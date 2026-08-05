import { readFileSync } from 'node:fs'
import path from 'node:path'
import { loadConfig as loadSeptic } from 'septic'

// One config, whole stack: laxative reads the same poops.json poops and septic
// already share. `septic` block → the backend (or null for a frontend-only
// site); `markup.out` → the static site laxative serves alongside the API.
export function load(root = process.cwd(), file = 'poops.json') {
  const configPath = path.isAbsolute(file) ? file : path.join(root, file)
  const raw = JSON.parse(readFileSync(configPath, 'utf8'))
  const baseDir = path.dirname(configPath)
  return {
    root: baseDir,
    raw,
    septic: raw.septic ? loadSeptic(baseDir, path.basename(configPath)) : null,
    outDir: path.resolve(baseDir, raw.markup?.out || 'dist')
  }
}
