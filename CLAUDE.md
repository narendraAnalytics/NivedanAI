# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

> This file is the authoritative context document for Claude when working on Nivedan AI.
> Read this fully before making any code, UI, or architecture decision.

---

## Production

- **Live URL:** https://nivedan-ai.vercel.app/
- **Deployment:** Vercel (auto-deploys on push to `main`)

---

## Commands

```bash
npm run dev          # Start Next.js dev server (localhost:3000)
npm run build        # Production build
npm run start        # Start production server

npm run db:generate  # Generate Drizzle migration SQL from schema changes
npm run db:migrate   # Apply pending migrations
npm run db:push      # Push schema directly (avoid — TCP hangs with Neon; use generate + Neon MCP instead)
npm run db:studio    # Open Drizzle Studio at localhost:4983
```

**Schema changes workflow:** Run `db:generate` to produce SQL in `drizzle/`, then apply via the Neon MCP tool (`mcp__neon__run_sql_transaction`) — `db:push` hangs when connecting to Neon from local machine over TCP.

---

## Code Architecture

### Database — `src/db/`

Schema is split into 5 domain files, all re-exported from `src/db/schema/index.ts`:

| File | Tables |
|---|---|
| `users.ts` | `users` — Clerk user sync target |
| `company.ts` | `company_profiles`, `knowledge_base_items` |
| `jobs.ts` | `rfp_jobs`, `rfp_documents`, `agent_runs` |
| `agent-outputs.ts` | `parsed_rfp_data`, `client_research_data`, `capability_matches` |
| `proposals.ts` | `proposals`, `proposal_exports`, `hitl_reviews` |

`src/db/index.ts` creates a single `db` export using `drizzle-orm/neon-http` (HTTP driver — required for Vercel/serverless; never use `pg` or WebSocket driver).

Critical schema rules:
- `users.id` is `text` (Clerk IDs are `user_xxx` strings — **never** `uuid`)
- All FKs to `users.id` are also `text`
- All other PKs are `uuid().defaultRandom()`
- All FK constraints use `{ onDelete: 'cascade' }` except `capability_matches.knowledge_base_item_id` which uses `set null`

### Auth — `src/middleware.ts` + `src/lib/auth.ts`

- Middleware is `src/middleware.ts` (not `src/proxy.ts`) — public routes: `/`, `/sign-in(.*)`, `/sign-up(.*)`, `/api/inngest`, `/api/uploadthing`
- `src/lib/auth.ts` exports `getOrCreateUser()` — call at the top of every protected API route. It lazy-creates the `users` row on first login using `currentUser()` (not `sessionClaims` — Clerk v7 JWT excludes email by default), and syncs the Clerk billing plan on every call via `has({ plan })`.
- `src/app/api/auth/sync/route.ts` — protected GET route Clerk redirects to after sign-in/sign-up. Calls `getOrCreateUser()` then redirects to `/`.

### Current Build State

| Area | Status |
|---|---|
| Landing page (`/`) | Complete — 11 components in `src/components/landing/` |
| Clerk auth (sign-in, sign-up, sync) | Complete |
| Neon DB schema (all 12 tables) | Created via Neon MCP |
| Dashboard (`/dashboard`) | Complete — upload triggers redirect to `/workflow/[jobId]`; pipeline preview shown as demo |
| Inngest foundation (Stage 0) | Complete — pipeline shell wired, verified on Inngest Cloud |
| Agent 01 — Orchestrator | Complete — `src/agents/orchestrator.ts` |
| Agent 02 — RFP Parser | Complete — `src/agents/rfp-parser.ts` |
| Agent 03 — Client Research | Complete — `src/agents/client-research.ts` + `src/agents/search-agent.ts` |
| Agent 04 — Requirements Matcher | Complete — `src/agents/requirements-matcher.ts` |
| Agent 05 — Proposal Writer | Complete — `src/agents/proposal-writer.ts` |
| Agent 06 — Quality Review | Complete — `src/agents/quality-review.ts` |
| HITL Gate (Stage 7) | Complete — approve + changes API routes + `handle-hitl-changes.ts` |
| PDF Export & Delivery (Stage 8) | Complete — `@react-pdf/renderer` + UploadThing server upload + Resend |
| UploadThing RFP upload | Complete — `src/lib/uploadthing.ts` + `src/utils/uploadthing.ts` |
| Workflow page (`/workflow/[jobId]`) | Complete — live 6-agent timeline, polls `/api/jobs/[jobId]` every 3s, HITL panel |
| Knowledge Base (`/knowledge-base`) | Complete — company profile editor, PDF upload with AI extraction, manual form, item list |

