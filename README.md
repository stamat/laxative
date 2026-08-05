# 💊 laxative

One config, whole stack. laxative conducts [poops](https://github.com/stamat/poops) (frontend) and [septic](https://github.com/stamat/septic) (backend) into a single MVP — from one `poops.json`.

> It's a **conductor, not an engine.** poops bundles and renders; septic serves the API, generates the forms, and feeds the static build. laxative just runs them together, on one origin. It reimplements nothing.

## Why

You already have the organs:

- **poops** — the bundler + static-site generator.
- **septic** — config → SQLite + REST API + generated forms + the poops build bridge.

They already share `poops.json`. What was missing: running them as **one thing** — the API and the static site on the same host, so a generated `<form>` POSTs to `/api` on the origin that served the page. That's laxative.

## Use

```sh
npm i septic && npm i -D poops laxative
laxative init      # scaffold poops.json (poops + septic + a form) + a starter page
laxative dev       # build once, then serve site + /api on one origin, rebuild on change
laxative build     # septic build (DB → markup + forms) → poops compile → dist/
laxative serve     # production: serve dist/ + /api + /uploads from one process
```

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
