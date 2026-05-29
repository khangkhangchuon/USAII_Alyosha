import Link from "next/link";
import { getActivePersona } from "@/lib/persona/server";
import { ReadAloud } from "@/components/a11y/ReadAloud";

export default async function ClientHome() {
  const persona = await getActivePersona();

  const welcome = `Welcome back, ${persona.name}. Here is your next step. Take your time. You are not alone in this.`;

  return (
    <div className="space-y-8">
      <section>
        <h1 className="text-3xl font-semibold text-navy-900 mb-3">
          Welcome back, {persona.name.split(" ")[0]}.
        </h1>
        <p className="text-navy-700 mb-4">
          Here is your next step. Take your time. You are not alone in this.
        </p>
        <ReadAloud text={welcome} />
      </section>

      <section className="border border-navy-100 rounded-lg p-5 bg-surface-muted">
        <p className="text-sm uppercase tracking-wide text-navy-500 mb-2">
          Up next
        </p>
        <p className="text-xl font-semibold text-navy-900 mb-1">
          Get your New York State ID
        </p>
        <p className="text-navy-700 mb-4">
          You will need this for almost everything else. We will walk you
          through it.
        </p>
        <Link
          href="/map"
          className="inline-flex items-center justify-center min-h-[44px] px-5 py-3 rounded-md bg-accent-500 text-navy-900 font-semibold hover:bg-accent-600 focus-visible:bg-accent-600"
        >
          Open my map →
        </Link>
      </section>
    </div>
  );
}
