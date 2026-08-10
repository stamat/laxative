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

## [Unreleased] — one config, one set of flags

laxative had one way in and one way out: the command word, and a `PORT` env var
poops does not share. A project keeping its config anywhere but `poops.json`
could not be run at all, `PORT=nope` fell back to 3000 without saying so, and
there was no `--help` to ask.

Both how-tos were written from memory rather than from a running project. The
todo one pulled Alpine off a CDN and told you to "add `_partials` to
`includePaths`" without saying which of the two it meant. The blog one did not
build at all: its layout could not resolve, and if it had, the post body would
have rendered empty. Each page has now been run end to end and transcribed from
what worked.

### Added

- **`-c`, `-p` and `-q` on every command, spelled the way poops spells them.**
  `-c <path>` reads a config other than `poops.json` — and hands that same file
  to the poops CLI `dev` conducts, so one config stays one config across both
  halves. `-p <number>` beats `PORT`, which beats the 3000 default; `0` asks the
  OS for a free port, and the port printed is the port bound, not the port
  asked for. `-q` hides the 💊 info lines. `--help` and `--version` come with
  them, off [argoyle](https://github.com/stamat/argoyle).

### Changed

- **The docs site searches.** `poops-docs-theme` 3.0.1 → 4.0.0, which puts a
  field in the topbar of every docs page and filters the `search-index.json`
  poops was already writing. Nothing in `docs/poops.json` changed — the config
  shape and the `es2019` target are the same, and the theme brings
  [book-of-elementals](https://github.com/stamat/book-of-elementals) with it.
  A dev-dependency of this repo only: it builds the docs site, and is not part
  of what laxative ships.
- **A value that is not a port is refused out loud.** `-p nope` used to fall
  back to 3000 in silence, and `PORT=70000` got as far as
  `ERR_SOCKET_BAD_PORT`. Both are now quoted back with the port used instead.
- **The lines explaining a degraded run moved to stderr** — no `serve` block for
  poops, a missing `markup.in`, an `init` that found a `poops.json` already
  there. `-q` does not hide them: a run that lost livereload says so even when
  asked to be quiet. The `init` one is now prefixed `💊` like the rest.

### Fixed

- **[How-to: a todo app](https://stamat.github.io/laxative/docs/howto-todo)
  is transcribed from a working app.** No CDN dependency; the generated no-JS
  form comes first and the live list is the enhancement on top of it, which is
  the order the code actually degrades in. It now states the three things that
  bite: the two `includePaths` are different resolvers, `hints.done.exclude`
  keeps the boolean off the form, and `success` must name a page that exists.
  `PATCH` is documented as mounting alongside `PUT`, so it does not go in
  `methods`.
- **[How-to: a blog](https://stamat.github.io/laxative/docs/howto-blog) builds.**
  Four things stopped it: `"layout": "post.html"` asked poops for
  `post.html.html`, because poops appends the extension to a front-matter
  layout; the layout printed `{{ content }}`, which is not a variable, so every
  post rendered with no body; the config declared no `includePaths`, so neither
  `_layouts` nor `_partials` was on the engine's search path; and with no
  `serve` block `laxative dev` never handed the loop to poops. The `<time>` now
  carries a machine-readable `datetime` beside the human date, and the page says
  the layout owns the `<h1>` so post bodies start at `##`.

## [1.2.0] - 2026-08-09 — dev conducts poops

`laxative dev` watched `markup.in` with its own `fs.watch` and nothing else: a
style or script edit changed nothing until a manual rebuild, and the browser
was never told. That was the conductor reimplementing the one thing poops
already does better.

### Changed

- **`dev` hands the loop to poops.** With poops installed and a `serve` block in
  the config, septic emits its markup and forms once, then the poops CLI runs
  behind laxative — building, watching every `in` in the config, live-reloading
  the browser — and laxative proxies every route septic did not claim to it.
  One visible origin, poops's dev loop intact behind it. Without poops or
  without `serve`, `dev` falls back to the old markup-only watch and says so.
- **`init` scaffolds the whole pipeline.** `styles` and `scripts` entries with
  near-empty entry points, top-level `includePaths: ["node_modules"]` so
  `@use "some-package"` resolves, and `watch` + `serve` + `livereload` so the
  first `laxative dev` conducts. The scaffolded page links the built CSS and JS.

### Added

- **The dev proxy waits for poops's first build.** A page requested in the first
  seconds of `laxative dev` met a proxy whose upstream had not started serving yet
  and got a 502 mid-load. A refused GET/HEAD now retries briefly (bodied requests
  still fail fast — their stream is already consumed); the answer arrives when
  poops does.
- **laxative vouches for the `septic` config key.** poops warns about top-level
  keys it does not know unless a package by that name is declared — but a
  laxative app declares `laxative`, not `septic`. The manifest now carries
  `"poops": { "companionKeys": ["septic"] }`, which poops (from the release
  after 2.1.0) reads from direct dependencies; the warning on every build goes.

## [1.1.0] - 2026-08-06 — septic 3.0.0

### Changed

- **septic moves to `^3.0.0`.** It brings `createStore`, the data layer under
  the REST API: an application with its own routes — an admin panel, a CMS —
  can now reach septic's tables directly, with the same access rules and field
  shaping the API applies, instead of calling its own API over localhost.
  laxative does not use it (it conducts, it does not query), but anything built
  on top of a laxative project can.

  Underneath it, septic took express 5, better-sqlite3 13 and js-yaml 5. Only
  the first is visible from here, and laxative was already on express 5, so the
  two share a single deduped copy rather than mounting one major inside another.

  It also carries septic's move off `js-yaml@5.2.1`, which sat inside
  [GHSA-pm4m-ph32-ghv5](https://github.com/advisories/GHSA-pm4m-ph32-ghv5) — a
  parsing denial of service septic never reached (it only ever writes YAML), but
  one `npm audit` reported to anyone with laxative in their tree.

- **`build-deploy` timed out waiting for GitHub Pages to finish publishing.**
  `actions/deploy-pages` defaults to a 10-minute timeout; when GitHub Pages
  infrastructure is slow the deployment stays in `deployment_in_progress` past
  that limit and the workflow fails. The timeout is now raised to 30 minutes.

## [1.0.1] - 2026-08-06 — septic 2.0.0, and the fixes it carries

laxative 1.0.0 shipped pinned to `septic@^1.0.0`, so every install kept a set of
holes septic had already closed but could not deliver through that range.

### Changed

- **septic moves to `^2.0.0`.** What reaches you with it, all septic's:
  a malformed `Cookie` header — any cookie on the domain — no longer 500s every
  route; `?limit=-1` no longer reads as "no limit" and dumps a whole table past
  the documented cap of 200; an uploaded `.html`/`.svg`/`.js` is stored
  extension-less and served as a download rather than executing as your site;
  a `slug` naming a plain text field can no longer write outside its emit
  directory via `../`; and a read returns only the `id` and the fields your
  config declares, so an undeclared column — `password_hash` on a `users` table
  being the case that mattered — stops riding along in responses.

  **Upgrading:** two of those change behaviour you may have leaned on. If you
  relied on undeclared columns appearing in API responses, declare them; if you
  use `?expand=`, the referenced resource now has to be one your config serves
  and the caller has to pass its own `access.read`.

- `dev`'s rebuild loop gets quieter for free: septic 2.0.0 writes a markup file
  or form partial only when its content differs, where it used to clear each
  emit dir and rewrite everything on every build. laxative's own guard — the
  watcher ignoring events under the config's `into` dirs — stays, because it is
  what makes a first build safe before septic's diffing has anything to compare
  against.

### Fixed

- **The npm publish could never succeed.** `package.json` carried no
  `repository`, and trusted publishing signs a provenance statement naming the
  repository it built from — so the registry rejected every upload with
  `422 … "repository.url" is "", expected to match
  "https://github.com/stamat/laxative"`. 1.0.0 reached npm only because it was
  pushed by hand, without provenance; this is the change that let 1.0.1 publish
  itself. `repository`, `bugs` and `homepage` are now set, matching septic's.

## [1.0.0] - 2026-08-06

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
