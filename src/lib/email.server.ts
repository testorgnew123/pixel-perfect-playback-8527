import { Resend } from "resend";

const apiKey = process.env["RESEND_API_KEY"];
const resend = apiKey ? new Resend(apiKey) : undefined;
const FROM = process.env["EMAIL_FROM"] ?? "Hari Shiv Shankar Tirth Yatra <no-reply@harishivshankar.com>";

export async function sendEmail({ to, subject, html }: { to: string; subject: string; html: string }) {
  if (!resend) {
    console.warn(`[email] RESEND_API_KEY not set — skipping email to ${to}: ${subject}`);
    return;
  }
  const { error } = await resend.emails.send({ from: FROM, to, subject, html });
  if (error) throw new Error(error.message);
}
