import { readFileSync } from 'node:fs'
import path from 'node:path'
import { loadConfig as loadSeptic } from 'septic'

// One config, whole stack: laxative reads the same poops.json poops and septic
// already share. `septic` block → the backend (or null for a frontend-only
// site); `markup.out` → the static site laxative serves alongside the API.
export function load(root = process.cwd(), file = 'poops.json') {
  const configPath = path.isAbsolute(file) ? file : path.join(root, file)
  const raw = read(configPath)
  const baseDir = path.dirname(configPath)
  return {
    root: baseDir,
    raw,
    septic: raw.septic ? loadSeptic(baseDir, path.basename(configPath)) : null,
    outDir: path.resolve(baseDir, raw.markup?.out || 'dist')
  }
}

// The two ways a first run ends before it starts: no config at all, and one
// that does not parse. Node's own errors name neither the file nor the way out,
// so they arrive as a stack trace about fs internals.
function read(configPath) {
  let text
  try {
    text = readFileSync(configPath, 'utf8')
  } catch (err) {
    if (err.code !== 'ENOENT') throw err
    throw new Error(`no ${path.basename(configPath)} in ${path.dirname(configPath)} — run \`laxative init\` to scaffold one`)
  }
  try {
    return JSON.parse(text)
  } catch (err) {
    throw new Error(`${configPath} is not valid JSON: ${err.message}`)
  }
}
