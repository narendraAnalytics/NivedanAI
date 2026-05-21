import { Inngest } from 'inngest'

export type NivedanEvents = {
  'nivedan/rfp.submitted': {
    data: {
      jobId: string
      userId: string
      rfpDocumentUrl: string
      companyProfileId: string
      recipientEmail?: string
    }
  }
  'nivedan/agent.completed': {
    data: {
      jobId: string
      agentNumber: number
      status: 'completed' | 'failed'
    }
  }
  'nivedan/hitl.approved': {
    data: {
      jobId: string
      proposalId: string
    }
  }
  'nivedan/hitl.changes.requested': {
    data: {
      jobId: string
      proposalId: string
      flaggedSections: string[]
      feedbackText: string
      userId: string
    }
  }
  'nivedan/hitl.timeout': {
    data: {
      jobId: string
    }
  }
}

export const inngest = new Inngest({ id: 'nivedanai' })
