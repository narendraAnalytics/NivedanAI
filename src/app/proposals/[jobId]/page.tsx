import { redirect } from 'next/navigation'
import { auth } from '@clerk/nextjs/server'
import { eq, and } from 'drizzle-orm'
import { db } from '@/db'
import { proposals, rfpJobs, proposalExports } from '@/db/schema'
import { ProposalViewer } from './ProposalViewer'

export const maxDuration = 60

export default async function ProposalPage({
  params,
}: {
  params: Promise<{ jobId: string }>
}) {
  const { userId } = await auth()
  if (!userId) redirect('/sign-in')

  const { jobId } = await params

  const [row] = await db
    .select()
    .from(proposals)
    .innerJoin(rfpJobs, eq(rfpJobs.id, proposals.rfpJobId))
    .where(and(eq(proposals.rfpJobId, jobId), eq(rfpJobs.userId, userId)))
    .limit(1)

  if (!row) {
    return (
      <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', fontFamily: 'var(--f-body)', background: 'var(--ivory)', color: 'var(--forest)' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>📄</div>
          <div style={{ fontSize: 18, fontWeight: 600 }}>Proposal not found</div>
          <div style={{ fontSize: 14, color: '#888', marginTop: 8 }}>It may still be generating.</div>
          <a href="/dashboard" style={{ display: 'inline-block', marginTop: 20, color: 'var(--forest)', textDecoration: 'underline', fontSize: 14 }}>
            ← Back to Dashboard
          </a>
        </div>
      </div>
    )
  }

  const proposal = row.proposals
  const job      = row.rfp_jobs

  const [exportRow] = await db
    .select({ pdfUrl: proposalExports.pdfUrl, fileName: proposalExports.fileName })
    .from(proposalExports)
    .where(eq(proposalExports.proposalId, proposal.id))
    .limit(1)

  const score = proposal.qualityScore ? Math.round(Number(proposal.qualityScore) * 100) : null
  const scoreColor = score === null ? '#888' : score >= 90 ? '#2F5D50' : score >= 75 ? '#B88A2F' : '#C0392B'
  const scoreBg    = score === null ? '#f0f0f0' : score >= 90 ? '#E8F5F1' : score >= 75 ? '#FBF1D8' : '#FDECEA'

  return (
    <ProposalViewer
      proposal={proposal}
      job={job}
      exportRow={exportRow ?? null}
      score={score}
      scoreColor={scoreColor}
      scoreBg={scoreBg}
    />
  )
}
