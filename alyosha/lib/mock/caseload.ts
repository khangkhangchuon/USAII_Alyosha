// PHASE-4 PLACEHOLDER. Real Caseload Intelligence (build-plan §5.3) will run
// /api/caseload over seeded clients. This fixture is shaped to the seed data so
// the digest UI looks real in the demo.

export type CaseloadDigest = {
  generated_for: string; // date label
  at_risk: { client_id: string; name: string; reason: string }[];
  patterns: string[];
  positive_signals: string[];
};

export const MOCK_CASELOAD: CaseloadDigest = {
  generated_for: "May 29, 2026",
  at_risk: [
    {
      client_id: "client-keisha-r",
      name: "Keisha Robinson",
      reason:
        "No check-in for ~21 days. Last completed step was applying for Medicaid. Consider reaching out.",
    },
    {
      client_id: "client-luis-m",
      name: "Luis Mendoza",
      reason:
        "Brand new and has no documents in hand. Needs help across the board — schedule an early follow-up.",
    },
  ],
  patterns: [
    "Employment is the most common active need across your caseload (4 of 6 clients).",
    "One client (Renée Sims) lists childcare as her only unmet need — not covered by any resource currently in the network.",
  ],
  positive_signals: [
    "Andre Jackson is nearly done — ID and benefits set, OSHA-10 in progress with an apprenticeship lined up.",
    "Tanya Williams stayed active this week, working on HHA recertification.",
  ],
};
