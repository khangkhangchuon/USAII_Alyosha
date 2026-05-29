"use client";
import { useState } from "react";
import { MOCK_GAPS } from "@/lib/mock/gaps";
import type { GapAnalysis } from "@/lib/ai/schemas";

export default function GapsPage() {
  const [g, setG] = useState<GapAnalysis>(MOCK_GAPS);
  const [live, setLive] = useState(false);
  const [loading, setLoading] = useState(false);

  async function generate() {
    setLoading(true);
    try {
      const res = await fetch("/api/gaps", { method: "POST" });
      const data = await res.json();
      setG(data.analysis);
      setLive(Boolean(data.live));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-baseline justify-between flex-wrap gap-2">
        <h1 className="text-2xl font-semibold text-navy-900">Gap Analysis</h1>
        <button
          type="button"
          onClick={generate}
          disabled={loading}
          className="min-h-[44px] px-4 rounded-md bg-navy-700 text-white text-sm font-semibold hover:bg-navy-800 disabled:opacity-60"
        >
          {loading ? "Analyzing…" : "Run analysis"}
        </button>
      </div>

      <p className="text-sm text-navy-500">
        {live ? (
          <span className="text-green-700">Live analysis</span>
        ) : (
          <span className="text-amber-700">
            Sample analysis — click “Run analysis” for live.
          </span>
        )}
      </p>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-navy-900">Unmet needs</h2>
        <ul className="space-y-3">
          {g.unmet_needs.map((u) => (
            <li
              key={u.need}
              className="border border-navy-100 rounded-md p-4 bg-surface"
            >
              <p className="font-medium text-navy-900">{u.need}</p>
              <p className="text-sm text-navy-600 mt-1">{u.note}</p>
              {u.clients.length > 0 && (
                <p className="text-xs text-navy-500 mt-2">
                  Affected: {u.clients.join(", ")}
                </p>
              )}
            </li>
          ))}
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-navy-900">
          Underserved categories
        </h2>
        <ul className="space-y-2">
          {g.underserved_categories.map((c) => (
            <li
              key={c.category}
              className="border border-navy-100 rounded-md px-4 py-3 bg-surface"
            >
              <span className="font-medium text-navy-900">{c.category}</span>
              <span className="text-sm text-navy-600"> — {c.note}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-navy-900">
          Suggested partner organizations
        </h2>
        <ul className="space-y-2">
          {g.suggested_partners.map((p) => (
            <li
              key={p.name}
              className="border border-navy-100 rounded-md px-4 py-3 bg-surface"
            >
              <p className="font-medium text-navy-900">{p.name}</p>
              <p className="text-sm text-navy-600 mt-1">{p.why}</p>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
