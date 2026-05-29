# Alyosha — Full Product & Technical Document

## 1. What Alyosha Is

### The Problem (Brief)

Every year, over 600,000 people are released from prison in the United States, 50,000+ in Vietnam, and millions worldwide. They reenter societies that have not prepared a place for them. The support they need — employment programs, housing assistance, legal aid, educational opportunities, government benefits — exists in abundance. Thousands of nonprofits, government programs, and fair-chance employers are actively working on reentry. But these resources are scattered across disconnected organizations, each with its own intake process, eligibility criteria, and geographic coverage. No single tool aggregates them. No single interface navigates them. The help is real, but it is invisible — both to the people who need it and to the organizations providing it.

### The Product

Alyosha is a two-sided digital platform that connects formerly incarcerated people with the reentry resources they need by aggregating the services of multiple nonprofits, government programs, and community organizations into a single, AI-powered, personalized experience.

It serves two user types simultaneously:

- **Formerly incarcerated people (clients)** get a personalized guide showing them available jobs, education opportunities, step-by-step life guidance, and direct connections to organizations that can help — all drawn from a shared resource network.
- **Reentry organizations (nonprofits, NGOs, government programs)** get an AI-enhanced operational dashboard to manage clients, input and maintain resources, generate reports, and receive intelligent insights about their caseloads.

Between the two sits a **shared resource network** — a single aggregated pool of every resource entered by every participating organization. The more organizations that join, the more complete the picture becomes for every client and every other organization.

---

## 2. Architecture Overview

Alyosha is built on three layers:

```
┌─────────────────────────────────────────────────────────┐
│  LAYER 3: CLIENT EXPERIENCE                             │
│  What the formerly incarcerated person sees and uses     │
│  - Step-by-step life guidance                           │
│  - Resource search                                      │
│  - Educational resources                                │
│  - AI chat companion (working LLM)                      │
│  - Direct messaging to organizations                    │
│  - Progress tracking                                    │
└──────────────────────┬──────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────┐
│  LAYER 2: SHARED RESOURCE NETWORK                       │
│  The connective layer                                   │
│  - Aggregated pool of all resources from all orgs       │
│  - Searchable, filterable, matchable                    │
│  - Each org maintains ownership of their listings       │
│  - Network effects: more orgs = more value for everyone │
└──────────────────────┬──────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────┐
│  LAYER 1: NONPROFIT DASHBOARD                           │
│  What the reentry organization sees and uses            │
│  - Smart Intake (working LLM)                           │
│  - Resource Management                                  │
│  - Caseload Intelligence                                │
│  - Gap Analysis                                         │
│  - Funder Reporting                                     │
└─────────────────────────────────────────────────────────┘
```

A cross-platform **communication hub** allows clients and organizations to message each other directly through the platform.

---

## 3. Tech Stack

| Component | Technology |
|---|---|
| Framework | Next.js (React) |
| Styling | Tailwind CSS |
| Deployment | Vercel |
| LLM (local dev) | Ollama (Llama 3 / Mistral) |
| LLM (production) | OpenAI API (GPT-4o or GPT-4o-mini) |
| Vector store (RAG) | Pinecone (free tier) or ChromaDB |
| Embedding model | OpenAI text-embedding-3-small |
| API routes | Next.js API routes (Vercel serverless functions) |
| Mock data | JSON files for non-LLM features |

### LLM Integration Architecture (RAG)

The LLM does not run continuously. It activates through two patterns only:

1. **User-triggered**: A user clicks a button or asks a question. The system retrieves relevant data from the vector store, injects it into the LLM prompt, and returns a single response. One request, one response.
2. **Scheduled batch**: For features like Caseload Intelligence and Gap Analysis, a batch process runs at intervals (daily/weekly), processes data in one sweep, generates a digest, then stops. *(For the demo, these are pre-generated static outputs.)*

**RAG flow for the demo:**

```
User asks question
       │
       ▼
Query is embedded (OpenAI embeddings API)
       │
       ▼
Vector store returns relevant resource chunks
       │
       ▼
Retrieved chunks + user question + system prompt → sent to LLM
       │
       ▼
LLM generates grounded response
       │
       ▼
Response displayed to user
```

The vector store is pre-loaded with curated data about New York City reentry resources, administrative procedures, and guidance content. This data is embedded and indexed before the demo goes live — no real-time ingestion needed.

---

## 4. Demo Context: New York City

All demo data is set in New York City. The curated dataset should include:

