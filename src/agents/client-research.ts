import { GoogleGenAI } from '@google/genai'
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

const ai = new GoogleGenAI({ apiKey: process.env.GOOGLE_API_KEY!, apiVersion: 'v1alpha' })

const CLIENT_RESEARCH_INSTRUCTION = `
You are the Client Research Agent for Nivedan AI.

Your job is to build a comprehensive profile of a client company so that the downstream
Proposal Writer can craft a deeply tailored, relevant proposal.

Use everything you know about the company — its industry, business model, recent developments,
leadership, strategic priorities, key challenges, competitors, and funding stage.

If the company is a well-known enterprise (bank, government body, large corporation), provide
rich, accurate details. If it is obscure or private with limited public information, build a
reasonable profile from the RFP context and known industry patterns.

Rules:
- Never fabricate specific funding amounts, executive names, or news headlines you are not confident about
- If uncertain about a specific fact, omit it or mark it as approximate
- Assign researchConfidence: "high" if the company is well-known with rich data,
  "medium" if partial information is available, "low" if minimal data exists

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
  "sources": [],
  "researchConfidence": "high|medium|low"
}
`

import type { PipelineDirective } from './orchestrator'

export interface ClientResearchInput {
  jobId: string
  userId: string
  pipelineDirective: PipelineDirective | null
  clientName?: string | null
}

export async function runClientResearch(input: ClientResearchInput): Promise<{ googleSearchUsed: boolean; sourcesCount: number; confidence: string; companyName: string }> {
  const { jobId } = input
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

    const researchPrompt = `${CLIENT_RESEARCH_INSTRUCTION}

---
Research the following company for an RFP proposal we are preparing:

Company: ${companyToResearch}
Industry Sector: ${pipelineDirective?.sectorHint ?? 'unknown'}
Research Focus Areas: ${focusAreas.join(', ')}

Build a comprehensive client profile using your knowledge of this company.
Focus on: company overview, recent strategic priorities, leadership team, key challenges,
competitive landscape, and any known expansion or technology initiatives.

Return ONLY valid JSON matching the schema above.`

    await updateJobActivity(jobId, `Researching: ${companyToResearch} — priorities, leadership, challenges…`)

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
      sources: [],
      researchConfidence: confidence,
      googleSearchUsed: false,
    })

    await completeAgentRun(runId, 0, 0, Date.now() - startTime)

    return {
      googleSearchUsed: false,
      sourcesCount: 0,
      confidence,
      companyName: (clientProfile.companyName as string) || companyToResearch,
    }
  } catch (error) {
    await failAgentRun(runId, String(error))
    throw error
  }
}
