// PHASE-4 PLACEHOLDER. Real Gap Analysis (build-plan §5.4) will run /api/gaps
// comparing client needs against the resource network. This fixture reflects the
// seed (Renée's childcare gap) so the analysis UI demos meaningfully.

export type GapAnalysis = {
  unmet_needs: { need: string; clients: string[]; note: string }[];
  underserved_categories: { category: string; note: string }[];
  suggested_partners: { name: string; why: string }[];
};

export const MOCK_GAPS: GapAnalysis = {
  unmet_needs: [
    {
      need: "Childcare",
      clients: ["Renée Sims"],
      note: "No childcare resource is currently listed in the shared network.",
    },
  ],
  underserved_categories: [
    {
      category: "Healthcare",
      note: "2 clients list healthcare needs, but your org has no healthcare resources listed.",
    },
    {
      category: "Housing",
      note: "Housing is a top need, yet only one transitional-housing resource is in the network.",
    },
  ],
  suggested_partners: [
    {
      name: "Children's Aid (NYC)",
      why: "Offers childcare and family support that would cover Renée's gap.",
    },
    {
      name: "The Osborne Association",
      why: "Family services and employment — complements your current listings.",
    },
  ],
};