### Resource Data (for the vector store and mock search results)
- **Employment**: Fair-chance employers in NYC, job training programs (e.g., The Doe Fund, Center for Employment Opportunities, Getting Out and Staying Out)
- **Housing**: Transitional housing programs, shelters accepting formerly incarcerated people, supportive housing applications (e.g., Fortune Society housing, The Osborne Association)
- **Legal aid**: Organizations offering record expungement, legal counseling, know-your-rights guidance (e.g., Legal Aid Society Reentry Unit, Neighborhood Defender Service)
- **Education**: GED programs, vocational training, free online learning resources, community college enrollment info (e.g., John Jay College prisoner reentry programs, LaGuardia Community College)
- **Financial assistance**: Government benefits (SNAP, SSI, Medicaid), emergency funds, NYC-specific programs
- **Healthcare**: Mental health services, substance abuse treatment programs accepting this population
- **Government procedures**: Step-by-step instructions for obtaining a New York State ID, opening a bank account, applying for SNAP benefits, enrolling in Medicaid, registering for employment services

### Administrative Procedure Data (for the AI chat companion and step-by-step guidance)
- How to get a NY State ID after incarceration (documents needed, DMV locations, fee waiver options)
- How to open a bank account without a permanent address
- How to apply for SNAP benefits in NYC
- How to apply for Medicaid
- How to register with the NYC Department of Labor
- How to search for housing with a criminal record
- How to access free legal aid for record sealing/expungement
- Ban the Box rights in NYC (NYC Fair Chance Act specifics)

---

## 5. Layer 3 — Client Experience (Detailed Specifications)

This is the side of the platform that the formerly incarcerated person sees and uses. It is the heart of the product.

### 5.1 Account Creation & Onboarding

**What it is:** A guided profile-building flow that captures enough information to personalize the client's entire experience.

**How it works:**
1. Client creates an account (email or phone number — keep it minimal, many may not have email).
2. Client is walked through a multi-step onboarding questionnaire.
3. Responses are saved as a client profile that drives all personalization downstream.

**Onboarding fields to capture:**

| Field | Purpose |
|---|---|
| Full name | Identity |
| Current location (city/zip) | Filter resources by geography |
| Date of release | Determine urgency / how far into reentry they are |
| Length of incarceration | Gauge digital literacy needs, gap in work history |
| Documents currently in possession (checklist: state ID, birth certificate, Social Security card, none) | Determine which steps are already complete |
| Employment history / skills | Match to job opportunities |
| Education level | Match to education resources |
| Immediate needs (multi-select: housing, employment, ID/documents, food/benefits, legal help, healthcare, education) | Prioritize what they see first |
| Goals (free text or multi-select: find a job, go back to school, start a business, get stable housing, reconnect with family) | Shape long-term guidance |

**UI notes:**
- The onboarding should feel welcoming, not bureaucratic. Use plain language. Avoid legal terminology.
- Progress bar showing how far along they are.
- Every field should be optional except location and immediate needs — don't create another gatekeeping form.
- Mobile-first design. Many clients will access this on a phone, possibly a shared or library computer.

### 5.2 Step-by-Step Life Guidance

**What it is:** A personalized, ordered sequence of practical reentry tasks with specific instructions for each step. This is the "map" that does not exist today.

**How it works:**
- Based on the client's onboarding profile (location, documents in possession, immediate needs), the system generates a task list ordered by dependency and urgency.
- Each task is a card/page with: what to do, where to go (address, office name), what to bring (documents, forms), what to expect (wait times, fees, process), and what the next step is after completion.
- Tasks have dependency logic: the system never tells someone to do Step 5 if Steps 1–3 are prerequisites they haven't completed.

**Example task sequence for a client in NYC who has no documents, no job, no housing:**

| Order | Task | Depends On |
|---|---|---|
| 1 | Obtain birth certificate (NYC Vital Records or state of birth) | Nothing |
| 2 | Obtain Social Security card (SSA office, bring birth certificate + release papers) | Step 1 |
| 3 | Obtain NY State ID (DMV, bring birth certificate + SS card + proof of release) | Steps 1, 2 |
| 4 | Open bank account (list of banks with no-minimum accounts, bring state ID) | Step 3 |
| 5 | Apply for SNAP benefits (HRA office, bring ID + proof of income/release) | Step 3 |
| 6 | Apply for Medicaid (online or HRA office) | Step 3 |
| 7 | Register with NYC Department of Labor | Step 3 |
| 8 | Begin job search through platform resource search | Steps 3, 4 |
| 9 | Apply for transitional housing (list of programs, bring ID + release papers) | Step 3 |

