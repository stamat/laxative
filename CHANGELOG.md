# Changelog

All notable changes to laxative are recorded here. [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) + [SemVer](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Docs site (`docs/`, poops + poops-docs-theme) deployed to GitHub Pages via
  `.github/workflows/pages.yml`.

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
