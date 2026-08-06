# laxative — agent notes

💊 One config, whole stack: laxative conducts poops (frontend) + septic (backend)
into one MVP. **It is a conductor, not an engine — it reimplements nothing.**

Read [CONTRIBUTING.md](CONTRIBUTING.md) first — it defines what belongs in this
project and what a pull request needs.

## Commands

```bash
script/bootstrap  # npm ci, from a fresh clone — pulls septic (npm) + express
script/test       # node --test
script/lint       # neostandard (the authority; CI runs it)
script/build      # build the docs site (the only artifact this repo produces)
script/publish    # cut a release: version, changelog, tag, push
```

There is no `script/server`: the repo has no `poops.json` to conduct. To run it
for real, scaffold a project elsewhere and install this checkout into it —
CONTRIBUTING.md has the four lines.

## Layout

- `lib/config.js` — reads `poops.json` (the shared config); `septic` block → backend, `markup.out` → static dir.
- `lib/laxative.js` — `createApp` (septic app + static site on one origin), `buildOnce` (sequences `septic build`), `watchAndRebuild`, `init` (scaffold).
- `bin/laxative.js` — the CLI.

## Documentation

Markdown in `docs/src/markup`, built by poops with `poops-docs-theme` (config:
`docs/poops.json`), deployed to GitHub Pages by
[pages.yml](.github/workflows/pages.yml) on a push to `main`. The nav comes from
each page's front matter — `title` and `order`. `docs/dist` is generated; never
edit it.

The README is the short version and the docs site is the long one, so a change
to what laxative reads or serves usually touches both.

- **Document in the same change as the code.** A behavior change that ships
  undocumented is unfinished.
- **Edit the page that already covers it.** No new pages, no summary or
  migration files nobody asked for.
- **Write for the person using it**, not the person who wrote it: what it does,
  one example that runs, and the part that would otherwise surprise them.

## Principles

- **Never reimplement poops or septic.** poops bundles/renders; septic does data,
  API, forms, the build bridge. If laxative grows a templater, a bundler, a DB
  layer, or a form engine, it's wrong — compose the organs.
- Compose septic through its package API (`import { createServer, build, ... } from 'septic'`),
  not `lib/*` paths.
- **Test-driven.** The test is the spec. A failing test means the code is wrong —
  never weaken, skip or delete one to make it pass; if the test is wrong, say so
  and let review decide.
- YAGNI. The value is the **one-origin server** + scaffolding; everything else
  already exists upstream.
- **Root cause over symptom.** Fix where all callers route through, not the one
  path the bug report names.
- **Delete dead code.** No commented-out blocks, no "for later" exports — git
  remembers.

## Boundaries

- **Always:** run `script/lint` and `script/test` before calling work done; pair
  every fix or feature with a test; document anything user-visible where it is
  already documented; add a changelog entry under `## [Unreleased]`.
- **Ask first:** changing the CLI surface or what `init` scaffolds; adding a
  dependency; taking a septic major.
- **Never:** edit `docs/dist` or `dist`; weaken, skip or delete a test to make it
  pass; bump the version or publish — `script/publish` and a tag do that.

## Before adding a feature

Run this checklist before writing any code; stop at the first "no".

1. **Could poops or septic do it instead?** Then it belongs there, and laxative
   gets smaller by not having it. This is the question that settles most of them.
2. **Does the platform or standard library already do it?** If so, there is no
   feature.
3. **Search for prior art.** How do similar tools do it, and can we improve on
   it? Cite what you found — a URL per fact, no guesses.
4. **Does it fit?** CONTRIBUTING.md lists what laxative refuses to become —
   check against it before building, not after.
5. **Still yes?** Build the smallest version that works.

## Non-obvious

- `septic` comes from **npm** (`^1.0.0`), pinned by the lockfile — so a septic
  fix does not reach laxative until septic publishes and the lockfile is
  refreshed. It pulls septic's native deps: better-sqlite3 and sharp.
- The one-origin trick: `createServer(config.septic)` returns an Express app with
  `/api` + `/uploads` already mounted; laxative just adds `express.static(outDir)`
  behind it, so unmatched routes fall through to the poops-built site.
- `CLAUDE.md` and `.github/copilot-instructions.md` are symlinks to this file.
  Edit this one.
