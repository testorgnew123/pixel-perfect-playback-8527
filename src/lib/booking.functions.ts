import { createServerFn } from "@tanstack/react-start";
import { and, eq, inArray, count, sql } from "drizzle-orm";
import { requireAuth } from "@/lib/auth-middleware.server";
import { isAdmin as checkIsAdmin, isStaff as checkIsStaff } from "@/lib/roles.server";
import { db } from "@/lib/db.server";
import { bookings, booking_travellers, booking_addons, payments, refunds, departures, yatras, yatra_pricing, yatra_addons, yatra_pickup_cities, site_settings, coupons, coupon_redemptions, waitlist, audit_logs, agents, agent_commissions } from "../../drizzle/schema";
import { computeQuote, daysUntil, refundFor, type Sharing, type Slab } from "./pricing";
import { computeCommission } from "./commission";
import { applyCapturedPayment, assertAgent, rejectPendingPayments, resolveRate, voidCommission } from "./agent.server";

export type TravellerIn = { traveller_type: "adult" | "child" | "infant"; full_name: string; age: number | null; gender: string; mobile?: string; id_type?: string; id_number?: string; medical_condition?: string; meal_pref?: string };
export type QuoteReq = { departureId: string; adults: number; children: number; infants: number; sharing: Sharing; pickupCityId?: string | null; addonIds: string[]; couponCode?: string | null };
export type BookingReq = QuoteReq & { travellers: TravellerIn[]; contact: { name: string; mobile: string; email?: string; city?: string }; consent: boolean; lang: "hi" | "en"; notes?: string };

const SHARINGS = ["quad", "triple", "twin", "single"];

function validateQuote(d: QuoteReq): QuoteReq {
  const int = (n: unknown, min: number, max: number) => Number.isInteger(n) && (n as number) >= min && (n as number) <= max;
  if (typeof d?.departureId !== "string") throw new Error("Invalid departure");
  if (!int(d.adults, 1, 20) || !int(d.children, 0, 10) || !int(d.infants, 0, 5)) throw new Error("Invalid number of travellers");
  if (!SHARINGS.includes(d.sharing)) throw new Error("Invalid room sharing");
  if (!Array.isArray(d.addonIds) || d.addonIds.length > 20) throw new Error("Invalid add-ons");
  return { departureId: d.departureId, adults: d.adults, children: d.children, infants: d.infants, sharing: d.sharing, pickupCityId: d.pickupCityId || null, addonIds: d.addonIds.map(String), couponCode: d.couponCode?.trim().toUpperCase() || null };
}

function validateBooking(d: BookingReq): BookingReq {
  const q = validateQuote(d);
  const heads = q.adults + q.children + q.infants;
  if (!Array.isArray(d.travellers) || d.travellers.length !== heads) throw new Error("Traveller details missing");
  if (!d.consent) throw new Error("Consent is required");
  const s = (v: unknown, max = 120) => String(v ?? "").trim().slice(0, max);
  if (!s(d.contact?.name) || !/^[0-9+\s-]{10,15}$/.test(s(d.contact?.mobile, 20))) throw new Error("Valid contact name and mobile required");
  const travellers = d.travellers.map((t) => {
    if (!s(t.full_name)) throw new Error("Every traveller needs a name");
    return { traveller_type: (["adult", "child", "infant"].includes(t.traveller_type) ? t.traveller_type : "adult") as TravellerIn["traveller_type"], full_name: s(t.full_name), age: t.age == null || isNaN(Number(t.age)) ? null : Math.max(0, Math.min(120, Math.round(Number(t.age)))), gender: s(t.gender, 10), mobile: s(t.mobile, 20), id_type: s(t.id_type, 30), id_number: s(t.id_number, 40).replace(/\s/g, ""), medical_condition: s(t.medical_condition, 500), meal_pref: s(t.meal_pref, 30) };
  });
  return { ...q, travellers, contact: { name: s(d.contact.name), mobile: s(d.contact.mobile, 20), email: s(d.contact.email), city: s(d.contact.city) }, consent: true, lang: d.lang === "en" ? "en" : "hi", notes: s(d.notes, 1000) };
}

