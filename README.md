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
SMTP_HOST=            # outgoing mail, e.g. mail.harishivshankartirthyatra.com
SMTP_USER=            # full mailbox address, e.g. noreply@harishivshankartirthyatra.com
SMTP_PASS=            # that mailbox's password
RESEND_API_KEY=       # optional alternative to SMTP
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

### Email

Password reset and OTP login go through `src/lib/email.server.ts`, which picks a transport in
this order:

1. **SMTP** when `SMTP_HOST`, `SMTP_USER` and `SMTP_PASS` are all set (a BigRock/cPanel mailbox).
   `SMTP_PORT` defaults to 465 (implicit TLS); use 587 for STARTTLS and set `SMTP_SECURE=false`.
2. **Resend** when `RESEND_API_KEY` is set.
3. Otherwise the message is **logged, not sent** — including the reset link, so accounts stay
   recoverable from the server console. This is a fallback, not a working configuration.

Check the settings before relying on them:

```sh
bun --env-file=.env.local run scripts/send-test-email.ts            # connect + authenticate
bun --env-file=.env.local run scripts/send-test-email.ts you@example.com  # send a real one
```

For deliverability, the sending domain needs an SPF record authorising the mail host, otherwise
reset mail tends to land in spam.

## Scripts

- `bun run dev` — start the dev server
- `bun run build` — production build
- `bun run test` — run the test suite
- `bun run lint` / `bun run format` — lint / format
