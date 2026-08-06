---
layout: poops-docs-theme/docs
title: The one-origin server
description: How laxative serves the site and the API together.
order: 3
---

# The one-origin server

`laxative serve`/`dev` boots septic's Express app — which already mounts `/api/*` and `/uploads` — and serves the poops-built site behind it. Same host, same port:

```
GET  /                → dist/index.html      (poops output)
GET  /api/messages    → septic REST          (JSON or, for HTMX, HTML)
POST /api/messages    → the generated form's target
GET  /uploads/…       → septic media
```

Because it's one origin, a generated form can `POST /api/messages` with no CORS, no proxy, no second server. Unmatched routes fall through to the static site.

```js
// what laxative does, in essence
const { app } = createServer(config.septic)   // septic: /api + /uploads
app.use(express.static(config.outDir))         // poops output behind it
app.listen(port)
```

A frontend-only project (no `septic` block) is served as plain static — laxative still runs, it just has no API to mount.

Order matters and is not arbitrary: septic's routes mount **first**, the static site behind them. septic claims `/api/<resource>` for each resource you declared, plus `/api/_auth`, `/api/_health` and the media URL — and only those. `/api/nothing-declared` is not an error from the backend; it falls through to the static site like any other unmatched path, and you get its 404.

## What `dev` watches

With poops installed and a `serve` block in the config — `init` scaffolds both — `laxative dev` conducts the whole loop: septic emits its markup and forms once, then the **poops CLI** runs behind laxative — building, watching every `in` in the config (markup, styles, scripts), serving the site and live-reloading the browser. laxative proxies every route septic did not claim to it, so the one visible origin stays laxative's port and the livereload client poops injects rides along. Style edits hot-swap the stylesheet without a page load; everything else reloads the page.

Two limits stay, and they are the same ones a bare poops session has:

- **Editing `poops.json`, or writing rows through the API, changes nothing the watcher sees** — restart `dev` (or re-run `laxative build`) to pick those up.
- **A failed rebuild is logged, not fatal.** The server keeps serving the last good build.

Without a `serve` block, or without poops installed, `dev` falls back to the old loop and says so: build once, watch `markup.in` recursively, rerun the whole build 300 ms after the last change — no livereload, refresh to see it. `build` without poops still emits septic's markup and forms — poops is an optional peer, and laxative degrades to the half it can still do.

## The whole loop

Define a resource once → septic makes the table + API + form partial, poops renders the page that includes it, laxative serves both together. That's "one config → full-stack MVP" made real.
