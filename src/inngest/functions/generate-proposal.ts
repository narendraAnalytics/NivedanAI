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

    const orchestratorResult = await step.run('step-1-orchestrator', async () => {
      const result = await runOrchestrator({ jobId, userId, rfpDocumentUrl, companyProfileId, inngestRunId: runId })
      return { status: 'ok', jobId, ...result }
    })

    const parserResult = await step.run('step-2-rfp-parser', async () => {
      return await runRfpParser({ jobId, userId, rfpDocumentUrl, companyProfileId })
    })

    await step.run('step-3-client-research', async () => {
      return await runClientResearch({
        jobId,
        userId,
        pipelineDirective: orchestratorResult.pipelineDirective,
        clientName: parserResult?.clientName ?? null,
      })
    })

    await step.run('step-4-requirements-matcher', async () => {
      return await runRequirementsMatcher({ jobId, userId, companyProfileId })
    })

    await step.run('step-5-proposal-writer', async () => {
      return await runProposalWriter({ jobId, userId })
    })

    await step.run('step-6-quality-review', async () => {
      return await runQualityReview({ jobId, userId })
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
        db.select({ clientName: rfpJobs.clientName, rfpTitle: rfpJobs.rfpTitle }).from(rfpJobs).where(eq(rfpJobs.id, jobId)).limit(1),
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
      const pdfUrl = (uploadResult as { data?: { ufsUrl?: string } }).data?.ufsUrl ?? ''

      let resendMessageId: string | null = null
      let emailSentAt: Date | null = null

      const toEmail = event.data.recipientEmail ?? user?.email
      if (toEmail) {
        const { Resend } = await import('resend')
        const resend = new Resend(process.env.RESEND_API_KEY)
        const rfp = rfpRows[0] ?? null
        const rfpTitle = jobRows[0]?.rfpTitle ?? `RFP for ${clientName}`
        const qualityScoreDisplay = proposal.qualityScore ? `${Math.round(parseFloat(String(proposal.qualityScore)) * 100)}%` : null
        const deadline = rfp?.submissionDeadline ?? null

        const emailResult = await resend.emails.send({
          from: `${process.env.RESEND_FROM_NAME} <${process.env.RESEND_FROM_EMAIL}>`,
          to: toEmail,
          subject: `Your proposal for ${clientName} is ready — v${proposal.version}`,
          html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f4f4f4;font-family:Inter,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f4;padding:32px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">

        <!-- Header -->
        <tr>
          <td style="background:#2F5D50;padding:28px 32px;">
            <p style="margin:0;color:#D4A84F;font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;">Nivedan AI</p>
            <h1 style="margin:8px 0 0;color:#ffffff;font-size:22px;font-weight:700;">Proposal Ready for Download</h1>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="padding:32px;">
            <p style="margin:0 0 20px;color:#374151;font-size:15px;">Hi ${user.fullName ?? 'there'},</p>
            <p style="margin:0 0 24px;color:#374151;font-size:15px;">Your proposal has been reviewed and approved. It is ready to submit.</p>

            <!-- Proposal Details Card -->
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#F9FAFB;border:1px solid #E5E7EB;border-radius:6px;margin-bottom:28px;">
              <tr>
                <td style="padding:20px 24px;">
                  <p style="margin:0 0 4px;color:#6B7280;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:1px;">Proposal Details</p>
                  <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:14px;">
                    <tr>
                      <td style="padding:6px 0;color:#6B7280;font-size:13px;width:140px;">Client</td>
                      <td style="padding:6px 0;color:#111827;font-size:13px;font-weight:600;">${clientName}</td>
                    </tr>
                    <tr>
                      <td style="padding:6px 0;color:#6B7280;font-size:13px;">RFP Title</td>
                      <td style="padding:6px 0;color:#111827;font-size:13px;">${rfpTitle}</td>
                    </tr>
                    <tr>
                      <td style="padding:6px 0;color:#6B7280;font-size:13px;">Prepared by</td>
                      <td style="padding:6px 0;color:#111827;font-size:13px;">${company?.companyName ?? 'Your Company'}</td>
                    </tr>
                    <tr>
                      <td style="padding:6px 0;color:#6B7280;font-size:13px;">Version</td>
                      <td style="padding:6px 0;color:#111827;font-size:13px;">v${proposal.version}</td>
                    </tr>
                    ${qualityScoreDisplay ? `
                    <tr>
                      <td style="padding:6px 0;color:#6B7280;font-size:13px;">Quality Score</td>
                      <td style="padding:6px 0;color:#2F5D50;font-size:13px;font-weight:700;">${qualityScoreDisplay}</td>
                    </tr>` : ''}
                    ${deadline ? `
                    <tr>
                      <td style="padding:6px 0;color:#6B7280;font-size:13px;">Submission Deadline</td>
                      <td style="padding:6px 0;color:#B45309;font-size:13px;font-weight:600;">${deadline}</td>
                    </tr>` : ''}
                  </table>
                </td>
              </tr>
            </table>

            <!-- CTA Button -->
            <table cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
              <tr>
                <td style="background:#2F5D50;border-radius:6px;">
                  <a href="${pdfUrl}" style="display:inline-block;padding:14px 28px;color:#ffffff;font-size:15px;font-weight:600;text-decoration:none;">Download Proposal PDF</a>
                </td>
              </tr>
            </table>

            <p style="margin:0;color:#6B7280;font-size:13px;">If the button above doesn't work, copy and paste this link into your browser:<br>
            <a href="${pdfUrl}" style="color:#2F5D50;word-break:break-all;">${pdfUrl}</a></p>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="background:#F9FAFB;border-top:1px solid #E5E7EB;padding:20px 32px;">
            <p style="margin:0;color:#9CA3AF;font-size:12px;text-align:center;">Prepared by <strong style="color:#2F5D50;">Nivedan AI</strong> · Autonomous Proposal Intelligence</p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`,
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
