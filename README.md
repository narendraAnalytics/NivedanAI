![Nivedan AI](https://res.cloudinary.com/dkqbzwicr/image/upload/q_auto/f_auto/v1780073397/bannerimage_ocjq9t.png)

# Nivedan AI

**Autonomous multi-agent SaaS that transforms RFP PDFs into submission-ready proposals in 15–20 minutes.**

🔗 [Live Demo](https://nivedan-ai.vercel.app/)

---

## What Is Nivedan AI?

Nivedan AI is a fully autonomous proposal generation platform. Upload an RFP PDF and a 6-agent AI pipeline takes over — parsing the document, researching the client company live on the web, matching your capabilities against every requirement, writing a 12-section branded proposal, and delivering the final PDF to your inbox. No manual drafting. No copy-pasting.

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
| AI models | Gemini 2.5 Pro · Gemini 2.5 Flash · Gemini 2.0 Flash Lite |
| Web search | Tavily MCP |
| Deployment | Vercel |

---

## Six-Agent Pipeline

| # | Agent | Model | Role |
|---|---|---|---|
| 1 | Orchestrator | Gemini 2.5 Pro | Validates inputs, issues pipeline directive |
| 2 | RFP Parser | Gemini 2.0 Flash Lite | Reads PDF natively via Gemini inline data |
| 3 | Client Research | Gemini 2.5 Flash | Tavily MCP web search → company intelligence |
| 4 | Requirements Matcher | Gemini 2.0 Flash Lite | Maps RFP requirements to KB items + Tavily evidence |
| 5 | Proposal Writer | Gemini 2.5 Pro | Generates 12-section JSON proposal |
| 6 | Quality Reviewer | Gemini 2.0 Flash Lite | 5 quality checks, applies corrections |

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
