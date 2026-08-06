import { test, after } from 'node:test'
import assert from 'node:assert/strict'
import { mkdirSync, writeFileSync, rmSync } from 'node:fs'
import path from 'node:path'
import { load } from '../lib/config.js'

// The two ways a first run ends before it starts. Covered: that `load` names
// the file and the way out instead of letting Node's fs/JSON errors through.
// Not covered: what the config resolves to once it parses — that is
// serve.test.js, which runs the server it produces.
const PROJ = new URL('./tmp-config/', import.meta.url).pathname
after(() => rmSync(PROJ, { recursive: true, force: true }))

test('a missing poops.json names the file and the way out, not an fs stack', () => {
  const dir = path.join(PROJ, 'empty')
  mkdirSync(dir, { recursive: true })
  assert.throws(() => load(dir), (err) => {
    assert.match(err.message, /poops\.json/, 'the error did not name the file that is missing')
    assert.match(err.message, /laxative init/, 'the error did not say how to get one')
    assert.doesNotMatch(err.message, /ENOENT/, 'the raw fs error reached the user')
    return true
  })
})

test('a poops.json that is not JSON says which file, and why', () => {
  const dir = path.join(PROJ, 'broken')
  mkdirSync(dir, { recursive: true })
  writeFileSync(path.join(dir, 'poops.json'), '{ "markup": broken }')
  assert.throws(() => load(dir), (err) => {
    assert.match(err.message, /poops\.json/, 'the error did not name the file that will not parse')
    assert.match(err.message, /not valid JSON/, 'the error did not say what is wrong with it')
    return true
  })
})