**UI notes:**
- Present as a vertical timeline or checklist.
- Completed steps are checked off and visually distinct (grayed out or marked with a checkmark).
- Each step expands to reveal detailed instructions.
- The sequence adapts: if the client already has a state ID (indicated during onboarding), Steps 1–3 are pre-completed and the sequence starts at Step 4.

**Demo implementation:** Static mock data. Pre-built task sequences for 2–3 common profiles. No LLM needed — the logic is rules-based (if/then based on onboarding answers).

### 5.3 Resource Search

**What it is:** A search interface over the shared resource network. The client can search for jobs, housing, legal aid, education, healthcare, and financial assistance — all from one place, drawn from every participating organization's listings.

**How it works:**
- Search bar with category filters (Employment, Housing, Legal Aid, Education, Financial Assistance, Healthcare).
- Results are filtered by the client's location and profile (e.g., a client with a drug conviction sees jobs from employers who accept that record type).
- Each result is a card showing: resource name, organization that listed it, brief description, location/distance, eligibility summary, and a contact/apply action.
- Clicking a result expands to full details including how to apply, what documents to bring, and a link to message the organization directly.

**Resource card fields:**

| Field | Description |
|---|---|
| Resource name | e.g., "Construction Apprentice — ABC Builders" |
| Category | Employment / Housing / Legal / Education / Financial / Healthcare |
| Organization | The nonprofit or program that listed it |
| Location | Address or "Remote" |
| Eligibility summary | Short text: "Accepts all felony types" or "Drug convictions only after 2 years" |
| Description | What the resource is and what it provides |
| How to access | Application process, walk-in info, required documents |
| Contact | Phone, email, or in-platform message button |
| Date listed | When the org posted it |

**UI notes:**
- Results should look like a clean, modern search interface — not a cluttered government database.
- Category filter tabs or sidebar.
- Sort by: relevance, distance, date posted.
- Mobile-friendly card layout.

**Demo implementation:** Mock data stored as JSON. 30–50 realistic NYC resource listings across all categories. Search and filter logic runs client-side against the JSON data. No LLM needed.

### 5.4 Educational Resources

**What it is:** A curated directory of free learning resources organized around the client's goals. Not a learning management system — a guided starting point.

**How it works:**
- Based on the client's stated goals and education level (from onboarding), the platform presents a curated set of learning pathways.
- Each pathway is a sequence of links to free external resources (Khan Academy, Coursera free courses, GED prep sites, vocational training directories, community college enrollment pages).
- Pathways are organized by goal: "I want to work in IT," "I want to get my GED," "I want to learn a trade," "I want to go to college."

**Example pathway: "I want to work in IT"**

| Step | Resource | Link |
|---|---|---|
| 1. Digital literacy basics | Khan Academy — Computer Basics | khan link |
| 2. Intro to coding | freeCodeCamp — Responsive Web Design | fcc link |
| 3. Certification prep | CompTIA A+ free study resources | link |
| 4. Job search | Platform resource search filtered to IT jobs | internal link |

**UI notes:**
- Clean card layout grouped by goal.
- Each pathway shows estimated time commitment.
- Client can browse all pathways or see recommended ones based on their profile.

**Demo implementation:** Static mock data. 4–6 pre-built pathways with real links to free resources. No LLM needed.

### 5.5 AI Chat Companion

**What it is:** An always-available conversational interface where clients can ask practical questions about reentry and receive clear, grounded answers.

**How it works (RAG pipeline):**
1. Client types a question in the chat interface.
2. The question is sent to the Next.js API route.
3. The API route embeds the question using OpenAI's embedding model.
4. The embedding is used to search the vector store for relevant resource data, administrative procedures, and guidance content.
5. The top matching chunks are retrieved.
6. The chunks + the question + a system prompt are sent to the LLM (OpenAI GPT-4o or GPT-4o-mini).
7. The LLM generates a response grounded in the retrieved data.
8. The response is returned and displayed in the chat interface.

**System prompt behavior (key rules for the LLM):**

```
You are Alyosha, an AI assistant for people reentering society after incarceration.
Your context is New York City.

RULES:
- Answer practical questions clearly and compassionately. Use plain language.
- Ground every answer in the provided resource data and procedures.
  Do not make up resources, organizations, addresses, or phone numbers.
- If the retrieved data contains a relevant resource, mention it by name
  with its location and how to access it.
- If the question involves legal advice, medical decisions, or anything
  high-stakes, clearly state that you cannot provide professional advice
  and direct the user to a specific relevant organization from the
  resource data (e.g., "For legal advice about your specific case,
  I'd recommend contacting the Legal Aid Society Reentry Unit at
  [address/phone]").
- Be warm but not patronizing. Do not use phrases like "I understand
  how hard this must be." Be direct and helpful.
- If you do not have enough information to answer accurately, say so.
  Do not guess.
- Never ask for or store sensitive personal information (SSN, case
  numbers, etc.).
```

