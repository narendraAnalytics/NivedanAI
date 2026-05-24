# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

> Authoritative context document for Nivedan AI. Read fully before making any code, UI, or architecture decision.

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

**Schema changes workflow:** Run `db:generate` → apply via Neon MCP tool (`mcp__neon__run_sql_transaction`). `db:push` hangs over TCP from local machine.

**Local pipeline testing:** `npm run dev` + Inngest dev server running separately. Re-sync after every deploy at `https://nivedan-ai.vercel.app/api/inngest` in Inngest Cloud.

---

## What Is Nivedan AI?

Autonomous, multi-agent SaaS that turns an uploaded RFP PDF into a submission-ready branded proposal PDF in 15–20 minutes via a 6-agent pipeline.

- **Stack:** Next.js 15 · Neon PostgreSQL · Drizzle ORM · Clerk auth · UploadThing · Resend · Vercel
- **AI:** Google Agent Development Kit (ADK) TypeScript + `@google/genai` direct
- **Models:** `gemini-3.1-pro-preview` (Orchestrator, Writer) · `gemini-3.1-flash` (Client Research) · `gemini-3.1-flash-lite` (Parser, Matcher, Reviewer)

---

## Code Architecture

### Database — `src/db/`

Schema in 5 domain files, all re-exported from `src/db/schema/index.ts`:

| File | Tables |
|---|---|
| `users.ts` | `users` — Clerk user sync target |
| `company.ts` | `company_profiles`, `knowledge_base_items` |
| `jobs.ts` | `rfp_jobs` (includes `recipient_email` nullable), `rfp_documents`, `agent_runs` |
| `agent-outputs.ts` | `parsed_rfp_data`, `client_research_data`, `capability_matches` |
| `proposals.ts` | `proposals`, `proposal_exports`, `hitl_reviews` |

`src/db/index.ts` — single `db` export via `drizzle-orm/neon-http` (HTTP driver — required for Vercel serverless; never use `pg` or WebSocket driver).

**Schema rules:**
- `users.id` is `text` (Clerk IDs are `user_xxx` — **never** `uuid`)
- All FKs to `users.id` are also `text`
- All other PKs are `uuid().defaultRandom()`
- All FK constraints use `{ onDelete: 'cascade' }` except `capability_matches.knowledge_base_item_id` which uses `set null`
- `capability_matches.confidenceScore` is `numeric(3,2)` — always pass `String(score)`, not a raw number
- `capability_matches.tavilyEvidence` (text, nullable) — stores the Tavily MCP web evidence used for that requirement; non-null confirms Tavily searched and found something
- `client_research_data.googleSearchUsed` (boolean, default false) — true when `sources[]` is non-empty after Agent 3 runs; query this in Neon to confirm GOOGLE_SEARCH tool fired

### Auth — `src/middleware.ts` + `src/lib/auth.ts`

- Public routes: `/`, `/sign-in(.*)`, `/sign-up(.*)`, `/api/inngest`, `/api/uploadthing`
- `getOrCreateUser()` in `src/lib/auth.ts` — call at top of every protected API route. Uses `currentUser()` (not `sessionClaims` — Clerk v7 JWT excludes email by default).
- Sign-in/sign-up → `/api/auth/sync` → lazy-creates `users` row → redirects to `/`

### Six-Agent Pipeline

All agents live in `src/agents/` and are called from `src/inngest/functions/generate-proposal.ts` via `step.run()`.

| # | File | Model | Role |
|---|------|-------|------|
| 1 | `orchestrator.ts` | gemini-3.1-pro-preview | Validates inputs, LLM pipeline directive, `createSession` |
| 2 | `rfp-parser.ts` | gemini-3.1-flash-lite | Fetches PDF → base64 `inlineData` → Gemini native PDF reading → `parsedRfpData` |
| 3 | `client-research.ts` + `search-agent.ts` | gemini-3.1-flash | `LlmAgent` (`subAgents: [searchAgent]`) + `GOOGLE_SEARCH` + `Runner.runEphemeral` → `clientResearchData` |
| 4 | `requirements-matcher.ts` | gemini-3.1-flash-lite | Tavily MCP evidence pass (`MCPToolset` + `LlmAgent` + `runEphemeral`), then per-requirement `generateContent` match → `capability_matches` |
| 5 | `proposal-writer.ts` | gemini-3.1-pro-preview | 12-section JSON proposal (incl. coverLetter, risksMitigation, assumptionsDependencies, whyUs) → `proposals` row |
| 6 | `quality-review.ts` | gemini-3.1-flash-lite | 5 quality checks, applies corrections, sets `awaiting_review` |

