import { LlmAgent, Runner, InMemorySessionService } from '@google/adk'
import { eq } from 'drizzle-orm'
import { db } from '@/db'
import { clientResearchData, rfpJobs } from '@/db/schema'
import { searchAgent } from './search-agent'
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
1. Use the search_agent to execute targeted searches about the company.
   Search for: recent news, funding rounds, strategic priorities, leadership, expansion plans,
   product launches, competitive position, key challenges, market movements.
2. Synthesise all search results into a structured Client Profile JSON.
3. Assign researchConfidence: "high" if rich data found, "medium" if partial, "low" if minimal.

Rules:
- Delegate ALL web lookups to search_agent — never rely on training data for current facts
- Never fabricate news, funding amounts, or executive names
- If a search returns nothing, note it and continue — do not crash
- If the company is private/obscure and little data exists, build a minimal profile from what is in the RFP itself
- Sources must be real URLs returned by search_agent — never invented

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
  model: 'gemini-3.1-flash',
  description: 'Researches client company intelligence using live web search for proposal tailoring.',
  instruction: CLIENT_RESEARCH_INSTRUCTION,
  subAgents: [searchAgent],
  generateContentConfig: { temperature: 0.3 },
})

import type { PipelineDirective } from './orchestrator'

export interface ClientResearchInput {
  jobId: string
  userId: string
  pipelineDirective: PipelineDirective | null
}

export async function runClientResearch(input: ClientResearchInput): Promise<void> {
  const { jobId, userId } = input
  const startTime = Date.now()

  const runId = await createAgentRun(jobId, 3, 'client_research', 'gemini-3.1-flash')

  try {
    await updateCurrentAgent(jobId, 3)
    await updateJobActivity(jobId, 'Initialising web research…')

    const { pipelineDirective } = input

    const [jobRow] = await db
      .select({ clientName: rfpJobs.clientName })
      .from(rfpJobs)
      .where(eq(rfpJobs.id, jobId))
      .limit(1)

    const clientName = jobRow?.clientName ?? null

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

Use search_agent to find current intelligence about this company.
Search for: recent news, funding, strategic priorities, leadership changes, expansion plans, competitive landscape.

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
  } catch (error) {
    await failAgentRun(runId, String(error))
    throw error
  }
}
