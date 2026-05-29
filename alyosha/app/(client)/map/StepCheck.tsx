"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { StepStatus } from "@/lib/data/types";

/**
 * Check-off control for a plan step. PATCHes /api/steps/:id, then refreshes the
 * server component so dependent steps unlock. Optimistic toggle for snappiness.
 */
export function StepCheck({
  stepId,
  status,
  locked,
}: {
  stepId: string;
  status: StepStatus;
  locked: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [saving, setSaving] = useState(false);
  const done = status === "done";

  async function toggle() {
    const next: StepStatus = done ? "todo" : "done";
    setSaving(true);
    const res = await fetch(`/api/steps/${stepId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: next }),
    });
    setSaving(false);
    if (res.ok) startTransition(() => router.refresh());
  }

  if (locked) {
    return (
      <p className="inline-flex items-center gap-2 text-navy-500">
        <span aria-hidden="true">🔒</span> Finish the step above first
      </p>
    );
  }

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={saving || pending}
      aria-pressed={done}
      className={`inline-flex items-center gap-2 min-h-[44px] px-5 py-3 rounded-md font-semibold disabled:opacity-60 ${
        done
          ? "bg-navy-100 text-navy-800 hover:bg-navy-200"
          : "bg-accent-500 text-navy-900 hover:bg-accent-600"
      }`}
    >
      <span aria-hidden="true">{done ? "✓" : "○"}</span>
      {done ? "Done — undo" : "Mark this done"}
    </button>
  );
}
