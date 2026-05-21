'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useUser, UserButton } from '@clerk/nextjs'

/* ── Types ── */
type JobStatus = {
  status: 'pending' | 'running' | 'awaiting_review' | 'completed' | 'failed' | 'expired'
  currentAgent: number | null
  errorMessage: string | null
  completedAt: string | null
  clientName: string | null
}

/* ── Stage definitions ── */
const stages = [
  { n: 1, title: 'Orchestrator',         sub: 'Validating inputs & creating session',       model: 'gemini-3.1-pro',       color: '#D4A84F' },
  { n: 2, title: 'RFP Parser',           sub: 'Extracting requirements & structure',         model: 'gemini-3.1-flash-lite', color: '#2F5D50' },
  { n: 3, title: 'Client Research',      sub: 'Researching company & industry signals',      model: 'gemini-3.1-flash',      color: '#C97548' },
  { n: 4, title: 'Requirements Matcher', sub: 'Mapping capabilities to requirements',        model: 'gemini-3.1-flash-lite', color: '#6B8F7A' },
  { n: 5, title: 'Proposal Writer',      sub: 'Drafting full 8-section proposal',            model: 'gemini-3.1-pro',        color: '#B88A2F' },
  { n: 6, title: 'Quality Review',       sub: 'Validating requirements & scoring',           model: 'gemini-3.1-flash-lite', color: '#8B4A5E' },
]

function stageStatus(n: number, job: JobStatus): 'done' | 'active' | 'pending' {
  if (job.status === 'awaiting_review' || job.status === 'completed') return 'done'
  if (!job.currentAgent) return 'pending'
  if (n < job.currentAgent) return 'done'
  if (n === job.currentAgent) return 'active'
  return 'pending'
}

/* ── Background ── */
function BgLayer() {
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none',
      background: `
        radial-gradient(900px 600px at 90% -10%, rgba(247,231,193,0.70) 0%, transparent 55%),
        radial-gradient(800px 600px at 0% 30%, rgba(221,231,216,0.45) 0%, transparent 55%),
        radial-gradient(700px 500px at 80% 80%, rgba(247,231,193,0.50) 0%, transparent 55%),
        linear-gradient(180deg, #FFFCF4 0%, #FAF7F2 100%)
      `,
    }} />
  )
}

/* ── Nav ── */
function Nav({ clientName }: { clientName: string | null }) {
  const router = useRouter()
  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 20,
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '0 48px', height: 68,
      background: 'rgba(255,252,244,0.88)',
      borderBottom: '1px solid rgba(212,168,79,0.18)',
      backdropFilter: 'blur(16px) saturate(140%)',
      WebkitBackdropFilter: 'blur(16px) saturate(140%)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
        <button
          onClick={() => router.push('/dashboard')}
          style={{
            display: 'flex', alignItems: 'center', gap: 7,
            background: 'none', border: 'none', cursor: 'pointer',
            fontSize: 13, fontWeight: 600, color: 'var(--ink-soft)',
            padding: '6px 10px', borderRadius: 8,
          }}
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M9 11L5 7l4-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Dashboard
        </button>
        <span style={{ width: 1, height: 16, background: 'var(--line-strong)' }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 30, height: 30, borderRadius: 8,
            background: 'linear-gradient(180deg, #FBF1D8 0%, #E0B663 100%)',
            display: 'grid', placeItems: 'center',
          }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M12 3 C 8 7, 8 13, 12 21 C 16 13, 16 7, 12 3 Z" fill="#2F5D50" />
              <circle cx="12" cy="11" r="1.4" fill="#D4A84F" />
            </svg>
          </div>
          <span style={{ fontFamily: 'var(--f-display)', fontWeight: 600, fontSize: 15, color: 'var(--forest-deep)' }}>
            {clientName ? `${clientName} — Proposal` : 'Proposal Pipeline'}
          </span>
        </div>
      </div>
      <UserButton />
    </div>
  )
}

