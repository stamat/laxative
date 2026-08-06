# Changelog

All notable changes to laxative are recorded here. [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) + [SemVer](https://semver.org/spec/v2.0.0.html).

## Contributing an entry

Write your change under `## [Unreleased]`, grouped under `### Added`,
`### Changed`, `### Fixed`, `### Deprecated`, `### Removed` or `### Security`.
Give the heading a short title after an em dash and open with one paragraph
saying what was wrong before:

````markdown
## [Unreleased] — timeouts are configurable

Every request used the same hardcoded thirty seconds, which is too long for a
health check and too short for an upload.

### Added

- ...
````

Write it for the person upgrading, not for the person who wrote the code. What
they need is what changed for them: a renamed option, a different default, an
error that is now thrown, output that moved.

On `script/publish`, `script/changelog` cuts this section into a released entry
in the same commit as the version bump, and the entry becomes the body of the
GitHub release verbatim.

## [Unreleased]

### Added

- The files an open project owes the people who show up: `CONTRIBUTING.md`
  (including what laxative refuses to become — if poops or septic could do it,
  it belongs there), `CODE_OF_CONDUCT.md`, `SECURITY.md`, issue forms and a pull
  request template.
- `script/bootstrap`, `script/test`, `script/lint`, `script/build`,
  `script/publish` (with `script/version` and `script/changelog` behind it) — the
  entry points every repo here answers to, and what CI now runs. There is
  deliberately no `script/server`: this repo has no `poops.json` to conduct.
  `script/build` builds the docs site, which is the only artifact this repo
  produces — CI runs it, so a docs site that stopped compiling now fails the
  pull request instead of the Pages deploy.
- `.github/workflows/publish.yml` — a `v*` tag now publishes to npm over trusted
  publishing (OIDC, no stored token, provenance attestation). The GitHub Release
  is `script/publish`'s job, since it holds the changelog entry
  `script/changelog` just cut.
- `CLAUDE.md` and `.github/copilot-instructions.md` are symlinks to `AGENTS.md` —
  one file, every tool. `AGENTS.md` gained the sections it was missing: how the
  docs are built and deployed, the always / ask-first / never boundaries, and the
  checklist that runs before a feature is written.
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

### Changed

- **septic now installs from npm** (`^1.0.0`) instead of git — it launched, so
  the git pin and every doc sentence claiming "neither is on npm yet" went with
  it.
- **laxative installs from npm too**, so the install line is
  `npm i -D poops laxative` — in the README, the docs site (index, quickstart,
  both how-tos) and the line `laxative init` prints when it finishes. The
  `NPM_PUBLISH` gate that held publishing back until a trusted publisher existed
  is gone with it.

### Fixed

- **The scaffold never closed its own loop.** `laxative init` promised "define a
  resource → get a working form on a page", then wrote a page with a comment
  where the form should be — and the obvious fix, an `include` of
  `messages-form.html`, failed with `Template not found`,
  because septic writes the form into `_partials` and poops only searches a
  directory it has been given as an include path. The scaffolded config now
  carries `markup.options.includePaths: ["_partials"]` and the page includes the
  form, so a first `init` → `dev` serves a page you can actually submit.
- **The scaffolded form's success page didn't exist.** The config redirects a
  submit to `/thanks`, and nothing wrote `/thanks` — so the happy path, HTMX and
  no-JS alike, ended on a 404. `init` now scaffolds `src/markup/thanks.html`.
- **A missing or malformed `poops.json` came out as a Node stack trace** about
  `fs` internals, which is the most likely first-run mistake there is. A missing
  one now names the file and points at `laxative init`; one that won't parse
  names the file and the syntax error. Every CLI failure — config, septic build,
  poops compile — now prints its message and exits 1, without the stack on top.
- **`dev` rebuilt forever.** The build writes form partials and bridged markup
  *into* the watched markup tree — the scaffolded config puts forms in
  `src/markup/_partials` — so every build's own output triggered the next
  build, 300ms apart, poops compile included. The watcher now ignores events
  under the config's `into` dirs.
- `dev` crashed right after a successful first build when the `markup.in` dir
  didn't exist yet (`fs.watch` throws on a missing path); it now says so and
  serves without watching.
- An invalid `PORT` (`PORT=abc`) fell back to 3000 silently; it now warns
  before doing so.
- **The install line was wrong twice.** It said `npm i septic`, but septic is
  laxative's own dependency you never install yourself; and it pulled
  `poops-docs-theme`, which this repo's docs site needs and an app being
  scaffolded never does. It is now `npm i -D poops laxative`, in the docs **and**
  in the line `laxative init` prints when it finishes.
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
