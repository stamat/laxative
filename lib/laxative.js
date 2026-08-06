import express from 'express'
import { watch as fsWatch } from 'node:fs'
import { mkdirSync, writeFileSync, existsSync } from 'node:fs'
import path from 'node:path'
import { createServer, prepareDb, build } from 'septic'

// The whole point of laxative: septic's API and poops's static site on ONE
// origin, so a generated form POSTs to /api on the same host that served the
// page. septic's createServer already mounts /api + /uploads; we just serve the
// built site behind it. Frontend-only projects (no septic block) get plain
// static serving.
export function createApp(config) {
  let app, db
  if (config.septic) ({ app, db } = createServer(config.septic))
  else app = express()
  app.use(express.static(config.outDir, { extensions: ['html'] }))
  return { app, db }
}

// Run the backend→frontend build: septic materializes DB rows into poops markup
// and generates the forms, then runs poops. laxative doesn't build anything
// itself — it sequences the organs.
export async function buildOnce(config) {
  if (!config.septic) { console.log('💊 no septic block — frontend-only, run poops directly'); return }
  const { db } = prepareDb(config.septic)
  try {
    const res = await build(config.septic, db)
    console.log(`💊 built${res.compiled ? ' → poops' : ' (poops not installed — markup only)'}`)
  } finally {
    db.close()
  }
}

// Dev watch: rebuild when the markup source changes. The build itself writes
// into the watched tree — septic emits form partials and bridged markup into
// the config's `into` dirs, usually under `markup.in` — so events under those
// dirs are ignored, or every build would trigger the next one forever.
// ponytail: full rebuild on change (poops is fast); no browser live-reload yet
// — refresh to see changes.
export function watchAndRebuild(config, rebuild = (c) => buildOnce(c).catch((e) => console.error(e.message))) {
  const inRel = config.raw.markup?.in
  if (!inRel) return
  const inDir = path.resolve(config.root, inRel)
  // fs.watch throws on a missing dir, which would kill dev right after a
  // successful first build. Serving without watching is the honest fallback.
  if (!existsSync(inDir)) { console.log(`💊 ${inRel} does not exist — serving without watching`); return }
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
  console.log(`💊 watching ${inRel}`)
  return watcher
}

// Scaffold a new full-stack project: one poops.json wiring poops + septic + a
// form, and a starter page. Deliberately tiny — this is a template, not codegen.
export function init(dir = process.cwd()) {
  const file = path.join(dir, 'poops.json')
  if (existsSync(file)) { console.log('poops.json already exists — leaving it alone'); return }
  writeFileSync(file, JSON.stringify(STARTER, null, 2) + '\n')
  mkdirSync(path.join(dir, 'src/markup'), { recursive: true })
  writeFileSync(path.join(dir, 'src/markup/index.html'), STARTER_HTML)
  console.log('💊 scaffolded poops.json + src/markup/index.html')
  console.log('   next: npm i -D poops stamat/laxative, then `laxative dev`')
}

const STARTER = {
  markup: { in: 'src/markup', out: 'dist' },
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

const STARTER_HTML = `<!doctype html>
<html lang="en">
<head><meta charset="utf-8"><title>💊 laxative app</title></head>
<body>
  <h1>It works.</h1>
  <p>Define a resource in <code>poops.json</code> → get a table, an API, and a form.</p>
  <!-- include the generated form partial once poops renders it -->
</body>
</html>
`
