export default function OrgDashboard() {
  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-semibold text-navy-900">Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <SummaryCard label="Active clients" value="6" />
        <SummaryCard label="New this week" value="1" />
        <SummaryCard label="Steps completed this week" value="11" />
        <SummaryCard label="Resources listed" value="—" />
      </div>
      <p className="text-navy-500 text-sm">
        Caseload Intelligence and Gap Analysis panels arrive in Phase 3 (mocks)
        and go live in Phase 4.
      </p>
    </div>
  );
}

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-navy-100 rounded-md p-4 bg-surface">
      <p className="text-sm text-navy-500">{label}</p>
      <p className="text-2xl font-semibold text-navy-900 mt-1">{value}</p>
    </div>
  );
}
