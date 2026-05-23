import { eq } from 'drizzle-orm'
import { inngest } from '@/inngest/client'
import { runOrchestrator } from '@/agents/orchestrator'
import { runRfpParser } from '@/agents/rfp-parser'
import { runClientResearch } from '@/agents/client-research'
import { runRequirementsMatcher } from '@/agents/requirements-matcher'
import { runProposalWriter } from '@/agents/proposal-writer'
import { runQualityReview } from '@/agents/quality-review'
import { updateJobStatus } from '@/db/helpers/job-status'
import { db } from '@/db'
import { proposals, proposalExports, rfpJobs, parsedRfpData, clientResearchData, capabilityMatches } from '@/db/schema'
import { companyProfiles } from '@/db/schema'
import { users } from '@/db/schema'
import { desc } from 'drizzle-orm'

export const generateProposal = inngest.createFunction(
  {
    id: 'generate-proposal',
    triggers: [{ event: 'nivedan/rfp.submitted' }],
  },
  async ({ event, step, runId }) => {
    const { jobId, userId, rfpDocumentUrl, companyProfileId } = event.data

    await step.run('step-1-orchestrator', async () => {
      await runOrchestrator({ jobId, userId, rfpDocumentUrl, companyProfileId, inngestRunId: runId })
    })

    await step.run('step-2-rfp-parser', async () => {
      await runRfpParser({ jobId, userId })
    })

    await step.run('step-3-client-research', async () => {
      await runClientResearch({ jobId, userId })
    })

    await step.run('step-4-requirements-matcher', async () => {
      await runRequirementsMatcher({ jobId, userId })
    })

    await step.run('step-5-proposal-writer', async () => {
      await runProposalWriter({ jobId, userId })
    })

    await step.run('step-6-quality-review', async () => {
      await runQualityReview({ jobId, userId })
    })

    // Pipeline pauses here — waits up to 7 days for human approval
    const review = await step.waitForEvent('wait-for-hitl', {
      event: 'nivedan/hitl.approved',
      timeout: '7d',
      if: 'event.data.jobId == async.data.jobId',
    })

    if (!review) {
      await step.run('mark-expired', async () => {
        await updateJobStatus(jobId, 'expired')
      })
      return { status: 'expired' }
    }

    await step.run('step-8-pdf-export', async () => {
      const [proposalRows, companyRows, userRows, jobRows, rfpRows, clientRows, matchRows] = await Promise.all([
        db.select().from(proposals).where(eq(proposals.rfpJobId, jobId)).limit(1),
        db.select().from(companyProfiles).where(eq(companyProfiles.id, companyProfileId)).limit(1),
        db.select().from(users).where(eq(users.id, userId)).limit(1),
        db.select({ clientName: rfpJobs.clientName }).from(rfpJobs).where(eq(rfpJobs.id, jobId)).limit(1),
        db.select().from(parsedRfpData).where(eq(parsedRfpData.rfpJobId, jobId)).limit(1),
        db.select().from(clientResearchData).where(eq(clientResearchData.rfpJobId, jobId)).limit(1),
        db.select().from(capabilityMatches).where(eq(capabilityMatches.rfpJobId, jobId)).orderBy(desc(capabilityMatches.confidenceScore)),
      ])

      if (!proposalRows[0]) throw new Error('No approved proposal found for PDF export')

      const proposal = proposalRows[0]
      const company = companyRows[0]
      const user = userRows[0]
      const clientName = jobRows[0]?.clientName ?? 'Client'

      const { generateProposalPdf } = await import('@/lib/pdf/generate')
      const pdfBuffer = await generateProposalPdf({
        proposal,
        companyProfile: company ?? { companyName: 'Company', logoUrl: null, brandColorPrimary: null, brandColorSecondary: null },
        clientName,
        parsedRfp: rfpRows[0] ?? null,
        clientResearch: clientRows[0] ?? null,
        capabilityMatchList: matchRows,
      })

      const { UTApi } = await import('uploadthing/server')
      const utapi = new UTApi()
      const fileName = `proposal-${jobId}-v${proposal.version}.pdf`
      const file = new File([new Uint8Array(pdfBuffer)], fileName, { type: 'application/pdf' })
      const uploadResult = await utapi.uploadFiles(file)
      const pdfUrl = (uploadResult as { data?: { url?: string } }).data?.url ?? ''

      let resendMessageId: string | null = null
      let emailSentAt: Date | null = null

      const toEmail = event.data.recipientEmail ?? user?.email
      if (toEmail) {
        const { Resend } = await import('resend')
        const resend = new Resend(process.env.RESEND_API_KEY)
        const emailResult = await resend.emails.send({
          from: process.env.RESEND_FROM_EMAIL!,
          to: toEmail,
          subject: `Your proposal for ${clientName} is ready`,
          html: `<p>Hi ${user.fullName ?? 'there'},</p><p>Your proposal has been approved and is ready to download.</p><p><a href="${pdfUrl}" style="background:#2F5D50;color:#fff;padding:10px 20px;border-radius:4px;text-decoration:none">Download Proposal PDF</a></p><p>Prepared by Nivedan AI</p>`,
        })
        resendMessageId = (emailResult as { data?: { id?: string } }).data?.id ?? null
        emailSentAt = resendMessageId ? new Date() : null
      }

      await db.insert(proposalExports).values({
        proposalId: proposal.id,
        version: proposal.version,
        pdfUrl,
        fileName,
        fileSizeBytes: pdfBuffer.length,
        emailSentTo: toEmail ?? null,
        emailSentAt,
        resendMessageId,
      })

      await db.update(rfpJobs).set({
        status: 'completed',
        completedAt: new Date(),
      }).where(eq(rfpJobs.id, jobId))
    })

    return { status: 'completed' }
  }
)
