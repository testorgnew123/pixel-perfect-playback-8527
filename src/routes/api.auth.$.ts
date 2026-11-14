import { createFileRoute } from "@tanstack/react-router";
import { auth } from "@/lib/auth.server";

// Mounts better-auth's own HTTP handler (sign-in/sign-up/sessions/OTP/reset)
// at /api/auth/*, consumed by src/lib/auth-client.ts.
export const Route = createFileRoute("/api/auth/$")({
  server: {
    handlers: {
      GET: ({ request }) => auth.handler(request),
      POST: ({ request }) => auth.handler(request),
    },
  },
});