/** Loads all prices from the database and computes the quote. */
async function buildQuote(q: QuoteReq, userId: string | null) {
  const dep = await db.query.departures.findFirst({ where: eq(departures.id, q.departureId) });
  if (!dep) throw new Error("Departure not found");
  const [y, pricing, addons, pickup, settings] = await Promise.all([
    db.query.yatras.findFirst({ where: eq(yatras.id, dep.yatra_id), with: { yatra_categories: { columns: { category_id: true } } } }),
    db.query.yatra_pricing.findFirst({ where: eq(yatra_pricing.yatra_id, dep.yatra_id) }),
    q.addonIds.length ? db.query.yatra_addons.findMany({ where: and(eq(yatra_addons.yatra_id, dep.yatra_id), inArray(yatra_addons.id, q.addonIds)) }) : Promise.resolve([]),
    q.pickupCityId ? db.query.yatra_pickup_cities.findFirst({ where: and(eq(yatra_pickup_cities.yatra_id, dep.yatra_id), eq(yatra_pickup_cities.id, q.pickupCityId)) }) : Promise.resolve(null),
    db.query.site_settings.findFirst({ where: eq(site_settings.id, 1) }),
  ]);
  if (!y || y.status !== "published") throw new Error("Yatra not available");
  let coupon: typeof coupons.$inferSelect | null = null;
  let couponError: string | null = null;
  if (q.couponCode) {
    const c = await db.query.coupons.findFirst({ where: and(eq(coupons.code, q.couponCode), eq(coupons.active, true)) });
    const today = new Date().toISOString().slice(0, 10);
    const catIds = y.yatra_categories.map((x) => x.category_id).filter((id): id is string => !!id);
    if (!c) couponError = "invalid";
    else if ((c.valid_from && today < c.valid_from) || (c.valid_to && today > c.valid_to)) couponError = "expired";
    else if (c.usage_limit && c.used_count >= c.usage_limit) couponError = "used_up";
    else if (c.applicable_yatra_ids.length && !c.applicable_yatra_ids.includes(y.id)) couponError = "not_applicable";
    else if (c.applicable_category_ids.length && !c.applicable_category_ids.some((id) => catIds.includes(id))) couponError = "not_applicable";
    else if (userId && c.per_user_limit) {
      const [{ value: n }] = await db.select({ value: count() }).from(coupon_redemptions).where(and(eq(coupon_redemptions.coupon_id, c.id), eq(coupon_redemptions.user_id, userId)));
      if (n >= c.per_user_limit) couponError = "used_up";
    }
    if (!couponError && c) coupon = c;
  }
  const quote = computeQuote({
    adults: q.adults, children: q.children, infants: q.infants, sharing: q.sharing,
    yatraPrice: y.price, priceOverride: dep.price_override, pricing: pricing as never,
    addons: addons ?? [], pickupCharge: Number(pickup?.extra_charge ?? 0),
    coupon: coupon ? { discount_type: coupon.discount_type, value: Number(coupon.value), min_amount: Number(coupon.min_amount) } : null,
    gstPercent: Number(y.gst_percent), gstInclusive: y.gst_inclusive, advanceType: y.advance_type, advanceValue: Number(y.advance_value),
  });
  if (coupon && quote.discount === 0) couponError = "min_amount";
  const seatsLeft = dep.total_seats - dep.booked_seats;
  return { dep, y, addons: addons ?? [], pickup, coupon: quote.discount > 0 ? coupon : null, couponError, quote, seatsLeft, slabs: (y.cancellation_slabs ?? settings?.cancellation_slabs ?? []) as Slab[] };
}

export const quoteBooking = createServerFn({ method: "POST" })
  .inputValidator(validateQuote)
  .handler(async ({ data }) => {
    const r = await buildQuote(data, null);
    return { ...r.quote, couponError: r.couponError, couponApplied: !!r.coupon, seatsLeft: r.seatsLeft, departureStatus: r.dep.status };
  });

