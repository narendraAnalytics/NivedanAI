import { GoogleGenAI } from '@google/genai'
import { eq } from 'drizzle-orm'
import { db } from '@/db'
import { parsedRfpData, capabilityMatches } from '@/db/schema'
import { knowledgeBaseItems } from '@/db/schema'
import { sessionService } from '@/lib/adk/session'
import {
  createAgentRun,
  completeAgentRun,
  failAgentRun,
  updateCurrentAgent,
} from '@/db/helpers/job-status'

const ai = new GoogleGenAI({ apiKey: process.env.GOOGLE_API_KEY!, apiVersion: 'v1alpha' })

const MATCHER_INSTRUCTION = `You are the Requirements Matcher Agent for Nivedan AI.

Your job is to match a single RFP requirement against a company's knowledge base items
and determine how well the company can fulfil that requirement.

You will receive:
- The requirement (id, text, category, priority)
- A list of knowledge base items (case studies, certifications, team bios, past proposals, technologies, testimonials)

Rules:
- Pick the BEST matching knowledge base item if one exists — return its exact id
- If no KB item is relevant, return knowledgeBaseItemId: null
- Assign confidenceScore between 0.00 and 1.00:
  - 0.90-1.00: direct evidence, exact match
  - 0.70-0.89: strong indirect match
  - 0.50-0.69: partial match, some evidence
  - below 0.50: gap — no meaningful match
- If confidenceScore < 0.50: isGap must be true and gapSuggestion must describe what evidence is needed
- matchSummary: 1-2 sentence explanation of why this KB item matches (or null if no match)

Output ONLY valid JSON — no markdown fences, no explanation:
{
  "knowledgeBaseItemId": "uuid or null",
  "matchSummary": "string or null",
  "confidenceScore": 0.85,
  "isGap": false,
  "gapSuggestion": "string or null"
}`

export interface RequirementsMatcherInput {
  jobId: string
  userId: string
}

interface Requirement {
  id: string
  text: string
  category?: string
  priority?: string
}

interface MatchResult {
  requirementId: string
  requirementText: string
  knowledgeBaseItemId: string | null
  matchSummary: string | null
  confidenceScore: number
  isGap: boolean
  gapSuggestion: string | null
}

export async function runRequirementsMatcher(input: RequirementsMatcherInput): Promise<void> {
  const { jobId, userId } = input
  const startTime = Date.now()

  const runId = await createAgentRun(jobId, 4, 'requirements_matcher', 'gemini-3.1-flash-lite')

  try {
    await updateCurrentAgent(jobId, 4)

    const session = await sessionService.getSession({
      appName: 'nivedanai',
      userId,
      sessionId: jobId,
    })

    if (!session?.state) {
      await failAgentRun(runId, 'Pipeline session missing')
      throw new Error('Pipeline session missing')
    }

    const { companyProfileId } = session.state as { companyProfileId: string }

    if (!companyProfileId) {
      await failAgentRun(runId, 'companyProfileId missing from session state')
      throw new Error('companyProfileId missing from session state')
    }

    // Fetch parsed RFP data from Neon
    const [rfpData] = await db
      .select()
      .from(parsedRfpData)
      .where(eq(parsedRfpData.rfpJobId, jobId))
      .limit(1)

    if (!rfpData) {
      await failAgentRun(runId, 'parsed_rfp_data not found — run RFP Parser first')
      throw new Error('parsed_rfp_data not found')
    }

    const mandatoryRequirements = (rfpData.mandatoryRequirements as Requirement[]) ?? []

    // Fetch all active KB items for this company
    const kbItems = await db
      .select()
      .from(knowledgeBaseItems)
      .where(eq(knowledgeBaseItems.companyProfileId, companyProfileId))

    const activeKbItems = kbItems.filter(item => item.isActive)

    const kbSummary = activeKbItems.map(item => ({
      id: item.id,
      type: item.type,
      title: item.title,
      description: item.description,
      tags: item.tags ?? [],
      industry: item.industry,
    }))

    const matches: MatchResult[] = []

    // Match each mandatory requirement against KB
    for (const req of mandatoryRequirements) {
      const matchPrompt = `${MATCHER_INSTRUCTION}

---
REQUIREMENT:
${JSON.stringify(req, null, 2)}

---
KNOWLEDGE BASE ITEMS (${activeKbItems.length} total):
${JSON.stringify(kbSummary, null, 2)}

Return ONLY valid JSON matching the schema above.`

      let matchData: Partial<MatchResult> = {}

      try {
        const result = await ai.models.generateContent({
          model: 'gemini-3.1-flash-lite',
          contents: [{ role: 'user', parts: [{ text: matchPrompt }] }],
        })

        const raw = result.candidates?.[0]?.content?.parts?.[0]?.text ?? ''
        const cleaned = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
        matchData = JSON.parse(cleaned)
      } catch {
        // Graceful degradation — treat as gap if LLM call or parse fails
        matchData = {
          knowledgeBaseItemId: null,
          matchSummary: null,
          confidenceScore: 0,
          isGap: true,
          gapSuggestion: 'Match could not be determined — add relevant case studies or certifications to the knowledge base.',
        }
      }

      const confidenceScore = typeof matchData.confidenceScore === 'number'
        ? matchData.confidenceScore
        : 0

      const isGap = confidenceScore < 0.5 ? true : (matchData.isGap ?? false)

      // Validate knowledgeBaseItemId is one of the actual KB UUIDs
      const kbIdRaw = matchData.knowledgeBaseItemId ?? null
      const validKbId = kbIdRaw && activeKbItems.some(k => k.id === kbIdRaw) ? kbIdRaw : null

      matches.push({
        requirementId: req.id,
        requirementText: req.text,
        knowledgeBaseItemId: validKbId,
        matchSummary: (matchData.matchSummary as string) ?? null,
        confidenceScore,
        isGap,
        gapSuggestion: isGap ? ((matchData.gapSuggestion as string) ?? 'No matching evidence found in knowledge base.') : null,
      })
    }

    // Bulk insert capability_matches rows
    if (matches.length > 0) {
      await db.insert(capabilityMatches).values(
        matches.map(m => ({
          rfpJobId: jobId,
          requirementId: m.requirementId,
          requirementText: m.requirementText,
          knowledgeBaseItemId: m.knowledgeBaseItemId,
          matchSummary: m.matchSummary,
          confidenceScore: String(m.confidenceScore),
          isGap: m.isGap,
          gapSuggestion: m.gapSuggestion,
        }))
      )
    }

    Object.assign(session.state, {
      capabilityMatchSummary: {
        totalRequirements: matches.length,
        matched: matches.filter(m => !m.isGap).length,
        gaps: matches.filter(m => m.isGap).length,
      },
    })

    await completeAgentRun(runId, 0, 0, Date.now() - startTime)
  } catch (error) {
    await failAgentRun(runId, String(error))
    throw error
  }
}
