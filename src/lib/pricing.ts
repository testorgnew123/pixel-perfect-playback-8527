// Pure booking price calculation. Runs on the server with DB-loaded inputs; never trust client amounts.
export type Sharing = "quad" | "triple" | "twin" | "single";
export type Slab = { min_days: number; refund_percent: number };

export type QuoteInput = {
  adults: number; children: number; infants: number; sharing: Sharing;
  yatraPrice: number | null; priceOverride: number | null;
  pricing: Partial<Record<Sharing | "child" | "infant", number | null>> | null;
  addons: { price: number; per_person: boolean }[];
  pickupCharge: number;
  coupon: { discount_type: string; value: number; min_amount: number } | null;
  gstPercent: number; gstInclusive: boolean;
  advanceType: string; advanceValue: number;
};

const r = (n: number) => Math.round(n);

export function computeQuote(i: QuoteInput) {
  const payingHeads = i.adults + i.children;
  const adultRate = Number(i.priceOverride ?? i.pricing?.[i.sharing] ?? i.yatraPrice ?? 0);
  const childRate = Number(i.pricing?.child ?? adultRate);
  const infantRate = Number(i.pricing?.infant ?? 0);
  const base = r(adultRate * i.adults + childRate * i.children + infantRate * i.infants);
  const addons = r(i.addons.reduce((s, a) => s + Number(a.price) * (a.per_person ? payingHeads : 1), 0));
  const pickup = r(Number(i.pickupCharge) * payingHeads);
  const subtotal = base + addons + pickup;
  let discount = 0;
  if (i.coupon && subtotal >= Number(i.coupon.min_amount ?? 0)) {
    discount = i.coupon.discount_type === "percent" ? r((subtotal * Number(i.coupon.value)) / 100) : r(Number(i.coupon.value));
    discount = Math.min(discount, subtotal);
  }
  const taxable = subtotal - discount;
  const rate = Number(i.gstPercent) / 100;
  const gst = i.gstInclusive ? r(taxable - taxable / (1 + rate)) : r(taxable * rate);
  const total = i.gstInclusive ? taxable : taxable + gst;
  const advance = Math.min(total, i.advanceType === "percent" ? r((total * Number(i.advanceValue)) / 100) : r(Number(i.advanceValue) * payingHeads));
  return { adultRate, childRate, infantRate, base, addons, pickup, subtotal, discount, gst, total, advance };
}

/** Refund for a cancellation: picks the highest slab whose min_days <= days before departure. */
export function refundFor(amountPaid: number, slabs: Slab[], daysBefore: number) {
  const slab = [...slabs].sort((a, b) => b.min_days - a.min_days).find((s) => daysBefore >= s.min_days);
  const percent = slab?.refund_percent ?? 0;
  return { percent, amount: r((amountPaid * percent) / 100) };
}

export function daysUntil(dateStr: string, now = new Date()) {
  const d = Date.UTC(+dateStr.slice(0, 4), +dateStr.slice(5, 7) - 1, +dateStr.slice(8, 10));
  const t = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  return Math.round((d - t) / 86400000);
}
