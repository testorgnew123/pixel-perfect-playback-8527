<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.

## What Lovable manages

Rules outside this block are the project's own. Change the pieces below in
Lovable, not by hand. With the [Lovable MCP](https://mcp.lovable.dev)
connected, `send_message` asks Lovable to do it; otherwise ask the user to
use the editor.

- **Database.** Do not add or edit `supabase/migrations/` or `drizzle/`.
  Ask Lovable to change the schema.
- **Generated files.** Do not edit a file whose header says it is automatically
  generated.
- **AI gateway.** Keep model calls on Lovable's gateway, and keep
  `LOVABLE_API_KEY` out of browser code.
- **Connectors.** Lovable provides native connectors. `list_connectors` shows
  which are enabled; `add_connector` only returns the dashboard link. When a
  connector is enabled, calls go through the connector gateway and need
  `LOVABLE_API_KEY`. When Lovable does not provide one, users can bring their
  own key and store it in Secrets.
- **Secrets.** Lovable manages them. Do not put secret values in the repo.
<!-- LOVABLE:END -->

## Project rules
- Public pages live under `src/routes/$lang.*` (hi/en); `/` redirects to the saved language (default `/hi`). Why: language must be in the URL for SEO/hreflang.
- All UI strings come from `src/locales/{hi,en}.json` via react-i18next; per-language i18n instances come from `getI18n(lang)`. Why: no shared mutable language state during SSR.
- DB content uses `_en`/`_hi` column pairs; read them with `loc()`/`locArr()` from `src/lib/format.ts` (Hindi falls back to English).
- Public reads go through `src/lib/public-data.functions.ts` (publishable-key client inside server fns) + queryOptions in `src/lib/queries.ts`. Why: SSR-safe, RLS-limited to published rows.
- Roles: `user_roles` + `has_role`/`is_staff`/`is_admin` SQL helpers; never store roles on profiles.
- Money totals must be computed server-side from DB prices (never trust client amounts); Razorpay payments keyed by unique `razorpay_payment_id`.
- Colors only via semantic tokens in `src/styles.css` (saffron/maroon/gold/cream palette).
