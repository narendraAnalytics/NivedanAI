import { eq } from 'drizzle-orm'
import { GoogleGenAI } from '@google/genai'
import { db } from '@/db'
import { rfpJobs, companyProfiles } from '@/db/schema'
import { sessionService } from '@/lib/adk/session'
import {
  updateJobStatus,
  updateCurrentAgent,
  updateJobActivity,
  createAgentRun,
  completeAgentRun,
  failAgentRun,
} from '@/db/helpers/job-status'

const ai = new GoogleGenAI({ apiKey: process.env.GOOGLE_API_KEY!, apiVersion: 'v1alpha' })

const ORCHESTRATOR_DESCRIPTION = `
Root orchestration agent and central execution controller for Nivedan AI.
Responsible for: workflow coordination, session continuity, execution state management,
context optimization, multi-agent pipeline initialization, and intelligent pipeline
directive generation that maximizes proposal quality for every downstream agent.
`

const ORCHESTRATOR_INSTRUCTION = `
You are the Orchestrator Agent — the operational brain and root controller of Nivedan AI.

Your purpose is to analyze the incoming job context and produce a precise, intelligent
pipeline directive that will guide 5 downstream agents to generate a winning RFP proposal.

Core responsibilities:

1. Initialize workflow sessions with complete execution context.
2. Maintain execution continuity across the full 6-agent pipeline.
3. Route context and priorities to downstream agents.
4. Decide complexity level and execution emphasis.
5. Track pipeline execution priorities based on company and RFP context.
6. Maintain shared workflow state with rich initial metadata.
7. Detect signals of high-risk areas (compliance, tight deadlines, large budgets).
8. Prevent pipeline failures by surfacing risks early.
9. Optimize context: compress what's known, flag what needs deeper research.
10. Ensure downstream agents receive clear, actionable directives.
11. Maintain structured, enterprise-grade execution quality.
12. Maximize proposal win probability through intelligent pipeline direction.

Workflow ownership and what each downstream agent needs from you:

Step 1 → RFP Parser Agent
- Needs: sector hints, document complexity signals, what types of requirements to prioritize

Step 2 → Client Research Agent
- Needs: company name to research, strategic context, which intelligence areas matter most

Step 3 → Requirements Matcher Agent
- Needs: focus areas, capability gaps to watch for, which KB item types are most relevant

Step 4 → Proposal Writer Agent
- Needs: tone guidance, sections to emphasize, client-specific framing directives

Step 5 → Quality Review Agent
- Needs: known risks, compliance flags, timeline/budget ceiling constraints to enforce

Execution rules:

- Never generate proposal sections directly.
- Never bypass or substitute for downstream agents.
- Never fabricate data you do not have — use 'unknown' when uncertain.
- Always surface every compliance, deadline, and budget risk signal you detect.
- Always compress context: pass only what downstream agents need.
- Assign complexity based on RFP document URL signals and company profile.
- If industry is unknown, infer it from company name patterns.
- priorityFlags must reflect real execution risks, not generic advice.
- focusAreas must map to actual KB item types: case_study, certification, team_bio, past_proposal, technology, testimonial.
- orchestratorNotes must contain actionable intelligence, not filler.

You are the execution brain of Nivedan AI. Every decision you make here affects proposal quality.
`

interface PipelineDirective {
  sectorHint: string
  complexityLevel: 'low' | 'medium' | 'high'
  priorityFlags: string[]
  focusAreas: string[]
  clientResearchFocus: string[]
  proposalTone: 'formal' | 'consultative' | 'technical' | 'partnership'
  orchestratorNotes: string
}

export interface OrchestratorInput {
  jobId: string
  userId: string
  rfpDocumentUrl: string
  companyProfileId: string
  inngestRunId: string
}