async function placeBooking(data: BookingReq, opts: { userId: string | null; createdBy: string; agent?: { id: string; percent: number } }) {
  const r = await buildQuote(data, opts.userId);
  const seats = data.adults + data.children; // infants don't take a seat
  const [{ ok }] = await db.execute<{ ok: boolean }>(sql`select public.reserve_seats(${data.departureId}::uuid, ${seats}::int) as ok`);
  if (!ok) return { ok: false as const, reason: "sold_out" as const };
  try {
    // One transaction: a failure part-way leaves no booking, coupon use or commission row behind
    // (the seats are released below). The agent commission row exists iff the booking does.
    return await db.transaction(async (tx) => {
      const [{ code }] = await tx.execute<{ code: string }>(sql`select public.next_booking_code() as code`);
      const status = r.quote.total === 0 ? "confirmed" : "pending_payment";
      const [b] = await tx.insert(bookings).values({
        booking_code: code, user_id: opts.userId, created_by: opts.createdBy, yatra_id: r.y.id, departure_id: r.dep.id,
        adults: data.adults, children: data.children, infants: data.infants, sharing: data.sharing, pickup_city_id: r.pickup?.id ?? null,
        contact: data.contact, base_amount: String(r.quote.base), addons_amount: String(r.quote.addons), pickup_amount: String(r.quote.pickup), discount_amount: String(r.quote.discount),
        gst_amount: String(r.quote.gst), total_amount: String(r.quote.total), status, payment_option: "pay_later", coupon_code: r.coupon?.code ?? null,
        consent: true, lang: data.lang, internal_notes: data.notes || null,
      }).returning({ id: bookings.id, booking_code: bookings.booking_code });
      if (!b) throw new Error("Could not save booking");
      const { encryptText } = await import("./crypto.server");
      const travellers = await Promise.all(data.travellers.map(async (t) => ({
        booking_id: b.id, traveller_type: t.traveller_type, full_name: t.full_name, age: t.age, gender: t.gender || null, mobile: t.mobile || null,
        id_type: t.id_type || null, id_last4: t.id_number ? t.id_number.slice(-4) : null, id_number_cipher: t.id_number ? await encryptText(t.id_number) : null,
        medical_condition: t.medical_condition || null, meal_pref: t.meal_pref || null,
      })));
      await tx.insert(booking_travellers).values(travellers);
      if (r.addons.length) await tx.insert(booking_addons).values(r.addons.map((a) => ({ booking_id: b.id, addon_id: a.id, name_en: a.name_en, name_hi: a.name_hi, price: String(a.price), qty: a.per_person ? seats : 1 })));
      if (r.coupon) {
        await tx.insert(coupon_redemptions).values({ coupon_id: r.coupon.id, booking_id: b.id, user_id: opts.userId, amount: String(r.quote.discount) });
        await tx.update(coupons).set({ used_count: sql`${coupons.used_count} + 1` }).where(eq(coupons.id, r.coupon.id));
      }
      if (opts.agent) {
        // Rate and amount come only from the DB-derived quote and the agent's stored rate, never from the client.
        const c = computeCommission({ total: r.quote.total, gst: r.quote.gst, percent: opts.agent.percent });
        const free = r.quote.total === 0; // nothing to collect, so it is already "fully paid"
        await tx.insert(agent_commissions).values({ booking_id: b.id, agent_id: opts.agent.id, rate_percent: String(c.percent), basis_amount: String(c.basis), amount: String(c.amount), status: free ? "payable" : "pending", earned_at: free ? new Date() : null });
      }
      await tx.insert(audit_logs).values({ actor_id: opts.createdBy, action: opts.agent ? "agent_booking" : opts.userId === opts.createdBy ? "customer_booking" : "manual_booking", entity: "bookings", entity_id: b.id, details: { code: b.booking_code, total: r.quote.total } });
      return { ok: true as const, code: b.booking_code, id: b.id, total: r.quote.total, advance: r.quote.advance };
    });
  } catch (e) {
    await db.execute(sql`select public.release_seats(${data.departureId}::uuid, ${seats}::int)`);
    throw e;
  }
}

export const createBooking = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .inputValidator(validateBooking)
  .handler(async ({ data, context }) => placeBooking(data, { userId: context.userId, createdBy: context.userId }));

