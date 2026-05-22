import { GoogleGenAI } from '@google/genai'
import { eq } from 'drizzle-orm'
import { db } from '@/db'
import { parsedRfpData, clientResearchData, capabilityMatches, proposals } from '@/db/schema'
import { sessionService } from '@/lib/adk/session'
import {
  createAgentRun,
  completeAgentRun,
  failAgentRun,
  updateCurrentAgent,
  updateJobActivity,
} from '@/db/helpers/job-status'

const ai = new GoogleGenAI({ apiKey: process.env.GOOGLE_API_KEY!, apiVersion: 'v1alpha' })

const WRITER_INSTRUCTION = `You are the Proposal Writer Agent for Nivedan AI.

Your job is to write a complete, submission-ready RFP proposal that is deeply tailored to the
specific client and their stated requirements. You must weave client intelligence throughout —
references to their strategic priorities, recent news, and known challenges should appear naturally
in the proposal, not as an afterthought.

You will receive:
- RFP Blueprint: mandatory requirements, budget, deadline, evaluation criteria
- Client Profile: company summary, recent news, strategic priorities, key challenges, leadership
- Capability Matches: how each requirement maps to the company's knowledge base (or is a gap)

Writing rules:
- Every section must reference the specific client by name
- For each matched requirement: cite the knowledge base evidence in the relevant section
- For each gap: write confidently — propose a credible approach, timeline, or mitigation
- Do NOT write generic filler — every paragraph must be specific to this client and this RFP
- Tone: professional, confident, consultative — not salesy or generic
- Budget and timeline must stay within the RFP's stated constraints
- Use "we" voice — the proposal is from the vendor company

Output ONLY valid JSON — no markdown fences, no explanation — matching this exact schema:
{
  "executiveSummary": "3-5 paragraphs — client challenge, our understanding, value proposition",
  "understandingOfRequirements": "structured breakdown of all mandatory requirements and how we address each",
  "proposedSolution": "detailed solution narrative — architecture, methodology, approach",
  "technicalApproach": "technical depth — stack, integrations, security, scalability, deployment",
  "caseStudies": "2-3 relevant past projects with outcomes and metrics — tie to client's industry/challenges",
  "teamAndExpertise": "key team members, roles, qualifications, relevant experience",
  "projectTimeline": "phase-by-phase breakdown within the RFP deadline — milestones, deliverables",
  "pricingStructure": "itemised pricing within budget ceiling — phases, optional add-ons, payment terms"
}`

export interface ProposalWriterInput {
  jobId: string
  userId: string
}

interface ProposalSections {
  executiveSummary?: string
  understandingOfRequirements?: string
  proposedSolution?: string
  technicalApproach?: string
  caseStudies?: string
  teamAndExpertise?: string
  projectTimeline?: string
  pricingStructure?: string
}

function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length
}

export async function runProposalWriter(input: ProposalWriterInput): Promise<void> {
  const { jobId, userId } = input
  const startTime = Date.now()

  const runId = await createAgentRun(jobId, 5, 'proposal_writer', 'gemini-3.1-pro-preview')

  try {
    await updateCurrentAgent(jobId, 5)
    await updateJobActivity(jobId, 'Drafting 8-section proposal…')

    const session = await sessionService.getSession({
      appName: 'nivedanai',
      userId,
      sessionId: jobId,
    })

    if (!session?.state) {
      await failAgentRun(runId, 'Pipeline session missing')
      throw new Error('Pipeline session missing')
    }

    // Fetch all source data in parallel
    const [rfpRows, clientRows, matchRows] = await Promise.all([
      db.select().from(parsedRfpData).where(eq(parsedRfpData.rfpJobId, jobId)).limit(1),
      db.select().from(clientResearchData).where(eq(clientResearchData.rfpJobId, jobId)).limit(1),
      db.select().from(capabilityMatches).where(eq(capabilityMatches.rfpJobId, jobId)),
    ])

    if (!rfpRows[0]) {
      await failAgentRun(runId, 'parsed_rfp_data not found — run RFP Parser first')
      throw new Error('parsed_rfp_data not found')
    }

    const rfp = rfpRows[0]
    const client = clientRows[0] ?? null
    const matches = matchRows

    const writerPrompt = `${WRITER_INSTRUCTION}

---
RFP BLUEPRINT:
${JSON.stringify({
  mandatoryRequirements: rfp.mandatoryRequirements,
  optionalRequirements: rfp.optionalRequirements,
  budgetCeiling: rfp.budgetCeiling,
  submissionDeadline: rfp.submissionDeadline,
  projectTimeline: rfp.projectTimeline,
  evaluationCriteria: rfp.evaluationCriteria,
  vendorQualifications: rfp.vendorQualifications,
  complianceRequirements: rfp.complianceRequirements,
  rawSummary: rfp.rawSummary,
}, null, 2)}

---
CLIENT PROFILE:
${JSON.stringify({
  companyName: client?.companyName,
  industry: client?.industry,
  companySummary: client?.companySummary,
  recentNews: client?.recentNews,
  strategicPriorities: client?.strategicPriorities,
  keyChallenges: client?.keyChallenges,
  leadership: client?.leadership,
  fundingStage: client?.fundingStage,
  researchConfidence: client?.researchConfidence,
}, null, 2)}

---
CAPABILITY MATCHES (${matches.length} requirements):
${JSON.stringify(
  matches.map(m => ({
    requirementText: m.requirementText,
    matchSummary: m.matchSummary,
    confidenceScore: m.confidenceScore,
    isGap: m.isGap,
    gapSuggestion: m.gapSuggestion,
  })),
  null,
  2
)}

---
Return ONLY valid JSON matching the 8-section schema in your instructions.`

    const result = await ai.models.generateContent({
      model: 'gemini-3.1-pro-preview',
      contents: [{ role: 'user', parts: [{ text: writerPrompt }] }],
      config: {
        temperature: 0.7,
        maxOutputTokens: 8192,
      },
    })

    const raw = result.candidates?.[0]?.content?.parts?.[0]?.text ?? ''
    const cleaned = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()

    let sections: ProposalSections = {}

    try {
      sections = JSON.parse(cleaned)
    } catch {
      // Graceful degradation — store raw output in executiveSummary, other sections null
      sections = { executiveSummary: raw || 'Proposal generation encountered an error. Please retry.' }
    }

    await updateJobActivity(jobId, 'Proposal draft complete')
    const allText = Object.values(sections).filter(Boolean).join(' ')
    const wordCount = countWords(allText)

    const [inserted] = await db
      .insert(proposals)
      .values({
        rfpJobId: jobId,
        version: 1,
        isApproved: false,
        executiveSummary: sections.executiveSummary ?? null,
        understandingOfRequirements: sections.understandingOfRequirements ?? null,
        proposedSolution: sections.proposedSolution ?? null,
        technicalApproach: sections.technicalApproach ?? null,
        caseStudies: sections.caseStudies ?? null,
        teamAndExpertise: sections.teamAndExpertise ?? null,
        projectTimeline: sections.projectTimeline ?? null,
        pricingStructure: sections.pricingStructure ?? null,
        wordCount,
      })
      .returning({ id: proposals.id })

    Object.assign(session.state, { proposalDraftId: inserted.id })

    await completeAgentRun(runId, 0, 0, Date.now() - startTime)
  } catch (error) {
    await failAgentRun(runId, String(error))
    throw error
  }
}
