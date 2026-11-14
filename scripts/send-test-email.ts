/**
 * Verifies the SMTP settings and optionally sends one real message.
 *
 *   bun --env-file=.env.local run scripts/send-test-email.ts              # connect + auth only
 *   bun --env-file=.env.local run scripts/send-test-email.ts you@example.com   # also send
 *
 * Run this before trusting "Forgot password?" — a wrong host, port or password fails here
 * with the provider's own error rather than silently never arriving in someone's inbox.
 */
import { sendEmail, verifyEmailTransport } from "../src/lib/email.server";

const to = process.argv[2];

try {
  const cfg = await verifyEmailTransport();
  console.log(`SMTP OK  host=${cfg.host} port=${cfg.port} secure=${cfg.secure}`);
  console.log(`from: ${cfg.from}`);
} catch (e) {
  console.error("SMTP verify FAILED:", (e as Error).message);
  console.error("\nCheck SMTP_HOST / SMTP_PORT / SMTP_SECURE / SMTP_USER / SMTP_PASS in .env.local.");
  process.exit(1);
}

if (!to) {
  console.log("\nNo recipient given — connection verified, nothing sent.");
  process.exit(0);
}

await sendEmail({
  to,
  subject: "Test email from Hari Shiv Shankar Tirth Yatra",
  html: `<p>SMTP is working.</p><p>Sent ${new Date().toISOString()}.</p><p><a href="https://harishivshankartirthyatra.com">harishivshankartirthyatra.com</a></p>`,
});
console.log(`\nSent to ${to}. If it does not arrive, check the mailbox's spam folder and the domain's SPF record.`);
