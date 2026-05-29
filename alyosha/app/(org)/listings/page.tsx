import { getActivePersona } from "@/lib/persona/server";
import { getCaseworker } from "@/lib/data/caseworkers";
import { listResourcesByOrg } from "@/lib/data/resources";
import { ResourceManager } from "./ResourceManager";

export default async function OrgResources() {
  const persona = await getActivePersona();
  const cw = await getCaseworker(persona.id);
  const resources = cw?.org_id ? await listResourcesByOrg(cw.org_id) : [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-navy-900">Resources</h1>
        <p className="text-sm text-navy-600 mt-1">
          Listings you add here join the shared network and become searchable by
          clients.
        </p>
      </div>
      <ResourceManager resources={resources} />
    </div>
  );
}
