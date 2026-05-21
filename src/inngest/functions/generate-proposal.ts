import { inngest } from '@/inngest/client'
import { runOrchestrator } from '@/agents/orchestrator'
import { runRfpParser } from '@/agents/rfp-parser'

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
      // TODO: Stage 3 — Client Research Agent
      console.log('[step-3-client-research] placeholder', { jobId })
    })

    await step.run('step-4-requirements-matcher', async () => {
      // TODO: Stage 4 — Requirements Matcher Agent
      console.log('[step-4-requirements-matcher] placeholder', { jobId })
    })

    await step.run('step-5-proposal-writer', async () => {
      // TODO: Stage 5 — Proposal Writer Agent
      console.log('[step-5-proposal-writer] placeholder', { jobId })
    })

    await step.run('step-6-quality-review', async () => {
      // TODO: Stage 6 — Quality Review Agent
      console.log('[step-6-quality-review] placeholder', { jobId })
    })

    // Pipeline pauses here — waits up to 7 days for human approval
    const review = await step.waitForEvent('wait-for-hitl', {
      event: 'nivedan/hitl.approved',
      timeout: '7d',
      if: 'event.data.jobId == async.data.jobId',
    })

    if (!review) {
      // Timeout path — mark job expired
      console.log('[hitl] timeout reached for job', jobId)
      return { status: 'expired' }
    }

    await step.run('step-8-pdf-export', async () => {
      // TODO: Stage 8 — PDF Export
      console.log('[step-8-pdf-export] placeholder', { jobId })
    })

    return { status: 'completed' }
  }
)