**Pipeline flow:**
```
Inngest: nivedan/rfp.submitted
  → step-1-orchestrator → step-2-rfp-parser → step-3-client-research
  → step-4-requirements-matcher → step-5-proposal-writer → step-6-quality-review
  → step.waitForEvent (HITL, 7d timeout)
  → step-8-pdf-export (PDF → UploadThing + Resend email)
```

**Live activity:** Call `updateJobActivity(jobId, message)` at each meaningful step — writes to `rfp_jobs.current_activity`, polled every 3s by `/workflow/[jobId]`.

### ADK Session — Critical Inngest Caveat

**`InMemorySessionService` mutations do NOT survive across Inngest step boundaries.**

Inngest replays the function body on each step execution, skipping already-completed step callbacks. This means `Object.assign(session.state, { key: value })` from step N is NOT visible when step N+1 executes (the callback was never called in that HTTP request). On Vercel serverless, each step runs in a separate Lambda invocation — the in-memory session from step 1 is gone by the time step 2 runs.

**Rule:** Never read session state that was written by a different agent step. Read from the DB or use Inngest step return values instead.

**How cross-step data is passed today:**

- `pipelineDirective` and `companyName` — `runOrchestrator` returns them; step 1 returns this from its `step.run` callback. Inngest caches this and it's available as `orchestratorResult` in the function scope for all subsequent steps.
- `rfpDocumentUrl`, `companyProfileId` — passed directly from `event.data` to each agent input.
- `clientName` — Agent 2 writes to `rfp_jobs.clientName` in the DB; Agent 3 reads it from there.
- All other inter-agent data — read from DB tables (`parsed_rfp_data`, `client_research_data`, `capability_matches`, `proposals`).

```typescript
// ✅ Correct — orchestrator return value, cached by Inngest
const orchestratorResult = await step.run('step-1-orchestrator', async () => {
  const result = await runOrchestrator({ ... })
  return { ...result }  // pipelineDirective, companyName
})

// step-3 receives pipelineDirective via arg, clientName via DB query
await step.run('step-3-client-research', async () => {
  await runClientResearch({ jobId, userId, pipelineDirective: orchestratorResult.pipelineDirective })
})
```

**`runEphemeral` vs `runAsync`:**
- `runEphemeral({ userId, newMessage })` — no pre-existing session required; correct for one-shot LlmAgent calls within a step (Agents 3 and 4 search passes use this with a local `new InMemorySessionService()`)
- `runAsync({ userId, sessionId, newMessage })` — requires session to already exist; never use with the pipeline `sessionService` across steps

### ADK Implementation Pattern per Agent

| Agent | LLM approach | How it gets its data |
|-------|-------------|----------------------|
| 1 Orchestrator | `generateContent` one-shot | `event.data`; creates ADK session; **returns** `{ pipelineDirective, companyName }` |
| 2 RFP Parser | `generateContent` one-shot | `rfpDocumentUrl` + `companyProfileId` from args; queries `company_profiles` for `companyName` |
| 3 Client Research | `LlmAgent` + `Runner.runEphemeral` (local `InMemorySessionService`) | `pipelineDirective` from orchestrator return; `clientName` from `rfp_jobs` DB |
| 4 Req. Matcher | Tavily `MCPToolset` + `LlmAgent` + `Runner.runEphemeral`, then `generateContent` per-requirement | `companyProfileId` from args |
| 5–6 | `generateContent` one-shot | All data from DB queries (`parsed_rfp_data`, `client_research_data`, `capability_matches`, `proposals`) |

**`sessionService` is only used by Agent 1** (to `createSession`). Agents 2–6 do not import or use it.

### @google/adk TypeScript API — Confirmed Correct Patterns

Read from `node_modules/@google/adk/dist/types/` — do not revert:

1. **All ADK exports from root only:**
   ```typescript
   import { LlmAgent, GOOGLE_SEARCH } from '@google/adk'  // ✅
   import { LlmAgent } from '@google/adk/agents'           // ❌ path doesn't exist
   ```

