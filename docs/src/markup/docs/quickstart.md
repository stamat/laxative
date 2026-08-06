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
npm i -D poops stamat/laxative
npx laxative init      # writes poops.json (poops + septic + a form) + src/markup/index.html
npx laxative dev       # http://localhost:3000 — site + /api, one origin
```

[septic](https://stamat.info/septic) arrives as laxative's own dependency — you never install it separately, and since 1.0.0 it comes from npm. laxative itself isn't there yet, so it comes from git; poops stays a peer you install yourself.

`laxative init` scaffolds a `poops.json` with:

- a `markup` block (poops renders `src/markup` → `dist`),
- a `septic` block with a public `messages` resource,
- a `build.forms` block that generates the `messages` form.

It refuses to touch an existing `poops.json` — run it in an empty directory, or write the blocks yourself.

Run `laxative build` to produce `dist/` (static site + generated form partials), then `laxative serve` to serve it with the API in one process.

## Commands

| Command | What it does |
|---------|--------------|
| `laxative init` | scaffold a full-stack `poops.json` + a page |
| `laxative dev` | build once, serve site + `/api` on one origin, rebuild on markup change |
| `laxative build` | `septic build` (DB → markup + forms) → poops compile → `dist/` |
| `laxative serve` | production: serve `dist/` + `/api` + `/uploads` from one process |

`PORT` overrides the port for `dev` and `serve`; it defaults to 3000.

## What laxative reads

Three keys of the shared config, and nothing of its own:

| Key | Used for |
|-----|----------|
| `markup.out` | the directory served as the static site (default `dist`) |
| `markup.in` | the directory `dev` watches for changes |
| `septic` | the backend to mount. **Absent → frontend-only**: laxative serves the static site and mounts no API |

Every other key belongs to poops or septic, and laxative passes it through untouched.
