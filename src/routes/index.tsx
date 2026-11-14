import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  beforeLoad: () => {
    let lang = "hi";
    if (typeof window !== "undefined") {
      try { if (window.localStorage.getItem("tdy_lang") === "en") lang = "en"; } catch { /* ignore */ }
    }
    // 301, not the router's default 307: the language default is permanent for crawlers, and
    // server-side there is no localStorage to read, so / always resolves to /hi there anyway.
    // The localStorage branch only runs for in-app navigations, which never make an HTTP request.
    throw redirect({ to: "/$lang", params: { lang }, replace: true, statusCode: 301 });
  },
});