export const joinWaitlist = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .inputValidator((d: { departureId: string; name: string; mobile: string; email?: string; seats: number }) => {
    if (!d.name?.trim() || !/^[0-9+\s-]{10,15}$/.test(d.mobile ?? "") || !Number.isInteger(d.seats) || d.seats < 1 || d.seats > 20) throw new Error("Invalid details");
    return d;
  })
  .handler(async ({ data, context }) => {
    await db.insert(waitlist).values({ departure_id: data.departureId, user_id: context.userId, name: data.name.trim(), mobile: data.mobile.trim(), email: data.email?.trim() || null, seats: data.seats });
    return { ok: true };
  });

async function refundPreview(bookingId: string) {
  const b = await db.query.bookings.findFirst({ where: eq(bookings.id, bookingId), with: { departures: { columns: { start_date: true } }, yatras: { columns: { cancellation_slabs: true } } } });
  if (!b) throw new Error("Booking not found");
  const s = await db.query.site_settings.findFirst({ where: eq(site_settings.id, 1), columns: { cancellation_slabs: true } });
  const slabs = (b.yatras?.cancellation_slabs ?? s?.cancellation_slabs ?? []) as Slab[];
  const days = daysUntil(b.departures?.start_date ?? new Date().toISOString().slice(0, 10));
  return { b, days, ...refundFor(Number(b.amount_paid), slabs, days) };
}

export const requestCancellation = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .inputValidator((d: { bookingId: string; reason?: string }) => d)
  .handler(async ({ data, context }) => {
    const p = await refundPreview(data.bookingId);
    if (p.b.user_id !== context.userId) throw new Error("Not your booking");
    if (!["pending_payment", "partially_paid", "confirmed"].includes(p.b.status)) throw new Error("This booking can't be cancelled");
    await db.update(bookings).set({ status: "cancellation_requested", internal_notes: data.reason ? `Customer: ${data.reason.slice(0, 500)}` : null }).where(eq(bookings.id, data.bookingId));
    await db.insert(audit_logs).values({ actor_id: context.userId, action: "cancellation_requested", entity: "bookings", entity_id: data.bookingId, details: { reason: data.reason ?? null } });
    return { percent: p.percent, amount: p.amount, days: p.days };
  });

// ---------- staff / admin ----------
async function assertStaff(ctx: { userId: string }, adminOnly = false) {
  const ok = adminOnly ? await checkIsAdmin(ctx.userId) : await checkIsStaff(ctx.userId);
  if (!ok) throw new Error(adminOnly ? "Admins only" : "Staff only");
}

export const adminCreateBooking = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .inputValidator((d: BookingReq & { waitlistId?: string | undefined }) => ({ ...validateBooking(d), waitlistId: d.waitlistId }))
  .handler(async ({ data, context }) => {
    await assertStaff(context);
    const res = await placeBooking(data, { userId: null, createdBy: context.userId });
    if (res.ok && data.waitlistId) await db.update(waitlist).set({ status: "converted", booking_id: res.id }).where(eq(waitlist.id, data.waitlistId));
    return res;
  });

/** An invited, active agent books on behalf of a customer: no customer account (user_id null), the agent
 * is the actor, and a commission row is created in the same transaction. */
export const agentCreateBooking = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .inputValidator(validateBooking)
  .handler(async ({ data, context }) => {
    const agent = await assertAgent(context.userId);
    return placeBooking(data, { userId: null, createdBy: context.userId, agent: { id: agent.id, percent: await resolveRate(agent) } });
  });

export const adminQuote = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .inputValidator(validateQuote)
  .handler(async ({ data, context }) => { await assertStaff(context); const r = await buildQuote(data, null); return { ...r.quote, couponError: r.couponError, seatsLeft: r.seatsLeft }; });

export const getRefundPreview = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .inputValidator((d: { bookingId: string }) => d)
  .handler(async ({ data, context }) => { await assertStaff(context); const p = await refundPreview(data.bookingId); return { percent: p.percent, amount: p.amount, days: p.days, paid: Number(p.b.amount_paid) }; });

