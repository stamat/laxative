import express from 'express'
import { spawn } from 'node:child_process'
import { watch as fsWatch } from 'node:fs'
import { mkdirSync, writeFileSync, existsSync } from 'node:fs'
import http from 'node:http'
import net from 'node:net'
import path from 'node:path'
import { createServer, prepareDb, build } from 'septic'

// The whole point of laxative: septic's API and poops's static site on ONE
// origin, so a generated form POSTs to /api on the same host that served the
// page. septic's createServer already mounts /api + /uploads; we just serve the
// built site behind it. Frontend-only projects (no septic block) get plain
// static serving. `fallback` swaps the static handler for another terminal
// middleware — dev hands unmatched routes to the poops dev server instead.
export function createApp(config, { fallback } = {}) {
  let app, db
  if (config.septic) ({ app, db } = createServer(config.septic))
  else app = express()
  app.use(fallback || express.static(config.outDir, { extensions: ['html'] }))
  return { app, db }
}

// Run the backend→frontend build: septic materializes DB rows into poops markup
// and generates the forms, then runs poops. laxative doesn't build anything
// itself — it sequences the organs.
// `config.quiet` is the CLI's `-q` grafted onto the loaded config, not a
// poops.json key — it hides the info lines only, never a warning.
export async function buildOnce(config) {
  if (!config.septic) { if (!config.quiet) console.log('💊 no septic block — frontend-only, run poops directly'); return }
  const { db } = prepareDb(config.septic)
  try {
    const res = await build(config.septic, db)
    if (!config.quiet) console.log(`💊 built${res.compiled ? ' → poops' : ' (poops not installed — markup only)'}`)
  } finally {
    db.close()
  }
}

// Resolve the poops CLI if installed — the same move septic makes. poops is a
// peer: dev without it degrades to markup watch and plain static serving.
async function resolvePoopsCli() {
  try {
    return new URL(await import.meta.resolve('poops/poops.js')).pathname
  } catch {
    return null
  }
}

// poops skips its own port-availability scan when the port comes as a flag,
// and the proxy has to know the exact port — so laxative finds a free one.
const freePort = () => new Promise((resolve, reject) => {
  const probe = net.createServer()
  probe.listen(0, () => {
    const { port } = probe.address()
    probe.close(() => resolve(port))
  })
  probe.on('error', reject)
})

// Everything septic did not claim goes to the poops dev server, which serves
// the built site, injects the livereload client and answers its SSE endpoint.
// Terminal middleware: a route that lands here is poops's or nobody's.
// A refused connection retries briefly: poops builds before it serves, so the
// first seconds of a dev session would otherwise 502 the page mid-load.
export function proxyTo(port, { retries = 8, delay = 500 } = {}) {
  const attempt = (req, res, left) => {
    const upstream = http.request({
      host: 'localhost',
      port,
      path: req.originalUrl,
      method: req.method,
      headers: { ...req.headers, host: `localhost:${port}` }
    }, (answer) => {
      res.writeHead(answer.statusCode, answer.headers)
      answer.pipe(res)
    })
    upstream.on('error', () => {
      // Only a body-less request can retry: the first attempt consumed the
      // request stream, so replaying a POST would replay it without its body.
      if (left > 0 && (req.method === 'GET' || req.method === 'HEAD')) {
        return setTimeout(() => attempt(req, res, left - 1), delay)
      }
      res.statusCode = 502
      res.end('poops dev server is not answering — check the poops output above')
    })
    req.pipe(upstream)
  }
  return (req, res) => attempt(req, res, retries)
}

// The conducted dev loop: septic emits its markup and forms once, then the
// poops CLI runs the rest — build, watch, livereload, serve — behind the
// proxy. laxative re-derives none of it; poops's watcher already knows every
// in/out pair in the same config. Returns null when there is nothing to
// conduct: no poops installed, or no `serve` block for it to serve on — the
// caller falls back to buildOnce + watchAndRebuild, which is the old dev loop.
export async function conductDev(config) {
  const cli = await resolvePoopsCli()
  if (!cli || !config.raw.serve) {
    // A degradation, not an info line: it says why livereload is gone, so `-q`
    // does not get to hide it.
    if (cli && !config.raw.serve) console.warn('💊 no "serve" block for poops — falling back to markup watch, no livereload')
    return null
  }
  if (config.septic) {
    const { db } = prepareDb(config.septic)
    try {
      await build(config.septic, db, { compile: false })
    } finally {
      db.close()
    }
  }
  const port = await freePort()
  const args = [cli, '-p', String(port), '-c', config.file]
  if (config.quiet) args.push('-q')
  const child = spawn(process.execPath, args, { cwd: config.root, stdio: 'inherit' })
  // A dev server outliving its watcher serves a site nobody rebuilds.
  process.on('exit', () => child.kill())
  child.on('exit', (code) => {
    if (code) console.warn(`💊 poops exited (${code}) — the site behind the proxy is down, /api still answers`)
  })
  const { app, db } = createApp(config, { fallback: proxyTo(port) })
  return { app, db, child }
}

