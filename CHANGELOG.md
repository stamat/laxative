# Changelog

All notable changes to laxative are recorded here. [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) + [SemVer](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- The files an open project owes the people who show up: `CONTRIBUTING.md`
  (including what laxative refuses to become — if poops or septic could do it,
  it belongs there), `CODE_OF_CONDUCT.md`, `SECURITY.md`, issue forms and a pull
  request template.
- `script/bootstrap`, `script/test`, `script/lint` — the same three entry points
  every repo here answers to, and what CI now runs. There is deliberately no
  `script/server`: this repo has no `poops.json` to conduct.
- `.github/workflows/publish.yml` — a `v*` tag now cuts a GitHub Release with the
  changelog section as its body. npm publishing stays gated on the
  `NPM_PUBLISH` repository variable until a trusted publisher exists.
- Docs site (`docs/`, poops + poops-docs-theme) deployed to GitHub Pages via
  `.github/workflows/pages.yml`.
- The docs now say what laxative actually reads and does: the three config keys
  it touches (`markup.out`, `markup.in`, `septic` — absent means frontend-only),
  `PORT`, that `init` refuses to overwrite an existing `poops.json`, and the
  mount order — septic claims `/api/<declared resource>`, `/api/_auth`,
  `/api/_health` and the media URL, everything else falls through to the site.
- What `dev` watches, and its three consequences: no live reload (refresh),
  only `markup.in` is watched (so a config edit or a row written through the API
  needs a restart), and a failed rebuild is logged while the last good `dist/`
  keeps serving.
- The organ table shared with septic's docs, so the three sites tell one story.

### Fixed

- **`dev` rebuilt forever.** The build writes form partials and bridged markup
  *into* the watched markup tree — the scaffolded config puts forms in
  `src/markup/_partials` — so every build's own output triggered the next
  build, 300ms apart, poops compile included. The watcher now ignores events
  under the config's `into` dirs.
- `dev` crashed right after a successful first build when the `markup.in` dir
  didn't exist yet (`fs.watch` throws on a missing path); it now says so and
  serves without watching.
- **The install line was wrong twice.** It said `npm i septic`, but septic is
  laxative's own dependency and isn't on npm; and it pulled `poops-docs-theme`,
  which this repo's docs site needs and an app being scaffolded never does. It
  is now `npm i -D poops stamat/laxative`, in the docs **and** in the line
  `laxative init` prints when it finishes.
- The link to septic's how-to 404'd — those pages answer without a trailing
  slash.
- The lockfile pinned an older septic commit than the one whose features the
  docs teach (the bridge's `where` filter); refreshed to septic 1.0.0. A fresh
  `npm i` always resolved septic's `main`, so only this repo's own checkout and
  CI were behind.
- `AGENTS.md` claimed CI must use `npm install` because "git-dep lockfiles are
  finicky". `npm ci` resolves the git dependency fine — checked — so CI uses
  `script/bootstrap` like every other repo here.

## [0.1.0] — the conductor

First cut: run poops + septic as one thing.

### Added

- `laxative serve` / `dev` — one Express origin serving septic's `/api` + `/uploads`
  and the poops-built static site, so a generated form POSTs to the same host
  that served the page. `dev` builds first and rebuilds on markup change.
- `laxative build` — sequences `septic build` (DB → markup + forms → poops).
- `laxative init` — scaffolds a starter `poops.json` (poops + septic + a form) and a page.
- Frontend-only projects (no `septic` block) are served as plain static.
- `💊` bin alias.
- Composes septic through its public API — the `septic` package's own exports,
  never its `lib/*` paths; reimplements nothing.
