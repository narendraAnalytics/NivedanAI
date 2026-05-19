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

## 13. Project Vision

> *"Nivedan AI exists to give every agency, every freelancer, and every sales team the same proposal quality that was previously only possible with a dedicated team of senior writers, researchers, and designers.*
>
> *A solo developer in Palakollu should be able to submit a proposal that competes with one prepared by a 10-person agency in Mumbai. Nivedan AI makes that the new normal."*

---

## 14. What Makes This Different From Generic AI Tools

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

*Documentation prepared for Claude Code project planning and implementation reference.*  
*Nivedan AI · Narendra Kumar · nk-analytics · 2026*