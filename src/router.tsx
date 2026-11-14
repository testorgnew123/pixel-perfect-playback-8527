import { QueryClient } from "@tanstack/react-query";
import { createRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";

export const getRouter = () => {
  // One client per request: a module-level QueryClient leaks cached data between SSR requests.
  const queryClient = new QueryClient();

  const router = createRouter({
    routeTree,
    context: { queryClient },
    scrollRestoration: true,
    // Warm the next route's loader on hover/focus instead of paying the full round trip on click.
    defaultPreload: "intent",
    // Keeps a preloaded route usable for a few seconds so the click doesn't re-fetch it;
    // beyond that, Query still owns freshness via its own staleTime.
    defaultPreloadStaleTime: 30_000,
  });

  return router;
};
