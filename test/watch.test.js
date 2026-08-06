import { test, before, after } from 'node:test'
import assert from 'node:assert/strict'
import { mkdirSync, writeFileSync, rmSync } from 'node:fs'
import path from 'node:path'
import { watchAndRebuild } from '../lib/laxative.js'

// The regression this file pins: the build writes form partials and bridged
// markup INTO the watched markup tree, so a watcher that reacts to its own
// build output rebuilds forever. Covered: events under the config's `into`
// dirs are ignored, events elsewhere in the tree rebuild. Deliberately not
// covered: the debounce timing and the actual buildOnce call — the rebuild
// callback is injected, because a test that runs septic+poops on every fs
// event would be slow and flaky for no extra proof.
const PROJ = new URL('./tmp-watch/', import.meta.url).pathname
const wipe = () => rmSync(PROJ, { recursive: true, force: true })

// Hand-built config in the shape load() returns — watchAndRebuild reads only
// root, raw.markup.in and septic.build.
const config = {
  root: PROJ,
  raw: { markup: { in: 'src/markup' } },
  septic: {
    build: {
      resources: { posts: { into: 'src/markup/posts' } },
      forms: { messages: { into: 'src/markup/_partials' } }
    }
  }
}

const settle = (ms = 800) => new Promise((resolve) => setTimeout(resolve, ms))

let watcher
const calls = []
before(() => {
  wipe()
  mkdirSync(path.join(PROJ, 'src/markup/_partials'), { recursive: true })
  mkdirSync(path.join(PROJ, 'src/markup/posts'), { recursive: true })
  watcher = watchAndRebuild(config, (c) => calls.push(c))
})
after(() => { watcher?.close(); wipe() })

test('build output landing in the watched tree does not retrigger the build', async() => {
  writeFileSync(path.join(PROJ, 'src/markup/_partials/messages.html'), '<form></form>')
  writeFileSync(path.join(PROJ, 'src/markup/posts/hello.md'), '---\n---\nhi\n')
  await settle()
  assert.equal(calls.length, 0, 'a write into an `into` dir scheduled a rebuild — the dev loop is infinite again')
})

test('an edit to the markup source does rebuild', async() => {
  writeFileSync(path.join(PROJ, 'src/markup/index.html'), '<h1>edited</h1>')
  // Poll rather than sleep once: fs.watch latency varies by platform.
  for (let waited = 0; calls.length === 0 && waited < 3000; waited += 100) await settle(100)
  assert.ok(calls.length >= 1, 'a source edit never scheduled a rebuild')
  assert.equal(calls[0], config)
})
