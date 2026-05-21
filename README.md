The change: removed EventSchemas (doesn't exist in Inngest v4) — the client is now just new Inngest({ id: 'nivedanai' }). The event
   types are exported as NivedanEvents for TypeScript use elsewhere.

--------------------https://adk.dev/integrations/

--------------------https://adk.dev/sessions/memory/

import {GOOGLE_SEARCH, LlmAgent} from '@google/adk';

export const rootAgent = new LlmAgent({
  model: 'gemini-flash-latest',
  name: 'root_agent',
  description:
      'an agent whose job it is to perform Google search queries and answer questions about the results.',
  instruction:
      'You are an agent whose job is to perform Google search queries and answer questions about the results.',
  tools: [GOOGLE_SEARCH],
});

-------------------------------------------------------------- ----------------------------------------------------------


Relevant for Later Phases

  ┌────────────────────────────┬─────────────────────────────────────────────────────────────────────────────────────────────────────┐
  │        Integration         │                                             Why it fits                                             │
  ├────────────────────────────┼─────────────────────────────────────────────────────────────────────────────────────────────────────┤
  │ Knowledge Engine           │ Google-native private data retrieval — potential upgrade for Agent 4's KB search (Phase 2 MCP work) │
  ├────────────────────────────┼─────────────────────────────────────────────────────────────────────────────────────────────────────┤
  │ MCP Toolbox for Databases  │ Expose Neon tables to agents as MCP tools — exact fit for Phase 2 (Add MCP roadmap item)            │
  ├────────────────────────────┼─────────────────────────────────────────────────────────────────────────────────────────────────────┤
  │ Pinecone / Qdrant / Chroma │ Vector search for knowledge base — better semantic matching than SQL text search for Agent 4        │
  └────────────────────────────┴─────────────────────────────────────────────────────────────────────────────────────────────────────┘
  ---------------------------------------

This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
