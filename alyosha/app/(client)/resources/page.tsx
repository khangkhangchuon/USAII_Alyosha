import Link from "next/link";
import { listResources, RESOURCE_TYPES } from "@/lib/data/resources";
import type { ResourceType } from "@/lib/data/types";

const VALID_TYPES = new Set(RESOURCE_TYPES.map((t) => t.value));

export default async function ClientResources({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; type?: string }>;
}) {
  const { q, type } = await searchParams;
  const activeType =
    type && VALID_TYPES.has(type as ResourceType)
      ? (type as ResourceType)
      : undefined;

  const resources = await listResources({ q, type: activeType });

  return (
    <div className="space-y-6">
      <section className="space-y-2">
        <h1 className="text-3xl font-semibold text-navy-900">Find help</h1>
        <p className="text-navy-700">
          Real organizations across New York City. Search or pick a category.
        </p>
      </section>

      <form method="get" className="space-y-3">
        <div className="flex gap-2">
          <input
            type="search"
            name="q"
            defaultValue={q ?? ""}
            placeholder="Search for help…"
            aria-label="Search for help"
            className="flex-1 min-h-[44px] px-4 py-3 rounded-md border border-navy-200 bg-surface text-navy-900"
          />
          <button
            type="submit"
            className="min-h-[44px] px-5 rounded-md bg-accent-500 text-navy-900 font-semibold hover:bg-accent-600"
          >
            Search
          </button>
        </div>
        {activeType && <input type="hidden" name="type" value={activeType} />}
      </form>

      <nav aria-label="Categories" className="flex flex-wrap gap-2">
        <CategoryChip label="All" href={q ? `/resources?q=${encodeURIComponent(q)}` : "/resources"} active={!activeType} />
        {RESOURCE_TYPES.map((t) => {
          const params = new URLSearchParams();
          if (q) params.set("q", q);
          params.set("type", t.value);
          return (
            <CategoryChip
              key={t.value}
              label={t.label}
              href={`/resources?${params.toString()}`}
              active={activeType === t.value}
            />
          );
        })}
      </nav>

      {resources.length === 0 ? (
        <p className="text-navy-600">
          No results. Try a different word or category.
        </p>
      ) : (
        <ul className="space-y-4">
          {resources.map((r) => (
            <li
              key={r.id}
              className="rounded-lg border border-navy-100 bg-surface p-5"
            >
              <p className="text-sm uppercase tracking-wide text-navy-500">
                {RESOURCE_TYPES.find((t) => t.value === r.type)?.label ?? r.type}
                {r.org_name ? ` · ${r.org_name}` : ""}
              </p>
              <h2 className="text-xl font-semibold text-navy-900 mt-1">
                {r.title}
              </h2>
              {r.description && (
                <p className="text-navy-700 mt-1">{r.description}</p>
              )}
              {r.location && (
                <p className="text-navy-600 mt-2">📍 {r.location}</p>
              )}
              {r.eligibility && (
                <p className="text-navy-600 mt-1 text-sm">
                  Who qualifies: {r.eligibility}
                </p>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function CategoryChip({
  label,
  href,
  active,
}: {
  label: string;
  href: string;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      className={`min-h-[44px] inline-flex items-center px-4 rounded-full border font-medium ${
        active
          ? "bg-navy-700 text-surface border-navy-700"
          : "bg-surface text-navy-700 border-navy-200 hover:bg-navy-50"
      }`}
    >
      {label}
    </Link>
  );
}
