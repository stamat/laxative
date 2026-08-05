# laxative — agent notes

💊 One config, whole stack: laxative conducts poops (frontend) + septic (backend)
into one MVP. **It is a conductor, not an engine — it reimplements nothing.**

## Commands

```bash
npm install       # installs septic (git dep) + express
npm run dev       # laxative dev — build once, serve site + /api on one origin, watch
npm test          # node --test
npm run lint      # neostandard
```

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

- `septic` is a **git dependency** (`github:stamat/septic`); `npm install`, not
  `npm ci`, in CI (git-dep lockfiles are finicky). It pulls septic's native deps
  (better-sqlite3, sharp).
- The one-origin trick: `createServer(config.septic)` returns an Express app with
  `/api` + `/uploads` already mounted; laxative just adds `express.static(outDir)`
  behind it, so unmatched routes fall through to the poops-built site.
