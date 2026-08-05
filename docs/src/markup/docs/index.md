---
layout: poops-docs-theme/docs
title: Overview
description: What laxative is, and what it deliberately is not.
order: 1
---

# Overview

You already have the organs, and they already read one `poops.json`:

| Organ | Its job | You reach for it when |
|-------|---------|-----------------------|
| [poops](https://stamat.info/poops) | bundler + static-site generator | you have pages to compile |
| [septic](https://stamat.info/septic) | schema, REST API, generated forms, the build bridge | those pages need data |
| **laxative** | conductor — runs both on **one origin** | a form on the built page must POST to `/api` on the host that served it |

What was missing is that last row: running them as **one thing**, on the same host, so a generated `<form>` POSTs to `/api` on the origin that served the page. That's laxative — and it is the only piece of the three that isn't also useful alone.

## Not an engine

laxative reimplements nothing. No templater (poops), no DB/CRUD (septic), no bundler, no form engine. It is `init` + `dev` + `build` + `serve` — a conductor over two mature tools. If it grows an engine, it's wrong.

## Not (only) a template

Scaffolding a starter is one command (`laxative init`) and could be a template. laxative's real, net-new value is the **one-origin runtime** — `dev`/`serve` serving septic's API and poops's output together. That's the part a template can't be.
