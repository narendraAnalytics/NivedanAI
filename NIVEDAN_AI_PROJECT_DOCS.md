# Nivedan AI — Project Documentation
### Autonomous Proposal Intelligence Platform
**Built by:** Narendra Kumar · nk-analytics  
**Stack:** Google ADK (TypeScript) · Gemini 3.1 · Next.js 15 · Neon · Clerk · Drizzle · Vercel  
**Year:** 2026

---

## 1. Project Identity

**Full Name:** Nivedan AI  
**Tagline:** *"निवेदन — The formal submission that wins contracts, written by AI in 20 minutes, not 20 hours."*

**Name Origin:**  
The name is derived from the Hindi and Sanskrit word **निवेदन**, meaning a formal, respectful submission. This is precisely what an RFP response is — a professionally crafted proposal submitted to win a contract, a government tender, or a large enterprise deal. The name carries cultural identity, emotional resonance, and enterprise seriousness simultaneously.

**Category:** Multi-Agent AI SaaS · Autonomous Workflow Platform · Enterprise Proposal Intelligence  

**Classification:** Not a chatbot. Not a prompt wrapper. A fully orchestrated, multi-agent business automation system that produces structured, verifiable outputs in a sequential pipeline.

---

## 2. What Is Nivedan AI?

Nivedan AI is an **autonomous, multi-agent SaaS platform** that transforms the way agencies, freelancers, and sales teams respond to RFPs (Requests for Proposals).

It deploys **six highly specialized AI agents** coordinated in a strict pipeline:
1. Read the uploaded RFP document
2. Research the client company in real time
3. Match company capabilities to client requirements
4. Write a complete, tailored proposal
5. Review and validate the proposal against all requirements
6. Export a professionally branded, submission-ready PDF

All of this completes in **under 20 minutes**.

The platform runs as a **single Next.js 15 monorepo**. All agents execute inside Next.js API routes — no separate backend, no extra infrastructure. Authentication via Clerk, data via Neon PostgreSQL with Drizzle ORM, email delivery via Resend, all deployed on Vercel.

---

## 3. The Real-World Problem Being Solved

### Before Nivedan AI (The Painful Status Quo)

| Pain Point | Detail |
|---|---|
| Manual reading time | Sales manager reads a 40-page RFP — 3 hours just to understand requirements |
| Blank-page problem | Starts writing from scratch, copy-pasting fragments from old proposals |
| Tribal knowledge hunting | Pings 5 teammates asking for case studies and past project data |
| Generic output | Proposal barely addresses the client's specific situation or priorities |
| Last-minute failures | Reviewer finds missing mandatory sections — entire rewrite required |
| Time cost | 8 to 20 hours of senior staff time wasted per single proposal |
| Low win rate | Win rate stays at 20–25% because proposals are not tailored |
| Capacity bottleneck | Agency handles 15 RFPs/month = 150 to 300 hours wasted monthly |

### After Nivedan AI (The Transformation)

| Outcome | Detail |
|---|---|
| Instant parsing | RFP PDF uploaded — all requirements extracted in 60 seconds |
| Live client intelligence | Client Research Agent finds the company's latest news and priorities |
| Automatic knowledge retrieval | Past case studies pulled from company knowledge base automatically |
| Deep tailoring | Every proposal section is specific to that client's context and goals |
| Zero missed requirements | Quality Review Agent validates all mandatory requirements before export |
| Speed | Complete proposal ready in 15–20 minutes — zero hours of human writing |
| Higher win rate | Win rate improves to 40–50% with precise, research-backed proposals |
| 3× capacity | Same team handles 3× more RFPs per month without additional headcount |

### Business Impact
> A software agency winning just **one extra contract per month** using Nivedan AI earns an additional **₹25–₹50 lakhs annually**. The subscription pays for itself in the first hour of use.

---

## 4. The Six Agents — Roles, Models, Tasks, Outputs

### Agent Pipeline Overview

```
User Upload → Orchestrator → RFP Parser → Client Research → Requirements Matcher → Proposal Writer → Quality Review & Export → Final PDF
```

Each agent receives the structured output of the previous agent. The pipeline is strictly sequential. No agent begins until its predecessor completes successfully.

---

### Agent 1 — Orchestrator Agent
**Role:** THE BRAIN · ROOT ADK AGENT  
**Gemini Model:** `gemini-3.1-pro`  
**Position in Pipeline:** Entry point — triggers and manages all downstream agents

**What It Does:**
- Creates and manages the session state shared across all agents
- Reads the uploaded RFP file reference and the user's company profile
- Decides the exact execution sequence for all downstream agents
- Monitors pipeline progress and handles errors gracefully
- Retries failed agents or skips and continues rather than crashing the workflow
- Acts as the conductor ensuring all six agents play in the correct order

**Real Example:**  
User uploads a 38-page hospital RFP and clicks "Generate Proposal." The Orchestrator reads the file metadata, creates a session with the job ID and company profile, and begins triggering agents in sequence — starting immediately with the RFP Parser Agent.

**Output:** Structured session state object shared across all agents

---

### Agent 2 — RFP Parser Agent
**Role:** DOCUMENT INTELLIGENCE · REQUIREMENT EXTRACTOR  
**Gemini Model:** `gemini-3.1-flash-lite`  
**Position in Pipeline:** Step 2 — first agent to process the actual document

**What It Does:**
- Reads the entire RFP document regardless of length or structure quality
- Extracts and classifies every requirement as mandatory or optional
- Pulls out: budget ceiling, project timeline, evaluation criteria, vendor qualifications, compliance requirements, and certification requirements
- Converts a chaotic, unstructured document into a clean, structured JSON object
- Applies priority flags to requirements so downstream agents know what is non-negotiable

**Real Example:**  
RFP contains: "Vendor must have HIPAA compliance experience" (page 12), "Budget not to exceed $150,000" (page 28), "Delivery within 6 months" (page 5). This agent finds all three regardless of page order and marks each as a mandatory requirement with priority flags.

**Output:** Structured RFP Blueprint JSON — mandatory requirements, budget, timeline, evaluation weights

---

### Agent 3 — Client Research Agent
**Role:** COMPANY INTELLIGENCE · CONTEXT BUILDER  
**Gemini Model:** `gemini-3.1-flash` (uses Google Search / Web Search Agent)  
**Position in Pipeline:** Step 3 — runs in parallel context with the parsed requirements

**What It Does:**
- Uses the client company name extracted from the RFP to trigger web research
- Searches for: recent news, funding rounds, leadership changes, product launches, expansion plans, strategic priorities, and competitive position
- Generates a company intelligence profile that makes the proposal feel personally researched and deeply relevant
- Provides the contextual layer that separates a generic proposal from a winning one
- Uses a dedicated Search Tool / Search Agent (Gemini-3.1-flash) for routing-level intelligence and lightweight lookups

**Real Example:**  
RFP is from Apollo Hospitals. Agent discovers Apollo recently announced a ₹2,000 crore investment in digital health infrastructure and is expanding their telemedicine platform to Tier 2 cities. The proposal now opens with: *"Given Apollo's strategic focus on digital health expansion into Tier 2 markets, our solution directly addresses your infrastructure modernisation goals..."*

**Output:** Client Profile JSON — company context, priorities, recent news, industry position

---

### Agent 4 — Requirements Matcher Agent
**Role:** CAPABILITY ALIGNMENT · PROOF FINDER  
**Gemini Model:** `gemini-3.1-flash-lite`  
**Position in Pipeline:** Step 4 — bridges client requirements with company capabilities

**What It Does:**
- Compares every RFP requirement against the user's company knowledge base
- Searches knowledge base assets: past proposals, case studies, team bios, certifications, technology stack documentation
- Maps each requirement to the company's strongest, most relevant proof point
- Assigns confidence scores to each requirement-to-proof-point mapping
- Identifies gaps in coverage and recommends content directions where hard evidence is thin
- Ensures no requirement goes unaddressed in the final proposal

**Real Example:**  
Client requires HIPAA compliance experience. The knowledge base contains a 2024 case study: HIPAA-compliant patient portal for a US clinic — 10,000 patients migrated, zero compliance violations, delivered 3 weeks early. This agent retrieves it, extracts the key metrics, and maps it directly to the requirement. The proposal now has real evidence, not empty claims.

**Output:** Capability Match Table — requirement-to-proof-point mapping with confidence scores

---

### Agent 5 — Proposal Writer Agent
**Role:** FULL DOCUMENT DRAFTER · SECTION BUILDER  
**Gemini Model:** `gemini-3.1-pro` (highest capability — used for long-form coherent writing)  
**Position in Pipeline:** Step 5 — the core creative and drafting engine

**What It Does:**
- Ingests all structured outputs from Agents 2, 3, and 4 simultaneously
- Writes the complete proposal document from scratch using all available intelligence
- Generates every standard proposal section:
  - Executive Summary
  - Understanding of Requirements
  - Proposed Solution
  - Technical Approach
  - Case Studies & Past Work
  - Team & Expertise
  - Project Timeline
  - Pricing Structure
- Every sentence is written with the specific client's context in mind
- Uses `gemini-3.1-pro` because this task demands the highest level of language reasoning, context retention, and coherent long-form writing

**Real Example:**  
Executive Summary opens with Apollo's digital health mission, acknowledges their Tier 2 expansion initiative, and immediately connects it to the vendor team's healthcare technology track record — all in the first three sentences. The Proposed Solution section maps each of their eight stated requirements to a specific feature with supporting evidence from past projects. No generic filler.

**Output:** Full proposal draft — all sections written, structured, and ready for review

---

### Agent 6 — Quality Review & Export Agent
**Role:** EDITOR · VALIDATOR · PDF GENERATOR  
**Gemini Model:** `gemini-3.1-flash-lite`  
**Position in Pipeline:** Step 6 — final gate before delivery