export async function runOrchestrator(input: OrchestratorInput): Promise<void> {
  const { jobId, userId, rfpDocumentUrl, companyProfileId, inngestRunId } = input
  const startTime = Date.now()

  const runId = await createAgentRun(jobId, 1, 'orchestrator', 'gemini-3.1-pro-preview')

  try {
    await Promise.all([
      updateJobStatus(jobId, 'running'),
      updateCurrentAgent(jobId, 1),
      updateJobActivity(jobId, 'Validating inputs & routing pipeline…'),
      db
        .update(rfpJobs)
        .set({ inngestRunId, startedAt: new Date(), updatedAt: new Date() })
        .where(eq(rfpJobs.id, jobId)),
    ])

    // Validate: company profile exists
    const [profile] = await db
      .select()
      .from(companyProfiles)
      .where(eq(companyProfiles.id, companyProfileId))
      .limit(1)
    if (!profile) throw new Error(`Company profile not found: ${companyProfileId}`)

    // Validate: RFP URL accessible
    const urlCheck = await fetch(rfpDocumentUrl, { method: 'HEAD' })
    if (!urlCheck.ok) throw new Error(`RFP URL not accessible: ${rfpDocumentUrl} (${urlCheck.status})`)

    const prompt = `${ORCHESTRATOR_DESCRIPTION.trim()}

${ORCHESTRATOR_INSTRUCTION.trim()}

---

CURRENT JOB CONTEXT:
- Job ID: ${jobId}
- Company Name: ${profile.companyName}
- Company Industry: ${profile.industry ?? 'unknown — infer from company name'}
- Company Website: ${profile.website ?? 'not provided'}
- Company Tagline: ${profile.tagline ?? 'not provided'}
- Team Size: ${profile.teamSize ?? 'not provided'}
- Founded Year: ${profile.foundedYear ?? 'not provided'}
- RFP Document URL: ${rfpDocumentUrl}

---

TASK:
Analyze this job context with your full intelligence and produce a pipeline directive
that will maximize the win probability of this proposal.

Return ONLY valid JSON — no markdown fences, no explanation text — matching this exact schema:
{
  "sectorHint": "primary industry sector of the RFP client (string)",
  "complexityLevel": "low | medium | high",
  "priorityFlags": ["array of execution risk strings, e.g. compliance-heavy, tight-deadline, large-budget, government-tender, multi-vendor-evaluation"],
  "focusAreas": ["KB item types to prioritize: case_study | certification | team_bio | past_proposal | technology | testimonial"],
  "clientResearchFocus": ["array of specific intelligence areas for Client Research Agent, e.g. recent-funding, leadership-changes, strategic-priorities, expansion-plans"],
  "proposalTone": "formal | consultative | technical | partnership",
  "orchestratorNotes": "2-3 sentences of actionable intelligence for downstream agents — specific to this company and RFP context"
}`

    const result = await ai.models.generateContent({
      model: 'gemini-3.1-pro-preview',
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      config: { temperature: 0.3, maxOutputTokens: 2048, responseMimeType: 'application/json' },
    })

    const raw = result.candidates?.[0]?.content?.parts?.[0]?.text ?? '{}'
    const cleaned = raw.replace(/```json\n?|\n?```/g, '').trim() || '{}'
    const pipelineDirective: PipelineDirective = JSON.parse(cleaned)

    const inputTokens = result.usageMetadata?.promptTokenCount ?? 0
    const outputTokens = result.usageMetadata?.candidatesTokenCount ?? 0

    // Create shared ADK session — ALL downstream agents read this state
    await sessionService.createSession({
      appName: 'nivedanai',
      userId,
      sessionId: jobId,
      state: {
        jobId,
        userId,
        rfpDocumentUrl,
        companyProfileId,
        companyName: profile.companyName,
        companyIndustry: profile.industry ?? null,
        companyWebsite: profile.website ?? null,
        pipelineDirective,
      },
    })

    await updateJobActivity(jobId, 'Session created — agents ready')
    await completeAgentRun(runId, inputTokens, outputTokens, Date.now() - startTime)
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error)
    await failAgentRun(runId, msg)
    await updateJobStatus(jobId, 'failed')
    await db
      .update(rfpJobs)
      .set({ errorMessage: msg, updatedAt: new Date() })
      .where(eq(rfpJobs.id, jobId))
    throw error
  }
}
