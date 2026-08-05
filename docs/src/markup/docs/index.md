---
layout: poops-docs-theme/docs
title: Overview
description: What laxative is, and what it deliberately is not.
order: 1
---

# Overview

You already have the organs:

- **[poops](https://github.com/stamat/poops)** — the bundler + static-site generator.
- **[septic](https://github.com/stamat/septic)** — config → SQLite + REST API + generated forms + the poops build bridge.

They already share `poops.json`. What was missing: running them as **one thing** — the API and the static site on the same host, so a generated `<form>` POSTs to `/api` on the origin that served the page. That's laxative.

## Not an engine

laxative reimplements nothing. No templater (poops), no DB/CRUD (septic), no bundler, no form engine. It is `init` + `dev` + `build` + `serve` — a conductor over two mature tools. If it grows an engine, it's wrong.

## Not (only) a template

Scaffolding a starter is one command (`laxative init`) and could be a template. laxative's real, net-new value is the **one-origin runtime** — `dev`/`serve` serving septic's API and poops's output together. That's the part a template can't be.