2. **`GOOGLE_SEARCH`** (uppercase constant), not `googleSearch`

3. **Sub-agents property is `subAgents`**, not `agents`

4. **`runner.runEphemeral()` — preferred for one-shot calls (no session pre-creation needed):**
   ```typescript
   const sessionSvc = new InMemorySessionService()
   const runner = new Runner({ appName: 'my-app', agent, sessionService: sessionSvc })
   for await (const event of runner.runEphemeral({ userId, newMessage: { role: 'user', parts: [{ text: prompt }] } })) {
     const text = event.content?.parts?.[0]?.text
     if (text) finalText = text
   }
   // runAsync({ sessionId }) also exists but requires the session to already be in that Runner's sessionService
   ```

5. **ADK env var:** `LlmAgent` reads `GOOGLE_GENAI_API_KEY` or `GEMINI_API_KEY` — **not** `GOOGLE_API_KEY`. The alias in `client-research.ts` fixes this:
   ```typescript
   process.env.GOOGLE_GENAI_API_KEY ??= process.env.GOOGLE_API_KEY
   ```

6. **`MCPToolset` — Tavily MCP (used in `requirements-matcher.ts`):**
   ```typescript
   import { MCPToolset, LlmAgent, Runner, InMemorySessionService } from '@google/adk'

   const toolset = new MCPToolset({
     type: 'StreamableHTTPConnectionParams',
     url: 'https://mcp.tavily.com/mcp/',
     transportOptions: {
       requestInit: { headers: { Authorization: `Bearer ${process.env.TAVILY_API_KEY}` } },
     },
   })
   // Always close in finally block: await toolset.close()
   // Auth goes in transportOptions.requestInit.headers — NOT the deprecated .header field
   // Use runner.runEphemeral({ userId, newMessage }) for one-shot calls (no pre-created session needed)
   ```
   Env var: `TAVILY_API_KEY` (from app.tavily.com — free tier: 1,000 credits/mo).
   Vercel compatible: HTTP transport only — never `StdioConnectionParams` on serverless.

### `@google/genai` — All Direct Agents

```typescript
const ai = new GoogleGenAI({ apiKey: process.env.GOOGLE_API_KEY!, apiVersion: 'v1alpha' })

const result = await ai.models.generateContent({
  model: 'gemini-3.1-pro-preview',
  contents: [{ role: 'user', parts: [{ text: prompt }] }],
  config: { temperature: 0.3, maxOutputTokens: 2048, responseMimeType: 'application/json' },
})
```

Use `config:` not `generationConfig:`. Use `responseMimeType: 'application/json'` for agents that output JSON — avoids markdown fence wrapping and parse errors.

**Gemini inline PDF (Agent 2):**
```typescript
const pdfBase64 = Buffer.from(await fetch(url).then(r => r.arrayBuffer())).toString('base64')
// Pass as inlineData — Gemini reads PDF natively, no extraction library needed
parts: [
  { inlineData: { mimeType: 'application/pdf', data: pdfBase64 } },
  { text: prompt },
]
```

### Inngest v4 API (v4.4.0 — breaking changes from v3)

1. **`EventSchemas` does not exist** — `new Inngest({ id: '...' })` only; event types as a TypeScript `type`
2. **`createFunction` takes 2 args** — trigger inside config:
   ```typescript
   inngest.createFunction(
     { id: 'generate-proposal', triggers: [{ event: 'nivedan/rfp.submitted' }] },
     async ({ event, step }) => { ... }
   )
   ```
3. **`step.waitForEvent` uses `if:`** not `match:` for correlation:
   ```typescript
   step.waitForEvent('wait-for-hitl', { event: 'nivedan/hitl.approved', timeout: '7d', if: 'event.data.jobId == async.data.jobId' })
   ```
4. **`INNGEST_DEV=1`** — only in `.env.local`; never on Vercel

### UploadThing v7 (uploadthing@^7.7.4, @uploadthing/react@^7.3.3)

**Env var:** Single `UPLOADTHING_TOKEN` (base64 JSON) — replaces v6's `UPLOADTHING_SECRET` + `UPLOADTHING_APP_ID`.

