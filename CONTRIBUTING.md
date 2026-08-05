# Contributing to laxative

Issues and pull requests are welcome. Taking part means keeping to the
[Code of Conduct](CODE_OF_CONDUCT.md).

laxative is the conductor of the [poops](https://github.com/stamat/poops)
ecosystem: it runs poops (frontend) and [septic](https://github.com/stamat/septic)
(backend) as one thing, on one origin, from the `poops.json` they already share.
Its whole value is `init` + `dev` + `build` + `serve`. **It reimplements
nothing**, and that is the line every change is measured against.

## What does not have a home here

- **A templater, a bundler, a static-site generator.** That is poops.
- **A schema, CRUD, auth, validation, forms, the markup bridge.** That is septic.
- **Anything an app should own** — routes, an admin UI, business logic. laxative
  scaffolds a starting point; it is not a framework you build inside.

The question that settles it: *could poops or septic do this instead?* If yes,
it belongs there, and laxative gets smaller by not having it. A feature that
survives is one that only exists because the two run together — the one-origin
server is the whole example so far.

## Getting set up

```bash
git clone https://github.com/stamat/laxative.git
cd laxative
script/bootstrap
```

```bash
script/test      # run the tests (node --test)
script/lint      # run the linter (neostandard; CI runs it)
```

There is no `script/server`, because the repo is not an app: laxative needs a
`poops.json` to conduct. To run it for real, scaffold one somewhere else —
`mkdir /tmp/try && cd /tmp/try && npm init -y`, install this checkout
(`npm i -D poops /path/to/laxative`), then `npx laxative init && npx laxative dev`.

Source of truth is `lib/`: `config.js` reads the shared `poops.json`,
`laxative.js` holds `createApp` (septic's app with the built site behind it),
`buildOnce`, `watchAndRebuild` and `init`. Compose septic through its package
API (`import { createServer, build } from 'septic'`), never through `lib/*`
paths — those are its internals and will move.

## Reporting a bug

[Open an issue](../../issues/new/choose) — the form asks for what you ran, what
you expected, the version and the environment, because those are the four things
every fix starts from. A reproduction is worth more than a description of one.

If it involves a form posting to the API, say which origin served the page: most
"the API doesn't answer" reports are two processes on two ports, which is the
problem laxative exists to remove.

## Pull requests

- **Add a test.** A bug fix gets a test that fails without the fix.
- **Match the surrounding style.** `script/lint` is the authority, and CI runs it.
- **Add a changelog entry** under `## [Unreleased]` in [CHANGELOG.md](CHANGELOG.md).
- **Keep the diff about one thing.** A rename bundled with a fix is two reviews
  wearing one hat.
- **Agent-written code is welcome — you still own it.** Same bar as handwritten:
  tests, lint, CI green, and you can answer review questions on every line.
  Point your agent at [AGENTS.md](AGENTS.md) before it starts.

Commit messages are freeform; write something that says what changed.

## How a release works

Bump the version in `package.json`, move `## [Unreleased]` in the changelog into
a new `## [x.y.z]` section, commit, then tag `vx.y.z` and push the tag. Pushing
the tag triggers [publish.yml](.github/workflows/publish.yml), which creates the
GitHub Release with that changelog section as its body.

Publishing to npm is gated on the `NPM_PUBLISH` repository variable, which is
not set yet: laxative and septic both install from git for now. Set it to
`true` once an npm trusted publisher exists for the package, and the same
workflow starts publishing.
