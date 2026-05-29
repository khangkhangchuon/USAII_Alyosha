import Link from "next/link";
import { getActivePersona } from "@/lib/persona/server";

const NAV = [
  { href: "/home", label: "Home", icon: "🏠" },
  { href: "/map", label: "My Map", icon: "🗺" },
  { href: "/resources", label: "Find Help", icon: "🔍" },
  { href: "/chat", label: "Ask", icon: "💬" },
];

export default async function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const persona = await getActivePersona();
  return (
    <div className="flex-1 flex flex-col text-[18px] leading-relaxed">
      <header className="px-5 py-4 border-b border-navy-100 bg-surface flex items-center justify-between">
        <p className="text-base text-navy-600">
          Hi, <span className="font-semibold text-navy-900">{persona.name}</span>
        </p>
        <Link href="/" className="text-sm text-navy-500 underline min-h-[44px] inline-flex items-center">
          Switch persona
        </Link>
      </header>
      <main className="flex-1 px-5 py-6 pb-28 max-w-2xl mx-auto w-full">
        {children}
      </main>
      <nav
        aria-label="Primary"
        className="fixed bottom-0 inset-x-0 bg-surface border-t border-navy-100 grid grid-cols-4"
      >
        {NAV.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="flex flex-col items-center gap-1 py-3 min-h-[44px] text-sm text-navy-700 hover:bg-navy-50 focus-visible:bg-navy-50"
          >
            <span aria-hidden="true" className="text-xl">
              {item.icon}
            </span>
            <span>{item.label}</span>
          </Link>
        ))}
      </nav>
      <footer className="hidden">Fictional demo data.</footer>
    </div>
  );
}
