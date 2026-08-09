import { test, after } from 'node:test'
import assert from 'node:assert/strict'
import { mkdirSync, writeFileSync, rmSync } from 'node:fs'
import path from 'node:path'
import express from 'express'
import { conductDev, proxyTo } from '../lib/laxative.js'
import { load } from '../lib/config.js'

// The conducted dev loop: unmatched routes proxy to the poops dev server, and
// conductDev refuses a config it cannot conduct. Covered: the proxy passes a
// request through untouched, answers 502 honestly when nothing is behind it,
// and conductDev returns null without a `serve` block. Deliberately not
// covered: the spawned poops process itself — a test that boots poops's
// watcher and server would be slow and flaky for no extra proof, and the
// spawn line is a `node poops.js -p <port>` with nothing to branch on.
const PROJ = new URL('./tmp-dev/', import.meta.url).pathname
after(() => rmSync(PROJ, { recursive: true, force: true }))

const listen = (app) => new Promise((resolve) => {
  const srv = app.listen(0, () => resolve(srv))
})

test('the proxy hands an unmatched route to the port it was given, and streams the answer back', async() => {
  const upstream = await listen(express().get('/page', (req, res) => {
    res.set('x-poops', 'yes').send('<h1>from poops</h1>')
  }))
  const front = await listen(express().use(proxyTo(upstream.address().port)))
  try {
    const res = await fetch(`http://localhost:${front.address().port}/page`)
    assert.equal(res.status, 200)
    assert.equal(res.headers.get('x-poops'), 'yes', 'an upstream header was dropped on the way through')
    assert.match(await res.text(), /from poops/)
  } finally {
    upstream.close()
    front.close()
  }
})

test('a proxy with nothing behind it says so with a 502, never a hang or a stack', async() => {
  const dead = await listen(express())
  const port = dead.address().port
  await new Promise((resolve) => dead.close(resolve)) // a port that answers nothing
  const front = await listen(express().use(proxyTo(port, { retries: 1, delay: 50 })))
  try {
    const res = await fetch(`http://localhost:${front.address().port}/`)
    assert.equal(res.status, 502)
    assert.match(await res.text(), /poops dev server is not answering/)
  } finally {
    front.close()
  }
})

test('a config with no serve block is not conducted — the caller falls back to the markup watch', async() => {
  mkdirSync(path.join(PROJ, 'noserve'), { recursive: true })
  writeFileSync(path.join(PROJ, 'noserve/poops.json'), JSON.stringify({
    markup: { in: 'src/markup', out: 'dist' }
  }))
  assert.equal(await conductDev(load(path.join(PROJ, 'noserve'))), null)
})
