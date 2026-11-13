import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { computeQuote, daysUntil, refundFor, type Sharing, type Slab } from "./pricing";

export type TravellerIn = { traveller_type: "adult" | "child" | "infant"; full_name: string; age: number | null; gender: string; mobile?: string; id_type?: string; id_number?: string; medical_condition?: string; meal_pref?: string };
export type QuoteReq = { departureId: string; adults: number; children: number; infants: number; sharing: Sharing; pickupCityId?: string | null; addonIds: string[]; couponCode?: string | null };
export type BookingReq = QuoteReq & { travellers: TravellerIn[]; contact: { name: string; mobile: string; email?: string; city?: string }; consent: boolean; lang: "hi" | "en"; notes?: string };

const admin = async () => (await import("@/integrations/supabase/client.server")).supabaseAdmin;
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
  const db = await admin();
  const { data: dep } = await db.from("departures").select("id, yatra_id, start_date, end_date, total_seats, booked_seats, status, price_override").eq("id", q.departureId).maybeSingle();
  if (!dep) throw new Error("Departure not found");
  const [{ data: y }, { data: pricing }, { data: addons }, { data: pickup }, { data: settings }] = await Promise.all([
    db.from("yatras").select("id, title_en, title_hi, slug, status, price, gst_percent, gst_inclusive, advance_type, advance_value, cancellation_slabs, yatra_categories(category_id)").eq("id", dep.yatra_id).single(),
    db.from("yatra_pricing").select("*").eq("yatra_id", dep.yatra_id).maybeSingle(),
    q.addonIds.length ? db.from("yatra_addons").select("id, name_en, name_hi, price, per_person").eq("yatra_id", dep.yatra_id).in("id", q.addonIds) : Promise.resolve({ data: [] as { id: string; name_en: string; name_hi: string | null; price: number; per_person: boolean }[] }),
    q.pickupCityId ? db.from("yatra_pickup_cities").select("id, city_en, city_hi, extra_charge").eq("yatra_id", dep.yatra_id).eq("id", q.pickupCityId).maybeSingle() : Promise.resolve({ data: null }),
    db.from("site_settings").select("cancellation_slabs").eq("id", 1).single(),
  ]);
  if (!y || y.status !== "published") throw new Error("Yatra not available");
  let coupon: { id: string; code: string; discount_type: string; value: number; min_amount: number } | null = null;
  let couponError: string | null = null;
  if (q.couponCode) {
    const { data: c } = await db.from("coupons").select("*").eq("code", q.couponCode).eq("active", true).maybeSingle();
    const today = new Date().toISOString().slice(0, 10);
    const catIds = (y.yatra_categories ?? []).map((x: { category_id: string | null }) => x.category_id);
    if (!c) couponError = "invalid";
    else if ((c.valid_from && today < c.valid_from) || (c.valid_to && today > c.valid_to)) couponError = "expired";
    else if (c.usage_limit && c.used_count >= c.usage_limit) couponError = "used_up";
    else if (c.applicable_yatra_ids.length && !c.applicable_yatra_ids.includes(y.id)) couponError = "not_applicable";
    else if (c.applicable_category_ids.length && !c.applicable_category_ids.some((id: string) => catIds.includes(id))) couponError = "not_applicable";
    else if (userId && c.per_user_limit) {
      const { count } = await db.from("coupon_redemptions").select("id", { count: "exact", head: true }).eq("coupon_id", c.id).eq("user_id", userId);
      if ((count ?? 0) >= c.per_user_limit) couponError = "used_up";
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

async function placeBooking(data: BookingReq, opts: { userId: string | null; createdBy: string }) {
  const db = await admin();
  const r = await buildQuote(data, opts.userId);
  const seats = data.adults + data.children; // infants don't take a seat
  const { data: ok, error: rErr } = await db.rpc("reserve_seats", { _departure_id: data.departureId, _seats: seats });
  if (rErr) throw new Error(rErr.message);
  if (!ok) return { ok: false as const, reason: "sold_out" as const };
  try {
    const { data: code } = await db.rpc("next_booking_code");
    const status = r.quote.total === 0 ? "confirmed" : "pending_payment";
    const { data: b, error } = await db.from("bookings").insert({
      booking_code: (code as string).replace("TDY", "HSS"), user_id: opts.userId, created_by: opts.createdBy, yatra_id: r.y.id, departure_id: r.dep.id,
      adults: data.adults, children: data.children, infants: data.infants, sharing: data.sharing, pickup_city_id: r.pickup?.id ?? null,
      contact: data.contact, base_amount: r.quote.base, addons_amount: r.quote.addons, pickup_amount: r.quote.pickup, discount_amount: r.quote.discount,
      gst_amount: r.quote.gst, total_amount: r.quote.total, status, payment_option: "pay_later", coupon_code: r.coupon?.code ?? null,
      consent: true, lang: data.lang, internal_notes: data.notes || null,
    }).select("id, booking_code").single();
    if (error || !b) throw new Error(error?.message ?? "Could not save booking");
    const { encryptText } = await import("./crypto.server");
    const travellers = await Promise.all(data.travellers.map(async (t) => ({
      booking_id: b.id, traveller_type: t.traveller_type, full_name: t.full_name, age: t.age, gender: t.gender || null, mobile: t.mobile || null,
      id_type: t.id_type || null, id_last4: t.id_number ? t.id_number.slice(-4) : null, id_number_cipher: t.id_number ? await encryptText(t.id_number) : null,
      medical_condition: t.medical_condition || null, meal_pref: t.meal_pref || null,
    })));
    const ins = await db.from("booking_travellers").insert(travellers);
    if (ins.error) throw new Error(ins.error.message);
    if (r.addons.length) await db.from("booking_addons").insert(r.addons.map((a) => ({ booking_id: b.id, addon_id: a.id, name_en: a.name_en, name_hi: a.name_hi, price: a.price, qty: a.per_person ? seats : 1 })));
    if (r.coupon) {
      await db.from("coupon_redemptions").insert({ coupon_id: r.coupon.id, booking_id: b.id, user_id: opts.userId, amount: r.quote.discount });
      const { data: c } = await db.from("coupons").select("used_count").eq("id", r.coupon.id).single();
      await db.from("coupons").update({ used_count: (c?.used_count ?? 0) + 1 }).eq("id", r.coupon.id);
    }
    await db.from("audit_logs").insert({ actor_id: opts.createdBy, action: opts.userId === opts.createdBy ? "customer_booking" : "manual_booking", entity: "bookings", entity_id: b.id, details: { code: b.booking_code, total: r.quote.total } });
    return { ok: true as const, code: b.booking_code, id: b.id, total: r.quote.total, advance: r.quote.advance };
  } catch (e) {
    await db.rpc("release_seats", { _departure_id: data.departureId, _seats: seats });
    throw e;
  }
}

export const createBooking = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(validateBooking)
  .handler(async ({ data, context }) => placeBooking(data, { userId: context.userId, createdBy: context.userId }));

export const joinWaitlist = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { departureId: string; name: string; mobile: string; email?: string; seats: number }) => {
    if (!d.name?.trim() || !/^[0-9+\s-]{10,15}$/.test(d.mobile ?? "") || !Number.isInteger(d.seats) || d.seats < 1 || d.seats > 20) throw new Error("Invalid details");
    return d;
  })
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("waitlist").insert({ departure_id: data.departureId, user_id: context.userId, name: data.name.trim(), mobile: data.mobile.trim(), email: data.email?.trim() || null, seats: data.seats });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