**Example interactions:**

| User question | Expected behavior |
|---|---|
| "How do I get my ID back?" | Retrieves NY State ID procedure data. Responds with step-by-step: what documents to bring, which DMV to visit, fee waiver options. |
| "Can I get a job with a drug felony?" | Retrieves employment resources + NYC Fair Chance Act info. Responds with rights explanation + specific fair-chance employers in the network. |
| "I need a place to stay tonight" | Retrieves emergency shelter data. Responds with specific shelter names, addresses, intake procedures. Flags that this is urgent and suggests calling 311 as well. |
| "Should I take this plea deal?" | Does NOT provide legal advice. Flags limitation. Directs to Legal Aid Society Reentry Unit with contact info. |
| "I feel like giving up" | Responds with empathy and directs to mental health resources and crisis support (988 Suicide & Crisis Lifeline). Does not attempt to be a therapist. |

**UI notes:**
- Standard chat interface. Message bubbles, input field at bottom, send button.
- Typing indicator while the LLM is processing.
- Messages should render markdown (bold, links, lists) for structured responses.
- Persistent chat history within the session (no need for cross-session persistence in the demo).
- A small disclaimer at the top: "Alyosha can help with practical reentry questions. For legal, medical, or crisis situations, it will direct you to professional help."

**Demo implementation:** This is a WORKING FEATURE. Full RAG pipeline connected to OpenAI API via Next.js API route. Vector store pre-loaded with NYC reentry data.

### 5.6 Direct Connection to Organizations

**What it is:** A directory of reentry organizations with the ability to message them directly through the platform.

**How it works:**
- Client can browse or search for organizations by category (employment, housing, legal, education, healthcare) and location.
- Each organization has a profile page showing: name, mission, services offered, location, hours, contact info, and a "Message" button.
- Clicking "Message" opens a direct chat thread with the organization. The caseworker on the other end sees the message in their dashboard (Layer 1).
- This is human-to-human messaging. No AI generates or mediates the conversation.

**Organization profile fields:**

| Field | Description |
|---|---|
| Organization name | e.g., "Fortune Society" |
| Mission statement | Brief description of what they do |
| Services offered | Tags: Employment, Housing, Legal, Education, etc. |
| Location | Address + map |
| Hours | Operating hours |
| Phone | Contact number |
| Website | External link |
| Message button | Opens in-platform chat |

**UI notes:**
- Organization cards in a grid or list layout.
- Filter by service type and location.
- Message interface is a simple chat — text input, send button, message history.

**Demo implementation:** Mock data for 10–15 NYC reentry organizations. Messaging UI is built but sends to a mock inbox (no real-time delivery needed for the demo — just show the UI flow).

### 5.7 Progress Tracking

**What it is:** A milestone-based checklist that gives the client a visual sense of forward momentum and feeds status data back to connected organizations.

**How it works:**
- Milestones are tied to the step-by-step life guidance tasks (Section 5.2).
- When a client completes a task (obtains ID, submits a job application, finishes a course), they check it off.
- The dashboard shows: total milestones, completed milestones, a progress bar or percentage, and a timeline of completions.
- Completion data is visible to any organization the client is connected to (via the nonprofit dashboard, Layer 1), so caseworkers can track progress without requiring a check-in meeting.

**UI notes:**
- Visual progress bar at the top of the client dashboard.
- List of milestones with checkboxes and completion dates.
- Celebratory micro-interaction when a milestone is completed (subtle animation, not patronizing).
- A "journey" view showing the full path from release to stability with the client's position marked.

**Demo implementation:** Functional UI with mock data. Client can check/uncheck milestones. Progress bar updates in real time. No backend persistence needed — state is held in React state during the session.

---

## 6. Layer 1 — Nonprofit Dashboard (Detailed Specifications)

This is the side of the platform that reentry organizations use to manage their operations.

### 6.1 Organization Onboarding

**What it is:** The signup and profile creation flow for a reentry organization joining the platform.

**Fields to capture:**

