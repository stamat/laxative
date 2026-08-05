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

`laxative dev` builds once, starts the server, then watches `markup.in` recursively and runs the whole build again 300 ms after the last change — poops is fast enough that a partial rebuild would be complexity for nothing.

Three things follow, and the first one surprises people:

- **No live reload.** The browser is never told; refresh to see the change.
- **Only `markup.in` is watched.** Editing `poops.json`, or writing rows through the API, changes nothing on disk that the watcher sees — restart `dev` (or re-run `laxative build`) to pick those up.
- **A failed rebuild is logged, not fatal.** The server keeps serving the last good `dist/`.

If poops isn't installed, `build` still emits septic's markup and forms and says so — poops is an optional peer, and laxative degrades to the half it can still do.

## The whole loop

Define a resource once → septic makes the table + API + form partial, poops renders the page that includes it, laxative serves both together. That's "one config → full-stack MVP" made real.