export const recordPayment = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .inputValidator((d: { bookingId: string; amount: number; method: string; notes?: string }) => {
    if (!(d.amount > 0) || d.amount > 10_000_000) throw new Error("Invalid amount");
    return d;
  })
  .handler(async ({ data, context }) => {
    await assertStaff(context);
    const amount = Math.round(data.amount);
    // Same checks and messages as before, now under a row lock in one transaction (see applyCapturedPayment).
    const res = await db.transaction(async (tx) => {
      const r = await applyCapturedPayment(tx, data.bookingId, amount);
      await tx.insert(payments).values({ booking_id: data.bookingId, amount: String(amount), method: data.method, status: "captured", recorded_by: context.userId, notes: data.notes || null });
      await tx.insert(audit_logs).values({ actor_id: context.userId, action: "record_payment", entity: "bookings", entity_id: data.bookingId, details: { amount: data.amount, method: data.method } });
      return r;
    });
    return res;
  });

export const adminCancelBooking = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .inputValidator((d: { bookingId: string; reason?: string; refundOverride?: number | null }) => d)
  .handler(async ({ data, context }) => {
    await assertStaff(context, true);
    const p = await refundPreview(data.bookingId);
    if (["cancelled", "refunded"].includes(p.b.status)) throw new Error("Already cancelled");
    const refund = data.refundOverride != null ? Math.max(0, Math.min(Number(p.b.amount_paid), Math.round(data.refundOverride))) : p.amount;
    const seats = p.b.adults + p.b.children;
    await db.update(bookings).set({ status: "cancelled", cancelled_at: new Date(), refund_amount: String(refund) }).where(eq(bookings.id, p.b.id));
    // Agent bookings: commission is void (or clawback if already paid out) and unverified agent payments can never apply.
    await voidCommission(p.b.id);
    await rejectPendingPayments(p.b.id);
    if (p.b.departure_id) await db.execute(sql`select public.release_seats(${p.b.departure_id}::uuid, ${seats}::int)`);
    if (refund > 0) await db.insert(refunds).values({ booking_id: p.b.id, amount: String(refund), status: "pending", reason: data.reason || null, created_by: context.userId });
    // Offer freed seats to the waitlist (oldest first)
    let offered = 0;
    if (p.b.departure_id) {
      const dep = await db.query.departures.findFirst({ where: eq(departures.id, p.b.departure_id), columns: { total_seats: true, booked_seats: true } });
      let free = (dep?.total_seats ?? 0) - (dep?.booked_seats ?? 0);
      const wl = await db.query.waitlist.findMany({ where: and(eq(waitlist.departure_id, p.b.departure_id), eq(waitlist.status, "waiting")), orderBy: (w, { asc }) => asc(w.created_at) });
      for (const w of wl) {
        if (w.seats > free) continue;
        free -= w.seats; offered++;
        await db.update(waitlist).set({ status: "offered", offered_until: new Date(Date.now() + 48 * 3600 * 1000) }).where(eq(waitlist.id, w.id));
      }
    }
    await db.insert(audit_logs).values({ actor_id: context.userId, action: "cancel_booking", entity: "bookings", entity_id: p.b.id, details: { refund, percent: p.percent, days: p.days, reason: data.reason ?? null, waitlistOffered: offered } });
    return { refund, offered };
  });

export const markRefundPaid = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .inputValidator((d: { refundId: string; reference?: string }) => d)
  .handler(async ({ data, context }) => {
    await assertStaff(context, true);
    const [r] = await db.update(refunds).set(data.reference ? { status: "processed", razorpay_refund_id: null, reason: `Ref: ${data.reference}` } : { status: "processed" }).where(eq(refunds.id, data.refundId)).returning({ booking_id: refunds.booking_id });
    if (r) await db.update(bookings).set({ status: "refunded" }).where(eq(bookings.id, r.booking_id));
    await db.insert(audit_logs).values({ actor_id: context.userId, action: "refund_processed", entity: "refunds", entity_id: data.refundId, details: { reference: data.reference ?? null } });
    return { ok: true };
  });