**What It Does:**
- Reads the complete draft proposal against the original RFP requirements
- Validates that every mandatory requirement identified by the Parser Agent has been addressed
- Checks that the proposed budget does not exceed the stated ceiling
- Checks that the proposed timeline fits within the client's deadline
- Flags conflicting information across sections and corrects it
- Triggers the Human-in-the-Loop (HITL) gate — user reviews draft, provides feedback or flags sections
- Incorporates user feedback and re-generates only the flagged sections (not the entire proposal)
- After HITL approval, hands the final document to the PDF export module
- Exports a professionally branded PDF with: company logo, brand colors, table of contents, cover page, page numbers

**Real Example:**  
Draft says the project will be delivered in 8 months. RFP required 6 months. This agent catches the conflict, revises the timeline section, and updates project milestones to fit within 6 months. Then exports a clean, professional PDF with agency branding applied from profile settings.

**Output:** Submission-ready branded PDF + dashboard view + Resend email delivery + saved to Neon DB

---

## 5. Gemini Models Used — Why Each Was Chosen

| Model | Assigned To | Reason |
|---|---|---|
| `gemini-3.1-pro` | Orchestrator Agent | Advanced reasoning and orchestration; manages complex multi-agent coordination |
| `gemini-3.1-flash-lite` | RFP Parser Agent | Fast parsing and structured information extraction; cost-efficient for document processing |
| `gemini-3.1-flash` | Client Research Agent | Deep research and information gathering at scale; paired with Search Agent |
| `gemini-3.1-flash-lite` | Requirements Matcher Agent | Accurate matching and gap analysis with high efficiency |
| `gemini-3.1-pro` | Proposal Writer Agent | High-quality, long-form content generation with deep context understanding |
| `gemini-3.1-flash-lite` | Quality Review Agent | Detailed review and quality assurance at scale; cost-efficient for validation |

**Search Tool / Search Agent** (separate component):  
Model: `gemini-3.1-flash`  
Capabilities: Google Search (Web Search), returns factual real-time information, provides centralized search capability used by agents that need it (primarily Client Research Agent)

---

## 6. End-to-End Workflow — Step by Step

### Trigger
User uploads RFP PDF and submits their company profile (one-time setup including: past proposals, case studies, team bios, certifications).

### Pipeline Execution

```
Step 0 — User Action
  └─ Uploads RFP PDF
  └─ Company profile available (knowledge base)
  └─ Clicks "Generate Proposal"

Step 1 — Inngest Workflow Trigger
  └─ Inngest receives job
  └─ Orchestrates the full agent pipeline
  └─ Routes execution through all 6 agents

Step 2 — Request Intake
  └─ System understands intent and context
  └─ Session initialized

Step 3 — Plan & Orchestrate (Orchestrator Agent)
  └─ Breaks workflow into sub-tasks
  └─ Assigns tasks to the right agents
  └─ Manages state across all agents

Step 4 — Execute & Monitor (All 6 Agents in Sequence)
  └─ Agents execute tasks in coordination
  └─ Each agent passes structured output to the next

Step 5 — Human-in-the-Loop Gate
  └─ Quality Review Agent generates draft PDF
  └─ Pipeline pauses — user reviews the draft
  └─ User provides feedback, requests changes, or flags sections
  └─ Agent incorporates feedback, re-generates only flagged sections
  └─ Revised proposal is re-validated

Step 6 — Deliver Response
  └─ Final PDF exported with full company branding
  └─ Dashboard view updated
  └─ PDF downloadable directly
  └─ Email delivered via Resend
  └─ Saved to Neon PostgreSQL
```

### Total Time: 15–20 minutes from upload to submission-ready PDF

---

## 7. Human-in-the-Loop (HITL) Flow

This is a critical design feature that separates Nivedan AI from a fully automated black box:

1. **Draft Generated** — Quality Review Agent exports draft proposal as PDF and pauses the pipeline
2. **User Reviews** — User views the draft in the dashboard; can read every section
3. **User Provides Feedback** — Requests changes, flags specific sections that need improvement, or approves
4. **Agent Incorporates Feedback** — Re-generates only the flagged sections (not the entire document — cost and time efficient)
5. **Revised Proposal Ready** — Updated proposal is re-validated and prepared for final export
6. **Final PDF Delivered** — Professionally formatted proposal delivered to user

---

## 8. Technology Stack

| Layer | Technology |
|---|---|
| Frontend Framework | Next.js 15 (App Router) |
| AI Framework | Google ADK (TypeScript) |
| AI Models | Gemini 3.1 Pro / Flash / Flash-Lite |
| Authentication | Clerk |
| Database | Neon PostgreSQL |
| ORM | Drizzle ORM |
| File Upload | UploadThing |
| Email Delivery | Resend |
| Document Parsing | pdf-parse + mammoth |
| Deployment | Vercel |
| Workflow Orchestration | Inngest |

**Architecture:** Single Next.js 15 monorepo. All agents execute inside Next.js API routes. No separate backend server. No external infrastructure beyond listed services. Deployed as a single application to Vercel.

---

## 9. Development Roadmap (4 Phases)

### Phase 1 — Build & Prove (Vercel + Inngest)
- All 6 agents running locally in pipeline
- Pipeline works end to end with structured outputs
- PDF generates correctly
- Real users can use the product

### Phase 2 — Add MCP (Model Context Protocol)
- Convert tools (knowledge base search, PDF export, web search) into MCP servers
- Agents use MCP toolsets instead of direct function calls
- No change to agent logic — only the tool layer changes

### Phase 3 — Add A2A (Agent-to-Agent)
- Wrap RFP Parser, Client Research, and Requirements Matcher as A2A services on Cloud Run
- Orchestrator calls them via RemoteA2aAgent
- Pipeline becomes distributed and independently scalable

### Phase 4 — Add Evals, HITL, Observability
- ADK eval framework applied to each agent
- Human approval gate enforced before PDF export
- AgentOps or Galileo for full pipeline tracing and observability

---

## 10. Target Users & Pricing

| Segment | Description | Monthly Price |
|---|---|---|
| Software Agencies | 10–15 RFPs/month; each proposal costs 8–20 hours of senior BD time | ₹16,000–₹25,000 |
| Freelance Developers | Bidding on Upwork, Toptal, or direct projects; one extra win/month justifies subscription | ₹8,000–₹12,000 |
| SaaS Sales Teams | Responding to Fortune 500 RFPs worth ₹50 lakhs to ₹5 crores each | ₹25,000–₹40,000 |
| Consulting Firms | Proposal development is their core business cost; 90% reduction = direct profit impact | ₹25,000–₹40,000 |
| Construction & Infrastructure | Government tenders with complex requirements; one missed item = disqualification | ₹12,000–₹20,000 |
| EdTech & Research Institutes | Government grants, academic partnerships, procurement contracts with strict formats | ₹8,000–₹16,000 |

---

## 11. Key Performance Metrics

| Metric | Value |
|---|---|
| Time reduction per proposal | 95% (from 8–20 hours → 15–20 minutes) |
| Win rate improvement | 2× (from 20–25% → 40–50%) |
| Proposal capacity increase | 3× with same team headcount |
| Missed requirements | 0 (validated by Quality Review Agent before export) |
| Extra infrastructure cost | ₹0 (single monorepo on Vercel) |
| Knowledge compounding | Every approved proposal strengthens future proposals |

---

## 12. System Design Principles

- **Sequential pipeline** — agents execute in strict order; no agent skips its predecessor
- **Structured outputs** — every agent produces a well-defined JSON or document object consumed by the next
- **Error resilience** — Orchestrator retries or bypasses failed agents without crashing the workflow
- **Human gate** — HITL approval enforced before irreversible export; user always has control
- **Context accumulation** — each agent layer adds intelligence; the Proposal Writer has access to everything all prior agents produced
- **Knowledge compounding** — every approved proposal is stored and improves future matching accuracy
- **Cost-efficient model selection** — Pro models only where highest reasoning is required; Flash-Lite for high-volume extraction and validation tasks

---

## 13. Environment Variables — `.env.local` Setup

Create a `.env.local` file in the project root. **Never commit this file to git.** Add `.env.local` to `.gitignore` immediately.

```dotenv
# ─────────────────────────────────────────────
# GOOGLE AI — GEMINI MODELS (Google ADK)
# ─────────────────────────────────────────────
# Get from: https://aistudio.google.com/app/apikey
GOOGLE_API_KEY=your_google_api_key_here

# Must be FALSE — we are using Google AI Studio (Gemini API directly),
# NOT Vertex AI. Setting this to TRUE would require a full GCP project setup.
GOOGLE_GENAI_USE_VERTEXAI=FALSE

# ─────────────────────────────────────────────
# CLERK — AUTHENTICATION
# ─────────────────────────────────────────────
# Get from: https://dashboard.clerk.com → Your App → API Keys
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_your_publishable_key_here
CLERK_SECRET_KEY=sk_test_your_secret_key_here

# Redirect URLs — IMPORTANT:
# After sign-in, send user BACK TO THE LANDING PAGE (not the dashboard).
# The landing page should then detect the auth state and show the app CTA.
# Only redirect to /dashboard after the user explicitly clicks "Go to Dashboard"
# or after onboarding is complete.
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/

# ─────────────────────────────────────────────
# NEON — POSTGRESQL DATABASE
# ─────────────────────────────────────────────
# Get from: https://console.neon.tech → Your Project → Connection String
DATABASE_URL=postgresql://user:password@ep-xxxx.us-east-1.aws.neon.tech/neondb?sslmode=require

# ─────────────────────────────────────────────
# INNGEST — WORKFLOW ORCHESTRATION
# ─────────────────────────────────────────────
# Get from: https://app.inngest.com → Your App → Manage → Keys
# INNGEST_EVENT_KEY is used to send events TO Inngest from your app
# INNGEST_SIGNING_KEY is used to verify that webhook calls are from Inngest
INNGEST_EVENT_KEY=your_inngest_event_key_here
INNGEST_SIGNING_KEY=your_inngest_signing_key_here

# ─────────────────────────────────────────────
# UPLOADTHING — FILE UPLOAD (RFP PDF)
# ─────────────────────────────────────────────
# Get from: https://uploadthing.com → Dashboard → Your App → API Keys
UPLOADTHING_SECRET=sk_live_your_uploadthing_secret_here
UPLOADTHING_APP_ID=your_uploadthing_app_id_here

# ─────────────────────────────────────────────
# RESEND — EMAIL DELIVERY
# ─────────────────────────────────────────────
# Get from: https://resend.com → API Keys
RESEND_API_KEY=re_your_resend_api_key_here

# The email address proposals will be sent FROM (must be a verified domain in Resend)
RESEND_FROM_EMAIL=proposals@yourdomain.com

# ─────────────────────────────────────────────
# APP — BASE URL
# ─────────────────────────────────────────────
# Local development
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Change to your production Vercel URL before deploying:
# NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
```

