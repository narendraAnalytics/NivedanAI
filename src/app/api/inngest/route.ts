import { serve } from 'inngest/next'
import { inngest } from '@/inngest/client'
import { generateProposal } from '@/inngest/functions/generate-proposal'

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [generateProposal],
})
