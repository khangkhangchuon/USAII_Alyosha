import Link from "next/link";

/**
 * Landing / persona chooser. No real auth for the demo — each card hits
 * /api/persona to set the persona cookie, then redirects into that surface.
 */
export default function Home() {
  return (
    <div className="flex flex-col flex-1 items-center justify-center px-6 py-16 bg-surface-muted">
      <main className="w-full max-w-2xl space-y-10">
        <header className="text-center space-y-3">
          <h1 className="text-4xl font-semibold text-navy-900">Alyosha</h1>
          <p className="text-lg text-navy-700">
            A guide for reentry — and the people who help. Choose how to enter
            the demo.
          </p>
        </header>

        <div className="grid gap-5 sm:grid-cols-2">
          <PersonaCard
            href="/api/persona?role=client&id=client-marcus-bell&name=Marcus%20Bell&next=/home"
            emoji="🧭"
            title="Enter as Marcus"
            subtitle="Client"
            blurb="See your personalized map, find help, and ask questions."
          />
          <PersonaCard
            href="/api/persona?role=caseworker&id=cw-diane-r&name=Diane%20R.&next=/dashboard"
            emoji="📋"
            title="Enter as Diane"
            subtitle="Caseworker"
            blurb="Run intake, track your caseload, and manage resources."
          />
        </div>

        <footer className="text-center text-sm text-navy-500">
          All people, organizations, and data shown here are fictional, for
          demonstration only.
        </footer>
      </main>
    </div>
  );
}

function PersonaCard({
  href,
  emoji,
  title,
  subtitle,
  blurb,
}: {
  href: string;
  emoji: string;
  title: string;
  subtitle: string;
  blurb: string;
}) {
  return (
    <Link
      href={href}
      className="flex flex-col gap-2 rounded-lg border border-navy-100 bg-surface p-6 hover:border-navy-300 focus-visible:border-navy-300 transition-colors min-h-[44px]"
    >
      <span aria-hidden="true" className="text-3xl">
        {emoji}
      </span>
      <span className="text-sm uppercase tracking-wide text-navy-500">
        {subtitle}
      </span>
      <span className="text-xl font-semibold text-navy-900">{title}</span>
      <span className="text-navy-700">{blurb}</span>
    </Link>
  );
}