async function refundPreview(bookingId: string) {
  const db = await admin();
  const { data: b } = await db.from("bookings").select("id, user_id, status, amount_paid, total_amount, adults, children, departure_id, yatra_id, departures(start_date), yatras(cancellation_slabs)").eq("id", bookingId).single();
  if (!b) throw new Error("Booking not found");
  const { data: s } = await db.from("site_settings").select("cancellation_slabs").eq("id", 1).single();
  const slabs = ((b.yatras as { cancellation_slabs: Slab[] | null } | null)?.cancellation_slabs ?? s?.cancellation_slabs ?? []) as Slab[];
  const days = daysUntil((b.departures as { start_date: string } | null)?.start_date ?? new Date().toISOString().slice(0, 10));
  return { b, days, ...refundFor(Number(b.amount_paid), slabs, days) };
}

export const requestCancellation = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { bookingId: string; reason?: string }) => d)
  .handler(async ({ data, context }) => {
    const p = await refundPreview(data.bookingId);
    if (p.b.user_id !== context.userId) throw new Error("Not your booking");
    if (!["pending_payment", "partially_paid", "confirmed"].includes(p.b.status)) throw new Error("This booking can't be cancelled");
    const db = await admin();
    await db.from("bookings").update({ status: "cancellation_requested", internal_notes: data.reason ? `Customer: ${data.reason.slice(0, 500)}` : null }).eq("id", data.bookingId);
    await db.from("audit_logs").insert({ actor_id: context.userId, action: "cancellation_requested", entity: "bookings", entity_id: data.bookingId, details: { reason: data.reason ?? null } });
    return { percent: p.percent, amount: p.amount, days: p.days };
  });

