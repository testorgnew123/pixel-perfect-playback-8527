import { createServerFn } from "@tanstack/react-start";
import { db } from "@/lib/db.server";
import { enquiries } from "../../drizzle/schema";

/** Public — anyone can submit an enquiry (matches the old "anyone can enquire"
 * RLS policy's constraints: short name/mobile, always status "new", never pre-assigned). */
export const submitEnquiry = createServerFn({ method: "POST" })
  .inputValidator((d: { name: string; mobile: string; email?: string; yatra_interest?: string; preferred_month?: string; message?: string; source: string; yatra_id?: string | null }) => {
    const name = String(d.name ?? "").trim();
    const mobile = String(d.mobile ?? "").trim();
    if (!name || name.length > 120) throw new Error("Invalid name");
    if (!mobile || mobile.length < 6 || mobile.length > 20) throw new Error("Invalid mobile");
    return { ...d, name, mobile };
  })
  .handler(async ({ data }) => {
    await db.insert(enquiries).values({
      name: data.name, mobile: data.mobile, email: data.email || null, yatra_interest: data.yatra_interest || null,
      preferred_month: data.preferred_month || null, message: data.message || null, source: data.source, yatra_id: data.yatra_id ?? null,
      status: "new", assigned_to: null,
    });
    return { ok: true };
  });
