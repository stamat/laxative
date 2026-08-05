# Security Policy

## Reporting a vulnerability

Report privately via a
[GitHub security advisory](https://github.com/stamat/laxative/security/advisories/new).
Do not open a public issue. Expect an initial response within a few days.

If the flaw is in the API, the schema or the generated forms, it is
[septic's](https://github.com/stamat/septic/security/advisories/new); if it is in
compiled output, it is [poops's](https://github.com/stamat/poops). laxative owns
the process that runs them together — report here when you are unsure, and it
gets routed.

## Supported versions

laxative is pre-1.0. Only the latest release receives fixes.

## Operational notes

laxative's one job — the site and the API on a single origin — is also where its
sharp edges are.

- **`serve` and `dev` bind every interface.** `app.listen(port)` with no host
  means the machine's LAN address serves your API too, not just `localhost`.
  On a shared or public network, put it behind a reverse proxy that terminates
  TLS, or bind it with a firewall rule. `dev` is a development server: it does
  no rate limiting and no TLS.
- **Set `SEPTIC_SECRET` in production.** Sessions are septic's, HMAC-signed with
  it. Without it a random secret is generated per process, so sessions drop on
  every restart and cannot be shared across workers.
- **Change the seeded admin.** `laxative init` scaffolds
  `admin@example.com` / `changeme` so `dev` works out of the box. It is a
  development convenience and shipping it is a public admin account.
- **Uploads are served from your own origin, unfiltered.** septic stores an
  upload under a random name but keeps the original extension, and there is no
  MIME allowlist — an `.html` or `.svg` accepted by a resource with public write
  access comes back as HTML from the same origin as your site, which is stored
  XSS. If a resource takes `file`/`image` fields from the public, gate writes by
  role, or serve `media.url` from a separate host.
- **Everything under `markup.out` is public.** It is served statically and
  wholesale. Keep the database and uploads outside it — the scaffolded config
  does (`data/app.db`, `data/uploads`), and a build that writes secrets into
  `dist/` publishes them.
- **A frontend-only project mounts no API at all.** No `septic` block means
  static serving and nothing else — that is the smallest attack surface
  available here, and it is worth choosing when there is no data to serve.
