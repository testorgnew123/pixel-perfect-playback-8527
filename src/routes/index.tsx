import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  beforeLoad: () => {
    let lang = "hi";
    if (typeof window !== "undefined") {
      try { if (window.localStorage.getItem("tdy_lang") === "en") lang = "en"; } catch { /* ignore */ }
    }
    throw redirect({ to: "/$lang", params: { lang }, replace: true });
  },
  head: () => ({ meta: [{ title: "Hari Shiv Shankar Tirth Yatra" }, { name: "description", content: "तीर्थ यात्रा का सरल और पावन मार्ग" }, { property: "og:title", content: "Hari Shiv Shankar Tirth Yatra" }, { property: "og:description", content: "Pilgrimage tours across India" }] }),
});
