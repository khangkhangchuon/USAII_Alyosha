import Link from "next/link";
import { getActivePersona } from "@/lib/persona/server";

const NAV = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/clients", label: "Clients" },
  { href: "/intake", label: "Smart Intake" },
  { href: "/resources", label: "Resources" },
  { href: "/caseload", label: "Caseload" },
  { href: "/gaps", label: "Gaps" },
];

export default async function OrgLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const persona = await getActivePersona();
  return (
    <div className="flex-1 flex flex-col">
      <header className="border-b border-navy-100 bg-navy-900 text-white">
        <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Link href="/dashboard" className="font-semibold text-lg">
              Alyosha · Org
            </Link>
            <nav aria-label="Primary" className="flex gap-1">
              {NAV.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="px-3 py-2 rounded-md text-sm text-navy-100 hover:bg-navy-700 focus-visible:bg-navy-700"
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
          <div className="flex items-center gap-4 text-sm">
            <span className="text-navy-100">
              {persona.name} · Reentry Coordinator
            </span>
            <Link href="/" className="underline text-navy-200">
              Switch
            </Link>
          </div>
        </div>
      </header>
      <main className="flex-1 px-6 py-8 max-w-7xl mx-auto w-full">
        {children}
      </main>
    </div>
  );
}