### Infrastructure — `src/inngest/` + `src/lib/adk/` + `src/db/helpers/` + `src/agents/`

```
src/inngest/
  client.ts                          — Inngest client: new Inngest({ id: 'nivedanai' })
                                       Also exports NivedanEvents type for all 6 event shapes
  functions/
    generate-proposal.ts             — Pipeline: all 8 steps wired
                                       Steps 1-6: agents; step 7: waitForEvent HITL (7d timeout); step 8: PDF export + email
    handle-hitl-changes.ts           — Separate function triggered by nivedan/hitl.changes.requested
                                       Rewrites flagged sections via LLM → re-runs quality review
                                       Main pipeline stays paused until user re-approves

src/app/api/inngest/route.ts         — Inngest serve route (GET/POST/PUT); public in middleware
src/app/api/proposals/
  [jobId]/approve/route.ts           — POST: inserts hitlReviews (approved), fires nivedan/hitl.approved
  [jobId]/changes/route.ts           — POST: inserts hitlReviews (changes_requested), fires nivedan/hitl.changes.requested
src/app/api/uploadthing/route.ts     — GET/POST: UploadThing route handler; public in middleware
src/app/api/jobs/
  [jobId]/route.ts                   — GET: returns rfp_jobs status + currentAgent for workflow page polling
src/app/api/kb/
  profile/route.ts                   — GET + PATCH company profile (companyName, industry, website, tagline)
  items/route.ts                     — GET all KB items; POST new item (PDF → pdf-parse → LLM extraction)
  items/[itemId]/route.ts            — DELETE KB item

src/app/workflow/[jobId]/page.tsx    — Live pipeline page: polls /api/jobs/[jobId] every 3s, 6-stage vertical
                                       timeline, HITL approve/changes panel, completion banner
src/app/knowledge-base/page.tsx      — KB management: company profile editor, PDF upload (AI auto-extracts
                                       title/description/tags via gemini-3.1-flash-lite), manual form, item list

src/agents/                          — One file per agent; called from Inngest step.run()
  orchestrator.ts                    — Agent 1: validates inputs, LLM directive, createSession
  rfp-parser.ts                      — Agent 2: fetch PDF → pdf-parse → LLM → parsedRfpData
  search-agent.ts                    — Search sub-agent (LlmAgent + GOOGLE_SEARCH tool); used only by client-research
  client-research.ts                 — Agent 3: LlmAgent + Runner; delegates web lookups to search-agent → clientResearchData
  requirements-matcher.ts            — Agent 4: queries knowledge_base_items, per-requirement LLM match,
                                       bulk inserts capability_matches with confidenceScore (String(), not number)
  proposal-writer.ts                 — Agent 5: gemini-3.1-pro, temperature 0.7, 8-section JSON output,
                                       inserts proposals row, writes proposalDraftId to session
  quality-review.ts                  — Agent 6: gemini-3.1-flash-lite, temperature 0.1, 5 quality checks,
                                       updates proposals row, calls updateJobStatus(jobId, 'awaiting_review')

src/lib/
  uploadthing.ts                     — FileRouter: rfpDocument endpoint (32MB PDF); middleware: getOrCreateUser;
                                       onUploadComplete: creates rfpJobs + rfpDocuments + fires nivedan/rfp.submitted
                                       Returns { jobId } as serverData
  pdf/
    generate.tsx                     — generateProposalPdf(): @react-pdf/renderer JSX → renderToBuffer()
                                       Cover page + TOC + 8 section pages; buildStyles(primary, secondary) for branding
                                       Footer with fixed prop + render={({ pageNumber, totalPages }) => ...}

src/utils/
  uploadthing.ts                     — Client-side: generateReactHelpers<OurFileRouter>() → exports useUploadThing
                                       (NOT generateUploadHook — that doesn't exist in @uploadthing/react v7)

src/lib/adk/
  session.ts                         — InMemorySessionService singleton (shared by ALL agents)
  memory.ts                          — InMemoryMemoryService singleton (Agent 3+ only)
  runner.ts                          — createRunner(agent) factory — used only by agents with LlmAgent

src/db/helpers/
  job-status.ts                      — createAgentRun, completeAgentRun, failAgentRun,
                                       updateJobStatus, updateCurrentAgent
```

