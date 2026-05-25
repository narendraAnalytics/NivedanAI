import { GoogleGenAI } from '@google/genai'
import { MCPToolset, LlmAgent, Runner, InMemorySessionService } from '@google/adk'
import { eq } from 'drizzle-orm'
import { db } from '@/db'
import { clientResearchData, rfpJobs } from '@/db/schema'
import {
  createAgentRun,
  completeAgentRun,
  failAgentRun,
  updateCurrentAgent,
  updateJobActivity,
} from '@/db/helpers/job-status'
import type { PipelineDirective } from './orchestrator'

const ai = new GoogleGenAI({ apiKey: process.env.GOOGLE_API_KEY!, apiVersion: 'v1alpha' })

// LlmAgent reads GOOGLE_GENAI_API_KEY; alias from the env var used by the rest of the pipeline
process.env.GOOGLE_GENAI_API_KEY ??= process.env.GOOGLE_API_KEY

const TAVILY_SEARCH_INSTRUCTION = `You are a company intelligence researcher.

Given a company name and sector, search the web to gather the following:
- Company overview: what they do, founding year, HQ location, employee count range, revenue range
- Recent news: acquisitions, product launches, leadership changes, tenders won, regulatory events (last 12–18 months)
- Strategic priorities: digital transformation, expansion plans, technology investments
- Key challenges: market pressures, regulatory burden, competitive threats, operational issues
- Leadership team: CEO, CTO, CFO and any recently appointed executives
- Main competitors in their space
- Any known government contracts or public sector RFP wins if applicable
- Technology stack or known platform preferences if available

Search at least 2–3 times for different aspects (news, leadership, strategy).
Return a detailed plain-text summary of everything you find. Include source URLs inline wherever possible (e.g. "According to [https://...], ...").
Do NOT return JSON — return rich prose that a proposal writer can use.`

const CLIENT_RESEARCH_INSTRUCTION = `You are the Client Research Agent for Nivedan AI.

Your job is to build a comprehensive, deeply researched profile of a client company so that the
downstream Proposal Writer can craft a hyper-tailored, winning proposal.

You will receive:
1. Basic company details (name, sector, focus areas)
2. LIVE WEB DATA gathered by a Tavily web search agent (when available)

Rules:
- If LIVE WEB DATA is provided, prioritize it over your training knowledge — treat it as ground truth for facts, dates, and names
- Extract all source URLs mentioned in the LIVE WEB DATA and include them in the "sources" array
- Never fabricate specific funding amounts, executive names, or news headlines you are not confident about
- For well-known enterprises: provide rich, accurate detail — do not hedge unnecessarily
- For obscure or private companies: build a reasonable profile from RFP context and known industry patterns
- Assign researchConfidence: "high" if rich live data exists, "medium" if partial, "low" if minimal
- strategicPriorities: minimum 4 items — be specific, not generic ("Cloud migration by 2026" not "digital transformation")
- keyChallenges: minimum 3 items — real operational and market pressures this company faces
- recentNews: include up to 5 items from the last 18 months; omit if nothing credible found
- leadership: include all C-suite and VP-level names you are confident about
- competitors: list 3–6 real named competitors, not generic descriptions

Output ONLY valid JSON — no markdown fences, no explanation — matching this exact schema:
{
  "companyName": "string",
  "industry": "string or null",
  "companySummary": "3-4 sentence description covering what they do, scale, and market position",
  "foundingYear": "string or null",
  "employeeCount": "string range e.g. 10000-50000 or null",
  "hqLocation": "string or null",
  "recentNews": [{ "headline": "string", "date": "ISO date or descriptive", "relevance": "string" }],
  "strategicPriorities": ["string"],
  "keyChallenges": ["string"],
  "leadership": [{ "name": "string", "role": "string" }],
  "fundingStage": "string or null",
  "competitors": ["string"],
  "technologyStack": ["string or null"],
  "sources": ["url strings extracted from web data"],
  "researchConfidence": "high|medium|low"
}`

async function gatherTavilyCompanyIntel(
  companyName: string,
  sectorHint: string,
  userId: string,
  jobId: string,
): Promise<string> {
  const tavilyKey = process.env.TAVILY_API_KEY
  if (!tavilyKey) return ''

  const toolset = new MCPToolset({
    type: 'StreamableHTTPConnectionParams',
    url: 'https://mcp.tavily.com/mcp/',
    transportOptions: {
      requestInit: {
        headers: { Authorization: `Bearer ${tavilyKey}` },
      },
    },
  })

  try {
    const agent = new LlmAgent({
      name: 'tavily_company_researcher',
      model: 'gemini-3.5-flash',
      instruction: TAVILY_SEARCH_INSTRUCTION,
      tools: [toolset],
    })

    const sessionSvc = new InMemorySessionService()
    const runner = new Runner({
      appName: 'nivedan-client-research',
      agent,
      sessionService: sessionSvc,
    })

    const prompt = `Research this company thoroughly for an RFP proposal we are preparing:

Company: ${companyName}
Sector: ${sectorHint || 'unknown'}

Search for: company overview, recent news (2024–2025), leadership team, strategic priorities,
key challenges, competitors, technology stack, and any known government contracts or RFP activity.
Return a rich prose summary with source URLs inline.`

    let finalText = ''
    for await (const event of runner.runEphemeral({
      userId,
      newMessage: { role: 'user', parts: [{ text: prompt }] },
    })) {
      for (const part of event.content?.parts ?? []) {
        if ('functionCall' in part && part.functionCall) {
          await updateJobActivity(jobId, `Tavily searching: ${companyName}…`)
        } else if ('functionResponse' in part && part.functionResponse) {
          await updateJobActivity(jobId, `Tavily: results received for ${companyName} — processing…`)
        } else if (part.text) {
          finalText = part.text
        }
      }
    }

    return finalText.trim()
  } catch {
    return ''
  } finally {
    await toolset.close()
  }
}

