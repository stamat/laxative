import { test, before, after } from 'node:test'
import assert from 'node:assert/strict'
import { mkdirSync, writeFileSync, rmSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { load } from '../lib/config.js'
import { createApp, init } from '../lib/laxative.js'

// The whole point of laxative: the poops-built site and septic's API on ONE
// origin. Build a tiny project, boot createApp, and hit both over the same
// host — plus the degraded case, a frontend-only project with no septic block.
const PROJ = new URL('./tmp-proj/', import.meta.url).pathname
const wipe = () => rmSync(PROJ, { recursive: true, force: true })

let base, server, db
before(async() => {
  wipe()
  mkdirSync(path.join(PROJ, 'dist'), { recursive: true })
  writeFileSync(path.join(PROJ, 'poops.json'), JSON.stringify({
    markup: { in: 'src/markup', out: 'dist' },
    septic: {
      db: 'data/app.db',
      resources: { notes: { methods: ['GET', 'POST'], access: { read: 'public', write: 'public' }, fields: { text: 'string required' } } }
    }
  }))
  writeFileSync(path.join(PROJ, 'dist/index.html'), '<!doctype html><title>home</title><h1>home page</h1>')

  const config = load(PROJ)
  const built = createApp(config)
  db = built.db
  await new Promise((resolve) => { server = built.app.listen(0, resolve) })
  base = `http://localhost:${server.address().port}`
})
after(() => { server?.close(); db?.close(); wipe() })

test('the static site is served', async() => {
  const res = await fetch(`${base}/`)
  assert.equal(res.status, 200)
  assert.match(await res.text(), /home page/)
})

test('septic API is on the same origin', async() => {
  const created = await fetch(`${base}/api/notes`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ text: 'hi' }) })
  assert.equal(created.status, 201)
  const list = await (await fetch(`${base}/api/notes`)).json()
  assert.equal(list.length, 1)
  assert.equal(list[0].text, 'hi')
})

test('a frontend-only project (no septic block) still serves the site, and mounts no API', async() => {
  const dir = path.join(PROJ, 'frontend-only')
  mkdirSync(path.join(dir, 'dist'), { recursive: true })
  writeFileSync(path.join(dir, 'poops.json'), JSON.stringify({ markup: { out: 'dist' } }))
  writeFileSync(path.join(dir, 'dist/index.html'), '<!doctype html><title>fo</title><h1>frontend only</h1>')

  const { app, db: noDb } = createApp(load(dir))
  assert.equal(noDb, undefined, 'a project without a septic block opened a database')
  const srv = await new Promise((resolve) => { const s = app.listen(0, () => resolve(s)) })
  try {
    const origin = `http://localhost:${srv.address().port}`
    const page = await fetch(`${origin}/`)
    assert.equal(page.status, 200)
    assert.match(await page.text(), /frontend only/)
    assert.equal((await fetch(`${origin}/api/notes`)).status, 404, 'an API answered on a frontend-only project')
  } finally {
    srv.close()
  }
})

test('init scaffolds a poops.json with both frontend and backend', () => {
  const dir = path.join(PROJ, 'scaffold')
  mkdirSync(dir, { recursive: true })
  init(dir)
  const cfg = JSON.parse(readFileSync(path.join(dir, 'poops.json'), 'utf8'))
  assert.ok(cfg.markup && cfg.septic) // one config, both ends
  assert.ok(cfg.septic.build.forms.messages)
})
