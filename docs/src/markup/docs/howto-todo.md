---
layout: poops-docs-theme/docs
title: "How-to: a todo app"
description: A full-stack todo app — page, API, and a form — from one config, served on one origin.
order: 4
---

# How-to: a todo app

A todo list that adds, lists and ticks off, with a real API behind it — one `poops.json`, one origin. The form works before a line of JavaScript loads; the live list is what you add on top of it.

## 1. Scaffold

```sh
mkdir todo && cd todo && npm init -y
npm i -D poops laxative
```

## 2. One config

`poops.json` — the frontend (poops), the backend (septic), and the generated form, together:

```json
{
  "includePaths": ["node_modules"],
  "markup": {
    "in": "src/markup",
    "out": "dist",
    "options": { "includePaths": ["_partials"] }
  },
  "styles": [{ "in": "src/styles/main.scss", "out": "dist/css/main.css" }],
  "scripts": [{ "in": "src/scripts/main.js", "out": "dist/js/main.js" }],
  "septic": {
    "db": "data/app.db",
    "resources": {
      "todos": {
        "methods": ["GET", "POST", "PUT", "DELETE"],
        "access": { "read": "public", "write": "public" },
        "fields": {
          "title":   "string required",
          "done":    "boolean = false",
          "created": "datetime = now"
        }
      }
    },
    "build": {
      "forms": {
        "todos": {
          "into": "src/markup/_partials",
          "success": "/",
          "submitLabel": "Add",
          "hints": { "done": { "exclude": true } }
        }
      }
    }
  },
  "watch": true,
  "serve": { "port": 4040 },
  "livereload": true
}
```

That is the entire backend: a `todos` table, `/api/todos` CRUD, and a generated add-todo form.

Three parts of it are easy to get wrong:

- **The two `includePaths` are different things.** The top-level one is sass/esbuild resolution — it makes `@use "some-package"` reach into `node_modules`. The one under `markup.options` is the template engine's: poops skips `_`-prefixed directories when rendering pages, but will not search them for includes unless they are on the engine's paths.
- **`hints.done.exclude` keeps `done` off the form.** It defaults to `false` and nobody ticks a todo before it exists; without the hint septic generates a checkbox for every writable field.
- **`success: "/"`** is where a no-JavaScript submit lands. A form declaring a page that does not exist ends its own happy path on a 404.

