import { GoogleGenAI } from '@google/genai'
import { eq } from 'drizzle-orm'
import { db } from '@/db'
import { parsedRfpData, proposals } from '@/db/schema'
import {
  createAgentRun,
  completeAgentRun,
  failAgentRun,
  updateCurrentAgent,
  updateJobActivity,
  updateJobStatus,
} from '@/db/helpers/job-status'

const ai = new GoogleGenAI({ apiKey: process.env.GOOGLE_API_KEY!, apiVersion: 'v1alpha' })

const REVIEW_INSTRUCTION = `You are the Quality Review Agent for Nivedan AI.

Your job is to validate a written proposal against the original RFP requirements and constraints,
identify any issues, and provide corrected section text where needed.

Validation checklist — check ALL of these:
1. Every mandatory requirement from the RFP is addressed somewhere in the proposal
2. The project timeline does not exceed the RFP submission deadline
3. The proposed pricing does not exceed the RFP budget ceiling
4. No section contradicts another (e.g. team size in team section matches timeline assumptions)
5. No generic filler — every paragraph references the specific client by name or their known context

For each issue found:
- Identify which section has the problem
- Describe the issue concisely
- Provide a complete, corrected rewrite of that section

Calculate qualityScore (0.00-1.00):
- 0.90-1.00: no issues found, proposal is submission-ready
- 0.70-0.89: minor issues, corrections applied
- 0.50-0.69: significant gaps or conflicts, multiple corrections applied
- below 0.50: major structural problems

Output ONLY valid JSON — no markdown fences, no explanation:
{
  "validationPassed": true,
  "qualityScore": 0.87,
  "qualityReviewNotes": "string — 2-3 sentence summary of overall review",
  "corrections": [
    {
      "section": "projectTimeline",
      "issue": "Proposed 8-month timeline exceeds the 6-month RFP deadline",
      "fix": "Full corrected section text..."
    }
  ]
}

Valid section names: executiveSummary, understandingOfRequirements, proposedSolution,
technicalApproach, caseStudies, teamAndExpertise, projectTimeline, pricingStructure`

type SectionKey =
  | 'executiveSummary'
  | 'understandingOfRequirements'
  | 'proposedSolution'
  | 'technicalApproach'
  | 'caseStudies'
  | 'teamAndExpertise'
  | 'projectTimeline'
  | 'pricingStructure'

const SECTION_KEYS = new Set<string>([
  'executiveSummary',
  'understandingOfRequirements',
  'proposedSolution',
  'technicalApproach',
  'caseStudies',
  'teamAndExpertise',
  'projectTimeline',
  'pricingStructure',
])

export interface QualityReviewInput {
  jobId: string
  userId: string
}

export async function runQualityReview(input: QualityReviewInput): Promise<void> {
  const { jobId, userId } = input
  const startTime = Date.now()

  const runId = await createAgentRun(jobId, 6, 'quality_review', 'gemini-3.1-flash-lite')

  try {
    await updateCurrentAgent(jobId, 6)
    await updateJobActivity(jobId, 'Running 5 quality checks…')

    const [latestProposal] = await db
      .select({ id: proposals.id })
      .from(proposals)
      .where(eq(proposals.rfpJobId, jobId))
      .limit(1)

    const proposalDraftId = latestProposal?.id ?? null

    if (!proposalDraftId) {
      await failAgentRun(runId, 'No proposals row found — Proposal Writer may have failed')
      throw new Error('No proposals row found for this job')
    }

    // Fetch proposal and RFP data in parallel
    const [proposalRows, rfpRows] = await Promise.all([
      db.select().from(proposals).where(eq(proposals.id, proposalDraftId)).limit(1),
      db.select().from(parsedRfpData).where(eq(parsedRfpData.rfpJobId, jobId)).limit(1),
    ])

    if (!proposalRows[0]) {
      await failAgentRun(runId, 'proposals row not found')
      throw new Error('proposals row not found')
    }

    const proposal = proposalRows[0]
    const rfp = rfpRows[0] ?? null

    const reviewPrompt = `${REVIEW_INSTRUCTION}

---
RFP CONSTRAINTS:
${JSON.stringify({
  mandatoryRequirements: rfp?.mandatoryRequirements ?? [],
  budgetCeiling: rfp?.budgetCeiling ?? null,
  submissionDeadline: rfp?.submissionDeadline ?? null,
  projectTimeline: rfp?.projectTimeline ?? null,
  evaluationCriteria: rfp?.evaluationCriteria ?? null,
  complianceRequirements: rfp?.complianceRequirements ?? null,
}, null, 2)}

---
PROPOSAL SECTIONS:
${JSON.stringify({
  executiveSummary: proposal.executiveSummary,
  understandingOfRequirements: proposal.understandingOfRequirements,
  proposedSolution: proposal.proposedSolution,
  technicalApproach: proposal.technicalApproach,
  caseStudies: proposal.caseStudies,
  teamAndExpertise: proposal.teamAndExpertise,
  projectTimeline: proposal.projectTimeline,
  pricingStructure: proposal.pricingStructure,
}, null, 2)}

---
Return ONLY valid JSON matching the schema in your instructions.`

    const result = await ai.models.generateContent({
      model: 'gemini-3.1-flash-lite',
      contents: [{ role: 'user', parts: [{ text: reviewPrompt }] }],
      config: { temperature: 0.1, maxOutputTokens: 4096 },
    })

    const raw = result.candidates?.[0]?.content?.parts?.[0]?.text ?? ''
    const cleaned = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()

    let reviewData: {
      validationPassed?: boolean
      qualityScore?: number
      qualityReviewNotes?: string
      corrections?: Array<{ section: string; issue: string; fix: string }>
    } = {}

    try {
      reviewData = JSON.parse(cleaned)
    } catch {
      // Graceful degradation — mark for human review, do not crash pipeline
      reviewData = {
        validationPassed: false,
        qualityScore: 0.5,
        qualityReviewNotes: 'Automated review could not complete — manual review required.',
        corrections: [],
      }
    }

    await updateJobActivity(jobId, 'Quality validated — proposal scored')
    const qualityScore = typeof reviewData.qualityScore === 'number' ? reviewData.qualityScore : 0.5
    const qualityReviewNotes = reviewData.qualityReviewNotes ?? 'Review complete.'
    const corrections = reviewData.corrections ?? []

    // Build update payload — start with review metadata
    const updatePayload: Record<string, string | null> = {
      qualityReviewNotes,
      qualityScore: String(qualityScore),
    }

    // Apply section corrections from the review
    for (const correction of corrections) {
      if (SECTION_KEYS.has(correction.section) && correction.fix) {
        updatePayload[correction.section as SectionKey] = correction.fix
      }
    }

    await db.update(proposals).set(updatePayload).where(eq(proposals.id, proposalDraftId))

    // Mark job as awaiting human review — pipeline pauses here for HITL
    await updateJobStatus(jobId, 'awaiting_review')

    await completeAgentRun(runId, 0, 0, Date.now() - startTime)
  } catch (error) {
    await failAgentRun(runId, String(error))
    throw error
  }
}
