import { LlmAgent, GOOGLE_SEARCH, Runner, InMemorySessionService } from '@google/adk'
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

// ADK LlmAgent reads GOOGLE_GENAI_API_KEY, not GOOGLE_API_KEY — alias at module load
process.env.GOOGLE_GENAI_API_KEY ??= process.env.GOOGLE_API_KEY

const CLIENT_RESEARCH_INSTRUCTION = `
You are the Client Research Agent for Nivedan AI.

Your job is to build a comprehensive, intelligence-backed profile of a client company
so that the downstream Proposal Writer can craft a deeply tailored, relevant proposal.

Process:
1. Use the google_search tool to execute multiple targeted searches about the company.
   Run separate searches for: company overview, recent news, leadership, strategic priorities,
   funding rounds, expansion plans, product launches, competitive position, key challenges.
2. Synthesise all search results into a structured Client Profile JSON.
3. Assign researchConfidence: "high" if rich data found, "medium" if partial, "low" if minimal.

Rules:
- Use google_search for ALL web lookups — never rely on training data for current facts
- Never fabricate news, funding amounts, or executive names
- If a search returns nothing, note it and continue — do not crash
- If the company is private/obscure and little data exists, build a minimal profile from what is in the RFP itself
- Sources must be real URLs returned by google_search — never invented

Output ONLY valid JSON — no markdown fences, no explanation — matching this exact schema:
{
  "companyName": "string",
  "industry": "string or null",
  "companySummary": "2-3 sentence description or null",
  "recentNews": [{ "headline": "string", "date": "ISO date or descriptive", "relevance": "string" }],
  "strategicPriorities": ["string"],
  "keyChallenges": ["string"],
  "leadership": [{ "name": "string", "role": "string" }],
  "fundingStage": "string or null",
  "competitors": ["string"],
  "sources": ["url string"],
  "researchConfidence": "high|medium|low"
}
`

const clientResearchAgent = new LlmAgent({
  name: 'client_research',
  model: 'gemini-3.5-flash',
  description: 'Researches client company intelligence using live web search for proposal tailoring.',
  instruction: CLIENT_RESEARCH_INSTRUCTION,
  tools: [GOOGLE_SEARCH],
  generateContentConfig: { temperature: 0.3 },
})

import type { PipelineDirective } from './orchestrator'

export interface ClientResearchInput {
  jobId: string
  userId: string
  pipelineDirective: PipelineDirective | null
  clientName?: string | null
}

export async function runClientResearch(input: ClientResearchInput): Promise<{ googleSearchUsed: boolean; sourcesCount: number; confidence: string; companyName: string }> {
  const { jobId, userId } = input
  const startTime = Date.now()

  const runId = await createAgentRun(jobId, 3, 'client_research', 'gemini-3.1-flash')

  try {
    await updateCurrentAgent(jobId, 3)
    await updateJobActivity(jobId, 'Initialising web research…')

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

    const researchPrompt = `
Research the following company for an RFP proposal we are preparing:

Company: ${companyToResearch}
Industry Sector: ${pipelineDirective?.sectorHint ?? 'unknown'}
Research Focus Areas: ${focusAreas.join(', ')}

Use the google_search tool to find current intelligence about this company.
Run at least 2-3 searches to gather comprehensive data — search for: recent news, funding, strategic priorities, leadership changes, expansion plans, competitive landscape.

Return ONLY valid JSON matching the schema in your instructions.
`

    await updateJobActivity(jobId, `Searching: ${companyToResearch} — news, strategy, leadership…`)

    // Ephemeral session — no dependency on pipeline session persistence across Inngest steps
    const localSessionSvc = new InMemorySessionService()
    const runner = new Runner({
      appName: 'nivedan-client-research',
      agent: clientResearchAgent,
      sessionService: localSessionSvc,
    })

    let finalText = ''
    for await (const event of runner.runEphemeral({
      userId,
      newMessage: { role: 'user', parts: [{ text: researchPrompt }] },
    })) {
      for (const part of event.content?.parts ?? []) {
        if ('functionCall' in part && part.functionCall) {
          await updateJobActivity(jobId, `Google Search: querying "${companyToResearch}"…`)
        } else if ('functionResponse' in part && part.functionResponse) {
          await updateJobActivity(jobId, 'Google Search: analysing results…')
        } else if (part.text) {
          finalText = part.text
        }
      }
    }

    await updateJobActivity(jobId, 'Compiling research intelligence…')
    let clientProfile: Record<string, unknown>

    try {
      const cleaned = finalText
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .trim()
      clientProfile = JSON.parse(cleaned)
    } catch {
      // Graceful degradation — build minimal low-confidence profile
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
      sources: (clientProfile.sources as string[]) ?? null,
      researchConfidence: confidence,
      googleSearchUsed: Array.isArray(clientProfile.sources) && (clientProfile.sources as string[]).length > 0,
    })

    await completeAgentRun(runId, 0, 0, Date.now() - startTime)

    const sources = Array.isArray(clientProfile.sources) ? (clientProfile.sources as string[]) : []
    return {
      googleSearchUsed: sources.length > 0,
      sourcesCount: sources.length,
      confidence,
      companyName: (clientProfile.companyName as string) || companyToResearch,
    }
  } catch (error) {
    await failAgentRun(runId, String(error))
    throw error
  }
}
