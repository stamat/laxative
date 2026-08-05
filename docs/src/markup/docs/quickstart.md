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
npm i septic && npm i -D poops laxative poops-docs-theme
npx laxative init      # writes poops.json (poops + septic + a form) + src/markup/index.html
npx laxative dev       # http://localhost:3000 — site + /api, one origin
```

`laxative init` scaffolds a `poops.json` with:

- a `markup` block (poops renders `src/markup` → `dist`),
- a `septic` block with a public `messages` resource,
- a `build.forms` block that generates the `messages` form.

Run `laxative build` to produce `dist/` (static site + generated form partials), then `laxative serve` to serve it with the API in one process.

## Commands

| Command | What it does |
|---------|--------------|
| `laxative init` | scaffold a full-stack `poops.json` + a page |
| `laxative dev` | build once, serve site + `/api` on one origin, rebuild on markup change |
| `laxative build` | `septic build` (DB → markup + forms) → poops compile → `dist/` |
| `laxative serve` | production: serve `dist/` + `/api` + `/uploads` from one process |
