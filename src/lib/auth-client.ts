import { createAuthClient } from "better-auth/react";
import { emailOTPClient, customSessionClient } from "better-auth/client/plugins";
import type { auth } from "./auth.server";

export const authClient = createAuthClient({
  plugins: [emailOTPClient(), customSessionClient<typeof auth>()],
});
