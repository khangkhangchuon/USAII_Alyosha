// The "scripted spine" (build-plan §6). Pinned answers for the Marcus tour so the
// headline demo is instant and identical every time. Anything off-script still hits
// live RAG. Answers are grounded in the ingested corpus; citations point to the
// real sources. Keep these consistent with data/corpus/*.md.

import type { Citation } from "@/lib/ai/schemas";
import type { IntakeOutput } from "@/lib/ai/schemas";

type PinnedChat = {
  // Keywords that must all appear (after normalization) to match this entry.
  keywords: string[];
  answer: string;
  citations: Citation[];
};

const DMV_CITE: Citation = {
  source_title: "Get a NY State non-driver ID card",
  source_url: "https://dmv.ny.gov/non-driver-id/get-a-non-driver-id",
};
const IDNYC_CITE: Citation = {
  source_title: "IDNYC — how to apply",
  source_url: "https://access.nyc.gov/programs/idnyc/",
};
const SNAP_CITE: Citation = {
  source_title: "SNAP food benefits — how to apply (NYC ACCESS HRA)",
  source_url:
    "https://access.nyc.gov/programs/supplemental-nutrition-assistance-program-snap/",
};
const FCA_CITE: Citation = {
  source_title:
    "NYC Fair Chance Act — employment rights for people with criminal records",
  source_url: "https://www.nyc.gov/site/cchr/law/fair-chance-act.page",
};

const PINNED: PinnedChat[] = [
  {
    keywords: ["id"],
    answer:
      "Here's how to get your New York State ID:\n\n" +
      "1. **Check what to bring.** You'll need proof of who you are (your birth certificate helps) and proof you live in New York — a shelter letter or mail works.\n" +
      "2. **Fill out form MV-44** (the non-driver ID application). You can get it at the DMV.\n" +
      "3. **Go to any NYC DMV office in person.** They'll give you a temporary paper ID that day; the real one comes in the mail.\n" +
      "4. **Ask about the fee waiver.** If you get public assistance, you may not have to pay.\n\n" +
      "While you wait, **IDNYC** is a free city ID card you can use right away for many things.",
    citations: [DMV_CITE, IDNYC_CITE],
  },
  {
    keywords: ["place", "stay"],
    answer:
      "If you need a place to stay tonight, you're not out of options.\n\n" +
      "- **Call 311** and ask for shelter intake — they can direct you to a bed tonight.\n" +
      "- **The Fortune Society** runs transitional housing (The Castle) for people with a justice history — ask your caseworker to start a referral.\n\n" +
      "This is urgent, so please call 311 first. Your caseworker can help with the longer-term housing application.",
    citations: [],
  },
  {
    keywords: ["plea", "deal"],
    answer:
      "I can't give legal advice about a plea deal — that's a decision only you and a lawyer should make together.\n\n" +
      "Please talk it through with your lawyer. If you don't have one, the **Legal Aid Society Reentry Unit** offers free legal help. Your caseworker can connect you.",
    citations: [],
  },
  {
    keywords: ["job"],
    answer:
      "Yes — having a record does not shut you out of work in New York City.\n\n" +
      "- The **NYC Fair Chance Act** means most employers can't ask about your record until after they offer you the job, and they can't pull the offer just because of a conviction without a fair review.\n" +
      "- **Fair-chance employers** actively hire people with records. The **Center for Employment Opportunities** can get you on a paid work crew within a week.\n\n" +
      "Check the Find Help tab for jobs near you.",
    citations: [FCA_CITE],
  },
];

function normalize(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9\s]/g, " ");
}

/** Return the pinned answer if the message matches a scripted question, else null. */
export function matchPinnedChat(
  message: string,
): { answer: string; citations: Citation[] } | null {
  const n = normalize(message);
  for (const p of PINNED) {
    if (p.keywords.every((k) => n.includes(k))) {
      return { answer: p.answer, citations: p.citations };
    }
  }
  return null;
}

/** Pinned Smart Intake result for the tour (sentinel: client named "Marcus Bell"). */
export const TOUR_INTAKE_NAME = "marcus bell";

export const PINNED_INTAKE: IntakeOutput = {
  profile_summary:
    "Marcus Bell, recently released to Brooklyn after about 6 years. He has a birth certificate but no state ID and no phone. Skilled in warehouse work and basic cooking. Priorities: get an ID, then housing, then steady work.",
  structured_profile: {
    immediate_needs: ["ID", "Housing", "Employment"],
    skills: ["Warehouse work", "Basic cooking", "Forklift (expired cert)"],
    eligible_programs: [
      "New York State non-driver ID",
      "The Castle — transitional housing (The Fortune Society)",
      "SNAP food benefits (ACCESS HRA)",
      "Transitional day-labor crews (Center for Employment Opportunities)",
    ],
    risk_factors: [
      "No phone yet — confirm a reliable way to reach Marcus.",
      "Six-year gap in work history; may need help with digital tasks.",
    ],
  },
  plan_steps: [
    {
      order: 1,
      category: "id",
      title: "Get your NY State ID",
      instructions:
        "Bring your birth certificate and proof of release to a NYC DMV office. Fill out form MV-44. Ask about a fee waiver if you receive public assistance.",
      where_to_go: "Any NYC DMV office (Brooklyn nearest)",
      what_to_bring: "Birth certificate, proof of release, proof of NY address, form MV-44",
      depends_on: null,
    },
    {
      order: 2,
      category: "financial",
      title: "Open a bank account",
      instructions:
        "With your state ID, open a free or low-cost account so pay and benefits have a place to land.",
      where_to_go: "Any major bank branch in Brooklyn",
      what_to_bring: "NY State ID, Social Security card",
      depends_on: 1,
    },
    {
      order: 3,
      category: "housing",
      title: "Apply for transitional housing (Fortune Society)",
      instructions:
        "Call The Fortune Society for an intake screening. Share your release date and current situation.",
      where_to_go: "Phone screening (Fortune Society)",
      what_to_bring: "State ID, release papers, any program records",
      depends_on: 1,
    },
    {
      order: 4,
      category: "benefits",
      title: "Apply for SNAP and Medicaid",
      instructions: "Apply for both at once through ACCESS HRA online; a phone interview follows.",
      where_to_go: "access.nyc.gov or any HRA center",
      what_to_bring: "State ID, Social Security number, proof of release",
      depends_on: 1,
    },
    {
      order: 5,
      category: "employment",
      title: "Start with the Center for Employment Opportunities",
      instructions:
        "Walk in for orientation. You can start on a paid day-labor crew within the week while CEO helps find permanent work.",
      where_to_go: "CEO Manhattan office",
      what_to_bring: "State ID, work clothes and shoes",
      depends_on: 1,
    },
  ],
};
