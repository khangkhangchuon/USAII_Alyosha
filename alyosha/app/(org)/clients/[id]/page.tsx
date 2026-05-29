import Link from "next/link";
import { notFound } from "next/navigation";
import { getClient } from "@/lib/data/clients";
import { getPlanSteps } from "@/lib/data/plan";

const STATUS_LABEL: Record<string, string> = {
  todo: "To do",
  in_progress: "In progress",
  done: "Done",
};

export default async function OrgClientDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const client = await getClient(id);
  if (!client) notFound();

  const steps = await getPlanSteps(id);
  const done = steps.filter((s) => s.status === "done").length;

  return (
    <div className="space-y-8">
      <div>
        <Link href="/clients" className="text-sm text-navy-500 underline">
          ← All clients
        </Link>
        <h1 className="text-2xl font-semibold text-navy-900 mt-2">
          {client.name}
        </h1>
        {client.profile_summary && (
          <p className="text-navy-700 mt-2 max-w-2xl">
            {client.profile_summary}
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <InfoCard title="Needs" items={client.needs} />
        <InfoCard title="Skills" items={client.skills} />
        <div className="border border-navy-100 rounded-md p-4 bg-surface">
          <p className="text-sm text-navy-500 mb-2">Documents</p>
          <ul className="space-y-1 text-sm">
            {Object.entries(client.documents ?? {}).map(([doc, has]) => (
              <li key={doc} className="text-navy-700">
                {has ? "✓" : "✗"} {doc.replace(/_/g, " ")}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-navy-900">
          Plan steps — {done}/{steps.length} done
        </h2>
        <ol className="space-y-2">
          {steps.map((s) => (
            <li
              key={s.id}
              className="flex items-center justify-between border border-navy-100 rounded-md px-4 py-3 bg-surface"
            >
              <span className="text-navy-800">
                <span className="text-navy-400 mr-2">{s.order}.</span>
                {s.title}
              </span>
              <span
                className={`text-xs px-2 py-1 rounded-full ${
                  s.status === "done"
                    ? "bg-accent-500 text-navy-900"
                    : s.status === "in_progress"
                      ? "bg-navy-200 text-navy-800"
                      : "bg-navy-100 text-navy-600"
                }`}
              >
                {STATUS_LABEL[s.status]}
              </span>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}

function InfoCard({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="border border-navy-100 rounded-md p-4 bg-surface">
      <p className="text-sm text-navy-500 mb-2">{title}</p>
      {(items ?? []).length === 0 ? (
        <p className="text-navy-400 text-sm">None listed</p>
      ) : (
        <div className="flex flex-wrap gap-1">
          {items.map((it) => (
            <span
              key={it}
              className="px-2 py-0.5 rounded-full bg-navy-100 text-navy-700 text-xs"
            >
              {it}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