/** Booking detail for staff. ID numbers and medical info only for admins; staff see last 4 digits. */
export const getBookingDetail = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .inputValidator((d: { bookingId: string }) => d)
  .handler(async ({ data, context }) => {
    await assertStaff(context);
    const isAdmin = await checkIsAdmin(context.userId);
    const [b, tr, pay, ref, ad] = await Promise.all([
      db.query.bookings.findFirst({ where: eq(bookings.id, data.bookingId), with: { yatras: { columns: { title_en: true, title_hi: true, slug: true } }, departures: { columns: { start_date: true, end_date: true } } } }),
      db.query.booking_travellers.findMany({ where: eq(booking_travellers.booking_id, data.bookingId) }),
      db.query.payments.findMany({ where: eq(payments.booking_id, data.bookingId), orderBy: (p, { asc }) => asc(p.created_at) }),
      db.query.refunds.findMany({ where: eq(refunds.booking_id, data.bookingId), orderBy: (r, { asc }) => asc(r.created_at) }),
      db.query.booking_addons.findMany({ where: eq(booking_addons.booking_id, data.bookingId) }),
    ]);
    const { decryptText } = await import("./crypto.server");
    const travellers = await Promise.all(tr.map(async ({ id_number_cipher, ...t }) => ({
      ...t,
      medical_condition: isAdmin ? t.medical_condition : t.medical_condition ? "(restricted)" : null,
      id_number: isAdmin && id_number_cipher ? await decryptText(id_number_cipher).catch(() => null) : null,
    })));
    const pickup = b?.pickup_city_id ? (await db.query.yatra_pickup_cities.findFirst({ where: eq(yatra_pickup_cities.id, b.pickup_city_id), columns: { city_en: true } }))?.city_en ?? null : null;
    // Who booked it. Staff see the agent's name; the commission itself only reaches admins.
    const [ag] = await db.select({ name: agents.full_name, email: agents.email, amount: agent_commissions.amount, status: agent_commissions.status, rate: agent_commissions.rate_percent })
      .from(agent_commissions).innerJoin(agents, eq(agents.id, agent_commissions.agent_id)).where(eq(agent_commissions.booking_id, data.bookingId)).limit(1);
    const agent = ag ? { name: ag.name, email: ag.email, commission: isAdmin ? { amount: Number(ag.amount), status: ag.status, rate: Number(ag.rate) } : null } : null;
    return { booking: b, pickup, travellers, payments: pay, refunds: ref, addons: ad, isAdmin: !!isAdmin, agent };
  });

export const getManifest = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .inputValidator((d: { departureId: string }) => d)
  .handler(async ({ data, context }) => {
    await assertStaff(context);
    const isAdmin = await checkIsAdmin(context.userId);
    const bs = await db.query.bookings.findMany({
      where: and(eq(bookings.departure_id, data.departureId), sql`${bookings.status} not in ('cancelled','refunded')`),
      orderBy: (b, { asc }) => asc(b.created_at),
      with: { booking_travellers: true },
    });
    const { decryptText } = await import("./crypto.server");
    const pIds = [...new Set(bs.map((b) => b.pickup_city_id).filter((id): id is string => !!id))];
    const pk = pIds.length ? await db.query.yatra_pickup_cities.findMany({ where: inArray(yatra_pickup_cities.id, pIds), columns: { id: true, city_en: true } }) : [];
    const pmap = new Map(pk.map((x) => [x.id, x.city_en]));
    const rows = [];
    for (const b of bs) for (const t of b.booking_travellers) {
      rows.push({ code: b.booking_code, status: b.status, pickup: pmap.get(b.pickup_city_id ?? "") ?? "", contact: (b.contact as { mobile?: string } | null)?.mobile ?? "", name: t.full_name, type: t.traveller_type, age: t.age, gender: t.gender, mobile: t.mobile, meal: t.meal_pref, id_type: t.id_type,
        id: isAdmin && t.id_number_cipher ? await decryptText(t.id_number_cipher).catch(() => "") : t.id_last4 ? `XXXX${t.id_last4}` : "",
        medical: isAdmin ? t.medical_condition ?? "" : "" });
    }
    return { rows, isAdmin: !!isAdmin };
  });