/* ── Stage card ── */
function StageCard({
  stage,
  status,
  isLast,
  animTick,
}: {
  stage: typeof stages[0]
  status: 'done' | 'active' | 'pending'
  isLast: boolean
  animTick: number
}) {
  const isDone    = status === 'done'
  const isActive  = status === 'active'
  const isPending = status === 'pending'
  const barPct    = isDone ? 100 : isActive ? (animTick % 100) : 0

  return (
    <div style={{ display: 'flex', gap: 0 }}>
      {/* Timeline spine */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 40, flexShrink: 0 }}>
        <div style={{
          width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
          background: isDone
            ? 'var(--forest)'
            : isActive
            ? `linear-gradient(135deg, ${stage.color}33, ${stage.color}66)`
            : 'rgba(255,255,255,0.7)',
          border: isDone
            ? '2px solid var(--forest)'
            : isActive
            ? `2px solid ${stage.color}`
            : '2px solid var(--line-strong)',
          display: 'grid', placeItems: 'center',
          boxShadow: isActive ? `0 0 0 6px ${stage.color}22, 0 0 20px ${stage.color}44` : 'none',
          transition: 'all .5s ease',
          animation: isActive ? 'pulseGold 1.8s ease-in-out infinite' : 'none',
        }}>
          {isDone ? (
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M3 7l3 3 5-5" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          ) : (
            <span style={{
              fontFamily: 'var(--f-mono)', fontWeight: 700, fontSize: 11,
              color: isActive ? stage.color : 'var(--ni-muted)',
            }}>
              {String(stage.n).padStart(2, '0')}
            </span>
          )}
        </div>
        {!isLast && (
          <div style={{
            width: 2, flex: 1, minHeight: 24, marginTop: 4,
            background: isDone
              ? 'linear-gradient(180deg, var(--forest), rgba(47,93,80,0.3))'
              : 'rgba(47,93,80,0.10)',
            borderRadius: 999,
            transition: 'background .5s ease',
          }} />
        )}
      </div>

      {/* Card */}
      <div style={{
        flex: 1, marginLeft: 16, marginBottom: isLast ? 0 : 20,
        padding: '18px 20px',
        background: isActive
          ? 'linear-gradient(180deg, #FFFCF4 0%, #FBF1D8 100%)'
          : isDone
          ? 'linear-gradient(180deg, #fff 0%, var(--sage-soft) 100%)'
          : 'rgba(255,255,255,0.55)',
        border: isActive
          ? `1.5px solid ${stage.color}88`
          : isDone
          ? '1px solid rgba(47,93,80,0.18)'
          : '1px solid var(--line-strong)',
        borderRadius: 14,
        boxShadow: isActive
          ? `0 0 0 4px ${stage.color}18, 0 12px 28px ${stage.color}18`
          : isDone
          ? '0 2px 8px rgba(35,69,57,0.06)'
          : 'none',
        transition: 'all .5s cubic-bezier(.2,.7,.2,1)',
      }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 10 }}>
          <div>
            <div style={{
              fontFamily: 'var(--f-display)', fontWeight: 600, fontSize: 15.5,
              color: isPending ? 'var(--ni-muted)' : 'var(--ink)',
              marginBottom: 3,
            }}>{stage.title}</div>
            <div style={{ fontSize: 12.5, color: isPending ? 'rgba(138,149,143,0.6)' : 'var(--ink-soft)', lineHeight: 1.35 }}>
              {isPending ? 'Waiting for upstream output' : stage.sub}
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4, flexShrink: 0, marginLeft: 12 }}>
            <span style={{
              fontFamily: 'var(--f-mono)', fontSize: 10, fontWeight: 600,
              color: isPending ? 'rgba(138,149,143,0.5)' : stage.color,
              padding: '2px 8px',
              background: isPending ? 'transparent' : `${stage.color}18`,
              borderRadius: 999,
              border: isPending ? '1px solid transparent' : `1px solid ${stage.color}33`,
            }}>
              {stage.model}
            </span>
            {isActive && (
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: 5,
                fontSize: 11, fontWeight: 600, color: stage.color,
              }}>
                <span style={{
                  width: 6, height: 6, borderRadius: '50%',
                  background: stage.color,
                  boxShadow: `0 0 8px ${stage.color}`,
                  animation: 'pulseGold 1.2s ease-in-out infinite',
                }} />
                Running
              </span>
            )}
            {isDone && (
              <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--forest)' }}>Complete</span>
            )}
          </div>
        </div>

        {/* Progress bar */}
        <div style={{
          height: 3, borderRadius: 999,
          background: isPending ? 'rgba(47,93,80,0.06)' : 'rgba(47,93,80,0.10)',
          overflow: 'hidden',
        }}>
          <div style={{
            width: `${barPct}%`, height: '100%',
            background: isDone
              ? 'linear-gradient(90deg, #3d7565, var(--forest))'
              : `linear-gradient(90deg, ${stage.color}99, ${stage.color})`,
            borderRadius: 999,
            transition: isDone ? 'width .4s ease' : 'width .8s linear',
            boxShadow: isActive ? `0 0 8px ${stage.color}88` : 'none',
          }} />
        </div>
      </div>
    </div>
  )
}