// The fallback dev watch, for a config conductDev refuses (no poops, or no
// `serve` block): rebuild when the markup source changes, no livereload. The
// build itself writes into the watched tree — septic emits form partials and
// bridged markup into the config's `into` dirs, usually under `markup.in` —
// so events under those dirs are ignored, or every build would trigger the
// next one forever.
export function watchAndRebuild(config, rebuild = (c) => buildOnce(c).catch((e) => console.error(e.message))) {
  const inRel = config.raw.markup?.in
  if (!inRel) return
  const inDir = path.resolve(config.root, inRel)
  // fs.watch throws on a missing dir, which would kill dev right after a
  // successful first build. Serving without watching is the honest fallback.
  if (!existsSync(inDir)) { console.warn(`💊 ${inRel} does not exist — serving without watching`); return }
  const generated = [
    ...Object.values(config.septic?.build?.resources || {}),
    ...Object.values(config.septic?.build?.forms || {})
  ].filter((spec) => spec.into).map((spec) => path.resolve(config.root, spec.into))
  let timer
  const watcher = fsWatch(inDir, { recursive: true }, (_event, filename) => {
    // filename is null on platforms that don't report it — rebuild then, since
    // a spurious rebuild beats a missed one.
    const file = path.resolve(inDir, filename || '')
    if (filename && generated.some((dir) => file === dir || file.startsWith(dir + path.sep))) return
    clearTimeout(timer)
    timer = setTimeout(() => rebuild(config), 300)
  })
  if (!config.quiet) console.log(`💊 watching ${inRel}`)
  return watcher
}

// Scaffold a new full-stack project: one poops.json wiring poops + septic + a
// form, a starter page, and empty style/script entry points so the whole dev
// loop — sass, esbuild, livereload — is on from the first run. Deliberately
// tiny — this is a template, not codegen.
export function init(dir = process.cwd(), { quiet } = {}) {
  const file = path.join(dir, 'poops.json')
  // Loud even under `-q`: it is the reason nothing was scaffolded.
  if (existsSync(file)) { console.warn('💊 poops.json already exists — leaving it alone'); return }
  writeFileSync(file, JSON.stringify(STARTER, null, 2) + '\n')
  mkdirSync(path.join(dir, 'src/markup'), { recursive: true })
  mkdirSync(path.join(dir, 'src/styles'), { recursive: true })
  mkdirSync(path.join(dir, 'src/scripts'), { recursive: true })
  writeFileSync(path.join(dir, 'src/markup/index.html'), STARTER_HTML)
  writeFileSync(path.join(dir, 'src/markup/thanks.html'), STARTER_THANKS)
  writeFileSync(path.join(dir, 'src/styles/main.scss'), STARTER_SCSS)
  writeFileSync(path.join(dir, 'src/scripts/main.js'), STARTER_JS)
  if (quiet) return
  console.log('💊 scaffolded poops.json + src/{markup,styles,scripts}')
  console.log('   next: npm i -D poops laxative, then `laxative dev`')
}

const STARTER = {
  // Top-level includePaths is sass/esbuild resolution — `@use "some-package"`
  // straight from node_modules. The one under markup.options is the template
  // engine's: poops skips `_`-prefixed directories when rendering pages, but
  // does not search them for includes unless they are on the engine's paths.
  includePaths: ['node_modules'],
  markup: { in: 'src/markup', out: 'dist', options: { includePaths: ['_partials'] } },
  styles: [{ in: 'src/styles/main.scss', out: 'dist/css/main.css' }],
  scripts: [{ in: 'src/scripts/main.js', out: 'dist/js/main.js' }],
  // watch + serve + livereload is what lets `laxative dev` hand the whole dev
  // loop to poops; without a serve block it falls back to markup watch only.
  watch: true,
  serve: { port: 4040 },
  livereload: true,
  septic: {
    db: 'data/app.db',
    auth: { seed: { email: 'admin@example.com', password: 'changeme', role: 'admin' } },
    resources: {
      messages: {
        methods: ['GET', 'POST'],
        access: { read: 'admin', write: 'public' },
        fields: { name: 'string required', email: 'email required', body: 'text required', created: 'datetime = now' }
      }
    },
    build: {
      forms: { messages: { into: 'src/markup/_partials', success: '/thanks', submitLabel: 'Send' } }
    }
  }
}

// The include resolves only after septic has written the partial, which
// buildOnce always does before poops compiles — so a first `laxative dev` in a
// fresh scaffold succeeds, and the page ships with the working form on it.
const STARTER_HTML = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>💊 laxative app</title>
  <link rel="stylesheet" href="/css/main.css">
  <script type="module" src="/js/main.js"></script>
</head>
<body>
  <h1>It works.</h1>
  <p>Define a resource in <code>poops.json</code> → get a table, an API, and a form.</p>
  {% include "messages-form.html" %}
</body>
</html>
`

// Nearly empty on purpose: the entry points exist so the pipeline runs and
// livereload covers them from the first `laxative dev` — what goes in them is
// the app's business.
const STARTER_SCSS = `body {
  font-family: system-ui, sans-serif;
  max-width: 40rem;
  margin: 3rem auto;
  padding: 0 1rem;
}
`

const STARTER_JS = `console.log('💊 laxative app')
`

// Where the form lands: septic redirects a submit to `build.forms.messages.success`,
// so a scaffold that declares /thanks and does not write it ends its own happy
// path on a 404.
const STARTER_THANKS = `<!doctype html>
<html lang="en">
<head><meta charset="utf-8"><title>💊 Thanks</title></head>
<body>
  <h1>Thanks — it's in the database.</h1>
  <p><a href="/">Back</a></p>
</body>
</html>
`
