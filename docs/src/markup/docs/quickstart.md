---
layout: poops-docs-theme/docs
title: Quick start
description: Empty directory to a full-stack MVP.
order: 2
---

# Quick start

```sh
mkdir my-app && cd my-app
npm init -y
npm i -D poops laxative
npx laxative init      # writes poops.json (poops + septic + a form) + the two pages the form needs
npx laxative dev       # http://localhost:3000 — site + /api, one origin
```

[septic](https://stamat.info/septic) arrives as laxative's own dependency — you never install it separately. poops stays a peer you install yourself.

`laxative init` scaffolds a `poops.json` with:

- a `markup` block (poops renders `src/markup` → `dist`), carrying `includePaths: ["_partials"]` so the page can include the generated form by name,
- `styles` and `scripts` entries (`src/styles/main.scss` → `dist/css/main.css`, `src/scripts/main.js` → `dist/js/main.js`), with a top-level `includePaths: ["node_modules"]` so an `@use "some-package"` resolves without ceremony,
- `watch`, `serve` and `livereload`, which is what lets `dev` hand the whole loop to poops,
- a `septic` block with a public `messages` resource,
- a `build.forms` block that generates the `messages` form and redirects a submit to `/thanks`.

Alongside it come the two pages that make the form work end to end — `src/markup/index.html`, which links the built CSS and JS and includes the form with {% raw %}`{% include "messages-form.html" %}`{% endraw %}, and `src/markup/thanks.html`, where a submit lands — plus the two near-empty entry points, so the pipeline runs from the first `dev`.

It refuses to touch an existing `poops.json` — run it in an empty directory, or write the blocks yourself.

Run `laxative build` to produce `dist/` (static site + generated form partials), then `laxative serve` to serve it with the API in one process.

## Commands

| Command | What it does |
|---------|--------------|
| `laxative init` | scaffold a full-stack `poops.json` + pages + style/script entry points |
| `laxative dev` | serve site + `/api` on one origin; poops watches and live-reloads behind it |
| `laxative build` | `septic build` (DB → markup + forms) → poops compile → `dist/` |
| `laxative serve` | production: serve `dist/` + `/api` + `/uploads` from one process |

`PORT` overrides the port for `dev` and `serve`; it defaults to 3000.

## What laxative reads

Three keys of the shared config, and nothing of its own:

| Key | Used for |
|-----|----------|
| `markup.out` | the directory served as the static site (default `dist`) |
| `markup.in` | the directory the fallback `dev` loop watches (conducted `dev` watches every `in` via poops) |
| `septic` | the backend to mount. **Absent → frontend-only**: laxative serves the static site and mounts no API |

Every other key belongs to poops or septic, and laxative passes it through untouched.
