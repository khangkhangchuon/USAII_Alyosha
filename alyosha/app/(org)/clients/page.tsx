import Link from "next/link";
import { getActivePersona } from "@/lib/persona/server";
import { listClientsForCaseworker } from "@/lib/data/clients";
import { getStepCountsByClient } from "@/lib/data/plan";

function daysSince(iso: string | null): number {
  if (!iso) return Infinity;
  return Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);
}

export default async function OrgClients() {
  const persona = await getActivePersona();
  const clients = await listClientsForCaseworker(persona.id);
  const counts = await getStepCountsByClient(clients.map((c) => c.id));

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-navy-900">Clients</h1>

      <div className="overflow-x-auto border border-navy-100 rounded-md bg-surface">
        <table className="w-full text-sm">
          <thead className="bg-navy-50 text-navy-600 text-left">
            <tr>
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">Released</th>
              <th className="px-4 py-3 font-medium">Needs</th>
              <th className="px-4 py-3 font-medium">Last activity</th>
              <th className="px-4 py-3 font-medium">Progress</th>
            </tr>
          </thead>
          <tbody>
            {clients.map((c) => {
              const ct = counts[c.id] ?? { done: 0, total: 0 };
              const pct = ct.total ? Math.round((ct.done / ct.total) * 100) : 0;
              const quiet = daysSince(c.last_activity_at) >= 14;
              return (
                <tr
                  key={c.id}
                  className="border-t border-navy-100 hover:bg-navy-50"
                >
                  <td className="px-4 py-3">
                    <Link
                      href={`/clients/${c.id}`}
                      className="font-medium text-navy-800 underline"
                    >
                      {c.name}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-navy-600">
                    {c.released_on ?? "—"}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {(c.needs ?? []).length === 0 ? (
                        <span className="text-navy-400">—</span>
                      ) : (
                        c.needs.map((n) => (
                          <span
                            key={n}
                            className="px-2 py-0.5 rounded-full bg-navy-100 text-navy-700 text-xs"
                          >
                            {n}
                          </span>
                        ))
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-navy-600">
                    {daysSince(c.last_activity_at)}d ago
                    {quiet && (
                      <span className="ml-2 text-amber-700 font-medium">
                        ⚠ quiet
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-24 rounded-full bg-navy-100 overflow-hidden">
                        <div
                          className="h-full bg-accent-500"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="text-navy-600 text-xs">
                        {ct.done}/{ct.total}
                      </span>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
