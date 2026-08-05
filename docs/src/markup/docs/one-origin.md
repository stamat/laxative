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

## The whole loop

Define a resource once → septic makes the table + API + form partial, poops renders the page that includes it, laxative serves both together. That's "one config → full-stack MVP" made real.
