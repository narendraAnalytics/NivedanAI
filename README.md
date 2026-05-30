![Nivedan AI](https://res.cloudinary.com/dkqbzwicr/image/upload/q_auto/f_auto/v1780073397/bannerimage_ocjq9t.png)

# Nivedan AI

**Autonomous multi-agent SaaS that transforms RFP PDFs into submission-ready proposals in 15–20 minutes.**

🔗 [Live Demo](https://nivedan-ai.vercel.app/)

---

## What Is Nivedan AI?

Nivedan AI is a fully autonomous proposal generation platform. Upload an RFP PDF and a 6-agent AI pipeline takes over — parsing the document, researching the client company live on the web, matching your capabilities against every requirement, writing a 12-section branded proposal, and delivering the final PDF to your inbox. No manual drafting. No copy-pasting.

---

## The Problem

Responding to an RFP is one of the most time-consuming tasks a services team faces. A single proposal typically requires:

- **Reading a 20–50 page document** to extract every mandatory requirement, evaluation criterion, and deadline
- **Researching the client company** — strategy, recent news, technology choices, pain points
- **Matching your capabilities** to each listed requirement, with supporting evidence
- **Writing 10–15 structured sections** — executive summary, technical approach, pricing, timeline, risk register, cover letter
- **Internal review and revisions** before submission

For small-to-mid-size teams this takes **3–5 business days per RFP**. Miss the deadline or submit a generic response, and the contract goes elsewhere. Large firms have dedicated proposal teams; everyone else is disadvantaged.

Nivedan AI levels the playing field — the same 6-agent pipeline that would take a team days completes in **15–20 minutes**.

---

## Features

- Upload any RFP PDF → receive a full branded proposal PDF by email
- 6-agent AI pipeline: Parse → Research → Match → Write → Review → Export
- Live Tavily MCP web search for real-time client company intelligence
- Knowledge base for case studies, certifications, team bios, and past proposals
- Human-in-the-loop (HITL) review with targeted section rewrites
- Automated PDF export + Resend email delivery
- Plan-gated usage quotas (Free / Plus / Pro)

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 15, Tailwind CSS |
| Auth | Clerk v7 |
| Backend | Neon PostgreSQL, Drizzle ORM, Inngest |
| File handling | UploadThing v7 |
| Email | Resend |
| AI orchestration | Google Agent Development Kit (ADK) TypeScript |
| AI models | Gemini 3.1 Pro Preview · Gemini 3.5 Flash · Gemini 3.1 Flash Lite |
| Web search | Tavily MCP |
| Deployment | Vercel |

---

## Six-Agent Pipeline

| # | Agent | Model | Role |
|---|---|---|---|
| 1 | Orchestrator | Gemini 3.1 Pro Preview | Validates inputs, issues pipeline directive |
| 2 | RFP Parser | Gemini 3.1 Flash Lite | Reads PDF natively via Gemini inline data |
| 3 | Client Research | Gemini 3.5 Flash | Tavily MCP web search → company intelligence |
| 4 | Requirements Matcher | Gemini 3.1 Flash Lite | Maps RFP requirements to KB items + Tavily evidence |
| 5 | Proposal Writer | Gemini 3.1 Pro Preview | Generates 12-section JSON proposal |
| 6 | Quality Reviewer | Gemini 3.1 Flash Lite | 5 quality checks, applies corrections |

### How Each Agent Solves the Problem

**1 — Orchestrator**
Reads your company profile and the RFP metadata, then writes a `pipelineDirective` — a master brief that tells every downstream agent exactly how to position your firm for this specific client. This is what makes proposals feel tailored rather than templated. It also validates that all required inputs are present before the pipeline runs.

**2 — RFP Parser**
Sends the PDF directly to Gemini as native `inlineData` — no text extraction library, no formatting loss, no silent failures on complex layouts. Extracts structured requirements, evaluation criteria, submission deadline, and client name into a typed schema stored in the database for all downstream agents to read.

**3 — Client Research**
Fires a live Tavily MCP search session (15–20 search rounds) to build a real-time intelligence profile of the client: company strategy, recent news, technology stack, leadership priorities, and known pain points. This intel feeds the "Understanding of the Client", "Why Us", and "Proposed Solution" sections — turning generic filler into informed positioning.

**4 — Requirements Matcher**
Runs a second Tavily MCP pass to find third-party evidence (industry benchmarks, case studies, published data) that substantiates each capability match. Then scores every RFP requirement against your knowledge base items with a numeric confidence score, flagging gaps where your KB has no coverage.

**5 — Proposal Writer**
Combines the pipeline directive, parsed RFP, client intelligence, and matched requirements in a single `generateContent` call to produce a 12-section structured JSON proposal. Sections include: executive summary, understanding of requirements, proposed solution, technical approach, case studies, team and expertise, project timeline, pricing structure, risk mitigation, assumptions and dependencies, cover letter, and a "Why Us" closing.

**6 — Quality Reviewer**
Runs 5 automated checks — completeness, client alignment, requirement coverage, tone consistency, and factual accuracy — then applies targeted corrections in-place before setting the proposal to `awaiting_review`. Human reviewers can approve as-is or flag specific sections for a targeted AI rewrite (HITL loop).

---

## Built on Google ADK

The pipeline is orchestrated with **Google Agent Development Kit (ADK) for TypeScript** — a framework for building multi-step, tool-calling agent workflows.

### Key ADK primitives used

| Primitive | What it does | Used by |
|---|---|---|
| `LlmAgent` | A conversational agent that calls tools over multiple turns until a task is complete | Agents 3 & 4 (Tavily search passes) |
| `MCPToolset` | Connects any MCP server as a tool provider via HTTP transport | Agents 3 & 4 (Tavily MCP) |
| `Runner.runEphemeral()` | Runs a one-shot agent session with no pre-existing session — ideal for stateless serverless | Agents 3 & 4 |
| `InMemorySessionService` | Lightweight per-step session state scoped to a single `step.run()` block | Agents 3 & 4 |
| `@google/genai` `generateContent` | Direct one-shot Gemini call — no agent loop needed | Agents 1, 2, 5, 6 |

### Two-pass Tavily pattern (Agents 3 & 4)

Agents that need live web data use the same two-pass pattern:

```
Pass 1 — Search
MCPToolset (Tavily MCP over HTTP)
  + LlmAgent (Gemini 3.5 Flash / 3.1 Flash Lite)
  + Runner.runEphemeral()
  → Rich prose intelligence with inline source URLs

Pass 2 — Synthesise
@google/genai generateContent (same model)
  → Structured JSON schema, sources extracted into sources[]
```

The search pass runs 15–20 Tavily rounds autonomously — the LlmAgent decides when it has enough information. The synthesis pass then converts unstructured prose into the typed JSON schema the next agent reads from the database.

### Why Inngest wraps the ADK agents

Each ADK agent runs inside an **Inngest `step.run()` block** for durability:

- If a step fails (network timeout, model error), Inngest retries only that step — not the whole pipeline
- Completed steps are cached; a retry picks up from the exact failure point
- Each step's return value is serialised and visible in the Inngest Cloud dashboard for debugging
- The pipeline survives Vercel's 60-second serverless timeout — each step is a separate Lambda invocation

---

## Getting Started

### Prerequisites

- Node.js 18+
- Accounts: [Clerk](https://clerk.com), [Neon](https://neon.tech), [UploadThing](https://uploadthing.com), [Inngest](https://inngest.com), [Resend](https://resend.com), [Tavily](https://tavily.com), [Google AI Studio](https://aistudio.google.com)

### Environment Variables

```env
GOOGLE_API_KEY=
TAVILY_API_KEY=
CLERK_SECRET_KEY=
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
DATABASE_URL=
UPLOADTHING_TOKEN=
INNGEST_EVENT_KEY=
INNGEST_SIGNING_KEY=
RESEND_API_KEY=
RESEND_FROM_EMAIL=
RESEND_FROM_NAME=
```

### Install & Run

```bash
npm install
npm run dev       # http://localhost:3000
```

For local pipeline testing, also run the Inngest dev server separately and re-sync at your Inngest Cloud dashboard after every deploy.

---

## Commands

| Command | Purpose |
|---|---|
| `npm run dev` | Start Next.js dev server |
| `npm run build` | Production build (surfaces TypeScript errors) |
| `npm run start` | Start production server |
| `npm run db:generate` | Generate Drizzle migration SQL from schema |
| `npm run db:migrate` | Apply pending migrations |
| `npm run db:studio` | Open Drizzle Studio at localhost:4983 |

> **Schema changes:** Run `db:generate` then apply via Neon MCP. `db:push` hangs over TCP from local.

---

## Pricing

| Plan | Price | Proposals/mo | KB PDFs/mo | Extras |
|---|---|---|---|---|
| Free | $0 | 1 | 1 | Core pipeline |
| Plus | $9/mo | 5 | 10 | Priority processing |
| Pro | $19/mo | Unlimited | Unlimited | White-label, REST API, 5 team seats |

---

## Deployment

Auto-deploys to Vercel on push to `main`.

**Live:** [https://nivedan-ai.vercel.app/](https://nivedan-ai.vercel.app/)