**ADK singleton rule:** Import `sessionService` from `@/lib/adk/session` — never `new InMemorySessionService()` inside an agent. Direct state mutation: `Object.assign(session.state, { ... })` — `InMemorySessionService` has no `updateSession` method.

**`memoryService` usage:** NOT used in Agents 1, 2, 4, 5, 6 (no Runner). Only wired into Agent 3 via `createRunner()`. Call `memoryService.addSessionToMemory(session)` once after all agents complete in `generate-proposal.ts`.

### ADK Implementation Pattern per Agent Type

| Agent | LLM approach | memoryService | sessionService |
|-------|-------------|---------------|----------------|
| 1 Orchestrator | `generateContent` one-shot | ❌ | `createSession` |
| 2 RFP Parser | `generateContent` one-shot | ❌ | `getSession` + `Object.assign(session.state)` |
| 3 Client Research | `LlmAgent` + `createRunner()` | ✅ via Runner | `getSession` + `Object.assign` |
| 4–6 | `generateContent` one-shot | ❌ | `getSession` + `Object.assign` |

**`GoogleGenAI` constructor — all agents using gemini-3.1 models:**
```typescript
const ai = new GoogleGenAI({ apiKey: process.env.GOOGLE_API_KEY!, apiVersion: 'v1alpha' })
```

**pdf-parse v2 API** (v2.4.5 — class-based, no default export):
```typescript
import { PDFParse } from 'pdf-parse'
const parser = new PDFParse({ data: buffer })
const [textResult, infoResult] = await Promise.all([parser.getText(), parser.getInfo()])
const text = textResult.pages.map((p: { text: string }) => p.text).join('\n')
const pageCount = infoResult.total ?? 0
await parser.destroy()
```

### @google/adk TypeScript API — Confirmed Correct Patterns

These were discovered by reading `node_modules/@google/adk/dist/types/` — do not revert:

1. **All ADK exports from root only** — no sub-path imports:
   ```typescript
   // ✅ Correct
   import { LlmAgent, GOOGLE_SEARCH } from '@google/adk'
   // ❌ Wrong — these paths do not exist in the TypeScript package
   import { LlmAgent } from '@google/adk/agents'
   import { googleSearch } from '@google/adk/tools'
   ```

2. **Google Search tool is `GOOGLE_SEARCH`** (uppercase constant), not `googleSearch`

3. **Sub-agents property is `subAgents`**, not `agents`:
   ```typescript
   new LlmAgent({ subAgents: [searchAgent], ... })
   ```

4. **`runner.runAsync()` takes a single params object** (not positional args):
   ```typescript
   runner.runAsync({ userId, sessionId: jobId, newMessage: { role: 'user', parts: [{ text: prompt }] } })
   ```

5. **`runner.runAsync()` returns `AsyncGenerator<Event>`** — iterate with `for await`:
   ```typescript
   for await (const event of runner.runAsync({ ... })) {
     const text = event.content?.parts?.[0]?.text
     if (text) finalText = text
   }
   ```

### Inngest v4 API Rules (v4.4.0 — breaking changes from v3)

These bit us during build — do not repeat:

1. **`EventSchemas` does not exist in v4** — `new Inngest({ id: '...' })` only; define event types separately as a TypeScript `type`
2. **`createFunction` takes 2 arguments, not 3** — trigger moves inside the config object:
   ```typescript
   inngest.createFunction(
     { id: 'generate-proposal', triggers: [{ event: 'nivedan/rfp.submitted' }] },
     async ({ event, step }) => { ... }
   )
   ```
3. **`step.waitForEvent` uses `if:` not `match:`** for event correlation:
   ```typescript
   step.waitForEvent('wait-for-hitl', {
     event: 'nivedan/hitl.approved',
     timeout: '7d',
     if: 'event.data.jobId == async.data.jobId',
   })
   ```
4. **`INNGEST_DEV=1`** — only in `.env.local` for local dev; never on Vercel
5. **Inngest Cloud sync URL:** `https://nivedan-ai.vercel.app/api/inngest` — re-sync after every deploy

### UploadThing v7 API — Critical Patterns

Package versions: `uploadthing@^7.7.4`, `@uploadthing/react@^7.3.3`.

