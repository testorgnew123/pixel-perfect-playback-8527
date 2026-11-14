import { createMiddleware } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { auth } from "./auth.server";

/** Replaces the old requireSupabaseAuth: validates the session cookie and
 * exposes the caller's id as context.userId. Staff/admin checks happen
 * in-handler via roles.server.ts, same as before. */
export const requireAuth = createMiddleware({ type: "function" }).server(async ({ next }) => {
  const request = getRequest();
  if (!request?.headers) throw new Error("Unauthorized: No request headers available");
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session?.user) throw new Error("Unauthorized: No session");
  if (session.user.isActive === false) throw new Error("Unauthorized: Account disabled");
  return next({ context: { userId: session.user.id } });
});
