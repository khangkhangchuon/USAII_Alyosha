import Link from "next/link";
import { getActivePersona } from "@/lib/persona/server";
import { getPlanSteps } from "@/lib/data/plan";
import { ReadAloud } from "@/components/a11y/ReadAloud";
import { StepCheck } from "./StepCheck";

export default async function ClientMap() {
  const persona = await getActivePersona();
  const steps = await getPlanSteps(persona.id);

  const done = steps.filter((s) => s.status === "done").length;

  return (
    <div className="space-y-8">
      <section className="space-y-2">
        <h1 className="text-3xl font-semibold text-navy-900">My map</h1>
        <p className="text-navy-700">
          One step at a time. Each step unlocks the next.
        </p>
        <p className="text-sm text-navy-500">
          {done} of {steps.length} steps done ·{" "}
          <Link href="/progress" className="underline">
            See my progress
          </Link>
        </p>
      </section>

      {steps.length === 0 ? (
        <p className="text-navy-600">
          Your map is being prepared. Check back soon.
        </p>
      ) : (
        <ol className="space-y-5">
          {steps.map((step) => {
            const readText = [
              step.title,
              step.instructions,
              step.where_to_go ? `Where to go: ${step.where_to_go}.` : "",
              step.what_to_bring ? `What to bring: ${step.what_to_bring}.` : "",
            ]
              .filter(Boolean)
              .join(" ");

            return (
              <li
                key={step.id}
                className={`rounded-lg border p-5 ${
                  step.locked
                    ? "border-navy-100 bg-surface-muted opacity-70"
                    : step.status === "done"
                      ? "border-navy-200 bg-surface-muted"
                      : "border-navy-200 bg-surface"
                }`}
              >
                <div className="flex items-baseline gap-3 mb-2">
                  <span className="flex-none w-8 h-8 rounded-full bg-navy-700 text-surface text-sm font-semibold inline-flex items-center justify-center">
                    {step.order}
                  </span>
                  <h2 className="text-xl font-semibold text-navy-900">
                    {step.title}
                  </h2>
                </div>

                {step.instructions && (
                  <p className="text-navy-700 mb-3">{step.instructions}</p>
                )}

                <dl className="space-y-2 mb-4 text-navy-700">
                  {step.where_to_go && (
                    <div>
                      <dt className="text-sm uppercase tracking-wide text-navy-500">
                        Where to go
                      </dt>
                      <dd>{step.where_to_go}</dd>
                    </div>
                  )}
                  {step.what_to_bring && (
                    <div>
                      <dt className="text-sm uppercase tracking-wide text-navy-500">
                        What to bring
                      </dt>
                      <dd>{step.what_to_bring}</dd>
                    </div>
                  )}
                </dl>

                <div className="flex flex-wrap items-center gap-3">
                  <StepCheck
                    stepId={step.id}
                    status={step.status}
                    locked={step.locked}
                  />
                  {!step.locked && <ReadAloud text={readText} />}
                </div>
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}
