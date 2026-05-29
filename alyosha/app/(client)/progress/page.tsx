import Link from "next/link";
import { getActivePersona } from "@/lib/persona/server";
import { getPlanSteps } from "@/lib/data/plan";
import { ReadAloud } from "@/components/a11y/ReadAloud";

export default async function ClientProgress() {
  const persona = await getActivePersona();
  const steps = await getPlanSteps(persona.id);

  const total = steps.length;
  const done = steps.filter((s) => s.status === "done").length;
  const pct = total === 0 ? 0 : Math.round((done / total) * 100);

  const encouragement =
    done === 0
      ? "Every journey starts with one step. You've got this."
      : done === total
        ? "You've completed every step. That's real work — be proud."
        : `You've finished ${done} ${done === 1 ? "step" : "steps"}. Keep going — you're moving forward.`;

  return (
    <div className="space-y-8">
      <section className="space-y-2">
        <h1 className="text-3xl font-semibold text-navy-900">My progress</h1>
        <p className="text-navy-700">{encouragement}</p>
        <ReadAloud text={encouragement} />
      </section>

      <section className="rounded-lg border border-navy-100 bg-surface p-5">
        <div className="flex items-baseline justify-between mb-2">
          <p className="text-lg font-semibold text-navy-900">
            {done} of {total} done
          </p>
          <p className="text-2xl font-semibold text-navy-700">{pct}%</p>
        </div>
        <div
          className="h-4 w-full rounded-full bg-navy-100 overflow-hidden"
          role="progressbar"
          aria-valuenow={pct}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Steps completed"
        >
          <div
            className="h-full bg-accent-500 rounded-full"
            style={{ width: `${pct}%` }}
          />
        </div>
      </section>

      <ol className="space-y-3">
        {steps.map((step) => (
          <li
            key={step.id}
            className="flex items-center gap-3 rounded-md border border-navy-100 bg-surface px-4 py-3"
          >
            <span
              aria-hidden="true"
              className={`flex-none w-7 h-7 rounded-full inline-flex items-center justify-center text-sm font-semibold ${
                step.status === "done"
                  ? "bg-accent-500 text-navy-900"
                  : "bg-navy-100 text-navy-600"
              }`}
            >
              {step.status === "done" ? "✓" : step.order}
            </span>
            <span
              className={
                step.status === "done"
                  ? "text-navy-500 line-through"
                  : "text-navy-900"
              }
            >
              {step.title}
            </span>
          </li>
        ))}
      </ol>

      <Link href="/map" className="inline-block text-navy-600 underline">
        ← Back to my map
      </Link>
    </div>
  );
}
