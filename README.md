# 💊 laxative [![npm version](https://img.shields.io/npm/v/laxative)](https://www.npmjs.com/package/laxative) [![ci](https://img.shields.io/github/actions/workflow/status/stamat/laxative/ci.yml?branch=main&label=ci)](https://github.com/stamat/laxative/actions/workflows/ci.yml) [![license mit](https://img.shields.io/badge/license-MIT-green)](https://github.com/stamat/laxative/blob/main/LICENSE)

One config, whole stack. laxative conducts [poops](https://github.com/stamat/poops) (frontend) and [septic](https://github.com/stamat/septic) (backend) into a single MVP — from one `poops.json`.

> It's a **conductor, not an engine.** poops bundles and renders; septic serves the API, generates the forms, and feeds the static build. laxative just runs them together, on one origin. It reimplements nothing.

## Why

You already have the organs:

- **poops** — the bundler + static-site generator.
- **septic** — config → SQLite + REST API + generated forms + the poops build bridge.

They already share `poops.json`. What was missing: running them as **one thing** — the API and the static site on the same host, so a generated `<form>` POSTs to `/api` on the origin that served the page. That's laxative.

## Use

```sh
npm i -D poops laxative
laxative init      # scaffold poops.json (markup + styles + scripts + septic + a form) + the pages
laxative dev       # site + /api on one origin; poops watches + live-reloads behind it
laxative build     # septic build (DB → markup + forms) → poops compile → dist/
laxative serve     # production: serve dist/ + /api + /uploads from one process
```

Every command takes `-c <path>` (a config file other than `poops.json`), `-p <number>` (the port, over `PORT` and the 3000 default) and `-q` (hide the info lines — warnings and errors still print), spelled the way poops spells them.

septic comes along as laxative's own dependency — you never install it separately. poops is an optional peer you install yourself.

Full reference: [stamat.info/laxative](https://stamat.info/laxative/).

## The one-origin server

`laxative serve`/`dev` boots septic's app (mounting `/api/*`, `/uploads`) and serves the poops-built site behind it. Same host, same port:

```
GET  /                → dist/index.html         (poops output)
GET  /api/messages    → septic REST             (JSON or, for HTMX, HTML)
POST /api/messages    → the generated form's target
GET  /uploads/…       → septic media
```

A frontend-only project (no `septic` block) still works — laxative just serves the static site.

## The whole loop

Define a resource once in `poops.json` → septic makes the table + API + form partial, poops renders the page that includes it, laxative serves both together. Define `messages` → get a working, validated contact form on a static page, wired to its own endpoint.

---

Yes, still a fan of toilet humor. 💩🚽💊

MIT © Stamat
