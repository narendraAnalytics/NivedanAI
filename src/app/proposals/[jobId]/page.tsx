import { redirect } from 'next/navigation'
import { auth } from '@clerk/nextjs/server'
import { eq, and } from 'drizzle-orm'
import { db } from '@/db'
import { proposals, rfpJobs, proposalExports } from '@/db/schema'

export const maxDuration = 60

const SECTIONS = [
  { key: 'coverLetter',                 label: 'Cover Letter',                   num: '01' },
  { key: 'executiveSummary',            label: 'Executive Summary',              num: '03' },
  { key: 'understandingOfRequirements', label: 'Understanding of Requirements',  num: '04' },
  { key: 'proposedSolution',            label: 'Proposed Solution',              num: '05' },
  { key: 'technicalApproach',           label: 'Technical Approach',             num: '06' },
  { key: 'caseStudies',                 label: 'Case Studies',                   num: '08' },
  { key: 'teamAndExpertise',            label: 'Team & Expertise',               num: '09' },
  { key: 'projectTimeline',             label: 'Project Timeline',               num: '10' },
  { key: 'pricingStructure',            label: 'Pricing Structure',              num: '11' },
  { key: 'risksMitigation',             label: 'Risks & Mitigation',             num: '12' },
  { key: 'assumptionsDependencies',     label: 'Assumptions & Dependencies',     num: '13' },
  { key: 'whyUs',                       label: 'Why Us',                         num: '14' },
] as const

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

  const statusLabel: Record<string, string> = {
    pending: 'Pending',
    running: 'Generating…',
    awaiting_review: 'Awaiting Review',
    completed: 'Completed',
    failed: 'Failed',
  }

  const formatDate = (d: Date | null) =>
    d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'

  return (
    <div style={{ minHeight: '100vh', background: 'var(--ivory)', fontFamily: 'var(--f-body)', position: 'relative' }}>

      {/* ── Sticky header ── */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 50,
        background: 'rgba(250,247,242,0.94)', backdropFilter: 'blur(14px)',
        WebkitBackdropFilter: 'blur(14px)',
        borderBottom: '1px solid rgba(47,93,80,0.1)',
      }}>
        {/* Gold top stripe */}
        <div style={{ height: 3, background: 'linear-gradient(90deg, #D4A84F, #B88A2F, #D4A84F)' }} />

        <div style={{ maxWidth: 960, margin: '0 auto', padding: '0 48px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 56 }}>

          {/* Left — back + monogram */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{
              width: 28, height: 28, borderRadius: 7,
              background: 'linear-gradient(135deg, #234539, #2F5D50)',
              display: 'grid', placeItems: 'center',
              fontSize: 13, fontWeight: 800, color: '#D4A84F',
              fontFamily: 'var(--f-display)',
              flexShrink: 0,
            }}>N</div>
            <a
              href="/dashboard"
              style={{ fontSize: 13, color: 'var(--forest)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 5, fontWeight: 500 }}
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M9 2L4 7l5 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Dashboard
            </a>
          </div>

          {/* Right — badges + download */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{
              fontSize: 11, fontWeight: 600, padding: '4px 10px', borderRadius: 20,
              background: job.status === 'completed' ? '#E8F5F1' : job.status === 'awaiting_review' ? '#FBF1D8' : '#f0f0f0',
              color: job.status === 'completed' ? '#234539' : job.status === 'awaiting_review' ? '#8A5E0A' : '#666',
              letterSpacing: '0.02em',
            }}>
              {statusLabel[job.status] ?? job.status}
            </span>

            <span style={{
              fontSize: 11, fontWeight: 600, padding: '4px 10px', borderRadius: 20,
              background: '#f0f0f0', color: '#666',
            }}>
              v{proposal.version}
            </span>

            {score !== null && (
              <span style={{
                fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 20,
                background: scoreBg, color: scoreColor,
              }}>
                Score {score}
              </span>
            )}

            {exportRow?.pdfUrl && (
              <a
                href={exportRow.pdfUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  padding: '8px 16px', fontSize: 12.5, fontWeight: 600,
                  background: 'linear-gradient(135deg, #234539, #2F5D50)',
                  color: '#fff', borderRadius: 8, textDecoration: 'none',
                  display: 'flex', alignItems: 'center', gap: 6,
                  boxShadow: '0 3px 10px rgba(35,69,57,0.25)',
                }}
              >
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <path d="M6 1v6M3.5 5.5l2.5 2.5 2.5-2.5M1.5 10h9" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                Download PDF
              </a>
            )}
          </div>
        </div>
      </div>

      {/* ── Main content ── */}
      <div style={{ maxWidth: 960, margin: '0 auto', padding: '52px 48px 96px' }}>

        {/* ── Hero title block ── */}
        <div style={{ marginBottom: 44 }}>
          <div style={{
            fontSize: 9.5, fontWeight: 700, letterSpacing: '0.14em',
            textTransform: 'uppercase', color: '#D4A84F',
            marginBottom: 10,
          }}>
            PROPOSAL FOR
          </div>
          <h1 style={{
            fontFamily: 'var(--f-display-serif)',
            fontSize: 38, fontWeight: 700,
            color: 'var(--forest-deep)',
            margin: 0, lineHeight: 1.15,
          }}>
            {job.clientName ?? job.rfpTitle ?? 'Untitled RFP'}
          </h1>
          {job.rfpTitle && job.clientName && (
            <div style={{ fontSize: 15, color: '#667', marginTop: 8, fontStyle: 'italic' }}>{job.rfpTitle}</div>
          )}

          {/* Gold rule */}
          <div style={{ width: 52, height: 2.5, background: 'linear-gradient(90deg, #D4A84F, #B88A2F)', borderRadius: 2, marginTop: 20, marginBottom: 18 }} />

          <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
            {proposal.wordCount && (
              <span style={{ fontSize: 12.5, color: '#889', display: 'flex', alignItems: 'center', gap: 5 }}>
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><rect x="1" y="1" width="10" height="10" rx="2" stroke="#aaa" strokeWidth="1.2"/><path d="M3 4h6M3 6h6M3 8h3" stroke="#aaa" strokeWidth="1.2" strokeLinecap="round"/></svg>
                {proposal.wordCount.toLocaleString()} words
              </span>
            )}
            <span style={{ fontSize: 12.5, color: '#889', display: 'flex', alignItems: 'center', gap: 5 }}>
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><circle cx="6" cy="6" r="5" stroke="#aaa" strokeWidth="1.2"/><path d="M6 3.5V6l1.5 1.5" stroke="#aaa" strokeWidth="1.2" strokeLinecap="round"/></svg>
              Generated {formatDate(proposal.createdAt)}
            </span>
          </div>
        </div>

        {/* ── Quality review notes ── */}
        {proposal.qualityReviewNotes && (
          <div style={{
            padding: '16px 20px 16px 24px', borderRadius: 12, marginBottom: 36,
            background: '#FFFDF5',
            borderLeft: `4px solid #D4A84F`,
            border: '1px solid #EDD9A0',
            borderLeftWidth: 4,
          }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: '#B88A2F', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 7 }}>
              Quality Review Notes
            </div>
            <div style={{ fontSize: 13.5, color: '#444', lineHeight: 1.65 }}>{proposal.qualityReviewNotes}</div>
          </div>
        )}

        {/* ── Proposal sections ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          {SECTIONS.map(({ key, label, num }) => {
            const content = proposal[key as keyof typeof proposal] as string | null
            return (
              <div
                key={key}
                style={{
                  background: '#fff',
                  borderRadius: 14,
                  overflow: 'hidden',
                  boxShadow: '0 2px 16px rgba(35,69,57,0.07), 0 1px 3px rgba(35,69,57,0.05)',
                  border: '1px solid rgba(47,93,80,0.08)',
                }}
              >
                {/* Section header */}
                <div style={{
                  padding: '14px 22px',
                  background: 'linear-gradient(135deg, #234539 0%, #2F5D50 100%)',
                  display: 'flex', alignItems: 'center', gap: 12,
                }}>
                  {/* Gold number badge */}
                  <span style={{
                    width: 28, height: 28, borderRadius: 7,
                    background: 'linear-gradient(135deg, #D4A84F, #B88A2F)',
                    color: '#fff', fontSize: 10, fontWeight: 800,
                    display: 'grid', placeItems: 'center', flexShrink: 0,
                    fontFamily: 'var(--f-mono)',
                    letterSpacing: '0.02em',
                    boxShadow: '0 2px 6px rgba(180,130,40,0.4)',
                  }}>
                    {num}
                  </span>
                  <h2 style={{
                    fontFamily: 'var(--f-display)',
                    fontSize: 14, fontWeight: 700,
                    color: '#fff', margin: 0,
                    letterSpacing: '0.01em',
                  }}>
                    {label}
                  </h2>
                </div>

                {/* Section body */}
                <div style={{ padding: '22px 24px' }}>
                  {content ? (
                    <div style={{
                      fontSize: 14.5, lineHeight: 1.8, color: '#2a2a2a',
                      whiteSpace: 'pre-wrap', wordBreak: 'break-word',
                      fontFamily: 'var(--f-body)',
                    }}>
                      {content}
                    </div>
                  ) : (
                    <div style={{ fontSize: 13.5, color: '#bbb', fontStyle: 'italic' }}>
                      Not yet generated
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {/* ── Bottom attribution ── */}
        <div style={{
          marginTop: 56, paddingTop: 24,
          borderTop: '1px solid rgba(47,93,80,0.12)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div style={{ fontSize: 12, color: '#aaa' }}>
            Generated by <span style={{ color: 'var(--forest)', fontWeight: 600 }}>Nivedan AI</span>
            {' · '}Confidential &amp; Proprietary
          </div>
          {score !== null && (
            <div style={{ fontSize: 12, color: '#aaa' }}>
              Confidence Score: <span style={{ color: scoreColor, fontWeight: 700 }}>{score}%</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