**Server-side (FileRouter):**
```typescript
import { createUploadthing, type FileRouter } from 'uploadthing/next'
const f = createUploadthing()
export const ourFileRouter = { ... } satisfies FileRouter
export type OurFileRouter = typeof ourFileRouter
```

**Route handler** (`src/app/api/uploadthing/route.ts`):
```typescript
import { createRouteHandler } from 'uploadthing/next'
export const { GET, POST } = createRouteHandler({ router: ourFileRouter })
```

**Client-side hook** — use `generateReactHelpers`, NOT `generateUploadHook` (doesn't exist in v7):
```typescript
import { generateReactHelpers } from '@uploadthing/react'
export const { useUploadThing } = generateReactHelpers<OurFileRouter>()
```

**In components:**
```typescript
const { startUpload } = useUploadThing('rfpDocument', {
  onClientUploadComplete: (files) => { const jobId = files[0]?.serverData?.jobId },
  onUploadError: () => { ... },
})
```

**Server-side upload (PDF export):**
```typescript
import { UTApi } from 'uploadthing/server'
const utapi = new UTApi()
const file = new File([new Uint8Array(pdfBuffer)], fileName, { type: 'application/pdf' })
// ⚠️ Must use new Uint8Array(buffer), NOT raw Buffer — TypeScript BlobPart incompatibility
const result = await utapi.uploadFiles(file)
```

**File URL property:** `file.ufsUrl` (not `file.url`) in v7 `onUploadComplete` handler.

**Two endpoints in `src/lib/uploadthing.ts`:**
- `rfpDocument` — 32 MB PDF; middleware calls `getOrCreateProfile(userId)` (auto-creates company profile if none exists), passes `companyProfileId` to Inngest event; `onUploadComplete` creates `rfpJobs` + `rfpDocuments` rows, fires `nivedan/rfp.submitted`
- `kbDocument` — 16 MB PDF; middleware calls same `getOrCreateProfile`; `onUploadComplete` returns `{ fileUrl, companyProfileId }` — text extraction happens in `/api/kb/items` route (not here, to avoid timeout)

**`getOrCreateProfile(userId)`** — shared helper inside `src/lib/uploadthing.ts`: SELECT → INSERT on miss. Both endpoints use it. Never pass empty string as `companyProfileId`.

### generateContent config — all agents

Use `config:` not `generationConfig:`:
```typescript
const result = await model.generateContent({
  contents: [{ role: 'user', parts: [{ text: prompt }] }],
  config: { temperature: 0.7, maxOutputTokens: 8192 },
})
```

### @react-pdf/renderer — serverExternalPackages

Add to `next.config.ts` to prevent bundling issues:
```typescript
serverExternalPackages: ['@react-pdf/renderer']
```

### capability_matches.confidenceScore — numeric column

Drizzle `numeric(3,2)` requires string input. Always pass `String(score)`:
```typescript
confidenceScore: String(m.confidenceScore)  // not the raw number
```

### Utilities

- `src/lib/utils.ts` — exports `cn()` (clsx + tailwind-merge). Use for all `className` composition.
- CSS variables and Tailwind tokens live in `src/app/globals.css` `@theme inline {}` — never `tailwind.config.ts`.

---

## Skills (always load before working in these areas)

```
Frontend / UI work:           C:\Users\ES\.claude\skills\nextstack.skill
                              C:\Users\ES\.claude\skills\multigentsadk.skill
```

## What Is Nivedan AI?

**Nivedan AI** is an autonomous, multi-agent SaaS platform that transforms how agencies, freelancers, and sales teams respond to RFPs (Request for Proposals).

- **Name origin:** निवेदन — Hindi/Sanskrit for a formal, respectful submission. This is what an RFP response is: a professionally written proposal submitted to win a contract, government tender, or enterprise deal.
- **Framework:** Google Agent Development Kit (ADK) with TypeScript
- **Models:** `gemini-3.1-pro` (Orchestrator & Writer) · `gemini-3.1-flash-lite` (Parser, Researcher, Matcher, Reviewer)
- **Stack:** Next.js 15 · Neon PostgreSQL · Clerk · Drizzle ORM · UploadThing · Resend · Vercel
- **Deployment:** Single Next.js 15 monorepo on Vercel — no separate backend, no external infrastructure

The platform runs 6 specialized AI agents in a coordinated pipeline that takes an uploaded RFP PDF and produces a submission-ready, branded proposal PDF in **15–20 minutes**.

---

## The Problem Being Solved

### Before Nivedan AI
- Sales manager reads 40-page RFP manually — 3 hours just to understand requirements
- Writes from a blank doc, copy-pasting from old proposals
- Proposal feels generic, barely addresses client's situation
- Reviewer finds missing sections — entire rewrite needed
- **8–20 hours of senior staff time wasted per proposal**
- Win rate stuck at 20–25%

### After Nivedan AI
- RFP parsed in 60 seconds — every requirement extracted
- Client researched automatically — news, priorities, strategic direction
- Case studies and past work retrieved from knowledge base
- Every section tailored to the specific client
- Quality review checks all mandatory requirements before export
- **Complete proposal in 15–20 minutes**
- Win rate improves to 40–50%

**Business impact:** One extra contract won per month = ₹25–50 lakhs additional annual revenue. The subscription pays for itself in the first hour of use.

---

## The Six-Agent Pipeline

Each agent has one clearly defined job. Outputs are structured JSON passed sequentially. This is **not** prompt renaming — each agent has distinct responsibility, business role, and structured output.

| # | Agent | Role | Model |
|---|-------|------|-------|
| 01 | **Orchestrator Agent** | Root ADK agent. Creates session state, routes pipeline, handles retries/failures gracefully. | gemini-3.1-pro |
| 02 | **RFP Parser Agent** | Reads entire RFP document. Extracts mandatory vs optional requirements, budget, timeline, evaluation criteria, compliance needs. Outputs structured RFP Blueprint JSON. | gemini-3.1-flash-lite |
| 03 | **Client Research Agent** | Web searches the client company for recent news, funding, leadership changes, strategic priorities. Makes proposals feel deeply client-aware. | gemini-3.1-flash |
| 04 | **Requirements Matcher Agent** | Searches company knowledge base (past proposals, case studies, certifications, team bios). Maps every RFP requirement to strongest proof point with confidence scores. | gemini-3.1-flash-lite |
| 05 | **Proposal Writer Agent** | Core creative agent. Uses all prior structured outputs to write the full proposal: Executive Summary, Solution, Technical Approach, Case Studies, Team, Timeline, Pricing. | gemini-3.1-pro |
| 06 | **Quality Review & Export Agent** | Validates every mandatory requirement is addressed. Catches conflicts (e.g. timeline mismatch). Exports branded PDF with company logo, colors, TOC, cover page, page numbers. | gemini-3.1-flash-lite |

### End-to-End Flow
```
User uploads RFP PDF + company profile
  → Orchestrator: creates session, routes pipeline
  → RFP Parser: structured requirements extracted
  → Client Research: company intelligence gathered
  → Requirements Matcher: capability map built
  → Proposal Writer: full draft written
  → Quality Review & Export: validated → branded PDF
  → Dashboard view + downloadable PDF + Resend email + saved to Neon DB
```

---

## Target Users & Pricing

| Segment | Use Case | Pricing |
|---------|----------|---------|
| Software Agencies | 10–15 RFPs/month, enterprise/hospital/government clients | ₹16,000–₹25,000/mo |
| Freelance Developers | Upwork/Toptal bids, direct clients | ₹8,000–₹12,000/mo |
| SaaS Sales Teams | Fortune 500 RFPs, deals worth ₹50L–₹5Cr | ₹25,000–₹40,000/mo |
| Consulting Firms | Proposal writing as core business cost | ₹25,000–₹40,000/mo |
| Construction & Infrastructure | Government tenders, complex lengthy RFPs | ₹12,000–₹20,000/mo |
| EdTech & Research | Grant applications, academic procurement | ₹8,000–₹16,000/mo |

---

## Build Roadmap (4 Phases)

### Phase 1 — Build & Prove (Vercel + Inngest)
- All 6 agents working locally, pipeline end-to-end
- Structured outputs correct
- PDF generates properly
- Real users can use it

### Phase 2 — Add MCP
- Convert tools (knowledge base search, PDF export, web search) into MCP servers
- Agents use MCP toolsets instead of direct function calls
- No change to agent logic — just the tool layer

### Phase 3 — Add A2A
- Wrap RFP Parser, Client Research, Requirements Matcher as A2A services on Cloud Run
- Orchestrator calls them via `RemoteA2aAgent`
- Pipeline becomes distributed and independently scalable

### Phase 4 — Add Evals, HITL, Observability
- ADK eval framework on each agent
- Human approval gate before PDF export
- AgentOps or Galileo for tracing

---

## Product Perception & Design Principles

This project is **not** a chatbot wrapper, RAG demo, or tutorial clone. It must present and feel like:

- **Enterprise SaaS** — not hobby AI
- **Workflow intelligence** — not a chat UI
- **AI infrastructure** — not prompt engineering
- **Operational automation** — not content generation
- **Revenue product** — not portfolio project

### Visual References (UI must feel like these)
Linear · Vercel · Retool · Notion AI · Harvey AI · Scale AI · Glean

### UI/UX Priorities (in order)
1. **Dashboard** — pipeline progress, agent execution states, extraction outputs, confidence scores, export history. Users must visually see the AI working.
2. **Workflow Visualization** — animated orchestration view, agent-to-agent transitions, live execution states, reasoning traces.
3. **Knowledge Base UI** — users see retrieved case studies, matched certifications, evidence mapping. Makes the platform feel like institutional intelligence.
4. **PDF Output** — the final PDF is the "wow" moment. Must be beautifully branded, structured, enterprise-grade. If it looks generic, perceived value collapses.
5. **Dark/light polished themes** — premium typography, subtle motion, structured dashboards, clean enterprise minimalism.

---

## Vision Statement

> "A solo developer in Palakollu should be able to submit a proposal that competes with one prepared by a 10-person agency in Mumbai. Nivedan AI makes that the new normal."

This communicates: democratization · empowerment · leverage · AI augmentation.

---

## Key Metrics to Always Reference

| Metric | Value |
|--------|-------|
| Time per proposal (before) | 8–20 hours |
| Time per proposal (after) | 15–20 minutes |
| Time reduction | 95% |
| Win rate (before) | 20–25% |
| Win rate (after) | 40–50% |
| Proposal capacity multiplier | 3× |
| Missed requirements | 0 (Quality Review Agent) |
| Infrastructure overhead | ₹0 extra (single Vercel monorepo) |

---

## Important Conventions

- All agents live in `src/agents/` and are called from `src/inngest/functions/generate-proposal.ts` via `step.run()` — not directly in API routes
- Agent 3 (Client Research) uses `LlmAgent` + `createRunner()` for googleSearch tool use; all other agents use `generateContent` one-shot
- Session state is the shared contract between all agents — treat it as the source of truth
- Outputs must always be **structured JSON** between agents; no free-form text passing
- PDF generation uses company profile settings for branding (logo, colors, fonts) applied automatically
- Auth: Clerk · Database: Neon PostgreSQL via Drizzle ORM · File upload: UploadThing · Email: Resend
- The knowledge base (past proposals, case studies, certifications) is the key differentiator — surface it visually everywhere possible

---

## Landing Page (Phase 0 — Marketing Site)

The public-facing landing page at `/` is fully implemented. It is a premium cinematic single-page site with ivory/forest-green/gold theme, glassmorphism cards, scroll-reveal animations, and a sticky workflow section.

### Files Created

```
src/middleware.ts             — Clerk auth middleware; public routes: /, /sign-in, /sign-up, /api/inngest, /api/uploadthing

src/app/layout.tsx            — Sora + Inter via next/font/google; ClerkProvider; metadata
src/app/globals.css           — Brand CSS vars, animation keyframes, utility classes
src/app/page.tsx              — Section composition (imports all landing components)
src/app/sign-in/
  [[...sign-in]]/page.tsx     — Branded sign-in page (Nivedan logo + Clerk <SignIn />)
src/app/sign-up/
  [[...sign-up]]/page.tsx     — Branded sign-up page (Nivedan logo + Clerk <SignUp />)
src/app/redirecting/
  page.tsx                    — Auth transition splash: logo + animated green tick → redirects after 2.2s

src/lib/utils.ts              — cn() helper (clsx + tailwind-merge)

src/components/landing/
  Navbar.tsx                  — Glassmorphism sticky nav; auth-aware (Login/Book a Demo → /redirecting; signed-in → Welcome + UserButton)
  Hero.tsx                    — 2-col hero; Start Free Trial → /redirecting?to=sign-up
  WorkflowViz.tsx             — Animated 7-stage grid snake pipeline (hero right panel) ← see below
  TrustedStrip.tsx            — Horizontal scrolling enterprise wordmark strip
  ProblemSolution.tsx         — Before/After comparison cards (red vs green)
  Agents.tsx                  — 6 AI agent cards in 3-col grid with hover glow
  HowItWorks.tsx              — Sticky scroll: 6 steps left, live pipeline visualization right
  Benefits.tsx                — 6 animated counter cards (95%, 2×, 3×, 0 missed, ₹0 infra, ∞)
  Audience.tsx                — 6 target audience cards (3-col grid) with pricing tags
  FinalCTA.tsx                — Dark forest section with gold radial accents + dual CTAs
  Footer.tsx                  — 5-col footer: logo/tagline/socials + 4 link columns
```

### Design Tokens (globals.css)

| Token | Value |
|-------|-------|
| `--forest` | `#2F5D50` |
| `--forest-deep` | `#234539` |
| `--gold` | `#D4A84F` |
| `--gold-deep` | `#B88A2F` |
| `--ivory` | `#FAF7F2` |
| `--ivory-warm` | `#F4EFE6` |
| `--champagne` | `#F7E7C1` |
| `--sage-soft` | `#EBF1E7` |
| `--f-display` | `Sora` (headings) |
| `--f-body` | `Inter` (body) |
| `--f-mono` | `JetBrains Mono` (badges, model names) |

Key classes: `.ni-glass` (glassmorphism), `.ni-section`, `.ni-container`, `.ni-eyebrow`, `.ni-section-head`, `.ni-text-gradient-gold`, `.btn-primary`, `.btn-gold`

Animations: `drift 8s ease-in-out infinite` (WorkflowViz float), `pulseGold`, `twinkle`, `floatParticle`

### WorkflowViz — Grid Snake Layout

The hero right panel shows a 7-stage pipeline in a horizontal snake pattern:

```
[01 RFP Upload] → [02 RFP Parsing] → [03 Client Research] → [04 Requirements Matching]
                                                                          ↓
                 [07 PDF Export]  ← [06 Quality Review]  ← [05 Proposal Writing]
```

- CSS Grid: `gridTemplateColumns: "1fr 15px 1fr 15px 1fr 15px 1fr"`, `gridTemplateRows: "auto 28px auto"`
- Row 2 stages placed at cols 3, 5, 7 (so stage 05 aligns under stage 04 for the ↓ connector)
- `active` state: `useState(4)` → cycles 0–6 every 2500ms via `setInterval`
- Active card: `rgba(247,231,193,0.35)` bg + gold border + gold dot top-right
- Done card (idx < active): white bg + 100% progress bar
- Pending card (idx > active): white bg + "Pending" text
- Progress bar fill: `linear-gradient(90deg, #E8C97A 0%, #C99437 100%)` (gold gradient)
- Stage 01 only: file chip "Hospital_RFP.pdf · 38.4 MB"
- Bottom panels: "Proposal Preview" (left) + "AI Agents Active" with 6 agent icon rings (right)
- Outer wrapper: `drift 8s` float animation + `.ni-glass` glassmorphism

### Responsive Breakpoints

- `≤ 1180px`: hero/sticky grids → 1 col; agent/benefit/audience grids → 2 col; nav links hide
- `≤ 760px`: all grids → 1 col

---

## Auth (Phase 0 — Clerk Integration)

Clerk v7 (`@clerk/nextjs@^7.3.5`) is fully integrated. Auth keys are in `.env`.

### Auth Flow

```
Signed-out user: CTA click (Login / Book a Demo / Start Free Trial)
  → /redirecting?to=sign-in | sign-up     (2.2s branded splash + tick animation)
  → /sign-in or /sign-up                  (Clerk hosted UI with Nivedan branding)
  → /api/auth/sync                        (lazy-creates users row, syncs plan)
  → /redirecting?to=                      (tick animation again)
  → /                                     (landing page)

Signed-in user: "Start Free Trial" CTA
  → /redirecting?to=dashboard             (tick animation)
  → /dashboard
```

### Files Created / Modified

```
src/middleware.ts                              — Clerk middleware; public: /, /sign-in, /sign-up, /api/inngest
src/app/sign-in/[[...sign-in]]/page.tsx       — Branded sign-in (Nivedan logo + <SignIn />)
src/app/sign-up/[[...sign-up]]/page.tsx       — Branded sign-up (Nivedan logo + <SignUp />)
src/app/redirecting/page.tsx                  — Transition splash: logo + animated tick → redirects after 2.2s
src/app/layout.tsx                            — <ClerkProvider> wraps children inside <body>
src/components/landing/Navbar.tsx             — Auth-aware: signed-out → Login/Book a Demo buttons; signed-in → Welcome + <UserButton />
src/components/landing/Hero.tsx               — Start Free Trial → router.push('/redirecting?to=sign-up')
```

### Signed-In Navbar State

- `Welcome, {username ?? firstName ?? "there"}` — forest green, Sora font
- `<UserButton />` — Clerk profile picture with built-in sign-out dropdown
- Sign-out → `/` via `NEXT_PUBLIC_CLERK_AFTER_SIGN_OUT_URL=/` in `.env`

### Clerk v7 Patterns — Critical

- `useUser()` → `{ isSignedIn, user }` for client-side auth state
- `<UserButton />` — **no** `afterSignOutUrl` prop (removed in v7; use env var)
- Middleware: `clerkMiddleware` + `createRouteMatcher` from `@clerk/nextjs/server`
- CTA navigation uses `useRouter().push('/redirecting?to=...')` — **not** `<SignInButton>` / `<SignUpButton>`
- All routes are public by default; `auth.protect()` called only for non-public routes

### Hero CTA — Conditional Redirect

`src/components/landing/Hero.tsx` uses `useUser()` to branch on "Start Free Trial":
- Signed-in → `router.push('/redirecting?to=dashboard')`
- Signed-out → `router.push('/redirecting?to=sign-up')`

### Transition Page (`/redirecting`) Design

- Background: `#FAF7F2` (ivory)
- Animation: CSS keyframes only — no animation library
  - Card fades up on mount (450ms)
  - Circle strokes in clockwise from top (850ms, `stroke-dashoffset` trick)
  - Checkmark draws in after circle completes (450ms, 750ms delay)
  - SVG glow pulses during animation
  - "Preparing your workspace..." with 3 blinking dots
- Color: `#2F5D50` (forest green)
- Auto-redirects after 2200ms via `useEffect` + `setTimeout`

---

## Dashboard (`/dashboard`)

Single `'use client'` file: `src/app/dashboard/page.tsx`. All sub-components are defined in the same file (no separate component files).

### Sub-components
| Component | Purpose |
|---|---|
| `DashLogo` | Logo + "Workspace" label — clicks navigate to `/` |
| `UserPill` | Avatar initials + name + "Free Plan" badge (from `useUser()`) |
| `ProcessingPipeline` | 6-stage animated pipeline — simulated via `setInterval`; calls `onComplete` when done |
| `UploadZone` | Drag-drop / click-to-upload PDF area; calls `useUploadThing('rfpDocument')` → `onFile(name, jobId)` |
| `StatCard` | Single stat tile with icon, value, hint |
| `RecentList` | Proposals table — `userProposals` (state, top) + `sampleProposals` (constant, bottom) |
| `AgentRoster` | 6 agent list with colored rings |
| `BgLayer` | Fixed radial gradient background + wave SVG |
| `Twinkles` | Twinkling gold dots — generated in `useEffect` only (not SSR) to avoid hydration mismatch |

### State in Dashboard component
```ts
fileName        — set on upload; triggers transition card → router.push('/workflow/[jobId]') after 1.8s
userProposals   — ProposalEntry[] (kept for future history use)
proposalCount   — drives StatCard values
```

**Upload flow:** User drops PDF → `useUploadThing('rfpDocument')` → `onFile(name, jid)` sets `fileName`, schedules `router.push('/workflow/${jid}')` after 1800ms → transition card shown briefly → redirect. `ProcessingPipeline` remains in code as a demo preview shown below the upload zone (labeled "Pipeline preview / Demo") so users understand the flow before uploading.

### Dynamic stat logic (on each `onComplete`)
- **Proposals this month** → `proposalCount`
- **Avg. time saved** → `proposalCount × 19h` (19h = midpoint of 8–20h saved per proposal)
- **Win rate** → always `—` (no outcome data yet)
- **Knowledge base** → always `0 docs` (KB upload not built yet)

### `ProposalEntry` type
```ts
type ProposalEntry = { name: string; status: string; score: number; date: string; win?: boolean; isOwn?: boolean }
```
Entries with `isOwn: true` get green tint + "Yours" badge in `RecentList`.