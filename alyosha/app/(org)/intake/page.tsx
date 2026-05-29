"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { EMPTY_INTAKE, type IntakeForm } from "@/lib/mock/intake";
import type { IntakeOutput } from "@/lib/ai/schemas";

const FIELDS: { key: keyof IntakeForm; label: string; textarea?: boolean }[] = [
  { key: "name", label: "Full name" },
  { key: "released_on", label: "Release date (YYYY-MM-DD)" },
  { key: "incarceration_years", label: "Years incarcerated" },
  { key: "location", label: "Location" },
  { key: "documents", label: "Documents in hand" },
  { key: "skills", label: "Skills / work history" },
  { key: "needs", label: "Immediate needs (comma-separated)" },
  { key: "goals", label: "Goals" },
  { key: "notes", label: "Caseworker notes", textarea: true },
];

export default function IntakePage() {
  const router = useRouter();
  const [form, setForm] = useState<IntakeForm>(EMPTY_INTAKE);
  const [profile, setProfile] = useState<IntakeOutput | null>(null);
  const [live, setLive] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [approving, setApproving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function generate() {
    setGenerating(true);
    setError(null);
    try {
      const res = await fetch("/api/intake", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      setProfile(data.profile);
      setLive(Boolean(data.live));
    } catch {
      setError("Could not generate a profile. Please try again.");
    } finally {
      setGenerating(false);
    }
  }

  async function approve() {
    if (!profile) return;
    setApproving(true);
    setError(null);
    try {
      const res = await fetch("/api/intake/approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name || "New Client",
          released_on: form.released_on,
          profile,
        }),
      });
      const data = await res.json();
      if (res.ok && data.client_id) {
        router.push(`/clients/${data.client_id}`);
      } else {
        setError(data.error ?? "Could not save the client.");
      }
    } catch {
      setError("Could not save the client.");
    } finally {
      setApproving(false);
    }
  }

  const sp = profile?.structured_profile;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-navy-900">Smart Intake</h1>
      {error && (
        <p className="rounded-md bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-2">
          {error}
        </p>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-navy-900">Intake form</h2>
          {FIELDS.map((f) => (
            <label key={f.key} className="block">
              <span className="text-sm text-navy-600">{f.label}</span>
              {f.textarea ? (
                <textarea
                  value={form[f.key]}
                  onChange={(e) =>
                    setForm({ ...form, [f.key]: e.target.value })
                  }
                  rows={3}
                  className="mt-1 w-full px-3 py-2 rounded-md border border-navy-200 bg-surface text-navy-900 text-sm"
                />
              ) : (
                <input
                  type="text"
                  value={form[f.key]}
                  onChange={(e) =>
                    setForm({ ...form, [f.key]: e.target.value })
                  }
                  className="mt-1 w-full px-3 py-2 rounded-md border border-navy-200 bg-surface text-navy-900 text-sm"
                />
              )}
            </label>
          ))}
          <button
            type="button"
            onClick={generate}
            disabled={generating}
            className="min-h-[44px] px-5 rounded-md bg-navy-700 text-white font-semibold hover:bg-navy-800 disabled:opacity-60"
          >
            {generating ? "Reviewing the situation…" : "Generate profile"}
          </button>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-navy-900">
            Generated profile
          </h2>
          {!profile ? (
            <p className="text-navy-500 text-sm">
              Fill the form and click “Generate profile” to see a draft.
            </p>
          ) : (
            <div className="border border-navy-100 rounded-md p-5 bg-surface space-y-4 text-sm">
              {!live && (
                <p className="rounded-md bg-amber-50 border border-amber-200 text-amber-800 text-xs px-3 py-2">
                  Live AI unavailable — showing a sample draft (fallback).
                </p>
              )}
              <Block title="Summary">
                <p className="text-navy-700">{profile.profile_summary}</p>
              </Block>
              <Block title="Immediate needs">
                <Chips items={sp!.immediate_needs} />
              </Block>
              <Block title="Skills">
                <Chips items={sp!.skills} />
              </Block>
              <Block title="Eligible programs">
                <ul className="list-disc pl-5 text-navy-700 space-y-1">
                  {sp!.eligible_programs.map((p) => (
                    <li key={p}>{p}</li>
                  ))}
                </ul>
              </Block>
              <Block title="Recommended next steps">
                <ol className="space-y-1 text-navy-700">
                  {profile.plan_steps.map((s) => (
                    <li key={s.order}>
                      <span className="font-medium">
                        {s.order}. {s.title}
                      </span>
                      {s.instructions ? ` — ${s.instructions}` : ""}
                    </li>
                  ))}
                </ol>
              </Block>
              <Block title="Risk factors">
                <ul className="list-disc pl-5 text-navy-700 space-y-1">
                  {sp!.risk_factors.map((r) => (
                    <li key={r}>{r}</li>
                  ))}
                </ul>
              </Block>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={approve}
                  disabled={approving}
                  className="min-h-[44px] px-4 rounded-md bg-accent-500 text-navy-900 font-semibold hover:bg-accent-600 disabled:opacity-60"
                >
                  {approving ? "Saving…" : "Approve & create client"}
                </button>
                <button
                  type="button"
                  onClick={generate}
                  disabled={generating}
                  className="min-h-[44px] px-4 rounded-md border border-navy-200 text-navy-700 hover:bg-navy-50"
                >
                  Regenerate
                </button>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wide text-navy-500 mb-1">
        {title}
      </p>
      {children}
    </div>
  );
}

function Chips({ items }: { items: string[] }) {
  return (
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
  );
}
