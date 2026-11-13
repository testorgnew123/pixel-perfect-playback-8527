import { createFileRoute } from "@tanstack/react-router";
import { DeparturesManager } from "@/components/admin/DeparturesManager";

export const Route = createFileRoute("/admin/departures")({ component: Departures });

function Departures() {
  return <div className="space-y-4"><h1 className="font-display text-2xl text-maroon">Departures</h1><DeparturesManager /></div>;
}
