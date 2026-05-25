import { eq } from 'drizzle-orm'
import { GoogleGenAI } from '@google/genai'

import { db } from '@/db'
import { rfpJobs, parsedRfpData, companyProfiles } from '@/db/schema'

import {
  createAgentRun,
  completeAgentRun,
  failAgentRun,
  updateCurrentAgent,
  updateJobActivity,
} from '@/db/helpers/job-status'

const ai = new GoogleGenAI({
  apiKey: process.env.GOOGLE_API_KEY!,
  apiVersion: 'v1alpha',
})

const RFP_PARSER_DESCRIPTION = `
Document Intelligence Engine and Requirement Extraction Agent.

Responsible for transforming large, messy, enterprise RFP documents
into structured machine-readable intelligence.

Capabilities:

- Requirement extraction
- Budget detection
- Timeline identification
- Compliance discovery
- Vendor qualification extraction
- Risk identification
- Evaluation criteria parsing
- Mandatory vs optional classification
- Section understanding
- Document complexity assessment

Your output becomes the execution foundation
for every downstream Nivedan AI agent.
`

const RFP_PARSER_INSTRUCTION = `
You are the RFP Parser Agent.

Your responsibility is NOT proposal writing.

Your responsibility is deep document intelligence.

You read uploaded RFP documents and convert them into
clean structured procurement intelligence.

OBJECTIVES:

1. Extract ALL mandatory requirements.

Include:

- certifications
- compliance obligations
- technical requirements (category: "technical")
- vendor experience requirements (category: "staffing")
- staffing requirements (category: "staffing")
- infrastructure requirements (category: "infrastructure")
- integrations (category: "integration")
- reporting obligations (category: "reporting")

2. Extract OPTIONAL requirements.

Identify:

- preferred qualifications
- nice-to-have capabilities
- bonus scoring opportunities

3. Extract budget intelligence.

Detect and normalize to a single text string:

- budget ceiling (e.g. "$500,000 USD" or "₹2.5 Crore")
- fixed pricing or pricing model
- If unavailable → null

4. Extract timeline intelligence.

Find:

- submission deadline (ISO date or descriptive)
- project duration / timeline (e.g. "12 months")
- If unavailable → null

5. Extract evaluation methodology.

Find:

- evaluation weights
- scoring systems
- technical score %
- pricing score %
- experience score %

6. Extract vendor qualification rules.

Examples:

- ISO certifications
- HIPAA
- SOC2
- GDPR
- Government certifications
- years of experience
- team size expectations

7. Extract risks.

Examples:

- aggressive-deadline
- compliance-heavy
- multi-location-rollout
- government-procurement
- security-sensitive
- high-documentation-burden

8. Extract client intelligence.

Find:

- company/agency name
- industry
- submission contact info (name, email, phone)

RULES:

- NEVER hallucinate
- NEVER infer missing budget values
- NEVER invent certifications
- If unavailable → null (not empty string)
- Preserve original wording where critical
- Normalize dates to ISO 8601 where possible
- Normalize currencies
- Mark confidence score on requirements (0.0–1.0)

PRIORITY:

mandatory > compliance > timeline > budget > evaluation > optional

OUTPUT ONLY VALID JSON.

NO MARKDOWN.

NO EXPLANATION.

SCHEMA:

{
  "clientName": "",
  "clientIndustry": "",
  "rfpTitle": "",
  "submissionDeadline": "ISO date or descriptive text, null if unavailable",
  "projectTimeline": "e.g. '12 months', null if unavailable",
  "budgetCeiling": "e.g. '$500,000 USD', null if unavailable",
  "mandatoryRequirements": [
    {
      "id": "req-001",
      "text": "",
      "category": "technical|compliance|certification|staffing|infrastructure|integration|reporting",
      "priority": "high|medium|low",
      "page": 0,
      "confidence": 0.95
    }
  ],
  "optionalRequirements": [
    { "id": "opt-001", "text": "", "category": "" }
  ],
  "complianceRequirements": ["ISO 27001", "HIPAA"],
  "vendorQualifications": ["5+ years experience in healthcare IT"],
  "evaluationCriteria": [
    { "criterion": "Technical Approach", "weight": 40 }
  ],
  "contactInfo": { "name": "", "email": "", "phone": "" },
  "rawSummary": "2-3 sentence document summary",
  "risks": ["aggressive-deadline", "compliance-heavy"],
  "complexity": "low|medium|high",
  "parserNotes": "any extraction caveats"
}
`