**Client hook** — `generateReactHelpers`, NOT `generateUploadHook` (doesn't exist in v7):
```typescript
import { generateReactHelpers } from '@uploadthing/react'
export const { useUploadThing } = generateReactHelpers<OurFileRouter>()
```

**File URL:** `file.ufsUrl` (not `file.url`) in `onUploadComplete`.

**Server-side upload:**
```typescript
const file = new File([new Uint8Array(pdfBuffer)], fileName, { type: 'application/pdf' })
// Must use new Uint8Array(buffer), NOT raw Buffer — TypeScript BlobPart incompatibility
const uploadResult = await new UTApi().uploadFiles(file)
const url = (uploadResult as { data?: { ufsUrl?: string } }).data?.ufsUrl ?? ''
// Use .ufsUrl on the result — NOT .url or .appUrl (those are deprecated getters that log warnings)
```

**Two endpoints in `src/lib/uploadthing.ts`:**
- `rfpDocument` — 32 MB; takes `recipientEmail` via `.input()`; `onUploadComplete` creates `rfpJobs` + fires `nivedan/rfp.submitted`; returns `{ jobId }` as `serverData`
- `kbDocument` — 16 MB; `onUploadComplete` returns `{ fileUrl }` only; client reads `files[0].ufsUrl` directly (never `serverData` — can be null on Vercel)

**Recipient email thread:** `startUpload(files, { recipientEmail })` → DB `rfpJobs.recipient_email` → Inngest event → Resend `to:`. Falls back to Clerk sign-up email.

### Resend Email

Sent in `src/inngest/functions/generate-proposal.ts` after PDF export (step 8).

**`from` field must use RFC 5322 display-name format** — bare email shows the local-part ("admin") as the sender name:
```typescript
// ❌ shows "admin" in inbox
from: process.env.RESEND_FROM_EMAIL!

// ✅ shows "NIVEDAN-AI" in inbox
from: `${process.env.RESEND_FROM_NAME} <${process.env.RESEND_FROM_EMAIL}>`
```

Env vars: `RESEND_API_KEY`, `RESEND_FROM_EMAIL`, `RESEND_FROM_NAME`.

### Vercel Serverless — Production Rules

Silent failures that burned us:

1. **`pdf-parse` must NEVER be used in Vercel routes** — silently hangs on cold starts; a try/catch does NOT protect. Use Gemini on filename (`extractFromFilename` in `/api/kb/items/route.ts`) or pass PDF as `inlineData`.

2. **`export const maxDuration = 60`** on any route doing LLM or PDF work — default is 10s.

3. **All API routes must have try/catch returning JSON** — uncaught throws return HTML, `r.json()` throws, breaking `Promise.all` silently.

4. **Client `Promise.all` fetches:** use `r.ok ? r.json() : fallback` — bare `.then(r => r.json())` throws on non-2xx.

5. **`awaitServerData: true` only when client MUST have `serverData`** (e.g. `rfpDocument` → `jobId`). `kbDocument` does not use it; read `files[0].ufsUrl` directly.

6. **`@react-pdf/renderer` in `next.config.ts`:**
   ```typescript
   serverExternalPackages: ['@react-pdf/renderer']
   ```

### UI — Design Tokens (globals.css)

CSS variables and Tailwind tokens live in `src/app/globals.css` `@theme inline {}` — never `tailwind.config.ts`. `cn()` helper in `src/lib/utils.ts`.

| Token | Value |
|-------|-------|
| `--forest` | `#2F5D50` |
| `--forest-deep` | `#234539` |
| `--gold` | `#D4A84F` |
| `--gold-deep` | `#B88A2F` |
| `--ivory` | `#FAF7F2` |
| `--f-display` | Sora |
| `--f-display-serif` | Playfair Display |
| `--f-body` | Inter |
| `--f-mono` | JetBrains Mono |

Key classes: `.ni-glass` (glassmorphism), `.ni-section`, `.ni-container`, `.btn-primary`, `.btn-gold`

Animations: `pulseGold`, `pulseGoldRing` (active agent card), `drift` (WorkflowViz float), `twinkle`, `spin` (upload spinner)

### Key Pages

- `/dashboard` — single `'use client'` file; all sub-components defined inline. Upload validates email before `startUpload`. Polls `/api/stats`, `/api/kb/items`, and `/api/proposals/recent` on mount. Real proposals rendered as clickable rows — "Draft Ready" rows link to `/workflow/[jobId]` (HITL approve panel); "Submitted" rows link to `/proposals/[jobId]` (viewer).
- `/workflow/[jobId]` — polls `/api/jobs/[jobId]` every 3s. `CircularProgress` shows ETA while running, "Complete" + "View Proposal" button when `awaiting_review`/`completed`. **HITL "Request Changes":** `POST /api/proposals/[jobId]/changes` must include ALL rewritable sections in `flaggedSections` — passing `[]` causes `handle-hitl-changes.ts` to exit early and no sections get rewritten (only Quality Review re-runs). Valid sections: `executiveSummary`, `understandingOfRequirements`, `proposedSolution`, `technicalApproach`, `caseStudies`, `teamAndExpertise`, `projectTimeline`, `pricingStructure`.
- `/proposals/[jobId]` — split into two files: `page.tsx` (server component — auth, DB queries, score computation, passes props) and `ProposalViewer.tsx` (client component — full interactive design: sticky TOC with scroll-spy, reading progress bar, section cards, floating action bar, Thank You closing card). `qualityScore` stored as `0.00–1.00` — multiply × 100 for display. Never move DB queries into `ProposalViewer`. **TOC scroll-jump:** `scrollMarginTop` must be on the outer wrapper `<div>` that holds the `ref` (the `scrollIntoView` target), NOT on the inner `<article>` — otherwise the sticky header covers the section heading on click.
- `/knowledge-base` — company profile editor + PDF upload (AI extracts title/tags from filename) + manual form.
- `/pricing` — `'use client'`; uses `<PricingTable appearance={nivedanAppearance} />`. Auth-protected (middleware). Sticky header with back-to-home + logo. All styling via Clerk's `appearance` object — never add manual plan cards here.
- `/redirecting` — transition animation page. Not in public routes. Context-aware message via `?to=` param. Any new nav link that needs the transition should route through here.

### Clerk v7 Patterns

- `useUser()` → `{ isSignedIn, user }`
- `<UserButton />` — no `afterSignOutUrl` prop (removed in v7; use `NEXT_PUBLIC_CLERK_AFTER_SIGN_OUT_URL` env var)
- Middleware: `clerkMiddleware` + `createRouteMatcher` from `@clerk/nextjs/server`

### Clerk Billing — Pricing Page

`/pricing` uses Clerk's `<PricingTable />` from `@clerk/nextjs`. Plans are defined in the Clerk Dashboard — **no hardcoded plan IDs in code**. The component auto-fetches and renders them.

Styled via the `appearance` prop in `src/app/pricing/page.tsx` using the brand palette (forest/gold/ivory). Plan name labels are lowercase (`free`, `plus`, `pro`) matching what's set in the Clerk Dashboard — `textTransform: 'none'` enforces this.

Pricing tiers are documented in `pdfdeisgn.txt` at the repo root:
- **free** — $0: 1 proposal/mo, 1 KB PDF/mo
- **plus** — $9/mo: 5 proposals/mo, 10 KB PDFs/mo, priority processing
- **pro** — $19/mo: unlimited, white-label, REST API, 5 team seats

`users.plan` varchar in DB (`free` | `plus` | `pro`) — updated by Clerk billing webhooks (not yet wired). Default `'free'` set in `getOrCreateUser()`.

### Navigation — Transition Page Pattern

`/redirecting?to=X` (`src/app/redirecting/page.tsx`) shows the branded tick animation (circle draw-in → checkmark → glow pulse) then pushes to `/${X}` after 2200ms.

- `/redirecting` is **not** in public routes — unauthenticated users hit sign-in first, then land on the transition after auth
- Message is context-aware: `to=pricing` → "Exploring your plans", all others → "Preparing your workspace"
- Used in Navbar for: Login → `sign-in`, Book a Demo → `sign-up`, Pricing → `pricing`

**`NavLink` in Navbar** accepts an optional `href` prop (default `"#"`). Pass a full path for real navigation:
```tsx
<NavLink href="/redirecting?to=pricing">Pricing</NavLink>
```

---

## Skills (always load before working in these areas)

```
Frontend / UI work:     C:\Users\ES\.claude\skills\nextstack.skill
Multi-agent / ADK:      C:\Users\ES\.claude\skills\multigentsadk.skill
```
