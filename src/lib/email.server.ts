import nodemailer, { type Transporter } from "nodemailer";
import { Resend } from "resend";

/**
 * Transport order: SMTP if configured (BigRock / cPanel mailbox), else Resend if a key is set,
 * else log the message and return. The log branch exists so password reset and OTP stay
 * recoverable from the server console when mail is unconfigured — it is not a working setup.
 */
/** Blank-but-present vars are normal in a .env placeholder, so treat "" as unset. */
const env = (key: string) => {
  const value = process.env[key]?.trim();
  return value ? value : undefined;
};

const SMTP_HOST = env("SMTP_HOST");
const SMTP_USER = env("SMTP_USER");
const SMTP_PASS = env("SMTP_PASS");
// 465 = implicit TLS (SMTPS), 587 = STARTTLS. BigRock mailboxes accept both; 465 is the safer
// default on serverless hosts, where port 25 is normally blocked outright.
const SMTP_PORT = Number(env("SMTP_PORT") ?? 465);
const SMTP_SECURE = (env("SMTP_SECURE") ?? String(SMTP_PORT === 465)) === "true";

const FROM =
  env("EMAIL_FROM") ??
  (SMTP_USER ? `Hari Shiv Shankar Tirth Yatra <${SMTP_USER}>` : "Hari Shiv Shankar Tirth Yatra <no-reply@harishivshankartirthyatra.com>");

const resendKey = env("RESEND_API_KEY");
const resend = resendKey ? new Resend(resendKey) : undefined;

let transporter: Transporter | undefined;
function smtp(): Transporter | undefined {
  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) return undefined;
  // Created once per process: a serverless container reuses it across invocations.
  transporter ??= nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: SMTP_SECURE,
    auth: { user: SMTP_USER, pass: SMTP_PASS },
  });
  return transporter;
}

export async function sendEmail({ to, subject, html }: { to: string; subject: string; html: string }) {
  const mailer = smtp();
  if (mailer) {
    // Envelope sender must be the authenticated mailbox or the host rejects it; a different
    // display address belongs in EMAIL_FROM only if that mailbox is allowed to send as it.
    await mailer.sendMail({ from: FROM, to, subject, html });
    return;
  }

  if (resend) {
    const { error } = await resend.emails.send({ from: FROM, to, subject, html });
    if (error) throw new Error(error.message);
    return;
  }

  const link = /https?:\/\/[^\s"'<>]+/.exec(html)?.[0];
  console.warn(
    `[email] No SMTP_* or RESEND_API_KEY configured — NOT sending "${subject}" to ${to}.` +
      (link ? ` Link: ${link}` : ""),
  );
}

/** Verifies credentials and connectivity without sending. Used by scripts/send-test-email.ts. */
export async function verifyEmailTransport() {
  const mailer = smtp();
  if (!mailer) throw new Error("SMTP_HOST, SMTP_USER and SMTP_PASS must all be set");
  await mailer.verify();
  return { host: SMTP_HOST, port: SMTP_PORT, secure: SMTP_SECURE, from: FROM };
}
