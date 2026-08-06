---
layout: poops-docs-theme/docs
title: "How-to: a blog"
description: A full blog — write posts in an admin form, publish a static site — from one config.
order: 5
---

# How-to: a blog

Write posts in a form, publish a static site — the whole loop from one `poops.json`. Drafts stay a database row; only published posts become pages.

## 1. Scaffold

```sh
mkdir blog && cd blog && npm init -y
npm i -D poops laxative
```

## 2. One config

```json
{
  "markup": { "in": "src/markup", "out": "dist" },
  "septic": {
    "db": "data/blog.db",
    "auth": { "seed": { "email": "you@example.com", "password": "changeme", "role": "admin" } },
    "resources": {
      "posts": {
        "methods": ["GET", "POST", "PUT", "DELETE"],
        "access": { "read": "public", "write": "admin" },
        "fields": {
          "title":        "string required",
          "slug":         "slug required unique",
          "body":         "text required",
          "excerpt":      "text",
          "status":       "enum(draft,published) = draft",
          "published_at": "datetime",
          "created":      "datetime = now",
          "updated":      "datetime = now!"
        }
      }
    },
    "build": {
      "resources": {
        "posts": { "into": "src/markup/posts", "slug": "slug", "body": "body", "layout": "post.html", "where": { "status": "published" } }
      },
      "forms": {
        "posts": { "into": "src/markup/_partials", "submitLabel": "Publish" }
      }
    }
  }
}
```

Three blocks, one file: the **schema + API** (`resources`), the **static build** (`build.resources`, published only), and the **author form** (`build.forms`).

## 3. A post layout

`src/markup/_layouts/post.html` renders each generated post. This is [poops](https://stamat.info/poops) templating:

{% raw %}
```html
<!-- _layouts/post.html -->
<!doctype html>
<html lang="en"><head><meta charset="utf-8"><title>{{ page.title }}</title></head>
<body>
  <article>
    <h1>{{ page.title }}</h1>
    <time>{{ page.published_at }}</time>
    {{ content }}
  </article>
  <p><a href="/">← all posts</a></p>
</body></html>
```
{% endraw %}

An `src/markup/index.html` lists the `posts` collection (see [poops collections](https://stamat.info/poops/docs/)). The generated `_partials/posts-form.html` is your write/edit form — include it on an admin page.

## 4. Write, then publish

```sh
npx laxative dev      # http://localhost:3000
```

Post to the API (or use the generated form) as the seeded admin:

```sh
curl -c jar -X POST localhost:3000/api/_auth/login \
  -H 'content-type: application/json' -d '{"email":"you@example.com","password":"changeme"}'
curl -b jar -X POST localhost:3000/api/posts -H 'content-type: application/json' \
  -d '{"title":"Hello","slug":"hello","body":"# Hi","status":"published","published_at":"2026-08-05 12:00:00"}'
```

A draft is just `"status":"draft"` — it lives in the DB and never reaches the site until you flip it. `GET /api/posts/:id` as admin returns a prefilled edit form to do exactly that.

## 5. Publish the static site

```sh
npx laxative build    # published posts → markup → poops → dist/
npx laxative serve    # serve dist/ + the /api (to keep writing) on one origin
```

Deploy `dist/` anywhere — it's plain HTML. Keep `laxative serve` running where you author; rebuild to publish.

## The loop

Write in a form → it's a draft row → flip to published → `laxative build` → a static page. Content in a database, a static site out, an author form in between — one config.

The backend half alone — schema, the `where` filter, the generated form, no app around it — is [septic's version of this how-to](https://stamat.info/septic/docs/howto-blog).
