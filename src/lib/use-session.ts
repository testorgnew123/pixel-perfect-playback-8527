import { authClient } from "@/lib/auth-client";

/** Client-side session state (null until hydrated). */
export function useSessionUser() {
  const { data, isPending } = authClient.useSession();
  return { user: data?.user ?? null, ready: !isPending };
}
