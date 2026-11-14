import { createServerFn } from "@tanstack/react-start";
import { desc, eq } from "drizzle-orm";
import { requireAuth } from "@/lib/auth-middleware.server";
import { isStaff } from "@/lib/roles.server";
import { db } from "@/lib/db.server";
import { bookings, booking_travellers, booking_addons, payments, yatra_pickup_cities } from "../../drizzle/schema";

/** The signed-in user's own bookings (account page). */
export const getMyBookings = createServerFn({ method: "GET" })
  .middleware([requireAuth])
  .handler(async ({ context }) => {
    return db.query.bookings.findMany({
      where: eq(bookings.user_id, context.userId),
      orderBy: desc(bookings.created_at),
      columns: { id: true, booking_code: true, status: true, adults: true, children: true, infants: true, total_amount: true, amount_paid: true, created_at: true },
      with: { yatras: { columns: { title_en: true, title_hi: true, slug: true, cover_image: true } }, departures: { columns: { start_date: true, end_date: true } } },
    });
  });

/** A booking voucher/invoice by code — only the owner or staff may view it
 * (RLS used to enforce this; now it's an explicit check). */
export const getBookingVoucher = createServerFn({ method: "GET" })
  .middleware([requireAuth])
  .inputValidator((d: { code: string }) => d)
  .handler(async ({ data, context }) => {
    const b = await db.query.bookings.findFirst({
      where: eq(bookings.booking_code, data.code),
      with: { yatras: { columns: { title_en: true, title_hi: true } }, departures: { columns: { start_date: true, end_date: true } } },
    });
    if (!b) return null;
    if (b.user_id !== context.userId && !(await isStaff(context.userId))) throw new Error("Not your booking");
    const [travellers, addons, pays, pickup] = await Promise.all([
      db.query.booking_travellers.findMany({ where: eq(booking_travellers.booking_id, b.id), columns: { id: true, full_name: true, age: true, gender: true, traveller_type: true, id_type: true, id_last4: true, meal_pref: true } }),
      db.query.booking_addons.findMany({ where: eq(booking_addons.booking_id, b.id) }),
      db.query.payments.findMany({ where: eq(payments.booking_id, b.id), orderBy: (p, { asc }) => asc(p.created_at), columns: { id: true, amount: true, method: true, created_at: true, status: true } }),
      b.pickup_city_id ? db.query.yatra_pickup_cities.findFirst({ where: eq(yatra_pickup_cities.id, b.pickup_city_id), columns: { city_en: true, city_hi: true, reporting_time: true, reporting_place_en: true, reporting_place_hi: true } }) : Promise.resolve(null),
    ]);
    return { b, travellers, addons, payments: pays, pickup };
  });