/* ── HITL panel ── */
function HitlPanel({ jobId }: { jobId: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState<'approve' | 'changes' | null>(null)
  const [feedback, setFeedback] = useState('')
  const [showFeedback, setShowFeedback] = useState(false)

  const approve = async () => {
    setLoading('approve')
    await fetch(`/api/proposals/${jobId}/approve`, { method: 'POST' })
    router.refresh()
  }

  const requestChanges = async () => {
    if (!feedback.trim()) { setShowFeedback(true); return }
    setLoading('changes')
    await fetch(`/api/proposals/${jobId}/changes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ flaggedSections: [], feedbackText: feedback }),
    })
    setShowFeedback(false)
    setFeedback('')
    setLoading(null)
  }

  return (
    <div style={{
      marginTop: 32,
      padding: '28px 28px',
      background: 'linear-gradient(180deg, #fff 0%, rgba(255,252,244,0.8) 100%)',
      border: '1.5px solid rgba(212,168,79,0.40)',
      borderRadius: 18,
      boxShadow: '0 16px 40px rgba(212,168,79,0.18)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
        <div style={{
          width: 36, height: 36, borderRadius: 10,
          background: 'linear-gradient(135deg, #FBF1D8, #E0B663)',
          display: 'grid', placeItems: 'center',
        }}>
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path d="M9 2l2 4.5L16 7l-3.5 3.3L13.4 16 9 13.4 4.6 16l.9-5.7L2 7l5-.5L9 2Z" fill="#2A1E08" />
          </svg>
        </div>
        <div>
          <div style={{ fontFamily: 'var(--f-display)', fontWeight: 600, fontSize: 17, color: 'var(--ink)' }}>
            Proposal ready for your review
          </div>
          <div style={{ fontSize: 13, color: 'var(--ink-soft)', marginTop: 2 }}>
            All 6 agents completed · Quality validated · Awaiting your approval
          </div>
        </div>
      </div>

      {showFeedback && (
        <textarea
          value={feedback}
          onChange={e => setFeedback(e.target.value)}
          placeholder="Describe what to change (e.g. 'Expand the technical section, adjust pricing to ₹12L')"
          style={{
            width: '100%', marginTop: 14, padding: '12px 14px',
            borderRadius: 10, border: '1.5px solid rgba(212,168,79,0.40)',
            background: 'rgba(255,252,244,0.8)',
            fontFamily: 'var(--f-body)', fontSize: 13.5, color: 'var(--ink)',
            resize: 'vertical', minHeight: 88,
            outline: 'none', lineHeight: 1.5,
            boxSizing: 'border-box',
          }}
        />
      )}

      <div style={{ display: 'flex', gap: 12, marginTop: 20 }}>
        <button
          onClick={approve}
          disabled={!!loading}
          style={{
            flex: 1, padding: '13px 20px',
            background: loading === 'approve'
              ? 'rgba(47,93,80,0.6)'
              : 'linear-gradient(135deg, var(--forest-deep), var(--forest))',
            color: '#fff', border: 'none', borderRadius: 12,
            fontFamily: 'var(--f-display)', fontWeight: 600, fontSize: 15,
            cursor: loading ? 'not-allowed' : 'pointer',
            boxShadow: '0 8px 20px rgba(35,69,57,0.25)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          }}
        >
          {loading === 'approve' ? 'Processing…' : (
            <>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M3 8l3.5 3.5 6.5-7" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Approve & Export PDF
            </>
          )}
        </button>
        <button
          onClick={requestChanges}
          disabled={!!loading}
          style={{
            flex: 1, padding: '13px 20px',
            background: loading === 'changes' ? 'rgba(212,168,79,0.2)' : 'rgba(212,168,79,0.12)',
            color: 'var(--gold-deep)', border: '1.5px solid rgba(212,168,79,0.40)',
            borderRadius: 12,
            fontFamily: 'var(--f-display)', fontWeight: 600, fontSize: 15,
            cursor: loading ? 'not-allowed' : 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          }}
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M2 7h10 M8 3l4 4-4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          {showFeedback && feedback.trim() ? 'Send Feedback' : 'Request Changes'}
        </button>
      </div>
    </div>
  )
}

/* ── Completion panel ── */
function CompletionPanel() {
  return (
    <div style={{
      marginTop: 32, padding: '24px 28px',
      background: 'linear-gradient(120deg, var(--forest-deep), var(--forest))',
      color: '#fff', borderRadius: 18,
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      boxShadow: '0 16px 40px rgba(35,69,57,0.28)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <div style={{
          width: 44, height: 44, borderRadius: 12,
          background: 'linear-gradient(180deg, #FBF1D8, #E0B663)',
          display: 'grid', placeItems: 'center',
        }}>
          <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
            <path d="M4 11l4 4 10-9" stroke="#2A1E08" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <div>
          <div style={{ fontFamily: 'var(--f-display)', fontWeight: 600, fontSize: 17 }}>
            Proposal exported — check your inbox
          </div>
          <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.72)', marginTop: 3 }}>
            Branded PDF delivered via email · Saved to your library
          </div>
        </div>
      </div>
      <a
        href="/dashboard"
        style={{
          padding: '11px 20px', fontSize: 13.5, fontWeight: 600,
          background: 'linear-gradient(135deg, #FBF1D8, #E0B663)',
          color: '#2A1E08', borderRadius: 10, cursor: 'pointer',
          border: 'none', textDecoration: 'none',
          boxShadow: '0 6px 16px rgba(212,168,79,0.30)',
          whiteSpace: 'nowrap',
        }}
      >
        Back to Dashboard →
      </a>
    </div>
  )
}

/* ── Info sidebar ── */
function JobInfo({ job, elapsedSecs }: { job: JobStatus; elapsedSecs: number }) {
  const mins = Math.floor(elapsedSecs / 60)
  const secs = elapsedSecs % 60
  const elapsedStr = mins > 0 ? `${mins}m ${secs}s` : `${secs}s`
  const etaMins = job.currentAgent ? Math.max(0, (7 - (job.currentAgent ?? 0)) * 3) : 18

  const statusColor = {
    pending: '#8A958F',
    running: '#D4A84F',
    awaiting_review: '#2F5D50',
    completed: '#2F5D50',
    failed: '#C0392B',
    expired: '#8A958F',
  }[job.status] ?? '#8A958F'

  const statusLabel = {
    pending: 'Initializing',
    running: 'Running',
    awaiting_review: 'Awaiting review',
    completed: 'Completed',
    failed: 'Failed',
    expired: 'Expired',
  }[job.status] ?? job.status

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Status card */}
      <div style={{
        padding: '20px 20px',
        background: 'rgba(255,255,255,0.82)',
        border: '1px solid var(--line-strong)',
        borderRadius: 16,
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        boxShadow: '0 6px 20px rgba(35,69,57,0.05)',
      }}>
        <div style={{ fontFamily: 'var(--f-mono)', fontSize: 10, fontWeight: 600, color: 'var(--ni-muted)', letterSpacing: '0.12em', marginBottom: 12 }}>
          JOB STATUS
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
          <span style={{
            width: 8, height: 8, borderRadius: '50%',
            background: statusColor,
            boxShadow: `0 0 10px ${statusColor}88`,
            animation: job.status === 'running' ? 'pulseGold 1.4s ease-in-out infinite' : 'none',
          }} />
          <span style={{ fontFamily: 'var(--f-display)', fontWeight: 600, fontSize: 14, color: 'var(--ink)' }}>
            {statusLabel}
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <div style={{
            padding: '12px 12px',
            background: 'rgba(247,231,193,0.25)',
            border: '1px solid rgba(212,168,79,0.20)',
            borderRadius: 10,
          }}>
            <div style={{ fontSize: 10.5, color: 'var(--ni-muted)', fontWeight: 600, marginBottom: 4 }}>ELAPSED</div>
            <div style={{ fontFamily: 'var(--f-display)', fontWeight: 600, fontSize: 18, color: 'var(--gold-deep)' }}>
              {elapsedStr}
            </div>
          </div>
          <div style={{
            padding: '12px 12px',
            background: 'rgba(235,241,231,0.5)',
            border: '1px solid rgba(47,93,80,0.12)',
            borderRadius: 10,
          }}>
            <div style={{ fontSize: 10.5, color: 'var(--ni-muted)', fontWeight: 600, marginBottom: 4 }}>ETA</div>
            <div style={{ fontFamily: 'var(--f-display)', fontWeight: 600, fontSize: 18, color: 'var(--forest-deep)' }}>
              {job.status === 'running' ? `~${etaMins}m` : '—'}
            </div>
          </div>
        </div>

        {/* Per-agent progress dots */}
        <div style={{ marginTop: 16 }}>
          <div style={{ fontSize: 10.5, color: 'var(--ni-muted)', fontWeight: 600, marginBottom: 8 }}>
            AGENTS ({job.currentAgent ? `${Math.min(job.currentAgent, 6)}/6` : '0/6'})
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            {stages.map(s => {
              const st = job.status === 'awaiting_review' || job.status === 'completed'
                ? 'done'
                : !job.currentAgent ? 'pending'
                : s.n < job.currentAgent ? 'done'
                : s.n === job.currentAgent ? 'active'
                : 'pending'
              return (
                <div key={s.n} title={s.title} style={{
                  flex: 1, height: 5, borderRadius: 999,
                  background: st === 'done'
                    ? 'var(--forest)'
                    : st === 'active'
                    ? s.color
                    : 'rgba(47,93,80,0.10)',
                  transition: 'background .4s ease',
                  boxShadow: st === 'active' ? `0 0 8px ${s.color}88` : 'none',
                }} />
              )
            })}
          </div>
        </div>
      </div>

      {/* What's happening */}
      {job.status === 'running' && job.currentAgent && (
        <div style={{
          padding: '18px 20px',
          background: 'linear-gradient(180deg, #FFFCF4 0%, #FBF1D8 100%)',
          border: '1.5px solid rgba(212,168,79,0.35)',
          borderRadius: 16,
          boxShadow: '0 6px 18px rgba(212,168,79,0.14)',
        }}>
          <div style={{ fontFamily: 'var(--f-mono)', fontSize: 10, fontWeight: 600, color: 'var(--gold-deep)', letterSpacing: '0.12em', marginBottom: 10 }}>
            ACTIVE AGENT
          </div>
          {(() => {
            const s = stages.find(x => x.n === job.currentAgent)
            if (!s) return null
            return (
              <>
                <div style={{ fontFamily: 'var(--f-display)', fontWeight: 600, fontSize: 15, color: 'var(--ink)', marginBottom: 4 }}>
                  {s.title}
                </div>
                <div style={{ fontSize: 12.5, color: 'var(--ink-soft)', lineHeight: 1.4, marginBottom: 10 }}>
                  {s.sub}
                </div>
                <span style={{
                  fontFamily: 'var(--f-mono)', fontSize: 10.5, fontWeight: 600,
                  color: s.color, padding: '3px 9px',
                  background: `${s.color}18`, borderRadius: 999,
                  border: `1px solid ${s.color}33`,
                }}>
                  {s.model}
                </span>
              </>
            )
          })()}
        </div>
      )}

      {/* Pipeline legend */}
      <div style={{
        padding: '16px 20px',
        background: 'rgba(255,255,255,0.70)',
        border: '1px solid var(--line-strong)',
        borderRadius: 16,
      }}>
        <div style={{ fontFamily: 'var(--f-mono)', fontSize: 10, fontWeight: 600, color: 'var(--ni-muted)', letterSpacing: '0.12em', marginBottom: 12 }}>
          PIPELINE
        </div>
        {stages.map(s => (
          <div key={s.n} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <div style={{
              width: 6, height: 6, borderRadius: '50%', flexShrink: 0,
              background: s.color,
            }} />
            <span style={{ fontSize: 12, color: 'var(--ink-soft)', flex: 1 }}>{s.title}</span>
            <span style={{ fontFamily: 'var(--f-mono)', fontSize: 10, color: 'var(--ni-muted)' }}>{s.model.replace('gemini-3.1-', '')}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ── Main page ── */
export default function WorkflowPage() {
  const params = useParams()
  const jobId  = typeof params.jobId === 'string' ? params.jobId : ''

  const [job, setJob]           = useState<JobStatus | null>(null)
  const [error, setError]       = useState(false)
  const [elapsedSecs, setElapsedSecs] = useState(0)
  const [animTick, setAnimTick] = useState(0)

  const poll = useCallback(async () => {
    if (!jobId) return
    try {
      const res = await fetch(`/api/jobs/${jobId}`)
      if (!res.ok) { setError(true); return }
      const data = await res.json()
      setJob(data)
    } catch {
      setError(true)
    }
  }, [jobId])

  useEffect(() => {
    poll()
    const pollId = setInterval(poll, 3000)
    const elapsedId = setInterval(() => setElapsedSecs(s => s + 1), 1000)
    const animId = setInterval(() => setAnimTick(t => (t + 2) % 100), 500)
    return () => { clearInterval(pollId); clearInterval(elapsedId); clearInterval(animId) }
  }, [poll])

  const isTerminal = job?.status === 'completed' || job?.status === 'failed' || job?.status === 'expired'

  useEffect(() => {
    if (isTerminal) return
  }, [isTerminal])

  return (
    <div style={{ position: 'relative', minHeight: '100vh', overflow: 'hidden' }}>
      <BgLayer />
      <Nav clientName={job?.clientName ?? null} />

      <div style={{
        position: 'relative', zIndex: 1,
        maxWidth: 1200, margin: '0 auto',
        padding: '96px 48px 80px',
        display: 'grid',
        gridTemplateColumns: '1fr 320px',
        gap: 36,
        alignItems: 'start',
      }}>

        {/* Left — pipeline */}
        <div>
          {/* Header */}
          <div style={{ marginBottom: 36 }}>
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              padding: '6px 14px',
              background: 'linear-gradient(120deg, #FBF1D8, #F7E7C1)',
              border: '1px solid rgba(212,168,79,0.4)',
              borderRadius: 999,
              fontSize: 11, fontWeight: 600,
              color: 'var(--gold-deep)', letterSpacing: '0.12em', textTransform: 'uppercase',
              boxShadow: '0 4px 14px rgba(212,168,79,0.18)',
              marginBottom: 14,
            }}>
              {job?.status === 'running' ? (
                <>
                  <span style={{
                    width: 6, height: 6, borderRadius: '50%', background: 'var(--gold)',
                    boxShadow: '0 0 8px var(--gold)',
                    animation: 'pulseGold 1.4s ease-in-out infinite',
                  }} />
                  6 agents running
                </>
              ) : job?.status === 'awaiting_review' ? (
                <>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--forest)' }} />
                  Awaiting your review
                </>
              ) : job?.status === 'completed' ? (
                <>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--forest)' }} />
                  Pipeline complete
                </>
              ) : (
                <>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--gold)' }} />
                  Initializing
                </>
              )}
            </span>
            <h1 style={{
              fontFamily: 'var(--f-display)',
              fontSize: 'clamp(28px, 3.2vw, 42px)',
              fontWeight: 600, lineHeight: 1.1,
              letterSpacing: '-0.03em',
              color: 'var(--forest-deep)',
              marginBottom: 10,
            }}>
              {job?.status === 'awaiting_review' ? 'Your proposal is ready.' : 'Agents are working.'}
              <br />
              <span className="text-gradient-gold">
                {job?.clientName ? `${job.clientName} RFP` : 'Proposal Pipeline'}
              </span>
            </h1>
            <p style={{ fontSize: 15.5, color: 'var(--ink-soft)', lineHeight: 1.5 }}>
              {job?.status === 'running'
                ? `Agent ${job.currentAgent ?? 1} of 6 is running. Average total time is 15–20 minutes.`
                : job?.status === 'awaiting_review'
                ? 'All 6 agents have completed. Review and approve your proposal below.'
                : job?.status === 'completed'
                ? 'Proposal exported and delivered to your inbox.'
                : 'Pipeline is starting up…'}
            </p>
          </div>

          {/* Error state */}
          {error && (
            <div style={{
              padding: '20px 24px', borderRadius: 14,
              background: 'rgba(192,57,43,0.08)',
              border: '1.5px solid rgba(192,57,43,0.25)',
              color: '#C0392B', fontSize: 14,
              marginBottom: 24,
            }}>
              Unable to load job status. Please refresh the page.
            </div>
          )}

          {/* Stage cards */}
          {!error && (
            <div>
              {stages.map((s, i) => (
                <StageCard
                  key={s.n}
                  stage={s}
                  status={job ? stageStatus(s.n, job) : 'pending'}
                  isLast={i === stages.length - 1}
                  animTick={animTick}
                />
              ))}
            </div>
          )}

          {/* HITL panel */}
          {job?.status === 'awaiting_review' && <HitlPanel jobId={jobId} />}

          {/* Completion panel */}
          {job?.status === 'completed' && <CompletionPanel />}
        </div>

        {/* Right — job info */}
        <div style={{ position: 'sticky', top: 88 }}>
          {job && <JobInfo job={job} elapsedSecs={elapsedSecs} />}
        </div>
      </div>
    </div>
  )
}
