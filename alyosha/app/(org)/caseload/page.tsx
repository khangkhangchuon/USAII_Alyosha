"use client";
import { useState } from "react";
import Link from "next/link";
import { MOCK_CASELOAD } from "@/lib/mock/caseload";
import type { CaseloadDigest } from "@/lib/ai/schemas";

export default function CaseloadPage() {
  const [digest, setDigest] = useState<CaseloadDigest>(MOCK_CASELOAD);
  const [live, setLive] = useState(false);
  const [loading, setLoading] = useState(false);

  async function generate() {
    setLoading(true);
    try {
      const res = await fetch("/api/caseload", { method: "POST" });
      const data = await res.json();
      setDigest(data.digest);
      setLive(Boolean(data.live));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-baseline justify-between flex-wrap gap-2">
        <h1 className="text-2xl font-semibold text-navy-900">
          Caseload Intelligence
        </h1>
        <button
          type="button"
          onClick={generate}
          disabled={loading}
          className="min-h-[44px] px-4 rounded-md bg-navy-700 text-white text-sm font-semibold hover:bg-navy-800 disabled:opacity-60"
        >
          {loading ? "Generating…" : "Generate today's digest"}
        </button>
      </div>

      <p className="text-sm text-navy-500">
        Digest — {digest.generated_for}{" "}
        {live ? (
          <span className="text-green-700">· live</span>
        ) : (
          <span className="text-amber-700">· sample (click generate for live)</span>
        )}
      </p>

      <Section title="Needs follow-up">
        <ul className="space-y-3">
          {digest.at_risk.map((a) => (
            <li
              key={a.client_id}
              className="border border-navy-100 rounded-md p-4 bg-surface flex items-start justify-between gap-4"
            >
              <div>
                <p className="font-medium text-navy-900">{a.name}</p>
                <p className="text-sm text-navy-600 mt-1">{a.reason}</p>
              </div>
              <Link
                href={`/clients/${a.client_id}`}
                className="flex-none text-sm underline text-navy-700"
              >
                View client
              </Link>
            </li>
          ))}
        </ul>
      </Section>

      <Section title="Patterns">
        <BulletList items={digest.patterns} />
      </Section>

      <Section title="Positive signals">
        <BulletList items={digest.positive_signals} />
      </Section>
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-3">
      <h2 className="text-lg font-semibold text-navy-900">{title}</h2>
      {children}
    </section>
  );
}

function BulletList({ items }: { items: string[] }) {
  return (
    <ul className="list-disc pl-5 space-y-1 text-navy-700">
      {items.map((it, i) => (
        <li key={i}>{it}</li>
      ))}
    </ul>
  );
}
