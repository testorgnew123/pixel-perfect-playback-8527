import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { emailOTP, customSession } from "better-auth/plugins";
import { db } from "./db.server";
import { sendEmail } from "./email.server";
import { getRoles } from "./roles.server";
import * as schema from "../../drizzle/schema";

export const auth = betterAuth({
  baseURL: process.env["BETTER_AUTH_URL"],
  secret: process.env["BETTER_AUTH_SECRET"],
  database: drizzleAdapter(db, { provider: "pg", schema }),
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
    sendResetPassword: async ({ user, url }) => {
      await sendEmail({
        to: user.email,
        subject: "Reset your password",
        html: `<p>Reset your Hari Shiv Shankar Tirth Yatra password:</p><p><a href="${url}">${url}</a></p>`,
      });
    },
  },
  user: {
    additionalFields: {
      phone: { type: "string", required: false, input: true },
      mustChangePassword: { type: "boolean", required: false, defaultValue: false, input: true },
      isActive: { type: "boolean", required: false, defaultValue: true, input: false },
      preferredLang: { type: "string", required: false, defaultValue: "hi", input: true },
    },
  },
  plugins: [
    emailOTP({
      sendVerificationOTP: async ({ email, otp, type }) => {
        const subject =
          type === "sign-in" ? "Your sign-in code" : type === "forget-password" ? "Your password reset code" : "Your verification code";
        await sendEmail({ to: email, subject, html: `<p>Your code: <strong>${otp}</strong></p><p>Expires in 5 minutes.</p>` });
      },
    }),
    // Enriches GET /get-session with roles, so admin.tsx and useSessionUser
    // never need a direct DB round-trip of their own.
    customSession(async ({ user, session }) => {
      const roles = await getRoles(user.id);
      return {
        user: {
          ...user,
          roles,
          isStaff: roles.some((r) => r === "staff" || r === "admin" || r === "super_admin"),
          isAdmin: roles.some((r) => r === "admin" || r === "super_admin"),
          isSuper: roles.includes("super_admin"),
          // UI flag only; every agent server fn re-checks via assertAgent (agent.server.ts).
          isAgent: roles.includes("agent"),
        },
        session,
      };
    }),
  ],
});
