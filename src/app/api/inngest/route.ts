import { serve } from 'inngest/next'
import { inngest } from '@/inngest/client'
import { generateProposal } from '@/inngest/functions/generate-proposal'
import { handleHitlChanges } from '@/inngest/functions/handle-hitl-changes'

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [generateProposal, handleHitlChanges],
})
