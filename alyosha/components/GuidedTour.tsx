"use client";
import { useState } from "react";

type Step = { label: string; detail: string };

const TOURS: Record<"client" | "org", { title: string; steps: Step[] }> = {
  client: {
    title: "Take the guided tour (as Marcus)",
    steps: [
      { label: "Open My Map", detail: "See your steps in order. Mark step 1 done — the next steps unlock." },
      { label: "Go to Ask", detail: "Try: “How do I get my ID?” — you'll get a clear answer with its source." },
      { label: "Ask a hard one", detail: "Try: “Should I take this plea deal?” — Alyosha hands you to a real person." },
      { label: "Find Help", detail: "Search “housing” or “job” to see real NYC organizations." },
    ],
  },
  org: {
    title: "Take the guided tour (as Diane)",
    steps: [
      { label: "Run Smart Intake", detail: "Enter name “Marcus Bell” and Generate — review the AI plan, then Approve." },
      { label: "Open Clients", detail: "See the caseload and click a client to view their live progress." },
      { label: "Generate Caseload digest", detail: "The AI flags who's gone quiet and what's trending." },
      { label: "Run Gap Analysis", detail: "See unmet needs and suggested partner organizations." },
    ],
  },
};

export function GuidedTour({ surface }: { surface: "client" | "org" }) {
  const [open, setOpen] = useState(true);
  const tour = TOURS[surface];
  if (!open) return null;

  return (
    <aside className="rounded-lg border border-navy-200 bg-surface-muted p-4">
      <div className="flex items-start justify-between gap-3">
        <p className="font-semibold text-navy-900">{tour.title}</p>
        <button
          type="button"
          onClick={() => setOpen(false)}
          aria-label="Dismiss guided tour"
          className="text-navy-500 hover:text-navy-800 min-h-[44px] px-2"
        >
          ✕
        </button>
      </div>
      <ol className="mt-2 space-y-2">
        {tour.steps.map((s, i) => (
          <li key={i} className="flex gap-2 text-sm">
            <span className="flex-none w-5 h-5 rounded-full bg-navy-700 text-surface text-xs inline-flex items-center justify-center">
              {i + 1}
            </span>
            <span className="text-navy-700">
              <span className="font-medium text-navy-900">{s.label}.</span>{" "}
              {s.detail}
            </span>
          </li>
        ))}
      </ol>
    </aside>
  );
}
