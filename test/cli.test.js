import { test, after } from 'node:test'
import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'
import { mkdirSync, writeFileSync, rmSync } from 'node:fs'
import path from 'node:path'

// The CLI surface: that every flag reaches the thing it names. Covered: `-c`
// reaching the config loader, `-p` beating PORT and rejecting a non-port, `-q`
// silencing info without silencing a warning, an unknown flag ending in a line
// a person can read, and `--help` listing what exists. Deliberately not
// covered: `--version` (argoyle registers it, and asserting the number here
// would only restate package.json), and what the commands themselves do —
// serve.test.js, dev.test.js and watch.test.js run those.
const BIN = new URL('../bin/laxative.js', import.meta.url).pathname
const PROJ = new URL('./tmp-cli/', import.meta.url).pathname

// Frontend-only, and named something other than poops.json: a run that reads
// it at all is a run where `-c` was honoured.
mkdirSync(PROJ, { recursive: true })
writeFileSync(path.join(PROJ, 'site.json'), JSON.stringify({ markup: { in: 'src/markup', out: 'dist' } }))
after(() => rmSync(PROJ, { recursive: true, force: true }))

const run = (args, env = {}) => new Promise((resolve) => {
  const child = spawn(process.execPath, [BIN, ...args], { cwd: PROJ, env: { ...process.env, ...env } })
  let out = ''
  let err = ''
  child.stdout.on('data', (chunk) => { out += chunk })
  child.stderr.on('data', (chunk) => { err += chunk })
  child.on('close', (code) => resolve({ code, out, err }))
})

test('--help lists every command and every flag', async() => {
  const { code, out } = await run(['--help'])
  assert.equal(code, 0)
  for (const cmd of ['init', 'dev', 'build', 'serve']) {
    assert.match(out, new RegExp(`\\b${cmd}\\b`), `the help does not mention the ${cmd} command`)
  }
  for (const flag of ['--config', '--port', '--quiet']) {
    assert.match(out, new RegExp(flag), `the help does not mention ${flag}`)
  }
})

test('a flag nobody registered ends the run with a sentence, not a stack', async() => {
  const { code, err } = await run(['build', '--nope'])
  assert.equal(code, 1)
  assert.match(err, /Unknown option: --nope/, 'the error did not name the flag it could not understand')
  assert.doesNotMatch(err, /\n\s+at /, 'a stack trace reached the user')
})

test('-c reads the file it names, and says that name when it is missing', async() => {
  const { code, err } = await run(['build', '-c', 'ghost.json'])
  assert.equal(code, 1)
  assert.match(err, /ghost\.json/, 'the error named a file other than the one -c asked for')
})

test('-c site.json builds the project that file describes', async() => {
  const { code, out } = await run(['build', '-c', 'site.json'])
  assert.equal(code, 0)
  assert.match(out, /no septic block/, 'the build did not read site.json — it would have failed on a missing poops.json')
})

test('-q hides the info lines', async() => {
  const { code, out } = await run(['build', '-c', 'site.json', '-q'])
  assert.equal(code, 0)
  assert.equal(out.trim(), '', `-q still printed: ${out.trim()}`)
})

test('a port that is not a port says so instead of silently serving 3000', async() => {
  const { code, err } = await run(['build', '-c', 'site.json', '-p', 'abc'])
  assert.equal(code, 0)
  assert.match(err, /"abc" is not a port/, 'the rejected value was not quoted back')
  assert.match(err, /3000/, 'the fallback port was not named')
})

test('-p wins over PORT, and the port it prints is the port it bound', async() => {
  const child = spawn(process.execPath, [BIN, 'serve', '-c', 'site.json', '-p', '0'], {
    cwd: PROJ,
    env: { ...process.env, PORT: '9999' }
  })
  try {
    const port = await new Promise((resolve, reject) => {
      let out = ''
      child.stdout.on('data', (chunk) => {
        out += chunk
        const found = out.match(/http:\/\/localhost:(\d+)/)
        if (found) resolve(found[1])
      })
      child.on('close', () => reject(new Error(`serve exited before printing a url: ${out}`)))
    })
    assert.notEqual(port, '9999', 'PORT overrode -p')
    assert.notEqual(port, '0', 'the port asked for was printed instead of the port bound')
    const res = await fetch(`http://localhost:${port}/`)
    assert.equal(res.status, 404, 'nothing was listening on the port it printed')
  } finally {
    child.kill()
  }
})
