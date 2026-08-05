---
layout: poops-docs-theme/docs
title: "How-to: a todo app"
description: A full-stack todo app — page, API, and a form — from one config, served on one origin.
order: 4
---

# How-to: a todo app

A complete todo app: a static page that lists, adds and toggles todos, backed by a real API — all from one `poops.json`, served on one origin by laxative.

## 1. Scaffold

```sh
mkdir todo && cd todo && npm init -y
npm i septic && npm i -D poops laxative poops-docs-theme
```

## 2. One config

`poops.json` — the frontend (poops), the backend (septic), and the generated form, together:

```json
{
  "markup": { "in": "src/markup", "out": "dist" },
  "septic": {
    "db": "data/todos.db",
    "resources": {
      "todos": {
        "methods": ["GET", "POST", "PUT", "DELETE"],
        "access": { "read": "public", "write": "public" },
        "fields": {
          "title":   "string required",
          "done":    "boolean = false",
          "created": "datetime = now",
          "updated": "datetime = now!"
        }
      }
    },
    "build": {
      "forms": { "todos": { "into": "src/markup/_partials", "submitLabel": "Add" } }
    }
  }
}
```

That's the entire backend: a `todos` table, `/api/todos` CRUD, and a generated add-todo form.

## 3. The page

`src/markup/index.html`. Because laxative serves the API and the site on **one origin**, the page just talks to `/api/todos` — no CORS, no proxy. Here with Alpine for the interactive list and toggle:

```html
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8"><title>Todos</title>
  <script src="https://unpkg.com/alpinejs" defer></script>
</head>
<body x-data="todos()" x-init="load()">
  <h1>Todos</h1>

  <form @submit.prevent="add()">
    <input x-model="title" placeholder="What needs doing?" required>
    <button>Add</button>
  </form>

  <ul>
    <template x-for="t in items" :key="t.id">
      <li>
        <input type="checkbox" :checked="t.done" @change="toggle(t)">
        <span x-text="t.title" :style="t.done && 'text-decoration:line-through'"></span>
      </li>
    </template>
  </ul>

  <script>
    function todos() {
      return {
        items: [], title: '',
        async load() { this.items = await (await fetch('/api/todos?sort=created&order=desc')).json() },
        async add() {
          await fetch('/api/todos', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ title: this.title }) })
          this.title = ''; this.load()
        },
        async toggle(t) {
          await fetch('/api/todos/' + t.id, { method: 'PUT', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ done: !t.done }) })
          this.load()
        }
      }
    }
  </script>
</body>
</html>
```

> Prefer no JavaScript? `septic build` also emits `src/markup/_partials/todos-form.html` — a real `<form>` that POSTs to `/api/todos` and works without a line of client code. Include it with {% raw %}`{% include "todos-form.html" %}`{% endraw %} (add `_partials` to `includePaths`). See [septic's how-to](https://stamat.info/septic/docs/howto-todo/).

## 4. Run it

```sh
npx laxative dev      # http://localhost:3000 — page + /api, one origin
```

Add a todo, tick it off — every request hits `/api/todos` on the same host that served the page. That's the whole point of laxative.

## 5. Ship it

```sh
npx laxative build    # dist/ (static site + generated form) + the DB
npx laxative serve    # one process: dist/ + /api + /uploads
```

One `poops.json` → a working full-stack todo app. Define a resource, write a page, done.
