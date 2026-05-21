import { GoogleGenAI } from '@google/genai'
import { eq } from 'drizzle-orm'
import { inngest } from '@/inngest/client'
import { db } from '@/db'
import { parsedRfpData, clientResearchData, capabilityMatches, proposals } from '@/db/schema'
import { runQualityReview } from '@/agents/quality-review'
import { updateJobStatus } from '@/db/helpers/job-status'

const ai = new GoogleGenAI({ apiKey: process.env.GOOGLE_API_KEY!, apiVersion: 'v1alpha' })

const VALID_SECTIONS = new Set([
  'executiveSummary',
  'understandingOfRequirements',
  'proposedSolution',
  'technicalApproach',
  'caseStudies',
  'teamAndExpertise',
  'projectTimeline',
  'pricingStructure',
])

export const handleHitlChanges = inngest.createFunction(
  {
    id: 'handle-hitl-changes',
    triggers: [{ event: 'nivedan/hitl.changes.requested' }],
  },
  async ({ event, step }) => {
    const { jobId, proposalId, flaggedSections, feedbackText, userId } = event.data

    await step.run('rewrite-flagged-sections', async () => {
      const [proposalRows, rfpRows, clientRows, matchRows] = await Promise.all([
        db.select().from(proposals).where(eq(proposals.id, proposalId)).limit(1),
        db.select().from(parsedRfpData).where(eq(parsedRfpData.rfpJobId, jobId)).limit(1),
        db.select().from(clientResearchData).where(eq(clientResearchData.rfpJobId, jobId)).limit(1),
        db.select().from(capabilityMatches).where(eq(capabilityMatches.rfpJobId, jobId)),
      ])

      if (!proposalRows[0]) return

      const proposal = proposalRows[0]
      const rfp = rfpRows[0] ?? null
      const client = clientRows[0] ?? null
      const matches = matchRows

      const sectionsToRewrite = flaggedSections.filter((s: string) => VALID_SECTIONS.has(s))
      if (sectionsToRewrite.length === 0) return

      const currentSections = Object.fromEntries(
        sectionsToRewrite.map((s: string) => [s, (proposal as Record<string, unknown>)[s] ?? ''])
      )

      const rewritePrompt = `You are the Proposal Writer Agent for Nivedan AI.

The user has reviewed the proposal and requested specific changes. Your job is to rewrite ONLY the
flagged sections incorporating the user's feedback.

User Feedback:
${feedbackText}

Sections to rewrite: ${sectionsToRewrite.join(', ')}

Current content of flagged sections:
${JSON.stringify(currentSections, null, 2)}

Context (for reference):
- RFP Requirements: ${JSON.stringify(rfp?.mandatoryRequirements ?? [], null, 2)}
- Client: ${client?.companyName ?? 'unknown'} — ${client?.companySummary ?? ''}
- Capability matches (${matches.length} total)

Rules:
- Rewrite ONLY the flagged sections — do not touch others
- Address the user's feedback directly
- Maintain the professional, client-specific tone of the original
- Keep within RFP constraints (deadline: ${rfp?.submissionDeadline ?? 'not specified'}, budget: ${rfp?.budgetCeiling ?? 'not specified'})

Output ONLY valid JSON — no markdown fences — matching this schema (include only the flagged sections):
{
  ${sectionsToRewrite.map((s: string) => `"${s}": "rewritten section text"`).join(',\n  ')}
}`

      const result = await ai.models.generateContent({
        model: 'gemini-3.1-flash-lite',
        contents: [{ role: 'user', parts: [{ text: rewritePrompt }] }],
        config: { temperature: 0.5, maxOutputTokens: 4096 },
      })

      const raw = result.candidates?.[0]?.content?.parts?.[0]?.text ?? ''
      const cleaned = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()

      let rewritten: Record<string, string> = {}
      try {
        rewritten = JSON.parse(cleaned)
      } catch {
        // If parse fails, skip the rewrite — quality review will still run
        return
      }

      const updatePayload: Record<string, string> = {}
      for (const section of sectionsToRewrite) {
        if (rewritten[section]) updatePayload[section] = rewritten[section]
      }

      if (Object.keys(updatePayload).length > 0) {
        await db.update(proposals).set(updatePayload).where(eq(proposals.id, proposalId))
      }
    })

    await step.run('re-run-quality-review', async () => {
      await runQualityReview({ jobId, userId })
    })

    // Quality review sets status to 'awaiting_review' — pipeline remains paused for next approval
  }
)
