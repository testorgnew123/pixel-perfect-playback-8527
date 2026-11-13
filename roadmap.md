# Roadmap — Hari Shiv Shankar Tirth Yatra
## Phase 1 — Foundation & public site
- [x] Cloud schema, roles, RLS, buckets, email_logs, audit_logs
- [x] Seed data (super admin account created in Phase 2) (18+2 yatras, content, sample bookings/enquiries, super admin)
- [x] i18n hi/en, `/` -> `/hi`, formatting
- [x] Header/footer/floating buttons, all public pages, lead forms
## Phase 2 — Admin portal
- [x] /admin/login, seeded super admin + forced password change, roles gate
- [x] 9-tab yatra editor, duplicate, version history (last 10)
- [x] Departures, leads (CSV), content/coupons/reviews CRUD, settings, admin users, audit log
- [x] WebP image upload, hourly job: completed departures + scheduled blog
## Phase 3 — Accounts & booking (pay later, no emails per user)
- [x] Customer login: email+password, email code; WhatsApp fallback (phone OTP later)
- [x] 3-step booking wizard, server-side pricing (tested), atomic seat reservation, consent
- [x] Encrypted ID numbers (last 4 shown), medical/ID restricted to admins, manifest + CSV
- [x] My bookings, cancellation request, voucher + GST invoice (print/save PDF)
- [x] Admin bookings: record offline payments, cancel with slab refund, refund paid, manual booking, waitlist offer/convert
- [ ] Razorpay online payments — skipped by user
- [ ] Resend emails — skipped by user
## Phase 4 — SEO, sitemap, hreflang, JSON-LD, polish