| Field | Description |
|---|---|
| Organization name | Official name |
| Type | Nonprofit / Government program / Community organization / Faith-based |
| Services offered | Multi-select: Employment, Housing, Legal, Education, Healthcare, Financial, Other |
| Service area | Geographic coverage (city, borough, zip codes) |
| Contact information | Address, phone, email, website |
| Staff accounts | Invite caseworkers / staff members with email |
| Mission statement | Brief description |

**UI notes:**
- Clean, professional onboarding wizard.
- After completion, the organization lands on their dashboard.

### 6.2 Dashboard Home

**What it is:** The main landing page a caseworker or program director sees when they log in.

**What it shows:**
- **Summary cards**: Total active clients, new clients this week, milestones completed this week, resources listed.
- **Caseload Intelligence digest** (see Section 6.5): Flags and patterns generated by the scheduled batch process.
- **Recent activity feed**: Latest client milestones, new messages, resource updates.
- **Quick actions**: "Add New Client," "Add Resource," "Generate Report."

### 6.3 Smart Intake (Working LLM Feature)

**What it is:** An AI-powered tool that processes intake conversations and generates structured client profiles.

**How it works:**
1. Caseworker clicks "Add New Client" and selects "Smart Intake."
2. The caseworker is presented with a guided questionnaire / intake form. They fill it out based on their conversation with the client (in person or over the phone).
3. The form captures: client's name, age, release date, location, incarceration history, documents on hand, skills, work history, immediate needs, goals, and any notes from the conversation.
4. The caseworker clicks "Generate Profile."
5. The intake data is sent to the LLM (via Next.js API route).
6. The LLM processes the data and returns a structured profile document containing:
   - **Summary**: A 2–3 sentence overview of the client's situation.
   - **Immediate needs**: Prioritized list (housing, employment, documents, etc.).
   - **Qualifications & skills**: Extracted from work history and education.
   - **Eligible programs**: Based on the client's profile, matched against resource data.
   - **Recommended next steps**: An ordered sequence of actions (aligned with the step-by-step guidance the client will see on their end).
   - **Risk factors**: Any noted concerns (substance use history, mental health needs, time since release).
7. The caseworker reviews the generated profile, makes edits, and clicks "Approve."
8. The approved profile becomes the client's record in the system.

**System prompt for intake LLM:**

```
You are an intake processing assistant for reentry case managers.

Given the following intake data about a new client, generate a structured
profile document with these sections:
1. Summary (2-3 sentences)
2. Immediate Needs (prioritized list)
3. Qualifications & Skills
4. Eligible Programs (match against the provided resource data)
5. Recommended Next Steps (ordered by dependency)
6. Risk Factors (if any noted in the intake data)

Use professional but compassionate language. Be specific in your
recommendations — name actual programs and resources from the
provided data. Do not invent resources.

Format the output in clean, readable sections.
```

**UI notes:**
- The intake form should be clean and structured — not a wall of text fields.
- Group fields logically: Personal Info → Incarceration History → Current Situation → Needs & Goals → Caseworker Notes.
- The generated profile appears in a side panel or modal for review.
- "Approve," "Edit," and "Regenerate" buttons on the generated profile.
- Loading state while the LLM processes (3–8 seconds expected).

**Demo implementation:** This is a WORKING FEATURE. The intake form submits to a Next.js API route that calls the OpenAI API with the intake data + system prompt + retrieved resource data from the vector store. The generated profile is displayed for review.

### 6.4 Resource Management

**What it is:** The interface where organizations input, edit, and manage the resources they offer.

**How it works:**
- Organization staff click "Add Resource" and select a resource type.
- Each type has a tailored template with specific fields.
- Once submitted, the resource is published to the shared resource network (Layer 2) and becomes searchable by all clients and organizations.
- The organization can edit, pause, or remove their listings at any time.
- Resources older than a configurable number of days (e.g., 30, 60, 90) are flagged with a "Needs Review" badge prompting the org to confirm the listing is still active.

**Resource templates by type:**

**Employment:**
| Field | Required | Description |
|---|---|---|
| Job title | Yes | e.g., "Warehouse Associate" |
| Employer name | Yes | Company or organization |
| Location | Yes | Address or "Remote" |
| Fair-chance employer | Yes | Yes/No — do they hire people with records? |
| Accepted conviction types | Yes | All / Non-violent only / Specific exclusions |
| Pay range | No | Hourly or salary range |
| Requirements | No | Skills, certifications, physical requirements |
| How to apply | Yes | Walk-in, online, through the org, etc. |
| Contact | Yes | Phone, email, or in-platform |
| Notes | No | Additional context |

