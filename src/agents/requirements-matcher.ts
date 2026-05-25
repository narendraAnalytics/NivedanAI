import { GoogleGenAI } from '@google/genai'
import { MCPToolset, LlmAgent, Runner, InMemorySessionService } from '@google/adk'
import { eq } from 'drizzle-orm'
import { db } from '@/db'
import { parsedRfpData, capabilityMatches } from '@/db/schema'
import { knowledgeBaseItems } from '@/db/schema'
import {
  createAgentRun,
  completeAgentRun,
  failAgentRun,
  updateCurrentAgent,
  updateJobActivity,
} from '@/db/helpers/job-status'

const ai = new GoogleGenAI({ apiKey: process.env.GOOGLE_API_KEY!, apiVersion: 'v1alpha' })

const TAVILY_EVIDENCE_INSTRUCTION = `You are a research assistant helping match RFP requirements to vendor capabilities.

For each RFP requirement given, use the search tool to find ONE relevant real-world example, industry standard, or proof point that a vendor could use to demonstrate they meet that requirement.

After searching, return ONLY a valid JSON array — no markdown, no explanation:
[
  {
    "requirementId": "exact id from the requirement",
    "evidence": "1-2 sentences summarising what you found, including the source URL"
  }
]

If search yields nothing useful for a requirement, omit it from the array.`

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

async function gatherTavilyEvidence(
  requirements: Requirement[],
  userId: string,
  jobId: string,
): Promise<Map<string, string>> {
  const tavilyKey = process.env.TAVILY_API_KEY
  if (!tavilyKey) return new Map()

  // LlmAgent reads GOOGLE_GENAI_API_KEY; alias from the env var used by the rest of the pipeline
  process.env.GOOGLE_GENAI_API_KEY ??= process.env.GOOGLE_API_KEY

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
      name: 'tavily_evidence_gatherer',
      model: 'gemini-3.1-flash-lite',
      instruction: TAVILY_EVIDENCE_INSTRUCTION,
      tools: [toolset],
    })

    const sessionSvc = new InMemorySessionService()
    const runner = new Runner({
      appName: 'nivedan-rm-evidence',
      agent,
      sessionService: sessionSvc,
    })

    const reqList = requirements
      .map(r => `- ID: ${r.id}\n  Requirement: ${r.text}`)
      .join('\n')
    const prompt = `Search for real-world evidence for each of these RFP requirements and return the JSON array:\n\n${reqList}`

    let finalText = ''
    for await (const event of runner.runEphemeral({
      userId,
      newMessage: { role: 'user', parts: [{ text: prompt }] },
    })) {
      for (const part of event.content?.parts ?? []) {
        if ('functionCall' in part && part.functionCall) {
          await updateJobActivity(jobId, 'Tavily MCP: searching for evidence…')
        } else if ('functionResponse' in part && part.functionResponse) {
          await updateJobActivity(jobId, 'Tavily MCP: evidence received, processing…')
        } else if (part.text) {
          finalText = part.text
        }
      }
    }

    const cleaned = finalText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
    const parsed = JSON.parse(cleaned) as Array<{ requirementId: string; evidence: string }>

    const map = new Map<string, string>()
    for (const entry of parsed) {
      if (entry.requirementId && entry.evidence) map.set(entry.requirementId, entry.evidence)
    }
    return map
  } catch {
    return new Map()
  } finally {
    await toolset.close()
  }
}

export interface RequirementsMatcherInput {
  jobId: string
  userId: string
  companyProfileId: string
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
  tavilyEvidence: string | null
}

export async function runRequirementsMatcher(input: RequirementsMatcherInput): Promise<{ totalRequirements: number; matchedCount: number; gapCount: number; tavilyEvidenceCount: number; avgConfidence: number }> {
  const { jobId, userId, companyProfileId } = input
  const startTime = Date.now()

  const runId = await createAgentRun(jobId, 4, 'requirements_matcher', 'gemini-3.1-flash-lite')

  try {
    await updateCurrentAgent(jobId, 4)

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
    await updateJobActivity(jobId, `Loaded ${activeKbItems.length} KB items — matching ${mandatoryRequirements.length} requirements…`)

    const kbSummary = activeKbItems.map(item => ({
      id: item.id,
      type: item.type,
      title: item.title,
      description: item.description,
      tags: item.tags ?? [],
      industry: item.industry,
    }))

    // Gather web evidence via Tavily MCP (best-effort — silently skipped on failure)
    let tavilyEvidence = new Map<string, string>()
    try {
      await updateJobActivity(jobId, 'Searching web for requirement evidence via Tavily MCP…')
      tavilyEvidence = await gatherTavilyEvidence(mandatoryRequirements, userId, jobId)
      if (tavilyEvidence.size > 0) {
        await updateJobActivity(jobId, `Web evidence gathered for ${tavilyEvidence.size} requirements — matching against KB…`)
      }
    } catch {
      // Non-fatal — proceed with KB-only matching
    }

    const matches: MatchResult[] = []

    // Match each mandatory requirement against KB
    for (let i = 0; i < mandatoryRequirements.length; i++) {
      const req = mandatoryRequirements[i]
      if (i % 5 === 0) {
        await updateJobActivity(jobId, `Matching requirement ${i + 1} / ${mandatoryRequirements.length}…`)
      }

      const webEvidence = tavilyEvidence.get(req.id)
      const evidenceBlock = webEvidence
        ? `\n\n---\nWEB EVIDENCE (Tavily MCP):\n${webEvidence}\n\nUse this evidence to strengthen your matchSummary if relevant.`
        : ''

      const matchPrompt = `${MATCHER_INSTRUCTION}

---
REQUIREMENT:
${JSON.stringify(req, null, 2)}

---
KNOWLEDGE BASE ITEMS (${activeKbItems.length} total):
${JSON.stringify(kbSummary, null, 2)}${evidenceBlock}

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
        tavilyEvidence: tavilyEvidence.get(req.id) ?? null,
      })
    }

    const matched = matches.filter(m => !m.isGap).length
    const gaps = matches.filter(m => m.isGap).length
    await updateJobActivity(jobId, `Matched ${matched} / ${matches.length} — ${gaps} gaps identified`)

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
          tavilyEvidence: m.tavilyEvidence,
        }))
      )
    }

    await completeAgentRun(runId, 0, 0, Date.now() - startTime)

    const avgConfidence = matches.length > 0
      ? Math.round((matches.reduce((sum, m) => sum + m.confidenceScore, 0) / matches.length) * 100) / 100
      : 0

    return {
      totalRequirements: matches.length,
      matchedCount: matched,
      gapCount: gaps,
      tavilyEvidenceCount: tavilyEvidence.size,
      avgConfidence,
    }
  } catch (error) {
    await failAgentRun(runId, String(error))
    throw error
  }
}
