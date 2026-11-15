import { createFileRoute, redirect } from "@tanstack/react-router";
import { AgentsAdmin } from "@/components/admin/AgentsAdmin";

export const Route = createFileRoute("/admin/agents")({
  // UI gate only; every function behind this page re-checks isAdmin on the server.
  beforeLoad: ({ context }) => { if (!context.me.isAdmin) throw redirect({ to: "/admin" }); },
  component: AgentsAdmin,
});