export interface RfpParserInput {
  jobId: string
  userId: string
  rfpDocumentUrl: string
  companyProfileId: string
}

export async function runRfpParser(
  input: RfpParserInput
): Promise<{ clientName: string | null; rfpTitle: string | null; mandatoryCount: number; optionalCount: number; budgetCeiling: string | null; submissionDeadline: string | null }> {

  const startTime = Date.now()

  const runId = await createAgentRun(
    input.jobId,
    2,
    'rfp_parser',
    'gemini-3.1-flash-lite'
  )

  try {

    await updateCurrentAgent(input.jobId, 2)
    await updateJobActivity(input.jobId, 'Fetching RFP document from storage…')

    const { rfpDocumentUrl, companyProfileId } = input

    const [profileRow] = await db
      .select({ companyName: companyProfiles.companyName })
      .from(companyProfiles)
      .where(eq(companyProfiles.id, companyProfileId))
      .limit(1)

    const companyName = profileRow?.companyName ?? ''

    // Fetch PDF and pass directly to Gemini as inline base64 (no pdf-parse)
    const pdfResponse = await fetch(rfpDocumentUrl as string)
    if (!pdfResponse.ok) {
      throw new Error(`Failed to fetch PDF: ${pdfResponse.status} ${pdfResponse.statusText}`)
    }
    const pdfBase64 = Buffer.from(await pdfResponse.arrayBuffer()).toString('base64')
    await updateJobActivity(input.jobId, 'Sending RFP document to AI for extraction…')

    const result = await ai.models.generateContent({
      model: 'gemini-3.1-flash-lite',
      contents: [{
        role: 'user',
        parts: [
          { inlineData: { mimeType: 'application/pdf', data: pdfBase64 } },
          { text: `${RFP_PARSER_DESCRIPTION}\n\n${RFP_PARSER_INSTRUCTION}\n\nPIPELINE CONTEXT:\n\nCompany:\n${companyName}` },
        ],
      }],
      config: { temperature: 0.1, maxOutputTokens: 4096, responseMimeType: 'application/json' },
    })

    const raw = result.candidates?.[0]?.content?.parts?.[0]?.text ?? '{}'
    const cleaned = raw.replace(/```json/g, '').replace(/```/g, '').trim() || '{}'
    const blueprint = JSON.parse(cleaned)
    await updateJobActivity(input.jobId, `Extracted ${(blueprint.mandatoryRequirements ?? []).length} mandatory + ${(blueprint.optionalRequirements ?? []).length} optional requirements`)

    // Neon writes — run in parallel
    await Promise.all([
      db.insert(parsedRfpData).values({
        rfpJobId: input.jobId,
        mandatoryRequirements: blueprint.mandatoryRequirements ?? [],
        optionalRequirements: blueprint.optionalRequirements ?? [],
        budgetCeiling: blueprint.budgetCeiling ?? null,
        submissionDeadline: blueprint.submissionDeadline ?? null,
        projectTimeline: blueprint.projectTimeline ?? null,
        evaluationCriteria: blueprint.evaluationCriteria ?? null,
        vendorQualifications: blueprint.vendorQualifications ?? [],
        complianceRequirements: blueprint.complianceRequirements ?? [],
        contactInfo: blueprint.contactInfo ?? null,
        rawSummary: blueprint.rawSummary ?? null,
      }),

      db.update(rfpJobs)
        .set({
          clientName: blueprint.clientName ?? null,
          clientIndustry: blueprint.clientIndustry ?? null,
          rfpTitle: blueprint.rfpTitle ?? null,
          budgetCeiling: blueprint.budgetCeiling ?? null,
          deadline: blueprint.submissionDeadline ?? null,
          updatedAt: new Date(),
        })
        .where(eq(rfpJobs.id, input.jobId)),

    ])

    await completeAgentRun(
      runId,
      result.usageMetadata?.promptTokenCount ?? 0,
      result.usageMetadata?.candidatesTokenCount ?? 0,
      Date.now() - startTime,
    )

    return {
      clientName: (blueprint.clientName as string) || null,
      rfpTitle: (blueprint.rfpTitle as string) || null,
      mandatoryCount: (blueprint.mandatoryRequirements ?? []).length,
      optionalCount: (blueprint.optionalRequirements ?? []).length,
      budgetCeiling: (blueprint.budgetCeiling as string) || null,
      submissionDeadline: (blueprint.submissionDeadline as string) || null,
    }

  } catch (error) {

    await failAgentRun(runId, String(error))
    throw error

  }
}
