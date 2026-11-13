# Tirth Darshan Yatra — Build Plan (revised)

A bilingual (Hindi default, English toggle) pilgrimage tours site with live seat availability, online booking with Razorpay, and a full admin portal. Built in four phases; each ends with a test checklist for you.

## Decisions
- Brand name, phone, WhatsApp, email, GST and defaults live in one Settings record, editable from admin.
- Hindi at `/hi/...`, English at `/en/...`; `/` redirects to `/hi` (or the saved language).
- Design: saffron, maroon, temple gold, cream, dark brown text; Mukta (Hindi), Poppins (English), Rozha One (decorative); mandala / temple-arch dividers; large tap targets.
- Unsplash images; all seed content marked "sample".
- Secrets needed: RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET, RAZORPAY_WEBHOOK_SECRET, RESEND_API_KEY (requested in Phase 3).

## Phase 1 — Foundation and public site
- Enable Lovable Cloud; all tables from the brief plus `email_logs`, with _en/_hi columns, security rules, storage buckets, roles (customer, staff, admin, super_admin), `audit_logs`.
- Seed: 18 published + 2 draft yatras, departures in 2027, destinations, categories, testimonials, blog, FAQs, team, representatives, coupons, 10 bookings, 8 enquiries; seeded super admin `admin@tirthdarshan.com` flagged to change password on first login.
- Language system (hi.json / en.json), ₹ formatting, dates per language.
- Header, footer, floating WhatsApp / Call buttons.
- All public pages: Home (15 sections), All Yatras (URL filters), Yatra detail, Departures (calendar + list), Destinations, Types, Blog, About, Team, Gallery, FAQ, Contact, Privacy, Terms, Cancellation & Refund.
- Enquiry / callback forms saved as leads.
- Checklist at end of phase.

## Phase 2 — Admin portal (content and operations)
- `/admin/login`, forced password change for the seeded super admin, role-based access.
- Dashboard with stats and alerts.
- Trips list (search, filters, bulk actions, duplicate, archive, delete guard).
- Full 9-tab trip editor: basic info, media (drag-drop, WebP compression on upload, reorder, cover, alt text), itinerary day builder, pricing, departures with bulk add, pickup cities and add-ons, lists, FAQs and cancellation slabs, SEO with search preview. Autosave, publish validation, bilingual preview, unsaved-changes warning, last 10 versions with restore.
- Departures calendar/table with quick edit and close bookings.
- Leads / enquiries (status, assign, follow-up, call/WhatsApp, CSV).
- Content modules: destinations, categories, blog (scheduled publish), testimonials, gallery, FAQs, team, representatives, hero slides, counters, video URL.
- Settings and admin users (invite, roles, deactivate). Every admin change written to `audit_logs`.
- Checklist at end of phase.

## Phase 3 — Accounts, booking, payments
- Sign up / login with email + password and email OTP. Auth is built around a provider layer so phone OTP (MSG91 / Twilio) can be added later without rework. Until then, the booking flow shows "Book via WhatsApp" as a fallback.
- My Account: bookings, wishlist, saved travellers, profile.
- 5-step booking wizard with consent checkbox for storing traveller data.
- Server-side pricing only: total computed on the server from database prices, sharing type, add-ons, pickup charge, coupon rules and GST; client amounts ignored.
- Razorpay: order created on the server with that amount; verify signature AND paid amount = order amount; webhook idempotent via unique `razorpay_payment_id`.
- Seat holds: atomic `reserve_seats`, 15-minute holds; `release_expired_holds` runs every 5 minutes on a schedule and before every availability read or reservation. Waitlist, with automatic offer to the next waitlisted customer when seats free up and one-click conversion to a booking.
- Privacy: ID numbers encrypted at rest, only last 4 digits shown in the UI; full ID numbers and medical info visible only to admin / super_admin on the manifest.
- Booking voucher PDF and GST invoice PDF; pay remaining balance.
- Resend emails (bilingual) for booking, payment, cancellation and admin notifications; every send logged in `email_logs`.
- Admin bookings: detail, status changes, offline payments, refunds via Razorpay with amount auto-calculated from the cancellation slabs, notes, resend emails, manual bookings, CSV/Excel; customers and review moderation; coupons; manifest export (PDF/Excel).
- Checklist at end of phase.

## Phase 4 — SEO and polish
- Bilingual per-page titles/descriptions, hreflang, sitemap.xml, robots.txt (block /admin, /account), structured data, performance and accessibility pass.
- Final checklist.

## Scheduled jobs (database scheduler)
- Every 5 min: release expired seat holds.
- Every 10 min: publish scheduled blog posts.
- Daily: mark past departures completed (and their bookings completed).

## Technical notes
- TanStack Start file routes under `$lang`; server logic in server functions; Razorpay webhook at `/api/public/razorpay-webhook` with signature check (no Edge Functions).
- Roles in `user_roles` with `has_role`; admin pages under an authenticated layout with role gate.
- ID numbers encrypted with pgcrypto using a server secret; manifest access via a security-definer function that checks admin role.
- Auth wrapped in an `authProvider` module exposing `sendOtp(channel, target)` / `verifyOtp` so a phone channel plugs in later.
- Resend called from server code only; failures logged with status in `email_logs`.
- A `roadmap.md` task list will track all phases and these requirements.
