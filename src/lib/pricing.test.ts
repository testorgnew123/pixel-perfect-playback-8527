import { describe, expect, it } from "vitest";
import { computeQuote, refundFor, daysUntil, type QuoteInput } from "./pricing";

const base: QuoteInput = {
  adults: 2, children: 1, infants: 1, sharing: "twin", yatraPrice: 20000, priceOverride: null,
  pricing: { twin: 18000, triple: 16000, child: 12000, infant: 2000 },
  addons: [{ price: 1500, per_person: true }, { price: 3000, per_person: false }],
  pickupCharge: 500, coupon: null, gstPercent: 5, gstInclusive: false, advanceType: "fixed", advanceValue: 5000,
};

describe("computeQuote", () => {
  it("uses the sharing price per adult, child and infant rates", () => {
    expect(computeQuote(base).base).toBe(18000 * 2 + 12000 + 2000);
  });
  it("departure special price overrides the sharing price for adults", () => {
    expect(computeQuote({ ...base, priceOverride: 15000 }).adultRate).toBe(15000);
  });
  it("charges per-person add-ons and pickup for adults+children only", () => {
    const q = computeQuote(base);
    expect(q.addons).toBe(1500 * 3 + 3000);
    expect(q.pickup).toBe(500 * 3);
  });
  it("adds GST on top when prices exclude GST", () => {
    const q = computeQuote(base);
    expect(q.gst).toBe(Math.round(q.subtotal * 0.05));
    expect(q.total).toBe(q.subtotal + q.gst);
  });
  it("keeps the total unchanged when prices include GST", () => {
    const q = computeQuote({ ...base, gstInclusive: true });
    expect(q.total).toBe(q.subtotal);
  });
  it("applies a percent coupon only above the minimum amount", () => {
    expect(computeQuote({ ...base, coupon: { discount_type: "percent", value: 10, min_amount: 0 } }).discount).toBe(Math.round(computeQuote(base).subtotal * 0.1));
    expect(computeQuote({ ...base, coupon: { discount_type: "percent", value: 10, min_amount: 10_000_000 } }).discount).toBe(0);
  });
  it("fixed advance is per paying person, capped at total", () => {
    expect(computeQuote(base).advance).toBe(15000);
    expect(computeQuote({ ...base, advanceValue: 1_000_000 }).advance).toBe(computeQuote(base).total);
  });
});

describe("refundFor", () => {
  const slabs = [{ min_days: 30, refund_percent: 90 }, { min_days: 15, refund_percent: 50 }, { min_days: 0, refund_percent: 0 }];
  it("90% refund 30+ days before", () => expect(refundFor(10000, slabs, 45)).toEqual({ percent: 90, amount: 9000 }));
  it("50% refund 15-29 days before", () => expect(refundFor(10000, slabs, 20)).toEqual({ percent: 50, amount: 5000 }));
  it("no refund under 15 days", () => expect(refundFor(10000, slabs, 3).amount).toBe(0));
  it("counts calendar days", () => expect(daysUntil("2027-01-31", new Date("2027-01-01T20:00:00Z"))).toBe(30));
});
