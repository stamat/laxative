---
layout: poops-docs-theme/prose
title: laxative
description: One config, whole stack — conducts poops (frontend) and septic (backend) into one MVP.
---

# 💊 laxative

**One config, whole stack.** laxative conducts [poops](https://github.com/stamat/poops) (frontend) and [septic](https://github.com/stamat/septic) (backend) into a single MVP — from one `poops.json`.

It's a **conductor, not an engine.** poops bundles and renders; septic serves the API, generates the forms, and feeds the static build. laxative just runs them together, on one origin. It reimplements nothing.

```sh
npm i septic && npm i -D poops laxative
laxative init      # scaffold a full-stack poops.json + a starter page
laxative dev       # site + /api on one origin, rebuild on change
laxative build     # septic build → poops compile → dist/
laxative serve     # production: dist/ + /api + /uploads, one process
```

Define a resource once → table + API + form + page. Define `messages` → a working, validated contact form on a static page, wired to its own endpoint.

[Read the docs →](docs/) · [GitHub →](https://github.com/stamat/laxative)
