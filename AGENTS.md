# laxative — agent notes

💊 One config, whole stack: laxative conducts poops (frontend) + septic (backend)
into one MVP. **It is a conductor, not an engine — it reimplements nothing.**

## Commands

```bash
script/bootstrap  # npm ci, from a fresh clone — pulls septic (npm) + express
script/test       # node --test
script/lint       # neostandard (the authority; CI runs it)
```

There is no `script/server`: the repo has no `poops.json` to conduct. To run it
for real, scaffold a project elsewhere and install this checkout into it —
CONTRIBUTING.md has the four lines.

## Layout

- `lib/config.js` — reads `poops.json` (the shared config); `septic` block → backend, `markup.out` → static dir.
- `lib/laxative.js` — `createApp` (septic app + static site on one origin), `buildOnce` (sequences `septic build`), `watchAndRebuild`, `init` (scaffold).
- `bin/laxative.js` — the CLI.

## Principles

- **Never reimplement poops or septic.** poops bundles/renders; septic does data,
  API, forms, the build bridge. If laxative grows a templater, a bundler, a DB
  layer, or a form engine, it's wrong — compose the organs.
- Compose septic through its package API (`import { createServer, build, ... } from 'septic'`),
  not `lib/*` paths.
- YAGNI. The value is the **one-origin server** + scaffolding; everything else
  already exists upstream.

## Non-obvious

- `septic` comes from **npm** (`^1.0.0`), pinned by the lockfile — so a septic
  fix does not reach laxative until septic publishes and the lockfile is
  refreshed. It pulls septic's native deps: better-sqlite3 and sharp. laxative
  itself is not on npm yet and installs from git (`stamat/laxative`).
- The one-origin trick: `createServer(config.septic)` returns an Express app with
  `/api` + `/uploads` already mounted; laxative just adds `express.static(outDir)`
  behind it, so unmatched routes fall through to the poops-built site.
