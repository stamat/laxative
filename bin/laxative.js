#!/usr/bin/env node
import { load } from '../lib/config.js'
import { createApp, buildOnce, watchAndRebuild, init } from '../lib/laxative.js'

const [cmd] = process.argv.slice(2)
const envPort = Number(process.env.PORT)
const port = Number.isInteger(envPort) && envPort > 0 ? envPort : 3000
if (process.env.PORT && port !== envPort) console.warn(`💊 PORT="${process.env.PORT}" is not a port — using ${port}`)

if (cmd === 'init') {
  init(process.cwd())
} else if (cmd === 'build') {
  await buildOnce(load())
} else if (cmd === 'serve') {
  const config = load()
  const { app } = createApp(config)
  app.listen(port, () => console.log(`💊 laxative serving on http://localhost:${port}`))
} else if (cmd === 'dev') {
  const config = load()
  await buildOnce(config)
  const { app } = createApp(config)
  app.listen(port, () => console.log(`💊 laxative dev on http://localhost:${port} — site + /api, one origin`))
  watchAndRebuild(config)
} else {
  console.log('Usage: laxative <init|dev|build|serve>')
  process.exit(cmd ? 1 : 0)
}
