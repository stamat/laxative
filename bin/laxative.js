#!/usr/bin/env node
import { readFileSync } from 'node:fs'
import Argoyle from 'argoyle'
import { load } from '../lib/config.js'
import { createApp, buildOnce, conductDev, watchAndRebuild, init } from '../lib/laxative.js'

const { version } = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'))

// The flags are poops's flags, spelled the same way: someone running 💩 and 💊
// in the same project should not have to remember which one wants `-c`.
const cli = new Argoyle(version)
  .line('Usage: laxative <command> [options]')
  .line('')
  .line('Commands:')
  .line('  init    scaffold poops.json + src/{markup,styles,scripts}')
  .line('  dev     site + /api on one origin, poops watching behind')
  .line('  build   septic build (DB → markup + forms) → poops compile → dist/')
  .line('  serve   serve the built site + /api + /uploads from one process')
  .line('')
  .option('config', { short: 'c', value: '<path>', description: 'Config file to read, defaults to poops.json' })
  .option('port', { short: 'p', value: '<number>', description: 'Port to serve on, overrides PORT and the 3000 default' })
  .option('quiet', { short: 'q', description: 'Hide the info lines — warnings and errors still print' })

// Everything that can fail here — an unknown flag, a missing config, a septic
// or poops build — already carries a message written for a person. A stack
// trace on top of one buries it, so the CLI prints the message and exits 1.
try {
  const { flags, positionals } = cli.parse()
  const [cmd] = positionals

  // -p wins over PORT wins over 3000. 0 is a real answer — it asks the OS for
  // a free port — so the test is "is a port", not "is truthy". Falling back in
  // silence would serve a typo'd port number as if it had been honoured.
  const asked = flags.port ?? process.env.PORT ?? ''
  const wanted = Number(asked)
  const port = asked !== '' && Number.isInteger(wanted) && wanted >= 0 && wanted <= 65535 ? wanted : 3000
  if (asked !== '' && port !== wanted) console.warn(`💊 "${asked}" is not a port — using ${port}`)

  const read = () => ({ ...load(process.cwd(), flags.config || 'poops.json'), quiet: flags.quiet })
  const say = (message) => { if (!flags.quiet) console.log(message) }
  // `-p 0` binds a port the OS picks, so the bound port is the one to print —
  // the number that was asked for is not always the number to connect to.
  const listen = (app, message) => {
    const server = app.listen(port, () => say(message(server.address().port)))
  }

  if (cmd === 'init') {
    init(process.cwd(), { quiet: flags.quiet })
  } else if (cmd === 'build') {
    await buildOnce(read())
  } else if (cmd === 'serve') {
    const { app } = createApp(read())
    listen(app, (p) => `💊 laxative serving on http://localhost:${p}`)
  } else if (cmd === 'dev') {
    const config = read()
    const conducted = await conductDev(config)
    if (conducted) {
      listen(conducted.app, (p) => `💊 laxative dev on http://localhost:${p} — site + /api, one origin, poops watching behind`)
    } else {
      await buildOnce(config)
      const { app } = createApp(config)
      listen(app, (p) => `💊 laxative dev on http://localhost:${p} — site + /api, one origin`)
      watchAndRebuild(config)
    }
  } else {
    console.log(cli.help())
    process.exit(cmd ? 1 : 0)
  }
} catch (err) {
  console.error(`💊 ${err.message}`)
  process.exit(1)
}