**Housing:**
| Field | Required | Description |
|---|---|---|
| Program name | Yes | e.g., "Fortune Society — The Castle" |
| Type | Yes | Emergency shelter / Transitional / Permanent supportive / Rental assistance |
| Location | Yes | Address |
| Capacity / Availability | No | Beds available, waitlist status |
| Eligibility | Yes | Who qualifies (gender, age, conviction type, sobriety requirements) |
| Duration | No | How long the person can stay |
| Application process | Yes | How to apply, what documents needed |
| Contact | Yes | Phone, email, or in-platform |

**Legal Aid:**
| Field | Required | Description |
|---|---|---|
| Organization name | Yes | e.g., "Legal Aid Society Reentry Unit" |
| Services | Yes | Record sealing, expungement, know-your-rights, family law, etc. |
| Location | Yes | Address |
| Eligibility | Yes | Income requirements, case type limitations |
| Cost | Yes | Free / Sliding scale / Fee |
| Hours | No | Operating hours |
| How to access | Yes | Walk-in, appointment, referral needed |
| Contact | Yes | Phone, email |

**Education / Training:**
| Field | Required | Description |
|---|---|---|
| Program name | Yes | e.g., "Per Scholas — IT Support Training" |
| Type | Yes | GED prep / Vocational training / Certificate / College enrollment / Online course |
| Subject area | Yes | IT, Construction, Healthcare, Culinary, General, etc. |
| Location | Yes | Address or "Online" |
| Duration | No | Weeks, months |
| Cost | Yes | Free / Scholarship available / Fee |
| Prerequisites | No | Education level, skills, etc. |
| Enrollment process | Yes | How to apply |
| Contact | Yes | Phone, email |

**Financial Assistance:**
| Field | Required | Description |
|---|---|---|
| Program name | Yes | e.g., "Emergency Assistance Program" |
| Type | Yes | Emergency funds / Government benefits / Loans / Grants |
| Amount | No | Dollar range or description |
| Eligibility | Yes | Who qualifies |
| Application process | Yes | How to apply |
| Contact | Yes | Phone, email |

**Healthcare:**
| Field | Required | Description |
|---|---|---|
| Provider / Program name | Yes | |
| Type | Yes | Mental health / Substance abuse treatment / General healthcare / Dental |
| Location | Yes | Address |
| Accepts uninsured | Yes | Yes/No |
| Accepts Medicaid | Yes | Yes/No |
| Specialization | No | Trauma-informed, reentry-specific, MAT, etc. |
| Hours | No | Operating hours |
| How to access | Yes | Walk-in, appointment, referral |
| Contact | Yes | Phone, email |

**UI notes:**
- Clean form interface with fields appearing based on the selected resource type.
- After submission, the resource appears in the org's "My Resources" list.
- Each listing shows its status: Active, Needs Review (stale), Paused, Removed.
- Edit and remove buttons on each listing.
- A counter showing how many clients have viewed or saved each resource.

**Demo implementation:** Functional UI with mock data. Organizations can fill out forms and see listings appear. No actual database — data is held in React state. Pre-populated with 30–50 NYC resources across all categories.

### 6.5 Caseload Intelligence

**What it is:** An AI-generated digest of insights about the organization's client caseload, surfaced when the caseworker opens their dashboard.

**What the digest contains:**
- **Individual flags**: Clients who may need follow-up.
  - "Maria R. hasn't logged in for 21 days and has not completed her ID renewal step. Consider reaching out."
  - "James K. completed his job application milestone but has not reported any interview activity in 14 days."
- **Aggregate patterns**: Trends across the caseload.
  - "8 of your 34 active clients listed vocational training as a priority, but none have been matched to a training program."
  - "Housing is the #1 unmet need across your caseload. You have 1 housing resource listed — consider partnering with organizations in the network that offer housing."
- **Positive signals**: Progress worth noting.
  - "5 clients completed employment milestones this week — your highest week this month."

**UI notes:**
- Presented as a card or panel on the dashboard home page.
- Digest is dated (e.g., "Morning Digest — January 15, 2027").
- Each flag has an action button: "View Client," "Send Message," "Find Resources."
- Collapsible — the caseworker can dismiss it after reading.

**Demo implementation:** Static mock data. A pre-written digest is displayed on the dashboard. No LLM call — the content is hardcoded to show what it would look like.

### 6.6 Gap Analysis

**What it is:** An AI-generated analysis of mismatches between client needs and available resources, with recommendations to fill gaps using the shared network.