export interface ClientResearchInput {
  jobId: string
  userId: string
  pipelineDirective: PipelineDirective | null
  clientName?: string | null
}

export async function runClientResearch(input: ClientResearchInput): Promise<{ tavilySearchUsed: boolean; sourcesCount: number; confidence: string; companyName: string }> {
  const { jobId, userId } = input
  const startTime = Date.now()

  const runId = await createAgentRun(jobId, 3, 'client_research', 'gemini-3.5-flash')

  try {
    await updateCurrentAgent(jobId, 3)
    await updateJobActivity(jobId, 'Initialising client research…')

    const { pipelineDirective } = input

    let clientName = input.clientName ?? null
    if (!clientName) {
      const [jobRow] = await db
        .select({ clientName: rfpJobs.clientName })
        .from(rfpJobs)
        .where(eq(rfpJobs.id, jobId))
        .limit(1)
      clientName = jobRow?.clientName || null
    }

    const companyToResearch = clientName ?? 'the client company mentioned in the RFP'
    const focusAreas = pipelineDirective?.clientResearchFocus ?? [
      'recent-news',
      'strategic-priorities',
      'leadership',
    ]

    // Gather live web intel via Tavily MCP (best-effort — non-fatal on failure)
    let tavilyIntel = ''
    try {
      await updateJobActivity(jobId, `Tavily searching: ${companyToResearch}…`)
      tavilyIntel = await gatherTavilyCompanyIntel(
        companyToResearch,
        pipelineDirective?.sectorHint ?? '',
        userId ?? jobId,
        jobId,
      )
    } catch {
      // Non-fatal — proceed with LLM knowledge only
    }

    const webDataBlock = tavilyIntel
      ? `\n\n---\nLIVE WEB DATA (Tavily — treat as ground truth for facts and dates):\n${tavilyIntel}\n\nExtract all source URLs from the above and include them in the "sources" array of your JSON output.\n---`
      : ''

    const researchPrompt = `${CLIENT_RESEARCH_INSTRUCTION}

---
Research the following company for an RFP proposal we are preparing:

Company: ${companyToResearch}
Industry Sector: ${pipelineDirective?.sectorHint ?? 'unknown'}
Research Focus Areas: ${focusAreas.join(', ')}${webDataBlock}

Build the most comprehensive, specific client profile you can — covering company overview,
recent strategic priorities, leadership team, key challenges, competitive landscape,
technology preferences, and any known RFP or government contracting activity.

Return ONLY valid JSON matching the schema above.`

    await updateJobActivity(jobId, `Synthesising research for ${companyToResearch}…`)

    const result = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: [{ role: 'user', parts: [{ text: researchPrompt }] }],
      config: { temperature: 0.3, maxOutputTokens: 2048, responseMimeType: 'application/json' },
    })

    const raw = result.candidates?.[0]?.content?.parts?.[0]?.text ?? ''
    const cleaned = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()

    await updateJobActivity(jobId, 'Compiling research intelligence…')

    let clientProfile: Record<string, unknown>
    try {
      clientProfile = JSON.parse(cleaned)
    } catch {
      clientProfile = {
        companyName: companyToResearch,
        industry: pipelineDirective?.sectorHint ?? null,
        companySummary: null,
        recentNews: [],
        strategicPriorities: [],
        keyChallenges: [],
        leadership: null,
        fundingStage: null,
        competitors: null,
        sources: [],
        researchConfidence: 'low',
      }
    }

    const confidence = (clientProfile.researchConfidence as string) ?? 'low'
    await updateJobActivity(jobId, `Research complete — confidence: ${confidence}`)

    const sources = Array.isArray(clientProfile.sources)
      ? (clientProfile.sources as string[]).filter(s => typeof s === 'string' && s.length > 0)
      : []

    await db.insert(clientResearchData).values({
      rfpJobId: jobId,
      companyName: (clientProfile.companyName as string) || companyToResearch,
      industry: (clientProfile.industry as string) ?? null,
      companySummary: (clientProfile.companySummary as string) ?? null,
      recentNews: (clientProfile.recentNews as object[]) ?? null,
      strategicPriorities: (clientProfile.strategicPriorities as string[]) ?? null,
      keyChallenges: (clientProfile.keyChallenges as string[]) ?? null,
      leadership: (clientProfile.leadership as object[]) ?? null,
      fundingStage: (clientProfile.fundingStage as string) ?? null,
      competitors: (clientProfile.competitors as string[]) ?? null,
      sources,
      researchConfidence: confidence,
      tavilySearchUsed: sources.length > 0,
    })

    await completeAgentRun(runId, 0, 0, Date.now() - startTime)

    return {
      tavilySearchUsed: sources.length > 0,
      sourcesCount: sources.length,
      confidence,
      companyName: (clientProfile.companyName as string) || companyToResearch,
    }
  } catch (error) {
    await failAgentRun(runId, String(error))
    throw error
  }
}
