import Link from "next/link";
import { getActivePersona } from "@/lib/persona/server";
import { getCaseworker } from "@/lib/data/caseworkers";
import { listClientsForCaseworker } from "@/lib/data/clients";
import { getStepCountsByClient } from "@/lib/data/plan";
import { listResourcesByOrg } from "@/lib/data/resources";
import { GuidedTour } from "@/components/GuidedTour";

function daysSince(iso: string | null): number {
  if (!iso) return Infinity;
  return (Date.now() - new Date(iso).getTime()) / 86_400_000;
}

export default async function OrgDashboard() {
  const persona = await getActivePersona();
  const cw = await getCaseworker(persona.id);
  const clients = await listClientsForCaseworker(persona.id);
  const counts = await getStepCountsByClient(clients.map((c) => c.id));
  const resources = cw?.org_id ? await listResourcesByOrg(cw.org_id) : [];

  const stepsDone = Object.values(counts).reduce((n, c) => n + c.done, 0);
  const newThisWeek = clients.filter(
    (c) => daysSince(c.released_on) <= 7,
  ).length;
  const activeResources = resources.filter((r) => r.status === "active").length;

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-semibold text-navy-900">Dashboard</h1>

      <GuidedTour surface="org" />

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <SummaryCard label="Active clients" value={String(clients.length)} />
        <SummaryCard label="New this week" value={String(newThisWeek)} />
        <SummaryCard label="Steps completed" value={String(stepsDone)} />
        <SummaryCard label="Resources listed" value={String(activeResources)} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <PanelLink
          href="/caseload"
          title="Caseload Intelligence"
          body="Today's digest: who needs follow-up and what's trending."
        />
        <PanelLink
          href="/gaps"
          title="Gap Analysis"
          body="Where client needs outrun the resources you can offer."
        />
      </div>
    </div>
  );
}

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-navy-100 rounded-md p-4 bg-surface">
      <p className="text-sm text-navy-500">{label}</p>
      <p className="text-2xl font-semibold text-navy-900 mt-1">{value}</p>
    </div>
  );
}

function PanelLink({
  href,
  title,
  body,
}: {
  href: string;
  title: string;
  body: string;
}) {
  return (
    <Link
      href={href}
      className="block border border-navy-100 rounded-md p-5 bg-surface hover:border-navy-300"
    >
      <p className="font-semibold text-navy-900">{title}</p>
      <p className="text-sm text-navy-600 mt-1">{body}</p>
    </Link>
  );
}
