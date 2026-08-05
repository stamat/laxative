# Changelog

All notable changes to laxative are recorded here. [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) + [SemVer](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

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

- **The install line was wrong twice.** It said `npm i septic`, but septic is
  laxative's own dependency and isn't on npm; and it pulled `poops-docs-theme`,
  which this repo's docs site needs and an app being scaffolded never does. It
  is now `npm i -D poops stamat/laxative`, in the docs **and** in the line
  `laxative init` prints when it finishes.
- The link to septic's how-to 404'd — those pages answer without a trailing
  slash.

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
- Composes septic through its public API (`septic` ≥ 1.2.0); reimplements nothing.