// ---------- staff / admin ----------
async function assertStaff(ctx: { supabase: any; userId: string }, adminOnly = false) {
  const { data } = await ctx.supabase.rpc(adminOnly ? "is_admin" : "is_staff", { _user_id: ctx.userId });
  if (!data) throw new Error(adminOnly ? "Admins only" : "Staff only");
}

export const adminCreateBooking = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: BookingReq & { waitlistId?: string }) => ({ ...validateBooking(d), waitlistId: d.waitlistId }))
  .handler(async ({ data, context }) => {
    await assertStaff(context);
    const res = await placeBooking(data, { userId: null, createdBy: context.userId });
    if (res.ok && data.waitlistId) await (await admin()).from("waitlist").update({ status: "converted", booking_id: res.id }).eq("id", data.waitlistId);
    return res;
  });

export const adminQuote = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(validateQuote)
  .handler(async ({ data, context }) => { await assertStaff(context); const r = await buildQuote(data, null); return { ...r.quote, couponError: r.couponError, seatsLeft: r.seatsLeft }; });

export const getRefundPreview = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { bookingId: string }) => d)
  .handler(async ({ data, context }) => { await assertStaff(context); const p = await refundPreview(data.bookingId); return { percent: p.percent, amount: p.amount, days: p.days, paid: Number(p.b.amount_paid) }; });

export const recordPayment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { bookingId: string; amount: number; method: string; notes?: string }) => {
    if (!(d.amount > 0) || d.amount > 10_000_000) throw new Error("Invalid amount");
    return d;
  })
  .handler(async ({ data, context }) => {
    await assertStaff(context);
    const db = await admin();
    const { data: b } = await db.from("bookings").select("id, status, amount_paid, total_amount").eq("id", data.bookingId).single();
    if (!b) throw new Error("Booking not found");
    if (["cancelled", "refunded"].includes(b.status)) throw new Error("Booking is cancelled");
    const paid = Number(b.amount_paid) + Math.round(data.amount);
    if (paid > Number(b.total_amount)) throw new Error(`Amount exceeds balance due (₹${Number(b.total_amount) - Number(b.amount_paid)})`);
    await db.from("payments").insert({ booking_id: b.id, amount: Math.round(data.amount), method: data.method, status: "captured", recorded_by: context.userId, notes: data.notes || null });
    const status = paid >= Number(b.total_amount) ? "confirmed" : "partially_paid";
    await db.from("bookings").update({ amount_paid: paid, status: b.status === "cancellation_requested" ? b.status : status }).eq("id", b.id);
    await db.from("audit_logs").insert({ actor_id: context.userId, action: "record_payment", entity: "bookings", entity_id: b.id, details: { amount: data.amount, method: data.method } });
    return { paid, status };
  });

export const adminCancelBooking = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { bookingId: string; reason?: string; refundOverride?: number | null }) => d)
  .handler(async ({ data, context }) => {
    await assertStaff(context, true);
    const db = await admin();
    const p = await refundPreview(data.bookingId);
    if (["cancelled", "refunded"].includes(p.b.status)) throw new Error("Already cancelled");
    const refund = data.refundOverride != null ? Math.max(0, Math.min(Number(p.b.amount_paid), Math.round(data.refundOverride))) : p.amount;
    const seats = p.b.adults + p.b.children;
    await db.from("bookings").update({ status: "cancelled", cancelled_at: new Date().toISOString(), refund_amount: refund }).eq("id", p.b.id);
    if (p.b.departure_id) await db.rpc("release_seats", { _departure_id: p.b.departure_id, _seats: seats });
    if (refund > 0) await db.from("refunds").insert({ booking_id: p.b.id, amount: refund, status: "pending", reason: data.reason || null, created_by: context.userId });
    // Offer freed seats to the waitlist (oldest first)
    let offered = 0;
    if (p.b.departure_id) {
      const { data: dep } = await db.from("departures").select("total_seats, booked_seats").eq("id", p.b.departure_id).single();
      let free = (dep?.total_seats ?? 0) - (dep?.booked_seats ?? 0);
      const { data: wl } = await db.from("waitlist").select("id, seats").eq("departure_id", p.b.departure_id).eq("status", "waiting").order("created_at");
      for (const w of wl ?? []) {
        if (w.seats > free) continue;
        free -= w.seats; offered++;
        await db.from("waitlist").update({ status: "offered", offered_until: new Date(Date.now() + 48 * 3600 * 1000).toISOString() }).eq("id", w.id);
      }
    }
    await db.from("audit_logs").insert({ actor_id: context.userId, action: "cancel_booking", entity: "bookings", entity_id: p.b.id, details: { refund, percent: p.percent, days: p.days, reason: data.reason ?? null, waitlistOffered: offered } });
    return { refund, offered };
  });

