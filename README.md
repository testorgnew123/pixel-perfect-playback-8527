# Hari Shiv Shankar Tirth Yatra

Pilgrimage tour booking site — Char Dham, Jyotirlinga and tirth yatra packages across India, with live seat availability, online booking, and an admin portal for managing yatras, departures, bookings, and leads.

## Stack

- [TanStack Start](https://tanstack.com/start) (React, SSR) on [Vite](https://vite.dev)
- [Neon](https://neon.tech) (Postgres) via [Drizzle ORM](https://orm.drizzle.team)
- [better-auth](https://www.better-auth.com) for authentication
- [Netlify Blobs](https://docs.netlify.com/blobs) for uploaded media
- Deployed on [Netlify](https://netlify.com)

## Development

Requires [Bun](https://bun.sh).

```sh
bun install
bun run dev
```

Copy `.env` and fill in a `.env.local` (git-ignored) with at least:

```
DATABASE_URL=         # Neon Postgres connection string
BETTER_AUTH_SECRET=   # random secret, e.g. `openssl rand -hex 32`
BETTER_AUTH_URL=      # http://localhost:5173 in dev
RESEND_API_KEY=       # for password-reset/OTP emails
ID_ENCRYPTION_KEY=    # AES-GCM key for encrypting traveller ID numbers
```

`VITE_SITE_URL` (the public origin used for canonical URLs, hreflang, `og:url` and
`/sitemap.xml`) lives in the committed `.env` and defaults to the production host. Override it
per environment; `public/robots.txt` hardcodes the same origin in its `Sitemap:` line, so change
both together if the host moves.

Push the schema and apply the SQL functions/triggers to a fresh Neon database:

```sh
bun run node_modules/drizzle-kit/bin.cjs push
# then run drizzle/functions.sql against the database
```

## Scripts

- `bun run dev` — start the dev server
- `bun run build` — production build
- `bun run test` — run the test suite
- `bun run lint` / `bun run format` — lint / format
