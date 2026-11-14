import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { listAuditLog } from "@/lib/admin-misc.functions";

export const Route = createFileRoute("/admin/audit")({ component: Audit });

function Audit() {
  const auditFn = useServerFn(listAuditLog);
  const { data = [] } = useQuery({ queryKey: ["admin", "audit"], queryFn: () => auditFn() });
  return (
    <div className="space-y-4">
      <h1 className="font-display text-2xl text-maroon">Audit log</h1>
      <div className="overflow-x-auto rounded-lg border bg-card">
        <table className="w-full text-sm">
          <thead className="bg-muted text-left"><tr><th className="p-2">When</th><th className="p-2">Who</th><th className="p-2">Action</th><th className="p-2">Item</th><th className="p-2">Details</th></tr></thead>
          <tbody>{data.map((l) => (
            <tr key={l.id} className="border-t align-top"><td className="whitespace-nowrap p-2">{new Date(l.created_at).toLocaleString("en-IN")}</td><td className="p-2">{l.who}</td><td className="p-2">{l.action}</td><td className="p-2">{l.entity}</td><td className="max-w-xs truncate p-2 text-muted-foreground">{l.details ? JSON.stringify(l.details) : ""}</td></tr>
          ))}</tbody>
        </table>
      </div>
    </div>
  );
}
