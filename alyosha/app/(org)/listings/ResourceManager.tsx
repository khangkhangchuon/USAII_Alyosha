"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { RESOURCE_TYPES } from "@/lib/data/resource-constants";
import type { Resource, ResourceType } from "@/lib/data/types";

const STATUS_STYLE: Record<string, string> = {
  active: "bg-accent-500 text-navy-900",
  paused: "bg-navy-200 text-navy-700",
  needs_review: "bg-amber-100 text-amber-800",
  removed: "bg-navy-100 text-navy-500",
};

export function ResourceManager({ resources }: { resources: Resource[] }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [type, setType] = useState<ResourceType>("employment");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [eligibility, setEligibility] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || busy) return;
    setBusy(true);
    setError(null);
    const res = await fetch("/api/resources", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type, title, description, location, eligibility }),
    });
    setBusy(false);
    if (res.ok) {
      setTitle("");
      setDescription("");
      setLocation("");
      setEligibility("");
      router.refresh();
    } else {
      const body = await res.json().catch(() => ({}));
      setError(body.error ?? "Could not add resource.");
    }
  }

  async function toggleStatus(r: Resource) {
    setBusy(true);
    const next = r.status === "active" ? "paused" : "active";
    const res = await fetch(`/api/resources/${r.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: next }),
    });
    setBusy(false);
    if (res.ok) router.refresh();
  }

  return (
    <div className="space-y-8">
      <form
        onSubmit={add}
        className="border border-navy-100 rounded-md p-5 bg-surface space-y-3"
      >
        <h2 className="text-lg font-semibold text-navy-900">Add a resource</h2>
        {error && <p className="text-sm text-red-700">{error}</p>}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <label className="block">
            <span className="text-sm text-navy-600">Category</span>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as ResourceType)}
              className="mt-1 w-full px-3 py-2 rounded-md border border-navy-200 bg-surface text-navy-900 text-sm"
            >
              {RESOURCE_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </label>
          <Field label="Title" value={title} onChange={setTitle} required />
          <Field label="Location" value={location} onChange={setLocation} />
          <Field
            label="Eligibility"
            value={eligibility}
            onChange={setEligibility}
          />
        </div>
        <label className="block">
          <span className="text-sm text-navy-600">Description</span>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            className="mt-1 w-full px-3 py-2 rounded-md border border-navy-200 bg-surface text-navy-900 text-sm"
          />
        </label>
        <button
          type="submit"
          disabled={busy || !title.trim()}
          className="min-h-[44px] px-5 rounded-md bg-navy-700 text-white font-semibold hover:bg-navy-800 disabled:opacity-60"
        >
          Add resource
        </button>
      </form>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-navy-900">My resources</h2>
        {resources.length === 0 ? (
          <p className="text-navy-500 text-sm">No resources listed yet.</p>
        ) : (
          <ul className="space-y-2">
            {resources.map((r) => (
              <li
                key={r.id}
                className="border border-navy-100 rounded-md p-4 bg-surface flex items-start justify-between gap-4"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full ${
                        STATUS_STYLE[r.status] ?? "bg-navy-100"
                      }`}
                    >
                      {r.status}
                    </span>
                    <span className="text-xs text-navy-500">
                      {RESOURCE_TYPES.find((t) => t.value === r.type)?.label ??
                        r.type}
                    </span>
                  </div>
                  <p className="font-medium text-navy-900 mt-1">{r.title}</p>
                  {r.description && (
                    <p className="text-sm text-navy-600 mt-1">
                      {r.description}
                    </p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => toggleStatus(r)}
                  disabled={busy || r.status === "removed"}
                  className="flex-none text-sm underline text-navy-700 disabled:opacity-50"
                >
                  {r.status === "active" ? "Pause" : "Activate"}
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  required,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
}) {
  return (
    <label className="block">
      <span className="text-sm text-navy-600">{label}</span>
      <input
        type="text"
        value={value}
        required={required}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full px-3 py-2 rounded-md border border-navy-200 bg-surface text-navy-900 text-sm"
      />
    </label>
  );
}
