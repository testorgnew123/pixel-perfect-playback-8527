/**
 * Sets a new password for a credential account, printing it once.
 *
 *   bun --env-file=.env.local run scripts/reset-admin-password.ts <email>
 *
 * Recovery path for when RESEND_API_KEY is unset and "Forgot password?" therefore cannot
 * deliver a link. Uses better-auth's own hasher, so the stored value is exactly what
 * signIn.email verifies against — never write a hash from anywhere else into account.password.
 */
import { randomBytes } from "node:crypto";
import postgres from "postgres";
import { auth } from "../src/lib/auth.server";

const email = process.argv[2];
if (!email) {
  console.error("usage: bun --env-file=.env.local run scripts/reset-admin-password.ts <email>");
  process.exit(1);
}

// 18 random bytes -> 24 base64url chars, no shell-hostile characters.
const password = randomBytes(18).toString("base64url");

const ctx = await auth.$context;
const hash = await ctx.password.hash(password);

const sql = postgres(process.env["DATABASE_URL"]!, { ssl: "require", max: 1 });
try {
  const user = (await sql`select id from "user" where email = ${email}`)[0];
  if (!user) {
    console.error(`no user with email ${email}`);
    process.exit(1);
  }

  const updated = await sql`
    update account set password = ${hash}
    where user_id = ${user["id"]} and provider_id = 'credential'
    returning id`;
  if (!updated.length) {
    console.error("that user has no credential (email+password) account row");
    process.exit(1);
  }

  await sql`update "user" set must_change_password = false, is_active = true where id = ${user["id"]}`;

  console.log(`\npassword reset for ${email}`);
  console.log(`new password: ${password}`);
  console.log("\nStore it in a password manager and change it after signing in.\n");
} finally {
  await sql.end();
}
