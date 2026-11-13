import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { CrudPage } from "@/components/admin/CrudPage";
import { CONTENT } from "@/components/admin/content-config";

export const Route = createFileRoute("/admin/content/$kind")({
  beforeLoad: ({ params }) => { if (!CONTENT[params.kind]) throw notFound(); },
  component: ContentPage,
});

const TABS = ["blog", "destinations", "categories", "banners", "testimonials", "gallery", "faqs", "team", "representatives"];

function ContentPage() {
  const { kind } = Route.useParams();
  const cfg = CONTENT[kind]!;
  const showTabs = TABS.includes(kind);
  return (
    <div className="space-y-4">
      {showTabs && (
        <div className="flex flex-wrap gap-1">
          {TABS.map((k) => <Link key={k} to="/admin/content/$kind" params={{ kind: k }} className="rounded-full border px-3 py-1 text-sm" activeProps={{ className: "bg-primary text-primary-foreground border-primary" }}>{CONTENT[k]!.title}</Link>)}
        </div>
      )}
      <CrudPage key={kind} cfg={cfg} />
    </div>
  );
}