**What it shows:**
- **Unmet needs**: "23 of your clients are in District X, but you have no resources listed in District X. Here are 4 organizations in the shared network that serve District X."
- **Category gaps**: "You offer employment and legal services, but 15 clients have listed housing as an immediate need. Here are housing organizations in the network you could partner with."
- **Partner recommendations**: Specific organizations from the shared network that could fill identified gaps, with their profiles and contact info.

**UI notes:**
- Presented as a dedicated analytics page or section.
- Visual: bar chart or breakdown showing client needs vs. available resources by category.
- Each gap has a "View Partner Organizations" action that shows matching orgs from the network.

**Demo implementation:** Static mock data. Pre-built analysis with charts and recommendations. No LLM call.

### 6.7 Funder Reporting

**What it is:** One-click generation of formatted outcome reports for grant compliance.

**What a report contains:**
- Date range
- Clients served (total, new, active)
- Outcomes: employment placements, housing placements, milestones completed
- Demographic breakdowns
- Program completion rates
- Narrative summary

**UI notes:**
- "Generate Report" button with date range selector.
- Report appears as a formatted document that can be downloaded as PDF.
- Clean, professional formatting suitable for funder submission.

**Demo implementation:** Static mock data. A pre-formatted example report is displayed. "Generate" button shows a loading state and then reveals the report. No LLM call.

### 6.8 Client Management

**What it is:** The list of all clients connected to the organization, with individual profile views.

**What it shows:**
- **Client list**: Name, date enrolled, status (active/inactive), last activity, progress percentage.
- **Individual client view**: Full profile (generated by Smart Intake or manually entered), milestone progress, activity log, messages, connected organizations (names only — not their case notes), and caseworker notes.

**UI notes:**
- Searchable, sortable table or list view.
- Click a client to open their full profile.
- Tabs within the client view: Profile, Progress, Messages, Notes.

### 6.9 Messaging (Organization Side)

**What it is:** The organization's inbox for messages from clients.

**How it works:**
- When a client sends a message through the platform (Section 5.6), it appears in the organization's message inbox.
- Caseworkers can reply directly.
- Messages are organized by client, with the most recent at the top.
- Client context (name, profile summary, recent milestones) is visible alongside the conversation so the caseworker has context without switching screens.

**UI notes:**
- Standard inbox layout: conversation list on the left, active conversation on the right.
- Client context panel (collapsible) next to the chat.
- Unread message count badge on the dashboard navigation.

**Demo implementation:** Mock conversations pre-loaded. Caseworker can type replies (stored in React state, no actual delivery).

---

## 7. Layer 2 — Shared Resource Network (Detailed Specifications)

### How It Works

- Every resource entered by any organization (through Resource Management, Section 6.4) is automatically added to the shared network.
- The network is a single aggregated pool — clients searching for resources (Section 5.3) are searching this pool.
- Each organization retains full ownership: they control their listings, can edit or remove them at any time, and their organization name is displayed on every listing.
- Resources are tagged with: category, location, eligibility criteria, and the organization that listed them.

### Multi-Nonprofit Client Model

- A single client can be connected to multiple organizations simultaneously.
- Organization A handles their employment. Organization B handles their housing. Organization C handles their legal aid.
- Each organization sees the client's shared profile + their own case notes. They do NOT see another organization's case notes.
- The client sees a unified view of all their connections and all available resources regardless of which organization listed them.
- No exclusivity — the platform mirrors how reentry actually works, where people receive services from multiple providers.

### Network Effects

- More organizations → more resources in the pool → more value for every client.
- More clients → more data on needs → better gap analysis for organizations.
- A small nonprofit with only employment listings benefits from a larger organization's housing resources being in the same network.
- This creates a natural adoption incentive: each new organization that joins makes the platform more valuable for everyone already on it.

### Privacy Model

| Who | What they can see |
|---|---|
| Client | Their own full profile. All resources in the network. All organizations they're connected to. All messages. Their own progress. |
| Organization | The client's shared profile (what the client chose to share). Their own case notes about the client. Their own message history with the client. Names of other connected organizations (so they know the client is getting housing help from Org X, for example). They CANNOT see other organizations' case notes. |
| Other organizations | Nothing about a client they're not connected to. |

**Key principle:** The client owns their data. They choose what to share when they connect with an organization. Organizations see only what they need to serve the client, and never more.

### Resource Freshness

- Resources have a "date listed" timestamp.
- After a configurable period (30, 60, or 90 days), a resource is flagged as "Needs Review."
- The listing organization receives a notification to confirm, update, or remove the listing.
- If not confirmed within a grace period (e.g., 14 days after flagging), the resource is automatically paused (hidden from search but not deleted).