---

### Where to Get Each Key

| Variable | Source URL | Notes |
|---|---|---|
| `GOOGLE_API_KEY` | [aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey) | Free tier available; enable Gemini API |
| `GOOGLE_GENAI_USE_VERTEXAI` | — | Always `FALSE` for direct Gemini API |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | [dashboard.clerk.com](https://dashboard.clerk.com) | Starts with `pk_test_` |
| `CLERK_SECRET_KEY` | [dashboard.clerk.com](https://dashboard.clerk.com) | Starts with `sk_test_`; never expose client-side |
| `DATABASE_URL` | [console.neon.tech](https://console.neon.tech) | Use the pooled connection string |
| `INNGEST_EVENT_KEY` | [app.inngest.com](https://app.inngest.com) | Used in `inngest.send()` calls |
| `INNGEST_SIGNING_KEY` | [app.inngest.com](https://app.inngest.com) | Used to verify incoming Inngest webhooks |
| `UPLOADTHING_SECRET` | [uploadthing.com](https://uploadthing.com) | Starts with `sk_live_` |
| `UPLOADTHING_APP_ID` | [uploadthing.com](https://uploadthing.com) | Found in app settings |
| `RESEND_API_KEY` | [resend.com](https://resend.com) | Starts with `re_` |

---

### Clerk — Sign-In Redirects Back to Landing Page

**The behaviour we want:**  
After a user signs in or signs up, Clerk should redirect them back to `/` (the landing page), NOT to `/dashboard`. The landing page detects the authenticated state and shows a "Go to Dashboard" CTA. The user then navigates to the dashboard by choice.

**Why this matters:**  
- New users land on `/` after sign-up and see the full product intro before entering the app
- Returning users land on `/` and can click through to their dashboard — no forced redirect
- Prevents confusing first-time users by dumping them into an empty dashboard immediately

**How to configure this in `middleware.ts`:**

```ts
// middleware.ts
import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'

const isProtectedRoute = createRouteMatcher([
  '/dashboard(.*)',
  '/proposals(.*)',
  '/knowledge-base(.*)',
  '/settings(.*)',
])

export default clerkMiddleware((auth, req) => {
  if (isProtectedRoute(req)) auth().protect()
  // Landing page (/) is public — authenticated users stay on /
  // They choose to go to /dashboard themselves via a CTA button
})

export const config = {
  matcher: ['/((?!.*\\..*|_next).*)', '/', '/(api|trpc)(.*)'],
}
```

**The Landing Page CTA logic (conceptual):**

```tsx
// On the landing page Hero section
import { useAuth } from '@clerk/nextjs'
import Link from 'next/link'

export function HeroCTA() {
  const { isSignedIn } = useAuth()

  return isSignedIn ? (
    <Link href="/dashboard">Go to Dashboard →</Link>
  ) : (
    <Link href="/sign-up">Start for Free →</Link>
  )
}
```

This means:
- Unauthenticated visitors → see "Start for Free" → go to `/sign-up` → after sign-up → return to `/`
- Authenticated users → see "Go to Dashboard" → navigate to `/dashboard` by choice
- `/dashboard` and all protected routes still require auth via middleware

---

### Vercel Environment Variables (Production)

When deploying to Vercel, add all of the above variables in:  
**Vercel Dashboard → Your Project → Settings → Environment Variables**

Set each variable for **Production**, **Preview**, and **Development** environments as appropriate. The `NEXT_PUBLIC_APP_URL` should be updated to your actual Vercel deployment URL for production.

---

## 14. Project Vision

> *"Nivedan AI exists to give every agency, every freelancer, and every sales team the same proposal quality that was previously only possible with a dedicated team of senior writers, researchers, and designers.*
>
> *A solo developer in Palakollu should be able to submit a proposal that competes with one prepared by a 10-person agency in Mumbai. Nivedan AI makes that the new normal."*

---

## 15. What Makes This Different From Generic AI Tools

| Generic AI Tool | Nivedan AI |
|---|---|
| Upload PDF and ask questions | Autonomous pipeline that produces a complete document |
| Chat-based interface | Workflow execution with structured stages |
| Single model, single prompt | Six specialized agents with distinct roles and models |
| Generic outputs | Client-specific, research-backed, evidence-mapped proposals |
| No validation | Mandatory quality gate with HITL before export |
| No knowledge retention | Every proposal strengthens the company knowledge base |
| Manual effort still required | Zero hours of human writing after upload |

---

---

## 16. Database Schema — Neon PostgreSQL (Drizzle ORM)

### Overview — All Tables at a Glance

| # | Table Name | Purpose | Syncs With |
|---|---|---|---|
| 1 | `users` | Core user record | Clerk webhook (auth sync) |
| 2 | `company_profiles` | User's agency/company info | Belongs to `users` |
| 3 | `knowledge_base_items` | Case studies, certs, team bios | Belongs to `company_profiles` |
| 4 | `rfp_jobs` | Each proposal generation job | Belongs to `users` |
| 5 | `rfp_documents` | Uploaded RFP PDF metadata | Belongs to `rfp_jobs` |
| 6 | `agent_runs` | Per-agent execution log | Belongs to `rfp_jobs` |
| 7 | `parsed_rfp_data` | RFP Parser Agent output | Belongs to `rfp_jobs` |
| 8 | `client_research_data` | Client Research Agent output | Belongs to `rfp_jobs` |
| 9 | `capability_matches` | Requirements Matcher output | Belongs to `rfp_jobs` |
| 10 | `proposals` | Final written proposal content | Belongs to `rfp_jobs` |
| 11 | `proposal_exports` | PDF export records + delivery | Belongs to `proposals` |
| 12 | `hitl_reviews` | Human-in-the-loop review state | Belongs to `proposals` |

Total: **12 tables**

---

### Relationship Map

```
users (Clerk sync)
  └── company_profiles (1 user → 1 profile)
        └── knowledge_base_items (1 profile → many items)

users
  └── rfp_jobs (1 user → many jobs)
        └── rfp_documents        (1 job → 1 document)
        └── agent_runs           (1 job → 6 runs, one per agent)
        └── parsed_rfp_data      (1 job → 1 record)
        └── client_research_data (1 job → 1 record)
        └── capability_matches   (1 job → many rows, one per requirement)
        └── proposals            (1 job → 1 proposal)
              └── hitl_reviews   (1 proposal → many review rounds)
              └── proposal_exports (1 proposal → many exports)
```

---

### Table 1 — `users`
**Purpose:** Core user record. Created and kept in sync via Clerk webhook. Every user in the app must exist here before any other record is created.

**Clerk Sync Pattern:**
Clerk fires a webhook on `user.created`, `user.updated`, and `user.deleted` events. Your `/api/webhooks/clerk` route listens for these and upserts this table accordingly. This is the standard Clerk + Neon sync pattern.

| Column | Type | Constraints | Notes |
|---|---|---|---|
| `id` | `uuid` | PK, default `gen_random_uuid()` | Internal DB primary key |
| `clerk_user_id` | `text` | UNIQUE, NOT NULL | Clerk's user ID e.g. `user_2abc...` |
| `email` | `text` | NOT NULL | Primary email from Clerk |
| `full_name` | `text` | NULLABLE | From Clerk profile |
| `avatar_url` | `text` | NULLABLE | Profile image URL from Clerk |
| `plan` | `text` | NOT NULL, default `'free'` | `free` / `starter` / `pro` / `agency` |
| `created_at` | `timestamp` | NOT NULL, default `now()` | When user first signed up |
| `updated_at` | `timestamp` | NOT NULL, default `now()` | Updated on every Clerk webhook |

**Clerk webhook events that touch this table:**
- `user.created` → INSERT new row
- `user.updated` → UPDATE email, full_name, avatar_url
- `user.deleted` → soft delete or hard delete depending on preference

---

### Table 2 — `company_profiles`
**Purpose:** The user's agency or company information. This is the one-time setup every user completes after signing up. It stores the company identity that gets applied to every proposal (logo, colors, company name, industry). One user = one company profile.

| Column | Type | Constraints | Notes |
|---|---|---|---|
| `id` | `uuid` | PK, default `gen_random_uuid()` | |
| `user_id` | `uuid` | FK → `users.id`, NOT NULL | Owner of this profile |
| `company_name` | `text` | NOT NULL | e.g. "Narendra Kumar & Associates" |
| `industry` | `text` | NULLABLE | e.g. "Software Development" |
| `website` | `text` | NULLABLE | Company website URL |
| `logo_url` | `text` | NULLABLE | UploadThing URL for company logo |
| `brand_color_primary` | `text` | NULLABLE, default `'#1a1a2e'` | Hex color for PDF branding |
| `brand_color_secondary` | `text` | NULLABLE, default `'#16213e'` | Hex color for PDF branding |
| `tagline` | `text` | NULLABLE | Short company positioning line |
| `founded_year` | `integer` | NULLABLE | |
| `team_size` | `text` | NULLABLE | e.g. "1-10", "11-50" |
| `is_onboarded` | `boolean` | NOT NULL, default `false` | True once setup is complete |
| `created_at` | `timestamp` | NOT NULL, default `now()` | |
| `updated_at` | `timestamp` | NOT NULL, default `now()` | |

---

### Table 3 — `knowledge_base_items`
**Purpose:** The company's library of proof points — past proposals, case studies, team bios, certifications, technology documentation. This is what the Requirements Matcher Agent (Agent 4) searches to find evidence for each RFP requirement. Every approved proposal also gets added here automatically, making the knowledge base smarter over time.

| Column | Type | Constraints | Notes |
|---|---|---|---|
| `id` | `uuid` | PK, default `gen_random_uuid()` | |
| `company_profile_id` | `uuid` | FK → `company_profiles.id`, NOT NULL | Belongs to company |
| `type` | `text` | NOT NULL | `case_study` / `certification` / `team_bio` / `past_proposal` / `technology` / `testimonial` |
| `title` | `text` | NOT NULL | e.g. "HIPAA-Compliant Patient Portal — 2024" |
| `description` | `text` | NOT NULL | Full text content of this knowledge item |
| `tags` | `text[]` | NULLABLE | e.g. `['healthcare', 'HIPAA', 'portal']` for filtering |
| `industry` | `text` | NULLABLE | Industry this item is relevant to |
| `file_url` | `text` | NULLABLE | UploadThing URL if item has a supporting doc |
| `metrics` | `jsonb` | NULLABLE | Key metrics e.g. `{"patients": 10000, "delivered": "3 weeks early"}` |
| `is_active` | `boolean` | NOT NULL, default `true` | Soft delete — inactive items excluded from search |
| `created_at` | `timestamp` | NOT NULL, default `now()` | |
| `updated_at` | `timestamp` | NOT NULL, default `now()` | |

---

### Table 4 — `rfp_jobs`
**Purpose:** The central job record. Every time a user uploads an RFP and clicks "Generate Proposal," one row is created here. All agent runs, parsed data, research, matches, and the final proposal are children of this record. This is the spine of the entire pipeline.

| Column | Type | Constraints | Notes |
|---|---|---|---|
| `id` | `uuid` | PK, default `gen_random_uuid()` | |
| `user_id` | `uuid` | FK → `users.id`, NOT NULL | Who triggered this job |
| `inngest_run_id` | `text` | NULLABLE | Inngest's run ID for this workflow |
| `status` | `text` | NOT NULL, default `'pending'` | `pending` / `running` / `awaiting_review` / `completed` / `failed` |
| `client_name` | `text` | NULLABLE | Extracted from RFP by Parser Agent |
| `client_industry` | `text` | NULLABLE | Extracted from RFP |
| `rfp_title` | `text` | NULLABLE | e.g. "Digital Health Infrastructure RFP 2026" |
| `budget_ceiling` | `text` | NULLABLE | Extracted budget e.g. "$150,000" |
| `deadline` | `text` | NULLABLE | Submission deadline from RFP |
| `current_agent` | `integer` | NULLABLE | Which agent is currently running (1–6) |
| `error_message` | `text` | NULLABLE | Last error if status is `failed` |
| `started_at` | `timestamp` | NULLABLE | When pipeline execution began |
| `completed_at` | `timestamp` | NULLABLE | When pipeline finished |
| `created_at` | `timestamp` | NOT NULL, default `now()` | |
| `updated_at` | `timestamp` | NOT NULL, default `now()` | Updated on every agent status change |

---

### Table 5 — `rfp_documents`
**Purpose:** Stores the metadata of the uploaded RFP PDF. The actual file lives on UploadThing's CDN. This table holds the URL reference, file name, and size so the Orchestrator and Parser Agent can access it without re-uploading.

| Column | Type | Constraints | Notes |
|---|---|---|---|
| `id` | `uuid` | PK, default `gen_random_uuid()` | |
| `rfp_job_id` | `uuid` | FK → `rfp_jobs.id`, NOT NULL, UNIQUE | One document per job |
| `file_name` | `text` | NOT NULL | Original filename e.g. "Apollo_RFP_2026.pdf" |
| `file_url` | `text` | NOT NULL | UploadThing CDN URL — persistent, used by agents |
| `file_size_bytes` | `integer` | NULLABLE | File size for display |
| `page_count` | `integer` | NULLABLE | Populated by Parser Agent after reading |
| `uploaded_at` | `timestamp` | NOT NULL, default `now()` | |

---

### Table 6 — `agent_runs`
**Purpose:** Execution log for every agent in the pipeline. One row per agent per job = 6 rows per completed job. Tracks start time, end time, status, and token usage per agent. This powers the real-time dashboard progress view and gives observability into which agents succeed, fail, or are slow.

| Column | Type | Constraints | Notes |
|---|---|---|---|
| `id` | `uuid` | PK, default `gen_random_uuid()` | |
| `rfp_job_id` | `uuid` | FK → `rfp_jobs.id`, NOT NULL | Parent job |
| `agent_number` | `integer` | NOT NULL | 1 through 6 |
| `agent_name` | `text` | NOT NULL | e.g. `orchestrator` / `rfp_parser` / `client_research` / `requirements_matcher` / `proposal_writer` / `quality_review` |
| `model_used` | `text` | NOT NULL | e.g. `gemini-3.1-pro` / `gemini-3.1-flash-lite` |
| `status` | `text` | NOT NULL, default `'pending'` | `pending` / `running` / `completed` / `failed` / `skipped` |
| `input_tokens` | `integer` | NULLABLE | Token count for input |
| `output_tokens` | `integer` | NULLABLE | Token count for output |
| `duration_ms` | `integer` | NULLABLE | How long this agent took in milliseconds |
| `error_message` | `text` | NULLABLE | Error detail if status is `failed` |
| `started_at` | `timestamp` | NULLABLE | |
| `completed_at` | `timestamp` | NULLABLE | |

---

### Table 7 — `parsed_rfp_data`
**Purpose:** Stores the structured JSON output of the RFP Parser Agent (Agent 2). This is the "RFP Blueprint" — the clean, structured extraction of everything the Parser found in the raw PDF. Every downstream agent reads from this table rather than re-parsing the PDF.

| Column | Type | Constraints | Notes |
|---|---|---|---|
| `id` | `uuid` | PK, default `gen_random_uuid()` | |
| `rfp_job_id` | `uuid` | FK → `rfp_jobs.id`, NOT NULL, UNIQUE | One record per job |
| `mandatory_requirements` | `jsonb` | NOT NULL | Array of `{id, text, category, priority}` |
| `optional_requirements` | `jsonb` | NULLABLE | Array of optional items |
| `budget_ceiling` | `text` | NULLABLE | Raw budget string from document |
| `submission_deadline` | `text` | NULLABLE | Deadline as found in document |
| `project_timeline` | `text` | NULLABLE | Expected delivery duration |
| `evaluation_criteria` | `jsonb` | NULLABLE | Scoring weights e.g. `{technical: 40, price: 30, experience: 30}` |
| `vendor_qualifications` | `jsonb` | NULLABLE | Required certifications, experience levels |
| `compliance_requirements` | `jsonb` | NULLABLE | e.g. HIPAA, ISO 27001, SOC 2 |
| `contact_info` | `jsonb` | NULLABLE | RFP contact person and submission address |
| `raw_summary` | `text` | NULLABLE | Agent's plain-English summary of the RFP |
| `created_at` | `timestamp` | NOT NULL, default `now()` | |

---

### Table 8 — `client_research_data`
**Purpose:** Stores the Client Research Agent (Agent 3) output. The company intelligence profile built from live web search — news, priorities, strategic direction. This is what makes the final proposal feel personally researched.

| Column | Type | Constraints | Notes |
|---|---|---|---|
| `id` | `uuid` | PK, default `gen_random_uuid()` | |
| `rfp_job_id` | `uuid` | FK → `rfp_jobs.id`, NOT NULL, UNIQUE | One record per job |
| `company_name` | `text` | NOT NULL | Client company name |
| `industry` | `text` | NULLABLE | Client's industry |
| `company_summary` | `text` | NULLABLE | Brief description of the company |
| `recent_news` | `jsonb` | NULLABLE | Array of `{headline, date, relevance}` |
| `strategic_priorities` | `jsonb` | NULLABLE | Array of key priorities found in research |
| `key_challenges` | `jsonb` | NULLABLE | Pain points relevant to the RFP context |
| `leadership` | `jsonb` | NULLABLE | Key decision makers if found |
| `funding_stage` | `text` | NULLABLE | e.g. "Series B", "Public", "Government" |
| `competitors` | `jsonb` | NULLABLE | Main competitors — context for differentiation |
| `sources` | `jsonb` | NULLABLE | Array of URLs the agent used for research |
| `research_confidence` | `text` | NULLABLE | `high` / `medium` / `low` — how much data was found |
| `created_at` | `timestamp` | NOT NULL, default `now()` | |

---

### Table 9 — `capability_matches`
**Purpose:** Stores the Requirements Matcher Agent (Agent 4) output. One row per RFP requirement, showing which knowledge base item was matched to it and with what confidence. This is the evidence layer of the proposal.

| Column | Type | Constraints | Notes |
|---|---|---|---|
| `id` | `uuid` | PK, default `gen_random_uuid()` | |
| `rfp_job_id` | `uuid` | FK → `rfp_jobs.id`, NOT NULL | Parent job |
| `requirement_id` | `text` | NOT NULL | Matches `id` from `parsed_rfp_data.mandatory_requirements` |
| `requirement_text` | `text` | NOT NULL | The full requirement text |
| `knowledge_base_item_id` | `uuid` | FK → `knowledge_base_items.id`, NULLABLE | Matched item (null if no match found) |
| `match_summary` | `text` | NULLABLE | How the item satisfies the requirement |
| `confidence_score` | `numeric(3,2)` | NULLABLE | 0.00 to 1.00 — strength of the match |
| `is_gap` | `boolean` | NOT NULL, default `false` | True if no good match was found |
| `gap_suggestion` | `text` | NULLABLE | What content to write to cover the gap |
| `created_at` | `timestamp` | NOT NULL, default `now()` | |

---

### Table 10 — `proposals`
**Purpose:** Stores the full written proposal produced by the Proposal Writer Agent (Agent 5), section by section. Each section is stored individually so the HITL review can flag and regenerate specific sections without rewriting the entire document.

| Column | Type | Constraints | Notes |
|---|---|---|---|
| `id` | `uuid` | PK, default `gen_random_uuid()` | |
| `rfp_job_id` | `uuid` | FK → `rfp_jobs.id`, NOT NULL, UNIQUE | One proposal per job |
| `version` | `integer` | NOT NULL, default `1` | Increments with each HITL revision |
| `executive_summary` | `text` | NULLABLE | Section 1 content |
| `understanding_of_requirements` | `text` | NULLABLE | Section 2 content |
| `proposed_solution` | `text` | NULLABLE | Section 3 content |
| `technical_approach` | `text` | NULLABLE | Section 4 content |
| `case_studies` | `text` | NULLABLE | Section 5 content |
| `team_and_expertise` | `text` | NULLABLE | Section 6 content |
| `project_timeline` | `text` | NULLABLE | Section 7 content |
| `pricing_structure` | `text` | NULLABLE | Section 8 content |
| `quality_review_notes` | `text` | NULLABLE | Quality Review Agent's validation notes |
| `quality_score` | `numeric(3,2)` | NULLABLE | 0.00 to 1.00 — overall quality rating |
| `is_approved` | `boolean` | NOT NULL, default `false` | True after HITL approval |
| `word_count` | `integer` | NULLABLE | Total word count of proposal |
| `created_at` | `timestamp` | NOT NULL, default `now()` | |
| `updated_at` | `timestamp` | NOT NULL, default `now()` | |

---

### Table 11 — `proposal_exports`
**Purpose:** Tracks every PDF export of a proposal. One proposal can be exported multiple times (different versions, re-exports after HITL revisions). Stores the UploadThing URL of the generated PDF and whether the email was delivered.

| Column | Type | Constraints | Notes |
|---|---|---|---|
| `id` | `uuid` | PK, default `gen_random_uuid()` | |
| `proposal_id` | `uuid` | FK → `proposals.id`, NOT NULL | Parent proposal |
| `version` | `integer` | NOT NULL, default `1` | Matches `proposals.version` |
| `pdf_url` | `text` | NOT NULL | UploadThing URL of the generated PDF |
| `file_name` | `text` | NOT NULL | e.g. "Apollo_Hospitals_Proposal_v1.pdf" |
| `file_size_bytes` | `integer` | NULLABLE | |
| `email_sent_to` | `text` | NULLABLE | Email address PDF was delivered to |
| `email_sent_at` | `timestamp` | NULLABLE | When Resend delivered the email |
| `resend_message_id` | `text` | NULLABLE | Resend's message ID for tracking |
| `created_at` | `timestamp` | NOT NULL, default `now()` | |

---

### Table 12 — `hitl_reviews`
**Purpose:** Tracks every Human-in-the-Loop review round. Each time the pipeline pauses for user review, one row is created. Stores which sections the user flagged, their feedback text, and whether they approved or requested changes. Supports multiple rounds of revision.

| Column | Type | Constraints | Notes |
|---|---|---|---|
| `id` | `uuid` | PK, default `gen_random_uuid()` | |
| `proposal_id` | `uuid` | FK → `proposals.id`, NOT NULL | Parent proposal |
| `round` | `integer` | NOT NULL, default `1` | Review round number (increments per revision) |
| `status` | `text` | NOT NULL, default `'pending'` | `pending` / `approved` / `changes_requested` |
| `flagged_sections` | `text[]` | NULLABLE | e.g. `['project_timeline', 'pricing_structure']` |
| `feedback_text` | `text` | NULLABLE | User's written feedback / change requests |
| `reviewed_at` | `timestamp` | NULLABLE | When user submitted their review decision |
| `created_at` | `timestamp` | NOT NULL, default `now()` | When pipeline paused for this review |

---

### Clerk ↔ Users Sync — How It Works

The `users` table is the only table that Clerk directly controls via webhooks. Every other table is created by your application logic after the user exists.

**Sync flow:**

```
Clerk Event → /api/webhooks/clerk → Verify Svix signature → Upsert users table

user.created  → INSERT into users (clerk_user_id, email, full_name, avatar_url)
user.updated  → UPDATE users SET email, full_name, avatar_url WHERE clerk_user_id = ?
user.deleted  → DELETE or soft-delete WHERE clerk_user_id = ?
```

**In every authenticated API route**, you get the Clerk user ID from the session and look up your internal `users.id`:

```ts
// Pattern used in every protected API route
const { userId: clerkUserId } = auth()
const user = await db.query.users.findFirst({
  where: eq(users.clerkUserId, clerkUserId)
})
// Use user.id (UUID) for all FK relationships — never store clerkUserId in child tables
```

**Important:** All foreign keys across all 12 tables reference `users.id` (the internal UUID), never `clerk_user_id` directly. Clerk's ID is only used for the initial lookup in the `users` table.

---

### Drizzle Schema File Structure (Recommended)

```
src/
  db/
    schema/
      users.ts           → users table
      company.ts         → company_profiles + knowledge_base_items
      jobs.ts            → rfp_jobs + rfp_documents + agent_runs
      agent-outputs.ts   → parsed_rfp_data + client_research_data + capability_matches
      proposals.ts       → proposals + proposal_exports + hitl_reviews
    index.ts             → exports all schemas, creates db instance
    migrations/          → Drizzle generated migration files
```

---

## 17. Agent Memory Architecture — InMemoryMemoryService + Neon

### The Two-Layer Memory Model

Nivedan AI uses **two complementary memory layers** that serve completely different purposes. They do not replace each other — both must be present.

| Layer | Service | What It Stores | Persists? |
|---|---|---|---|
| **ADK Event Memory** | `InMemoryMemoryService` | Agent reasoning traces, tool call history, turn-by-turn events within a pipeline run | No — RAM only, lost on restart |
| **Business Data** | Neon PostgreSQL (Drizzle) | Structured outputs, job state, proposals, user data | Yes — always persistent |

**Rule:** Neon stores what the agents *produced*. `InMemoryMemoryService` stores how the agents *reasoned* to produce it.

---

### Why InMemoryMemoryService Is Needed Alongside Neon

Without `InMemoryMemoryService`, each agent reads only the structured JSON outputs written to Neon by the previous agent. The agents still work — but they are reading a summary, not the full reasoning context.

With `InMemoryMemoryService`, each agent can call `search_memory` to query what earlier agents actually reasoned about — not just the final JSON they produced. For example:

- Agent 5 (Proposal Writer) can `search_memory("Apollo Hospitals strategic priorities")` and retrieve the full reasoning trace from Agent 3's research turn — including nuance, caveats, and context that didn't make it into the clean JSON output
- Agent 6 (Quality Review) can `search_memory("timeline conflict")` to find if the Orchestrator flagged any deadline mismatches earlier in the pipeline
- The Orchestrator can review what any agent reasoned about at any point without re-querying Neon

This is the difference between agents that **read summaries** and agents that **share a working memory**.

---

### The Three ADK Services — All Required

Every ADK `Runner` must be configured with three services. For Nivedan AI Phase 1:

```
Runner
  ├── session_service  → InMemorySessionService   (ADK session state, per pipeline run)
  ├── memory_service   → InMemoryMemoryService    (ADK event history, searchable by agents)
  └── [your Neon DB]   → Drizzle queries          (business data, always persistent)
```

**`InMemorySessionService`** — Manages the active session state object that flows between agents during a single pipeline run. This is the short-term working state — which agent is running, what has completed, any mid-run flags. It is separate from `InMemoryMemoryService`.

**`InMemoryMemoryService`** — Stores the full event history of each completed session turn. Agents can call `search_memory` to retrieve relevant context from earlier in the pipeline. After the pipeline completes, `add_session_to_memory` is called to ingest the entire session into the memory store for potential cross-job retrieval.

**Neon (Drizzle)** — Your 12 business tables. Completely independent of ADK's service layer. Always persistent. Stores structured outputs, never raw agent reasoning.

---

### What Each Agent Does With Memory

| Agent | Writes to InMemoryMemoryService | Reads from InMemoryMemoryService | Writes to Neon |
|---|---|---|---|
| **1 · Orchestrator** | Session creation event, routing decisions | — | `rfp_jobs` status, `agent_runs` row |
| **2 · RFP Parser** | Full parsing reasoning trace | — | `parsed_rfp_data`, `rfp_documents.page_count` |
| **3 · Client Research** | Research synthesis, confidence reasoning, source evaluation | — | `client_research_data` |
| **3b · Search Agent** | Raw search results per query (sub-agent of Agent 3) | — | Nothing — results passed back to Agent 3 only |
| **4 · Requirements Matcher** | Matching reasoning per requirement, gap analysis thinking | Parser + Research events via `search_memory` | `capability_matches` rows |
| **5 · Proposal Writer** | Draft generation reasoning per section | Research + Matcher events via `search_memory` | `proposals` all sections |
| **6 · Quality Review** | Validation checks, conflicts found, corrections made | Full pipeline event history via `search_memory` | `proposals.quality_score`, `proposal_exports` |

---

### `search_memory` — How Agents Use It

`search_memory` is an ADK built-in tool that agents call to query the `InMemoryMemoryService`. It takes a plain-language query string and returns relevant event snippets from the session history.

**How it is used in Nivedan AI:**

Agent 4 (Requirements Matcher) when processing a HIPAA compliance requirement:
```
search_memory("HIPAA compliance client requirements")
→ Returns Agent 2's reasoning about why this was flagged as mandatory
→ Returns Agent 3's finding that the client recently had a compliance audit
→ Matcher now has full context, not just the JSON flag
```

Agent 5 (Proposal Writer) when writing the Executive Summary:
```
search_memory("Apollo Hospitals digital health priorities")
→ Returns Agent 3's full research reasoning including confidence level
→ Returns any caveats the research agent noted about source reliability
→ Writer produces a more nuanced, accurate opening paragraph
```

Agent 6 (Quality Review) when validating the timeline:
```
search_memory("project timeline deadline")
→ Returns Agent 2's extraction: "6 months mandatory"
→ Returns Agent 5's draft reasoning: "proposed 8-month phased approach"
→ Reviewer catches the conflict before it reaches the user
```

---

### `add_session_to_memory` — Pipeline Completion Hook

After the full pipeline completes successfully, the Orchestrator calls `add_session_to_memory` on the completed session. This ingests the entire pipeline run into the memory store.

**What this enables in Phase 1:**
- If the same user runs a second proposal job in the same server session, Agent 4 can `search_memory` across the previous pipeline run and find that the same client was researched before
- The Orchestrator can detect repeat client patterns and skip redundant research steps

**What this enables in Phase 3 (with custom Neon-backed `BaseMemoryService`):**
- Memory persists across server restarts and Vercel deployments
- Agent 4's `search_memory` searches across **all past pipeline runs** for this user
- Knowledge compounds — every proposal makes future proposals smarter
- This is when `InMemoryMemoryService` is replaced with a custom `NeonMemoryService` extending `BaseMemoryService`

---

### Phase Upgrade Path

```
PHASE 1 — Current
  InMemorySessionService    → ADK session state (RAM)
  InMemoryMemoryService     → ADK event memory (RAM)
  Neon 12 tables            → Business data (persistent)

  Limitation: ADK memory lost on every Vercel function cold start.
  Acceptable because: Inngest manages job-level retries. Neon preserves
  all structured outputs. InMemoryMemoryService only enhances within-run
  reasoning quality — it doesn't break the pipeline if wiped.

PHASE 3 — Custom Neon-backed services
  NeonSessionService        → extends BaseSessionService → adk_sessions table
  NeonMemoryService         → extends BaseMemoryService  → adk_memories table (+ pgvector)
  Neon 12 tables            → Business data (unchanged, no migration needed)

  Gain: Full ADK event history persists across restarts and deployments.
  search_memory works across all past runs for a user, not just current session.
  Neon pgvector enables semantic similarity search on agent reasoning history.
```

**Two new tables added in Phase 3** (not needed now):

| Table | Purpose |
|---|---|
| `adk_sessions` | Stores ADK session state objects backed by Neon |
| `adk_memories` | Stores ingested memory entries with pgvector embeddings for semantic search |

These tables are **ADK infrastructure tables**, separate from the 12 business tables. They are never queried by your application UI — only by the ADK session and memory services.

---

### File Location in Project

```
src/
  lib/
    adk/
      runner.ts          → Creates Runner with all three services configured
      session.ts         → InMemorySessionService setup
      memory.ts          → InMemoryMemoryService setup + add_session_to_memory hook
      
  agents/
    orchestrator.ts      → Uses runner from lib/adk/runner.ts
    rfp-parser.ts        → Same runner instance
    client-research.ts   → Same runner instance (uses search_memory tool)
    requirements-matcher.ts → Same runner instance (uses search_memory tool)
    proposal-writer.ts   → Same runner instance (uses search_memory tool)
    quality-review.ts    → Same runner instance (uses search_memory tool)
```

**Critical:** All six agents must share the **same Runner instance** (or at minimum the same `InMemoryMemoryService` instance) within a single pipeline run. If each agent creates its own Runner, they each get a separate isolated memory store and `search_memory` returns nothing across agents.

---

### Summary — What Changes With InMemoryMemoryService Added

| Behaviour | Neon Only | Neon + InMemoryMemoryService |
|---|---|---|
| Structured outputs saved | Yes | Yes |
| Job status tracking | Yes | Yes |
| Agent reads previous agent's JSON | Yes | Yes |
| Agent reads previous agent's reasoning | No | Yes (via `search_memory`) |
| ADK event loop works as designed | No | Yes |
| `search_memory` tool available | No | Yes |
| Timeline conflict detection by Agent 6 | Partial | Full |
| Proposal Writer has nuanced research context | No | Yes |
| Cross-run memory (same session) | No | Yes (RAM only) |
| Cross-run memory (across restarts) | No | Phase 3 only |

---

## 18. Agent Build Plan — Implementation Order & Workflow

### Why This Order Matters

You already have the landing page and dashboard built. The next layer is the backend agent pipeline. The correct build order is **Inngest first, then agents 1 through 6 in sequence, then HITL last**. Each layer depends on the one before it. Building agents before Inngest means you have no durable execution container to run them in. Building HITL before agents means you have nothing to pause and resume.

```
Landing Page ✅ → Dashboard ✅ → Inngest Setup → Agent 1 → Agent 2 → Agent 3
→ Agent 4 → Agent 5 → Agent 6 → HITL Gate → PDF Export → Email Delivery
```

---

### Stage 0 — Inngest Foundation (Build This First)

**What it is:**
Inngest makes workflows unbreakable — workflows, agents, endpoints, background jobs — however it's written, wherever it runs. Wrap functions in Steps to automate retries, recovery, and flow without added infrastructure.

**Why Inngest before agents:**
Your six-agent pipeline runs for 15–20 minutes. A Next.js API route on Vercel times out in 10 seconds by default. Without Inngest, your pipeline dies mid-run every single time. Inngest makes each agent step a separate durable checkpoint — if one fails, it retries from that exact step, not from the beginning.

**What to set up in Stage 0:**

**0.1 — Inngest Client**
Create the Inngest client instance with your app name and event key. This is the single shared client that the entire application uses to send events and register functions. Lives at `src/lib/inngest/client.ts`.

**0.2 — Inngest Serve Route**
Use `step.ai.wrap()` to make LLM calls durable and retryable, or `step.waitForEvent()` to pause a workflow until a human approves an action. The serve route at `app/api/inngest/route.ts` registers all your Inngest functions with the Inngest platform. Every function you create must be listed here. This is the webhook endpoint Inngest calls to execute your steps.

**0.3 — Event Type Definitions**
Define all typed events your pipeline uses before writing any function:
- `nivedan/rfp.submitted` — triggers the full pipeline (carries jobId, userId, rfpDocumentUrl, companyProfileId)
- `nivedan/agent.completed` — fired after each agent finishes (carries jobId, agentNumber, status)
- `nivedan/hitl.approved` — user approves the draft (carries jobId, proposalId)
- `nivedan/hitl.changes.requested` — user requests revisions (carries jobId, proposalId, flaggedSections, feedbackText)
- `nivedan/hitl.timeout` — user did not respond within the time window

**0.4 — Main Pipeline Function Shell**
Create the `generateProposal` Inngest function that listens for `nivedan/rfp.submitted`. At this stage it is just the function shell with all six `step.run` placeholders and the `step.waitForEvent` placeholder. No agent logic yet. This gives you the full pipeline skeleton to fill in agent by agent.

**0.5 — Neon DB Status Helpers**
Write the helper functions that update `rfp_jobs.status` and `agent_runs` rows inside each step. These are simple Drizzle queries — not agent logic — but every step needs them so the dashboard can show live progress. Build these before agents so they are ready to plug in.

**0.6 — ADK Runner Setup**
Create `src/lib/adk/runner.ts` — the shared Runner instance configured with `InMemorySessionService` and `InMemoryMemoryService`. All six agents import from this single file. If each agent creates its own Runner, memory is isolated and `search_memory` returns nothing across agents.

`InMemorySessionService` role: manages the live session state object that flows between agents during a single pipeline run. It holds the short-term working state — current job context, which agents have completed, mid-run flags — without re-querying Neon on every turn. Think of it as the agents' shared whiteboard for the duration of one pipeline run. `InMemoryMemoryService` sits alongside it for the event and reasoning history layer. Both services are instantiated once in `runner.ts` and shared across all six agents via the same Runner instance.

**Test for Stage 0:**
Send a test `nivedan/rfp.submitted` event from the Inngest Dev Server UI. Confirm the shell function runs, all six `step.run` placeholders execute sequentially, and `rfp_jobs.status` updates in Neon correctly at each step. Only move to agents when this test passes cleanly.

---

### Stage 1 — Agent 1: Orchestrator

**Inngest step name:** `step-1-orchestrator`

**What it does:**
Initialises the ADK session via the shared Runner. Creates the session state object containing: `jobId`, `userId`, `rfpDocumentUrl`, `companyProfileId`. Writes the `agent_runs` row for Agent 1 with status `running`. Validates the input — confirms the RFP document URL is accessible and the company profile exists in Neon. If either is missing, marks the job as `failed` and stops the pipeline early rather than wasting 5 agents on bad input.

**What it writes to Neon:**
- `rfp_jobs.status` → `running`
- `rfp_jobs.current_agent` → `1`
- `agent_runs` row for Agent 1 → `completed`
- `rfp_jobs.inngest_run_id` → stored for dashboard linking

**What it writes to InMemoryMemoryService:**
Session creation event — the initial pipeline context including all input parameters. Available to all downstream agents via `search_memory`.

**`InMemorySessionService` role in this step:**
Agent 1 is where the ADK session is **created**. The Orchestrator calls the Runner to create a new session with a unique `sessionId` (mapped to the `jobId`). This session object — held by `InMemorySessionService` — is the live state container that all subsequent agents will read from and write to during this pipeline run. Without this creation step, no other agent has a session to attach to.

**Test before moving on:**

---

### Stage 2 — Agent 2: RFP Parser

**Inngest step name:** `step-2-rfp-parser`

**What it does:**
Fetches the RFP PDF from the UploadThing URL stored in `rfp_documents`. Uses `pdf-parse` to extract raw text from the PDF. Passes the full text to the RFP Parser Agent (Gemini 3.1 Flash-Lite) with a structured extraction prompt. The agent identifies and classifies every requirement, extracts budget ceiling, submission deadline, project timeline, evaluation criteria, vendor qualifications, and compliance requirements. Returns a clean structured JSON object — the RFP Blueprint.

**What it writes to Neon:**
- `parsed_rfp_data` — full structured JSON output
- `rfp_jobs.client_name` — extracted client company name
- `rfp_jobs.budget_ceiling` — extracted budget
- `rfp_jobs.deadline` — extracted submission deadline
- `rfp_documents.page_count` — populated after parsing
- `agent_runs` row for Agent 2 → `completed` with token counts and duration

**What it writes to InMemoryMemoryService:**
Full parsing reasoning trace — including how the agent classified each requirement and why certain items were flagged as mandatory vs optional. Agent 4 and Agent 6 will `search_memory` this.

**`InMemorySessionService` role in this step:**
Agent 2 reads the session state created by Agent 1 to get the `rfpDocumentUrl` and `companyProfileId` without querying Neon again. After parsing completes, Agent 2 writes key extracted values back into the session state — `clientName`, `budgetCeiling`, `deadline` — so Agent 3 can read them directly from session state in the next step. This is faster than a Neon round-trip and keeps the session state as the single source of truth for in-flight pipeline data.

**Retry strategy:**
If the PDF fetch fails (UploadThing CDN hiccup), Inngest retries this step automatically up to 3 times before marking it failed. The Orchestrator in Agent 1 already confirmed the URL was accessible, so retries here handle transient network failures only.

**Test before moving on:**
Upload a real RFP PDF. Confirm `parsed_rfp_data` in Neon contains correct structured JSON. Verify mandatory requirements are correctly flagged. Then move to Agent 3.

---

### Stage 3 — Agent 3: Client Research

**Inngest step name:** `step-3-client-research`

**Two-agent structure — important:**
Agent 3 is actually two ADK agents working together. The **Client Research Agent** (Gemini 3.1 Flash) is the primary agent. It delegates all web search work to a dedicated **Search Agent** (also Gemini 3.1 Flash) that has Google Search as its only tool. The Client Research Agent does not search the web directly — it sends search queries to the Search Agent and receives back factual, real-time results. This is the sub-agent pattern shown in the workflow diagram.

**Why a separate Search Agent instead of direct grounding:**
A dedicated Search Agent gives the Client Research Agent a clean interface — it sends a natural language query, gets structured results back, and focuses entirely on synthesising the findings into a Client Profile. The Search Agent handles the low-level search mechanics: query construction, result parsing, source validation, and returning factual real-time information. This also means the Search Agent can be reused by other agents in future phases if needed (e.g., Agent 4 searching for industry benchmarks).

**What it does:**
Reads `rfp_jobs.client_name` from Neon (set by Agent 2). The Client Research Agent formulates research queries and sends them to the Search Agent. The Search Agent executes Google Search and returns structured results. The Client Research Agent synthesises findings across multiple searches into a complete Client Profile JSON — covering recent news, funding rounds, strategic priorities, leadership changes, expansion plans, industry position, and competitive context. Assigns a research confidence level (`high` / `medium` / `low`) based on how much usable data was found. Also records the source URLs the Search Agent returned.

**`InMemorySessionService` role in this step:**
The shared `InMemorySessionService` carries the active session state from Agent 2 into Agent 3. Agent 3 reads from the session state to know the client name and the full RFP context — it does not re-query Neon for these. The session state is updated after Agent 3 completes to signal readiness for Agent 4.

**What it writes to Neon:**
- `client_research_data` — full Client Profile JSON including recent news array, strategic priorities, key challenges, sources, confidence level
- `agent_runs` row for Agent 3 → `completed`

**What it writes to InMemoryMemoryService:**
Full research reasoning trace — what the Client Research Agent concluded from Search Agent results, which sources it trusted most, and any caveats about data reliability. The Proposal Writer (Agent 5) will `search_memory("client strategic priorities")` to get richer context than the structured JSON alone provides.

**Graceful degradation:**
If the Search Agent returns no results (private company, very new company, or search temporarily unavailable), the Client Research Agent still completes — it sets `research_confidence` to `low` and builds a minimal Client Profile using only what was in the RFP document itself. The pipeline continues. A low-confidence research result still produces a better proposal than crashing the pipeline.

**Test before moving on:**
Use Apollo Hospitals as the test client. Confirm the Search Agent returns real recent news items. Confirm the Client Research Agent synthesises them into a meaningful Client Profile. Confirm `research_confidence` is `high` for a well-known company. Then move to Agent 4.

---

### Stage 4 — Agent 4: Requirements Matcher

**Inngest step name:** `step-4-requirements-matcher`

**What it does:**
Reads `parsed_rfp_data.mandatory_requirements` from Neon (Agent 2's output). For each requirement, queries `knowledge_base_items` via Drizzle filtered by `company_profile_id`. Also calls `search_memory("requirement text")` to retrieve the full parsing reasoning for that requirement from Agent 2's trace. Passes each requirement + available knowledge base items to the Requirements Matcher Agent (Gemini 3.1 Flash-Lite). The agent scores each knowledge base item against each requirement and assigns a confidence score (0.00 to 1.00). Items below 0.5 are flagged as gaps with a suggestion for what content to write instead.

**What it writes to Neon:**
- `capability_matches` — one row per requirement, with `knowledge_base_item_id`, `match_summary`, `confidence_score`, `is_gap`, and `gap_suggestion`
- `agent_runs` row for Agent 4 → `completed`

**What it writes to InMemoryMemoryService:**
Matching reasoning per requirement — why each item was or wasn't a strong match. Agent 5 searches this to understand which proof points to emphasise.

**`InMemorySessionService` role in this step:**
Agent 4 reads the session state to confirm the `companyProfileId` for the Drizzle `knowledge_base_items` query, and reads the `clientName` and `clientIndustry` to narrow the knowledge base search to relevant tags. After matching completes, Agent 4 writes a `capabilityMatchSummary` flag into session state — a simple count of matched vs gap requirements — so Agent 5 knows upfront how many proof points are available vs how many sections need to be written from general expertise only.

**Test before moving on:**

---

### Stage 5 — Agent 5: Proposal Writer

**Inngest step name:** `step-5-proposal-writer`

**What it does:**
This is the most compute-intensive step. Reads from Neon: `parsed_rfp_data` (requirements), `client_research_data` (client context), and `capability_matches` (proof points). Also calls `search_memory` twice:
- `search_memory("client strategic priorities")` → gets Agent 3's full research reasoning
- `search_memory("capability match reasoning")` → gets Agent 4's matching logic

Passes all of this to the Proposal Writer Agent (Gemini 3.1 Pro — highest capability model). The agent writes each proposal section individually in sequence: Executive Summary → Understanding of Requirements → Proposed Solution → Technical Approach → Case Studies → Team & Expertise → Project Timeline → Pricing Structure. Each section is written with the specific client context woven in. Gemini 3.1 Pro is used here because long-form coherent writing across 8 sections with deep context retention is beyond Flash-Lite's capability.

**What it writes to Neon:**
- `proposals` — all 8 section fields populated, `version` = 1, `is_approved` = false
- `proposals.word_count` — calculated total
- `agent_runs` row for Agent 5 → `completed` with token counts (will be high — Pro model writing ~3000–5000 words)

**What it writes to InMemoryMemoryService:**
Draft generation reasoning per section — why each section was framed the way it was. Agent 6 searches this during validation.

**`InMemorySessionService` role in this step:**
Agent 5 reads the session state to get the `capabilityMatchSummary` written by Agent 4 — this tells the Proposal Writer upfront which sections have strong proof points and which are gap areas that need to be written with general expertise framing rather than client-specific evidence. After all 8 sections are written, Agent 5 writes a `proposalDraftId` into session state (the `proposals.id` from Neon) so Agent 6 can fetch the exact proposal record without ambiguity.

**Important note on timeout:**
Agent 5 is the slowest step. Gemini 3.1 Pro writing 8 full sections takes 60–120 seconds. Inngest handles this fine — each `step.run` has no timeout limit enforced by Inngest itself. Vercel function timeout does not apply because Inngest manages execution, not your API route.

**Test before moving on:**
Run the full pipeline up to Agent 5. Read the generated proposal in Neon. Verify all 8 sections are populated and the client name and research context appears naturally in the text. Then move to Agent 6.

---

### Stage 6 — Agent 6: Quality Review

**Inngest step name:** `step-6-quality-review`

**What it does:**
Reads the full proposal from Neon (`proposals` all sections). Reads `parsed_rfp_data.mandatory_requirements` to get the full requirement list. Calls `search_memory("timeline deadline")` and `search_memory("budget ceiling")` to cross-check against Agent 2's extracted constraints. Passes everything to the Quality Review Agent (Gemini 3.1 Flash-Lite). The agent checks:
- Every mandatory requirement is addressed somewhere in the proposal
- The proposed timeline does not exceed the RFP deadline
- The proposed budget does not exceed the RFP ceiling
- No section contradicts another section
- No generic filler language — every section is client-specific

Conflicts found are corrected in place. A `quality_score` (0.00 to 1.00) is calculated. Quality notes are written to `proposals.quality_review_notes`.

**What it writes to Neon:**
- `proposals.quality_review_notes` — what was checked and corrected
- `proposals.quality_score` — overall rating
- `rfp_jobs.status` → `awaiting_review` (pipeline pauses here for HITL)
- `rfp_jobs.current_agent` → `6`
- `agent_runs` row for Agent 6 → `completed`

**`InMemorySessionService` role in this step:**
Agent 6 reads `proposalDraftId` from session state (written by Agent 5) to fetch the correct proposal from Neon. After validation and corrections are applied, Agent 6 writes a `qualityApproved` flag and `qualityScore` into session state. The Inngest `step.waitForEvent` HITL gate that follows reads `qualityScore` from session state to optionally surface it in the dashboard — no extra Neon query needed at the pause point.

**After Agent 6 completes — the pipeline does NOT export the PDF yet.** It pauses and waits for human review.

---

### Stage 7 — HITL Gate (Human-in-the-Loop)

**This is the pause point. Nothing irreversible happens before this.**

**How `step.waitForEvent` powers the HITL:**

Use `step.waitForEvent()` to pause your function's execution until a matching event is received or a timeout is reached. This is useful for building human-in-the-loop workflows, waiting for approvals, or coordinating between separate functions.

After Agent 6 completes, the Inngest function calls `step.waitForEvent` listening for either `nivedan/hitl.approved` or `nivedan/hitl.changes.requested`, matched on `data.jobId`. The pipeline is now completely paused — no compute running, no cost accumulating. Inngest stores the paused state durably. The pipeline can wait here for hours or days without any issue.

**What the user sees in the dashboard:**
- Job status changes to `awaiting_review`
- The full draft proposal renders in the dashboard — all 8 sections readable
- Quality score and review notes from Agent 6 are displayed
- Two buttons: **"Approve & Export PDF"** and **"Request Changes"**
- If requesting changes: a text field for feedback and section checkboxes to flag specific sections

**Path A — User Approves:**
User clicks "Approve & Export PDF." Your dashboard API route sends `nivedan/hitl.approved` to Inngest. `step.waitForEvent` resolves. The pipeline resumes immediately and moves to the PDF Export step.

**Path B — User Requests Changes:**
User flags sections and writes feedback. Your dashboard API route sends `nivedan/hitl.changes.requested` with `flaggedSections` array and `feedbackText`. A new `hitl_reviews` row is written to Neon. The pipeline resumes, re-runs Agent 5 for the flagged sections only (not the full proposal), re-runs Agent 6 for re-validation, then pauses again at the HITL gate for round 2 review. `proposals.version` increments to 2.

**Path C — Timeout (User Did Not Respond):**
`step.waitForEvent()` returns null if the event is not received within the timeout. Set a 7-day timeout. If null is returned, mark the job as `expired`, send a Resend notification email to the user reminding them the draft is waiting. The draft is preserved in Neon — the user can still approve it from the dashboard manually.

**What is written to Neon during HITL:**
- `hitl_reviews` row for each review round — `round`, `status`, `flagged_sections`, `feedback_text`, `reviewed_at`
- `rfp_jobs.status` → `awaiting_review` (waiting) → `running` (changes being made) → `awaiting_review` (second round) → `completed` (approved)

---

### Stage 8 — PDF Export & Delivery

**Inngest step name:** `step-8-pdf-export`

**This step only runs after HITL approval.**

**What it does:**
Reads the approved proposal sections from Neon. Reads the user's `company_profiles` for branding (logo URL, brand colors, company name). Generates a professionally formatted PDF using the PDF generation library. The PDF includes:
- Branded cover page (company logo, client name, proposal title, submission date)
- Table of contents
- All 8 proposal sections with proper headings and formatting
- Page numbers
- Company footer on every page

Uploads the generated PDF to UploadThing (not stored in your server memory — uploaded to CDN immediately). Saves the UploadThing URL to `proposal_exports`. Sends the PDF download link via Resend email to the user's email address. Updates `rfp_jobs.status` to `completed`.

**What it writes to Neon:**
- `proposal_exports` row — `pdf_url`, `file_name`, `file_size_bytes`
- `proposal_exports.email_sent_to` and `email_sent_at` — after Resend confirms delivery
- `proposal_exports.resend_message_id` — for delivery tracking
- `rfp_jobs.status` → `completed`
- `rfp_jobs.completed_at` → timestamp

**What the user sees:**
Dashboard job status → `completed`. PDF download button appears. Email arrives with the PDF attached or linked. The proposal is also saved permanently in their job history.

---

### Complete Event Flow Summary

```
User clicks "Generate Proposal"
  │
  ▼
Dashboard API route → inngest.send("nivedan/rfp.submitted", { jobId, userId, ... })
  │
  ▼
Inngest receives event → starts generateProposal function
  │
  ├── step.run("step-1-orchestrator")      → ADK session init, input validation
  ├── step.run("step-2-rfp-parser")        → PDF parsed, requirements extracted
  ├── step.run("step-3-client-research")   → Client intelligence gathered
  ├── step.run("step-4-requirements-matcher") → Capability map built
  ├── step.run("step-5-proposal-writer")   → Full draft written (slowest step)
  ├── step.run("step-6-quality-review")    → Validated, status → awaiting_review
  │
  ├── step.waitForEvent("wait-for-hitl", {
  │     event: "nivedan/hitl.approved" OR "nivedan/hitl.changes.requested",
  │     timeout: "7d",
  │     match: "data.jobId"
  │   })
  │     │
  │     ├── Path A: Approved → continue to step-8-pdf-export
  │     ├── Path B: Changes → re-run step-5 (flagged sections) + step-6 → waitForEvent again
  │     └── Path C: Timeout → mark expired, send reminder email → end
  │
  └── step.run("step-8-pdf-export")        → PDF generated, uploaded, emailed
```

---

### Inngest Primitives Used — Reference Table

| Primitive | Used Where | Purpose |
|---|---|---|
| `inngest.createFunction` | Main pipeline | Wraps the entire 6-agent pipeline as one durable function |
| `inngest.send` | Dashboard API route | Triggers the pipeline when user submits RFP |
| `step.run` | Each agent (steps 1–6, 8) | Makes each agent call durable, retryable, and independently logged |
| `step.waitForEvent` | After Agent 6 | Pauses pipeline for HITL — waits for approve or changes event |
| `step.waitForEvent` timeout | After Agent 6 | Returns null after 7 days if user doesn't respond |

---

### File Structure for the Agent Pipeline

```
src/
  inngest/
    client.ts                  → Inngest client (STAGE 0.1)
    functions/
      generate-proposal.ts     → Main pipeline function (STAGE 0.4)
    events.ts                  → All typed event definitions (STAGE 0.3)

  lib/
    adk/
      runner.ts                → Shared ADK Runner with both memory services (STAGE 0.6)
      session.ts               → InMemorySessionService config
      memory.ts                → InMemoryMemoryService config + add_session_to_memory

  agents/
    orchestrator.ts            → Agent 1 logic (STAGE 1)
    rfp-parser.ts              → Agent 2 logic (STAGE 2)
    client-research.ts         → Agent 3 logic (STAGE 3) — delegates to search-agent
    search-agent.ts            → Sub-agent used exclusively by Agent 3 (Google Search tool)
    requirements-matcher.ts    → Agent 4 logic (STAGE 4)
    proposal-writer.ts         → Agent 5 logic (STAGE 5)
    quality-review.ts          → Agent 6 logic (STAGE 6)

  db/
    helpers/
      job-status.ts            → Neon update helpers used by every step (STAGE 0.5)

  app/
    api/
      inngest/
        route.ts               → Inngest serve route — registers all functions (STAGE 0.2)
      proposals/
        [jobId]/
          approve/route.ts     → Sends nivedan/hitl.approved event (STAGE 7)
          changes/route.ts     → Sends nivedan/hitl.changes.requested event (STAGE 7)
```

---

### Build Checklist — In Order

```
Stage 0 — Inngest Foundation
  [ ] 0.1 — Inngest client at src/inngest/client.ts
  [ ] 0.2 — Serve route at app/api/inngest/route.ts
  [ ] 0.3 — All typed events defined in src/inngest/events.ts
  [ ] 0.4 — Pipeline function shell with 6 step.run placeholders
  [ ] 0.5 — Neon DB status helper functions
  [ ] 0.6 — ADK Runner with InMemorySessionService + InMemoryMemoryService
  [ ] TEST — Shell pipeline fires and all steps execute in sequence

Stage 1 — Agent 1: Orchestrator
  [ ] ADK session creation and input validation
  [ ] Neon writes: rfp_jobs.status, agent_runs row
  [ ] TEST — Job initialises correctly in Neon

Stage 2 — Agent 2: RFP Parser
  [ ] PDF fetch from UploadThing URL
  [ ] Gemini Flash-Lite structured extraction
  [ ] Neon writes: parsed_rfp_data, rfp_jobs fields
  [ ] TEST — Real RFP PDF produces correct JSON

Stage 3 — Agent 3: Client Research
  [ ] Google Search grounding via Gemini Flash
  [ ] Neon writes: client_research_data
  [ ] TEST — Apollo Hospitals returns real recent news

Stage 4 — Agent 4: Requirements Matcher
  [ ] Drizzle query on knowledge_base_items
  [ ] search_memory for Agent 2 reasoning context
  [ ] Neon writes: capability_matches rows with confidence scores
  [ ] TEST — Each requirement maps to a KB item or is flagged as gap

Stage 5 — Agent 5: Proposal Writer
  [ ] Read from Neon: parsed_rfp_data, client_research_data, capability_matches
  [ ] search_memory for Agent 3 and Agent 4 context
  [ ] Gemini Pro writing all 8 sections
  [ ] Neon writes: proposals all section fields
  [ ] TEST — Full proposal reads naturally with client context woven in

Stage 6 — Agent 6: Quality Review
  [ ] Cross-check all requirements addressed
  [ ] search_memory for timeline and budget constraints
  [ ] Corrections applied to proposal in Neon
  [ ] rfp_jobs.status → awaiting_review
  [ ] TEST — Timeline conflict is caught and corrected

Stage 7 — HITL Gate
  [ ] step.waitForEvent for approve/changes events matched on jobId
  [ ] Dashboard approve button → API route → inngest.send approved event
  [ ] Dashboard changes form → API route → inngest.send changes event
  [ ] hitl_reviews row written to Neon
  [ ] Re-run flagged sections path works
  [ ] 7-day timeout → expired status + reminder email
  [ ] TEST — Full approve flow works. Full changes + re-review flow works.

Stage 8 — PDF Export
  [ ] PDF generation with company branding
  [ ] UploadThing upload of generated PDF
  [ ] proposal_exports row written to Neon
  [ ] Resend email with PDF link
  [ ] rfp_jobs.status → completed
  [ ] TEST — Final PDF is professional, branded, downloadable
```

---

### Total Build Estimate — Stages Only (No UI)

| Stage | Complexity | Estimated Sessions |
|---|---|---|
| Stage 0 — Inngest Foundation | Medium | 1 focused session |
| Stage 1 — Agent 1 Orchestrator | Low | Half session |
| Stage 2 — Agent 2 RFP Parser | Medium | 1 session |
| Stage 3 — Agent 3 Client Research | Medium | 1 session |
| Stage 4 — Agent 4 Requirements Matcher | Medium-High | 1–2 sessions |
| Stage 5 — Agent 5 Proposal Writer | High | 1–2 sessions |
| Stage 6 — Agent 6 Quality Review | Medium | 1 session |
| Stage 7 — HITL Gate | Medium | 1 session |
| Stage 8 — PDF Export & Email | Medium | 1 session |

**Total: approximately 8–10 focused coding sessions to a working end-to-end pipeline.**

---

*Documentation prepared for Claude Code project planning and implementation reference.*  
*Nivedan AI · Narendra Kumar · nk-analytics · 2026*
