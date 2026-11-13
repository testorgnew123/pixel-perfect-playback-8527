import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  beforeLoad: () => {
    let lang = "hi";
    if (typeof window !== "undefined") {
      try { if (window.localStorage.getItem("tdy_lang") === "en") lang = "en"; } catch { /* ignore */ }
    }
    throw redirect({ to: "/$lang", params: { lang }, replace: true });
  },
  head: () => ({ meta: [{ title: "Tirth Darshan Yatra" }, { name: "description", content: "तीर्थ यात्रा का सरल और पावन मार्ग" }, { property: "og:title", content: "Tirth Darshan Yatra" }, { property: "og:description", content: "Pilgrimage tours across India" }] }),
});
