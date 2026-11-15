import { describe, expect, it } from "vitest";
import { computeCommission, isAllowedAgentEmail, parseAgentDomains, parsePercent, normalizeEmail } from "./commission";

const D = ["harishivshankartirthyatra.com"];

describe("computeCommission", () => {
  it("takes the percent of the pre-GST amount", () => {
    expect(computeCommission({ total: 10500, gst: 500, percent: 5 })).toEqual({ basis: 10000, percent: 5, amount: 500 });
  });
  it("works for GST-inclusive totals (gst is the part already inside total)", () => {
    expect(computeCommission({ total: 10000, gst: 476, percent: 10 }).amount).toBe(952);
  });
  it("rounds to whole rupees", () => {
    expect(computeCommission({ total: 1050, gst: 0, percent: 5 }).amount).toBe(53);
    expect(computeCommission({ total: 999, gst: 0, percent: 2.5 }).amount).toBe(25);
  });
  it("is zero at 0% and for a free booking", () => {
    expect(computeCommission({ total: 10500, gst: 500, percent: 0 }).amount).toBe(0);
    expect(computeCommission({ total: 0, gst: 0, percent: 5 }).amount).toBe(0);
  });
  it("never goes negative and clamps the percent to 0-100", () => {
    expect(computeCommission({ total: 100, gst: 500, percent: 5 }).basis).toBe(0);
    expect(computeCommission({ total: 1000, gst: 0, percent: 500 }).amount).toBe(1000);
    expect(computeCommission({ total: 1000, gst: 0, percent: -5 }).amount).toBe(0);
    expect(computeCommission({ total: 1000, gst: 0, percent: NaN }).amount).toBe(0);
  });
});

describe("parsePercent", () => {
  it("accepts 0-100 with at most 2 decimals", () => {
    expect(parsePercent("7.5")).toBe(7.5);
    expect(parsePercent(0)).toBe(0);
    expect(parsePercent(100)).toBe(100);
    expect(parsePercent("2.456")).toBe(2.46);
  });
  it("rejects blank, negative, too big and non-numbers", () => {
    for (const v of [null, undefined, "", "  ", -1, 100.01, "abc", NaN, Infinity]) expect(parsePercent(v)).toBeUndefined();
  });
});

describe("parseAgentDomains", () => {
  it("defaults to the site domain when blank or unset", () => {
    expect(parseAgentDomains(undefined)).toEqual(D);
    expect(parseAgentDomains("")).toEqual(D);
    expect(parseAgentDomains("  , ")).toEqual(D);
  });
  it("parses a comma list, lowercased and de-duplicated", () => {
    expect(parseAgentDomains("Example.com, other.org,example.com")).toEqual(["example.com", "other.org"]);
  });
  it("fails closed on any malformed entry", () => {
    for (const bad of ["*", "*.example.com", "example", "@example.com", "example.com/x", "exa mple.com", "a.com,b", ".com", "example.com."]) expect(parseAgentDomains(bad)).toEqual([]);
  });
});

describe("isAllowedAgentEmail", () => {
  it("accepts mailboxes on exactly the site domain, ignoring case and outer whitespace", () => {
    for (const ok of ["agent@harishivshankartirthyatra.com", "A.B+x@HariShivShankarTirthYatra.com ", " first_last@harishivshankartirthyatra.com"]) expect(isAllowedAgentEmail(ok, D)).toBe(true);
  });
  it("rejects other providers and other domains", () => {
    for (const bad of ["a@gmail.com", "a@yahoo.in", "a@harishivshankar.com"]) expect(isAllowedAgentEmail(bad, D)).toBe(false);
  });
  it("rejects subdomains and prefix/suffix lookalikes", () => {
    for (const bad of ["a@mail.harishivshankartirthyatra.com", "a@harishivshankartirthyatra.com.evil.com", "a@xharishivshankartirthyatra.com", "a@harishivshankartirthyatra.co", "a@harishivshankartirthyatra.com."]) expect(isAllowedAgentEmail(bad, D)).toBe(false);
  });
  it("rejects a second @, quoted tricks and inner whitespace", () => {
    for (const bad of ["a@evil.com@harishivshankartirthyatra.com", "a@harishivshankartirthyatra.com@evil.com", '"a@evil.com"@harishivshankartirthyatra.com', "a b@harishivshankartirthyatra.com", "a@harishivshankartirthyatra.com\n.evil.com"]) expect(isAllowedAgentEmail(bad, D)).toBe(false);
  });
  it("rejects non-ASCII homoglyphs, including the Kelvin sign that lowercases to k", () => {
    expect(isAllowedAgentEmail("a@hаrishivshankartirthyatra.com", D)).toBe(false); // Cyrillic a
    expect(isAllowedAgentEmail("a@harishivshanKartirthyatra.com", D)).toBe(false); // Kelvin sign
    expect(isAllowedAgentEmail("ａ@harishivshankartirthyatra.com", D)).toBe(false); // fullwidth a
  });
  it("rejects empty, missing parts and non-strings", () => {
    for (const bad of ["", "@harishivshankartirthyatra.com", "agent@", "agent", null, undefined, 42, {}]) expect(isAllowedAgentEmail(bad, D)).toBe(false);
  });
  it("rejects everything when the domain list is empty (fail closed)", () => {
    expect(isAllowedAgentEmail("agent@harishivshankartirthyatra.com", [])).toBe(false);
  });
  it("normalizeEmail gives the canonical stored form", () => {
    expect(normalizeEmail("  Agent@HariShivShankarTirthYatra.com ")).toBe("agent@harishivshankartirthyatra.com");
  });
});
