## Project rules
- Public pages live under `src/routes/$lang.*` (hi/en); `/` redirects to the saved language (default `/hi`). Why: language must be in the URL for SEO/hreflang.
- All UI strings come from `src/locales/{hi,en}.json` via react-i18next; per-language i18n instances come from `getI18n(lang)`. Why: no shared mutable language state during SSR.
- DB content uses `_en`/`_hi` column pairs; read them with `loc()`/`locArr()` from `src/lib/format.ts` (Hindi falls back to English).
- Public reads go through `src/lib/public-data.functions.ts` (Drizzle queries against Neon). There is no RLS — every query's own `eq(status, "published")`/`eq(is_published, true)` filter is the sole security boundary, so never drop it when editing a query.
- Auth is better-auth (`src/lib/auth.server.ts`), not Supabase. Roles live in `user_roles`; check membership with `isStaff`/`isAdmin`/`hasRole` from `src/lib/roles.server.ts` — never store roles on the `user` table.
- Money totals must be computed server-side from DB prices (never trust client amounts); Razorpay payments keyed by unique `razorpay_payment_id`.
- Colors only via semantic tokens in `src/styles.css` (saffron/maroon/gold/cream palette).

- Admin portal lives under `src/routes/admin*` (client-only, `ssr:false`), gated in `admin.tsx` by staff roles; admin UI is English-only. Why: staff tool, not indexed.
- All admin reads/writes go through staff-gated server functions (`admin-crud.functions.ts`, `admin-misc.functions.ts`, `admin-yatra.functions.ts`, `admin.functions.ts`, `booking.functions.ts`) that call `assertStaff`/`isStaff`/`isAdmin` explicitly — there is no RLS or separate admin-client split to lean on.
- Uploaded media goes to the Netlify Blobs `media` store, uploaded via the staff-gated `/api/media/upload` route and served back via the `/media/<path>` route (`src/routes/media.$.ts`).
- Booking prices come only from `computeQuote` in `src/lib/pricing.ts` (unit-tested), run server-side in `booking.functions.ts`; seats change only via the `reserve_seats`/`release_seats` Postgres functions (`drizzle/functions.sql`, called through Drizzle's `sql` tag). Why: no client-trusted amounts, no overbooking.
- Traveller ID numbers are AES-GCM encrypted (`crypto.server.ts`, `ID_ENCRYPTION_KEY`) and only decrypted for admins in server fns.
- `drizzle/schema.ts` columns are named snake_case (not idiomatic camelCase) on purpose, to match the DB column names the generic admin CRUD and many components already key off of. Keep new columns snake_case too.
- `drizzle/functions.sql` (sequence/functions/triggers) isn't tracked by `drizzle-kit push` — re-run it after any schema push in case `--force` drops the untracked `booking_code_seq` sequence.

- Agents (book on behalf of customers, earn commission): the `agent` role is never staff — it is not in `isStaff`/`isAdmin`. It is granted only by `agentSignIn` (`agent.functions.ts`, which verifies the emailed code itself) and by admin reactivate, and only for an admin-invited email on the website domain (`AGENT_EMAIL_DOMAINS`, default `harishivshankartirthyatra.com`, rule in `commission.ts`). Why: onboarding must be website-emails-only; password sign-up is open and unverified, so a separate "claim after sign-in" step could be raced.
- Every agent server fn starts with `assertAgent` (`agent.server.ts`); every agent-management fn is admin-only on the server. Commission lives in `agent_commissions`/`agent_settings`, never on `bookings` or `site_settings`, because `getBookingVoucher` and `getSettings` return those rows whole to customers/the public. Keep rates and payout references out of `audit_logs` (any staff can read it).
- Money is applied to a booking only through `applyCapturedPayment` (row lock, no over-collection, settles commission). Agent-recorded payments stay `pending_verification` until an admin verifies them; commission becomes `payable` only when `amount_paid >= total_amount`.