export const markRefundPaid = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { refundId: string; reference?: string }) => d)
  .handler(async ({ data, context }) => {
    await assertStaff(context, true);
    const db = await admin();
    const { data: r } = await db.from("refunds").update(data.reference ? { status: "processed", razorpay_refund_id: null, reason: `Ref: ${data.reference}` } : { status: "processed" }).eq("id", data.refundId).select("booking_id").single();
    if (r) await db.from("bookings").update({ status: "refunded" }).eq("id", r.booking_id);
    await db.from("audit_logs").insert({ actor_id: context.userId, action: "refund_processed", entity: "refunds", entity_id: data.refundId, details: { reference: data.reference ?? null } });
    return { ok: true };
  });

/** Booking detail for staff. ID numbers and medical info only for admins; staff see last 4 digits. */
export const getBookingDetail = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { bookingId: string }) => d)
  .handler(async ({ data, context }) => {
    await assertStaff(context);
    const { data: isAdmin } = await context.supabase.rpc("is_admin", { _user_id: context.userId });
    const db = await admin();
    const [{ data: b }, { data: tr }, { data: pay }, { data: ref }, { data: ad }] = await Promise.all([
      db.from("bookings").select("*, yatras(title_en, title_hi, slug), departures(start_date, end_date)").eq("id", data.bookingId).single(),
      db.from("booking_travellers").select("*").eq("booking_id", data.bookingId),
      db.from("payments").select("*").eq("booking_id", data.bookingId).order("created_at"),
      db.from("refunds").select("*").eq("booking_id", data.bookingId).order("created_at"),
      db.from("booking_addons").select("*").eq("booking_id", data.bookingId),
    ]);
    const { decryptText } = await import("./crypto.server");
    const travellers = await Promise.all((tr ?? []).map(async ({ id_number_enc, id_number_cipher, ...t }) => ({
      ...t,
      medical_condition: isAdmin ? t.medical_condition : t.medical_condition ? "(restricted)" : null,
      id_number: isAdmin && id_number_cipher ? await decryptText(id_number_cipher).catch(() => null) : null,
    })));
    const pickup = b?.pickup_city_id ? (await db.from("yatra_pickup_cities").select("city_en").eq("id", b.pickup_city_id).maybeSingle()).data?.city_en ?? null : null;
    return { booking: b, pickup, travellers, payments: pay ?? [], refunds: ref ?? [], addons: ad ?? [], isAdmin: !!isAdmin };
  });

export const getManifest = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { departureId: string }) => d)
  .handler(async ({ data, context }) => {
    await assertStaff(context);
    const { data: isAdmin } = await context.supabase.rpc("is_admin", { _user_id: context.userId });
    const db = await admin();
    const { data: bs } = await db.from("bookings").select("id, booking_code, contact, status, total_amount, amount_paid, pickup_city_id, booking_travellers(*)").eq("departure_id", data.departureId).not("status", "in", "(cancelled,refunded)").order("created_at");
    const { decryptText } = await import("./crypto.server");
    const pIds = [...new Set((bs ?? []).map((b) => b.pickup_city_id).filter(Boolean))] as string[];
    const { data: pk } = pIds.length ? await db.from("yatra_pickup_cities").select("id, city_en").in("id", pIds) : { data: [] };
    const pmap = new Map((pk ?? []).map((x) => [x.id, x.city_en]));
    const rows = [];
    for (const b of bs ?? []) for (const t of (b.booking_travellers ?? []) as any[]) {
      rows.push({ code: b.booking_code, status: b.status, pickup: pmap.get(b.pickup_city_id ?? "") ?? "", contact: (b.contact as { mobile?: string })?.mobile ?? "", name: t.full_name, type: t.traveller_type, age: t.age, gender: t.gender, mobile: t.mobile, meal: t.meal_pref, id_type: t.id_type,
        id: isAdmin && t.id_number_cipher ? await decryptText(t.id_number_cipher).catch(() => "") : t.id_last4 ? `XXXX${t.id_last4}` : "",
        medical: isAdmin ? t.medical_condition ?? "" : "" });
    }
    return { rows, isAdmin: !!isAdmin };
  });