---

## 8. Cross-Platform Communication Hub

The messaging system spans both layers:

- **Client side (Layer 3):** Client finds an organization, clicks "Message," types a message.
- **Organization side (Layer 1):** Message appears in the org's inbox. Caseworker replies with full client context visible.
- **No AI involvement.** This is human-to-human messaging. The platform provides the channel; the people provide the connection.

---

## 9. AI Integration Summary

### Where AI is used:

| Feature | AI Role | Demo Status |
|---|---|---|
| AI Chat Companion (Layer 3) | RAG-powered Q&A grounded in resource data | **Working LLM** |
| Smart Intake (Layer 1) | Processes intake data into structured profile | **Working LLM** |
| Caseload Intelligence (Layer 1) | Generates daily/weekly digest of client flags | Static mock |
| Gap Analysis (Layer 1) | Analyzes needs vs. resources, recommends partners | Static mock |
| Funder Reporting (Layer 1) | Generates formatted outcome reports | Static mock |

### Where AI is NOT used:

| Feature | Why no AI needed |
|---|---|
| Resource Management | Organizations use structured templates; no AI categorization |
| Resource Search | Filter/search logic against structured data |
| Step-by-step guidance | Rules-based task sequencing (if/then logic based on profile) |
| Educational Resources | Curated static content |
| Progress Tracking | Simple checklist with state management |
| Messaging | Human-to-human communication |

### LLM Cost Model (for reference, not for demo)

The LLM never runs continuously. It only activates:
- **User-triggered:** One API call per action (chat message, intake submission). Cost: fractions of a cent per call.
- **Scheduled batch:** One sweep per day or week per organization. Cost: minimal, scales linearly with org count.

No background processing. No continuous monitoring. The LLM is an on-demand tool, not a running service.

---

## 10. Demo Implementation Checklist

### Working Features (require LLM integration)
- [ ] AI Chat Companion with RAG pipeline (OpenAI API + vector store)
- [ ] Smart Intake form → LLM-generated profile

### Functional UI Features (no LLM, interactive with mock data)
- [ ] Client onboarding flow
- [ ] Step-by-step life guidance (pre-built task sequences)
- [ ] Resource search with filters (mock JSON data)
- [ ] Educational resources directory (static curated links)
- [ ] Progress tracking with checkable milestones
- [ ] Organization directory with profiles
- [ ] Messaging UI (mock conversations)
- [ ] Nonprofit dashboard home with summary cards
- [ ] Resource management forms
- [ ] Client management list and individual views

### Static Display Features (hardcoded content to show concept)
- [ ] Caseload Intelligence digest on dashboard
- [ ] Gap Analysis page with charts and recommendations
- [ ] Funder Report example

### Data to Prepare
- [ ] 30–50 NYC reentry resource listings across all 6 categories
- [ ] 10–15 NYC reentry organization profiles
- [ ] Step-by-step procedure data for common tasks (ID, bank, SNAP, housing, etc.)
- [ ] 3–5 mock client profiles for the nonprofit dashboard
- [ ] 1 pre-written Caseload Intelligence digest
- [ ] 1 pre-built Gap Analysis with chart data
- [ ] 1 pre-formatted Funder Report
- [ ] Administrative procedure data for vector store (RAG)
- [ ] Resource data for vector store (RAG)

---

## 11. Page Structure (Suggested)

### Client-Facing Pages
1. **Landing page** — What Alyosha is, how it helps, call to action to sign up
2. **Onboarding** — Multi-step profile creation
3. **Dashboard home** — Welcome message, progress summary, quick links
4. **Step-by-step guidance** — Task timeline/checklist
5. **Resource search** — Search interface with filters
6. **Educational resources** — Learning pathways by goal
7. **AI Chat** — Chat companion interface
8. **Organizations** — Directory with search and profiles
9. **Messages** — Inbox for conversations with organizations
10. **Profile / Settings** — Edit profile, manage connections, privacy controls

### Organization-Facing Pages
1. **Landing page** — What Alyosha offers organizations, call to action to sign up
2. **Onboarding** — Organization profile creation
3. **Dashboard home** — Summary cards, Caseload Intelligence digest, activity feed
4. **Clients** — Client list with search, individual client views
5. **Smart Intake** — Intake form with LLM profile generation
6. **Resources** — Resource management (add, edit, view listings)
7. **Gap Analysis** — Analytics page
8. **Reports** — Funder reporting interface
9. **Messages** — Inbox for client conversations
10. **Settings** — Organization profile, staff accounts, notification preferences
