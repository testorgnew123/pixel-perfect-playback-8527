# Tirth Darshan Yatra — Build Plan

A bilingual (Hindi default, English toggle) pilgrimage tours site with live seat availability, online booking with Razorpay, and a full admin portal. The brief is very large, so it is built in phases. Each phase leaves a working site you can preview.

## Decisions made (no questions, per your brief)
- Brand name, phone, WhatsApp, email, GST and colours live in one Settings record, editable from admin.
- Hindi at `/hi/...`, English at `/en/...`; `/` redirects to the saved language (Hindi by default).
- Design: saffron, maroon, temple gold, cream background, dark brown text; Mukta (Hindi body), Poppins (English body), Rozha One (decorative headings); mandala / temple-arch dividers; large tap targets for older travellers.
- Images: Unsplash photos of temples, Himalayas and ghats.
- All sample content is marked "sample" so it can be cleared later.
- Razorpay runs in test mode until you add your keys (RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET, RAZORPAY_WEBHOOK_SECRET). Until then, "Pay later / Book via call" works fully.

## Phase 1 — Foundation and public site
- Enable Lovable Cloud; create all tables listed in the brief with _en/_hi columns, security rules, image storage buckets, and roles (customer, staff, admin, super_admin).
- Seed data: 18 published + 2 draft yatras with itineraries, pricing, departures in 2027, 12 destinations, 12 categories, testimonials, 6 blog posts, 15 FAQs, team, representatives, 3 coupons, 10 bookings, 8 enquiries.
- Language system with hi.json / en.json, ₹ Indian formatting, dates per language.
- Header (search, language toggle, Login, Book Now), footer, floating WhatsApp and Call buttons.
- Pages: Home (all 15 sections), All Yatras (filters in URL, sort, mobile filter sheet), Yatra detail (all tabs, departures table, sticky booking card), Upcoming Departures (calendar + list), Destinations, Yatra Types, Blog, About, Team, Gallery with lightbox, FAQ, Contact, Privacy, Terms, Cancellation & Refund.
- Enquiry / callback forms saved as leads.

## Phase 2 — Accounts and booking
- Sign up / login (email + password and email OTP); My Account: bookings, wishlist, saved travellers, profile.
- 5-step booking wizard with live price (base x travellers + pickup + add-ons + GST - coupon).
- Seat safety: atomic seat reservation with 15-minute holds, auto-release, waitlist when full.
- Booking IDs like TDY-2027-00123, voucher PDF, pay-remaining-balance.
- Razorpay: order creation, signature check, webhook for captured payments and refunds.
- Bilingual confirmation emails (needs an email sender domain set up).

## Phase 3 — Admin portal
- Dashboard with stats and alerts.
- Trips: list with bulk actions, duplicate, archive; 9-tab editor (basic info, media with drag-reorder, itinerary day builder, pricing, departures with bulk add, pickup cities and add-ons, lists, FAQs and policy, SEO), autosave, publish checks, preview, last 10 versions with restore.
- Departures calendar, traveller manifest export (PDF/Excel).
- Bookings: detail, status changes, offline payments, refunds, notes, manual bookings, CSV export.
- Enquiries, customers, review moderation, coupons, all content modules, Settings, admin user invites, audit log.

## Phase 4 — SEO and polish
- Per-page bilingual titles/descriptions, hreflang, sitemap.xml, robots.txt (block /admin, /account), structured data (TouristTrip, Organization, FAQPage, Breadcrumb), performance and accessibility pass.

## Technical notes
- The brief names react-router and Supabase Edge Functions; this project uses TanStack Start, so routes use its file routing and server logic (Razorpay orders, webhooks, refunds, emails) uses server functions and `/api/public/*` routes with signature verification.
- Translations via react-i18next, language taken from the URL segment `$lang`.
- Roles in a separate `user_roles` table checked through a `has_role` function; admin pages sit under an authenticated layout.
- Seat holds: `reserve_seats` and `release_expired_holds` database functions with row locking.

I will start with Phase 1 after approval, then continue through the phases.
