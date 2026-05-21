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

- Middleware is `src/middleware.ts` (not `src/proxy.ts`) — public routes: `/`, `/sign-in(.*)`, `/sign-up(.*)`, `/api/inngest`
- `src/lib/auth.ts` exports `getOrCreateUser()` — call at the top of every protected API route. It lazy-creates the `users` row on first login using `currentUser()` (not `sessionClaims` — Clerk v7 JWT excludes email by default), and syncs the Clerk billing plan on every call via `has({ plan })`.
- `src/app/api/auth/sync/route.ts` — protected GET route Clerk redirects to after sign-in/sign-up. Calls `getOrCreateUser()` then redirects to `/`.

### Current Build State

| Area | Status |
|---|---|
| Landing page (`/`) | Complete — 11 components in `src/components/landing/` |
| Clerk auth (sign-in, sign-up, sync) | Complete |
| Neon DB schema (all 12 tables) | Created via Neon MCP |
| Dashboard (`/dashboard`) | Complete — UI only (simulated pipeline, no real agents yet) |
| Inngest foundation (Stage 0) | Complete — pipeline shell wired, verified on Inngest Cloud |
| Agent pipeline (Agents 01–06) | Not yet built |
| UploadThing RFP upload | Not yet built |

### Stage 0 Infrastructure — `src/inngest/` + `src/lib/adk/` + `src/db/helpers/`

Stage 0 is complete and verified live on Inngest Cloud. These files exist and are working:

```
src/inngest/
  client.ts                          — Inngest client: new Inngest({ id: 'nivedanai' })
                                       Also exports NivedanEvents type for all 5 event shapes
  functions/
    generate-proposal.ts             — Pipeline shell: 6 step.run placeholders + waitForEvent HITL gate

src/app/api/inngest/route.ts         — Inngest serve route (GET/POST/PUT); already public in middleware

src/lib/adk/
  session.ts                         — Module-level InMemorySessionService singleton (shared by ALL agents)
  memory.ts                          — Module-level InMemoryMemoryService singleton (shared by ALL agents)
  runner.ts                          — createRunner(agent) factory; imports from session.ts + memory.ts

src/db/helpers/
  job-status.ts                      — Drizzle helpers: updateJobStatus, updateCurrentAgent,
                                       createAgentRun, completeAgentRun, failAgentRun
```

**Critical ADK singleton rule:** `sessionService` and `memoryService` are module-level singletons in `session.ts` and `memory.ts`. All 6 agents MUST import from these files — never `new InMemorySessionService()` inside an agent file. If each agent creates its own instance, `search_memory` returns nothing across agents.

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
| 03 | **Client Research Agent** | Web searches the client company for recent news, funding, leadership changes, strategic priorities. Makes proposals feel deeply client-aware. | gemini-3.1-flash-lite |
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

## Skills (always load before working in these areas)

```
Frontend / UI work:           C:\Users\ES\.claude\skills\nextstack.skill
                              C:\Users\ES\.claude\skills\multigentsadk.skill
```

---

## Important Conventions

- All agents are implemented inside **Next.js 15 API routes** — no separate backend
- ADK agent type: Google ADK (TypeScript) with `LlmAgent`
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
src/middleware.ts             — Clerk auth middleware; public routes: /, /sign-in, /sign-up, /api/inngest

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
| `UploadZone` | Drag-drop / click-to-upload PDF area; sets `fileName` state in Dashboard |
| `StatCard` | Single stat tile with icon, value, hint |
| `RecentList` | Proposals table — `userProposals` (state, top) + `sampleProposals` (constant, bottom) |
| `AgentRoster` | 6 agent list with colored rings |
| `BgLayer` | Fixed radial gradient background + wave SVG |
| `Twinkles` | Twinkling gold dots — generated in `useEffect` only (not SSR) to avoid hydration mismatch |

### State in Dashboard component
```ts
fileName        — currently selected PDF name (null = show UploadZone)
completed       — pipeline finished flag
userProposals   — ProposalEntry[] grows on each onComplete
proposalCount   — increments on each onComplete; drives StatCard values
```

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