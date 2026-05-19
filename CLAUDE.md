he skill isn't registered as a plugin
# CLAUDE.md — Nivedan AI

> This file is the authoritative context document for Claude when working on Nivedan AI.
> Read this fully before making any code, UI, or architecture decision.

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
src/app/layout.tsx            — Sora + Inter via next/font/google; metadata title/description
src/app/globals.css           — Brand CSS vars, animation keyframes, utility classes
src/app/page.tsx              — Section composition (imports all landing components)
src/lib/utils.ts              — cn() helper (clsx + tailwind-merge)

src/components/landing/
  Navbar.tsx                  — Glassmorphism sticky nav; scroll-aware blur intensification
  Hero.tsx                    — 2-col hero: left (H1, CTAs, stats, avatars), right (WorkflowViz)
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