#!/usr/bin/env node
import { load } from '../lib/config.js'
import { createApp, buildOnce, watchAndRebuild, init } from '../lib/laxative.js'

const [cmd] = process.argv.slice(2)
const port = Number(process.env.PORT) || 3000

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