`PATCH` is not in `methods` and does not need to be: septic mounts it alongside `PUT` — same guard, same store call, and the contract is the only difference (`PATCH` is partial by definition, `PUT`'s JSON body is partial for compatibility). Declaring `PUT` gets you both.

## 3. The form, before any JavaScript

`laxative dev` runs `septic build` before poops compiles, so `src/markup/_partials/todos-form.html` exists by the time the page including it is rendered:

```html
<form class="septic-form" hx-post="/api/todos" hx-swap="outerHTML" hx-target="this" method="post" action="/api/todos" accept-charset="utf-8">
<p class="field">
  <label for="todos-title">Title</label>
  <input id="todos-title" name="title" type="text" required>
</p>
  <button type="submit">Add</button>
</form>
```

A real `<form>` with a real `action`: it posts, the row lands in the database, the browser follows `success`. No client code involved. That is the floor everything below stands on.

## 4. The page

`src/markup/index.html`. Because laxative serves the API and the site on **one origin**, the page talks to `/api/todos` directly — no CORS, no proxy, no second port.

{% raw %}
```html
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>✅ todo</title>
  <link rel="stylesheet" href="/css/main.css">
  <script type="module" src="/js/main.js"></script>
</head>
<body>
  <main class="container pt-64 pb-64 todo-page">
    <h1 class="pb-32">Todo</h1>
    <todo-app>
      <div class="pb-32" on="submit:add">
        {% include "todos-form.html" %}
      </div>
      <hg-each key="id">
        <p bind="items.length:unless">Nothing to do yet — add the first one above.</p>
        <ul class="todo-list">
          <template>
            <li class="d-flex align-center gap-16">
              <switch-elemental bind="done:prop#checked" on="switch-toggle:toggle">
                <button bind="title:attr#aria-label"></button>
              </switch-elemental>
              <span class="flex-1" bind="title;done:class#is-done"></span>
              <button class="btn btn-outline" on="click:removeTodo" aria-label="Delete">×</button>
            </li>
          </template>
          <li>The list needs JavaScript — the form above works without it.</li>
        </ul>
      </hg-each>
    </todo-app>
  </main>
</body>
</html>
```
{% endraw %}

The interactive layer here is [hydrargyri](https://github.com/stamat/hydrargyri) with [hydrargyri-each](https://github.com/stamat/hydrargyri-each) and a switch from [book-of-elementals](https://github.com/stamat/book-of-elementals), styled with [sulphuris](https://github.com/stamat/sulphuris) — `npm i hydrargyri hydrargyri-each book-of-elementals sulphuris`. laxative does not care which one you use: anything that can `fetch('/api/todos')` works, because the API is on the same host that served the page.

## 5. The client

`src/scripts/main.js`:

```js
import hg, { reactive } from 'hydrargyri'
import 'hydrargyri-each'
import 'book-of-elementals/switch'

const JSON_HEADERS = { 'Content-Type': 'application/json', Accept: 'application/json' }
const rowOf = (e) => e.target.closest('[hg-row]')

hg('todo-app', {
  connected (el) {
    // Server default is id DESC; a todo list reads oldest first.
    fetch('/api/todos?sort=id&order=asc&limit=200', { headers: { Accept: 'application/json' } })
      .then((r) => r.json())
      .then((rows) => {
        el.items = reactive(rows)
        el.querySelector('hg-each').items = el.items
      })
      .catch(() => { el.items = [] })
  },

  handlers: {
    add (e, el) {
      e.preventDefault()
      const form = e.target
      const title = (new FormData(form).get('title') || '').trim()
      if (!title) return
      fetch('/api/todos', { method: 'POST', headers: JSON_HEADERS, body: JSON.stringify({ title }) })
        .then((r) => (r.ok ? r.json() : Promise.reject(new Error(r.statusText))))
        .then((row) => {
          el.items.push(row)
          form.reset()
        })
        .catch(() => form.submit()) // fetch failed — fall back to the no-JS path
    },

    toggle (e, el) {
      const item = rowOf(e).hgItem
      const done = e.detail.checked
      if (done === item.done) return
      item.done = done
      fetch(`/api/todos/${item.id}`, { method: 'PATCH', headers: JSON_HEADERS, body: JSON.stringify({ done }) })
    },

    removeTodo (e, el) {
      const row = rowOf(e)
      fetch(`/api/todos/${row.hgItem.id}`, { method: 'DELETE', headers: { Accept: 'application/json' } })
      el.items.splice(Number(row.getAttribute('hg-row')), 1)
    }
  }
})
```

Two details in there are the difference between working and nearly working:

- **`add` falls back to `form.submit()`** when `fetch` rejects. The form is a real form; a failed request is a reason to let the browser do it, not to swallow the todo.
- **The delete handler is `removeTodo`, not `remove`.** Handler resolution checks element methods before the `handlers` object, and `Element.prototype.remove` would win — the click would detach `<todo-app>` itself.

## 6. Run it

```sh
npx laxative dev      # http://localhost:3000 — page + /api, one origin
```

Add a todo, tick it off. Every request hits `/api/todos` on the same host that served the page — that is the whole point of laxative. The `serve.port` in `poops.json` is poops' own server behind the curtain; laxative proxies it and puts everything on `3000` (`PORT` overrides).

## 7. Ship it

```sh
npx laxative build    # dist/ (static site + generated form) + the DB
npx laxative serve    # one process: dist/ + /api + /uploads
```

One `poops.json` → a working full-stack todo app. Define a resource, write a page, done.

The backend half alone — schema, generated form, no app around it — is [septic's version of this how-to](https://stamat.info/septic/docs/howto-todo).
