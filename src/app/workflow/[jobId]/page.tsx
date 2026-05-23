'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useUser, UserButton } from '@clerk/nextjs'

/* ── Types ── */
type JobStatus = {
  status: 'pending' | 'running' | 'awaiting_review' | 'completed' | 'failed' | 'expired'
  currentAgent: number | null
  currentActivity: string | null
  errorMessage: string | null
  completedAt: string | null
  clientName: string | null
  fileName: string | null
  recipientEmail: string | null
}

/* ── Stage definitions ── */
const stages = [
  { n: 1, title: 'Orchestrator Agent',          sub: 'Validating inputs & creating session',      model: 'gemini-3.1-pro',        color: '#D4A84F' },
  { n: 2, title: 'RFP Parser Agent',            sub: 'Extracting requirements & structure',        model: 'gemini-3.1-flash-lite', color: '#D4A84F' },
  { n: 3, title: 'Client Research Agent',       sub: 'Researching company & industry signals',     model: 'gemini-3.1-flash',      color: '#D4A84F' },
  { n: 4, title: 'Requirements Matcher Agent',  sub: 'Mapping capabilities to requirements',       model: 'gemini-3.1-flash-lite', color: '#D4A84F' },
  { n: 5, title: 'Proposal Writer Agent',       sub: 'Drafting full 8-section proposal',           model: 'gemini-3.1-pro',        color: '#D4A84F' },
  { n: 6, title: 'Quality Review Agent',        sub: 'Validating requirements & scoring',          model: 'gemini-3.1-flash-lite', color: '#D4A84F' },
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
    <>
      <div style={{
        position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none',
        background: `
          radial-gradient(900px 600px at 90% -10%, rgba(247,231,193,0.65) 0%, transparent 55%),
          radial-gradient(800px 600px at -10% 30%, rgba(221,231,216,0.40) 0%, transparent 55%),
          radial-gradient(700px 500px at 80% 90%, rgba(247,231,193,0.40) 0%, transparent 55%),
          linear-gradient(180deg, #FFFCF4 0%, #FAF7F2 100%)
        `,
      }} />
      <svg style={{
        position: 'fixed', top: '40%', left: 0, width: '100%', height: '60%',
        opacity: 0.08, pointerEvents: 'none', zIndex: 0,
      }} viewBox="0 0 1500 700" preserveAspectRatio="none" fill="none">
        {[...Array(24)].map((_, i) => (
          <path key={i}
            d={`M -50 ${i * 28 + 30} Q 400 ${i * 28 + 5}, 800 ${i * 28 + 55} T 1600 ${i * 28 + 20}`}
            stroke={i % 4 === 0 ? 'rgba(212,168,79,0.30)' : 'rgba(47,93,80,0.08)'}
            strokeWidth="1" fill="none"
          />
        ))}
      </svg>
    </>
  )
}

/* ── Page header ── */
function PageHeader({ clientName, fileName }: { clientName: string | null; fileName: string | null }) {
  const router = useRouter()
  const displayName = fileName
    ? (fileName.length > 32 ? fileName.slice(0, 30) + '…' : fileName)
    : null

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 20,
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '0 48px', height: 72,
      background: 'rgba(255,252,244,0.90)',
      borderBottom: '1px solid rgba(212,168,79,0.16)',
      backdropFilter: 'blur(20px) saturate(140%)',
      WebkitBackdropFilter: 'blur(20px) saturate(140%)',
    }}>
      {/* Left — logo + context */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 38, height: 38, borderRadius: 10,
            background: 'linear-gradient(180deg, #FBF1D8 0%, #E0B663 100%)',
            display: 'grid', placeItems: 'center',
            border: '1px solid rgba(212,168,79,0.45)',
            boxShadow: '0 4px 12px rgba(212,168,79,0.25)',
          }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M12 3 C 8 7, 8 13, 12 21 C 16 13, 16 7, 12 3 Z" fill="#2F5D50" />
              <path d="M5 9 C 4 13, 6 18, 11 20 C 9 16, 8 12, 5 9 Z" fill="#3d7565" />
              <path d="M19 9 C 20 13, 18 18, 13 20 C 15 16, 16 12, 19 9 Z" fill="#3d7565" />
              <circle cx="12" cy="11" r="1.5" fill="#D4A84F" />
            </svg>
          </div>
          <div style={{ lineHeight: 1.15 }}>
            <div style={{
              fontFamily: 'var(--f-display-serif)', fontWeight: 600, fontSize: 16,
              color: 'var(--forest-deep)', letterSpacing: '-0.01em',
            }}>
              Nivedan <span style={{ color: 'var(--gold-deep)' }}>AI</span>
            </div>
            <div style={{
              fontSize: 9.5, letterSpacing: '0.18em', fontWeight: 600,
              color: 'var(--ni-muted)', textTransform: 'uppercase',
              fontFamily: 'var(--f-mono)',
            }}>
              Proposal Intelligence
            </div>
          </div>
        </div>

        <span style={{ width: 1, height: 22, background: 'var(--line-strong)' }} />

        {/* Back */}
        <button
          onClick={() => router.push('/dashboard')}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            fontSize: 12.5, fontWeight: 600, color: 'var(--ink-soft)',
            padding: '5px 10px', borderRadius: 8,
            border: '1px solid transparent',
            transition: 'all .2s',
          }}
          onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = 'var(--forest-deep)'; (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--line-strong)'; }}
          onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = 'var(--ink-soft)'; (e.currentTarget as HTMLButtonElement).style.borderColor = 'transparent'; }}
        >
          <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
            <path d="M9 11L5 7l4-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Dashboard
        </button>

        {/* Client context pill */}
        {clientName && (
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 10,
            padding: '7px 14px 7px 10px',
            background: 'rgba(255,255,255,0.85)',
            border: '1px solid var(--line-strong)',
            borderRadius: 10,
            boxShadow: '0 2px 10px rgba(35,69,57,0.05)',
          }}>
            <div style={{
              width: 28, height: 28, borderRadius: 7,
              background: 'linear-gradient(135deg, #FBF1D8, #E0B663)',
              display: 'grid', placeItems: 'center',
            }}>
              <svg width="14" height="14" viewBox="0 0 20 20" fill="none">
                <path d="M3 17h14M5 17V8l5-4 5 4v9M8 17v-4h4v4" stroke="#2A1E08" strokeWidth="1.4" strokeLinecap="round" />
              </svg>
            </div>
            <div style={{ lineHeight: 1.2 }}>
              <div style={{
                fontFamily: 'var(--f-display-serif)', fontWeight: 600, fontSize: 13,
                color: 'var(--ink)',
              }}>{clientName}</div>
              {displayName && (
                <div style={{
                  fontFamily: 'var(--f-mono)', fontSize: 10, color: 'var(--gold-deep)',
                  letterSpacing: '0.04em',
                }}>{displayName}</div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Right — user */}
      <UserButton />
    </div>
  )
}

/* ── Circular progress ── */
function CircularProgress({ value, etaMin, etaMax, isDone }: { value: number; etaMin: number; etaMax: number; isDone: boolean }) {
  const size = 92
  const stroke = 7
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  const offset = c - (value / 100) * c

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 20,
      padding: '18px 24px',
      background: 'rgba(255,255,255,0.88)',
      border: '1px solid var(--line-strong)',
      borderRadius: 16,
      boxShadow: '0 4px 18px rgba(35,69,57,0.06)',
      backdropFilter: 'blur(10px)',
      WebkitBackdropFilter: 'blur(10px)',
      flexShrink: 0,
    }}>
      <div style={{ position: 'relative', width: size, height: size }}>
        <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
          <circle cx={size / 2} cy={size / 2} r={r}
            stroke="rgba(212,168,79,0.14)" strokeWidth={stroke} fill="none" />
          <circle cx={size / 2} cy={size / 2} r={r}
            stroke="url(#progGold)" strokeWidth={stroke} fill="none"
            strokeLinecap="round"
            strokeDasharray={c}
            strokeDashoffset={offset}
            style={{ transition: 'stroke-dashoffset .6s cubic-bezier(.2,.7,.2,1)' }}
          />
          <defs>
            <linearGradient id="progGold" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#E0B663" />
              <stop offset="100%" stopColor="#B88A2F" />
            </linearGradient>
          </defs>
        </svg>
        <div style={{
          position: 'absolute', inset: 0, display: 'flex',
          alignItems: 'center', justifyContent: 'center',
          fontFamily: 'var(--f-display)', fontWeight: 700, fontSize: 19,
          color: 'var(--forest-deep)', letterSpacing: '-0.02em',
        }}>
          <span>{Math.round(value)}</span>
          <span style={{ fontSize: 11, opacity: 0.7, marginLeft: 1 }}>%</span>
        </div>
      </div>
      <div>
        <div style={{
          fontFamily: 'var(--f-display-serif)', fontWeight: 600, fontSize: 15,
          color: 'var(--ink)', marginBottom: 3,
        }}>Overall Progress</div>
        <div style={{ fontSize: 12, color: isDone ? 'var(--forest)' : 'var(--gold-deep)', fontWeight: 500 }}>
          {isDone ? 'All agents done' : 'Estimated time left'}
        </div>
        <div style={{
          fontFamily: 'var(--f-mono)', fontSize: 13, color: isDone ? 'var(--forest)' : 'var(--gold-deep)',
          fontWeight: 600, marginTop: 1,
        }}>
          {isDone ? 'Complete' : `${etaMin} – ${etaMax} min`}
        </div>
      </div>
    </div>
  )
}

/* ── RFP document banner ── */
function RfpBanner({ fileName, status }: { fileName: string | null; status: JobStatus['status'] }) {
  const isRunning = status === 'running'
  const isDone = status === 'awaiting_review' || status === 'completed'

  return (
    <div style={{
      position: 'relative',
      padding: '20px 28px',
      background: 'linear-gradient(180deg, #fff 0%, #FFFCF4 100%)',
      border: '1px solid rgba(212,168,79,0.28)',
      borderRadius: 16,
      boxShadow: '0 6px 24px rgba(35,69,57,0.06)',
      overflow: 'hidden',
    }}>
      {/* Folded corner */}
      <div style={{ position: 'absolute', top: 0, right: 0, width: 52, height: 52, pointerEvents: 'none' }}>
        <svg width="52" height="52" viewBox="0 0 52 52">
          <path d="M52 0 L52 52 L0 0 Z" fill="rgba(212,168,79,0.08)" />
          <path d="M52 0 L18 0 L52 34 Z" fill="url(#foldGradBanner)" stroke="rgba(212,168,79,0.28)" strokeWidth="0.7" />
          <path d="M18 0 L52 34" stroke="rgba(212,168,79,0.40)" strokeWidth="0.5" />
          <defs>
            <linearGradient id="foldGradBanner" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#FFFCF4" />
              <stop offset="100%" stopColor="#F4EFE6" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
        {/* Doc info */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{
            width: 50, height: 58, borderRadius: 9,
            background: 'linear-gradient(180deg, #E0B663 0%, #B88A2F 100%)',
            display: 'grid', placeItems: 'center',
            boxShadow: '0 5px 14px rgba(212,168,79,0.28)',
            flexShrink: 0,
          }}>
            <svg width="36" height="44" viewBox="0 0 40 48">
              <path d="M4 4 H26 L36 14 V44 H4 Z" fill="#FBF1D8" stroke="#FFF" strokeWidth="0.6" />
              <path d="M26 4 V14 H36" fill="#E0B663" stroke="#FFF" strokeWidth="0.6" />
              <path d="M10 22 H30 M10 27 H30 M10 32 H22" stroke="#B88A2F" strokeWidth="1.2" strokeLinecap="round" />
            </svg>
          </div>
          <div>
            <div style={{
              fontFamily: 'var(--f-mono)', fontSize: 9.5, fontWeight: 600,
              color: 'var(--gold-deep)', letterSpacing: '0.18em', marginBottom: 5,
            }}>RFP DOCUMENT</div>
            <div style={{
              fontFamily: 'var(--f-display-serif)', fontWeight: 600, fontSize: 19,
              color: 'var(--ink)', lineHeight: 1.15, letterSpacing: '-0.01em',
            }}>
              {fileName ?? 'Proposal Document'}
            </div>
            <div style={{ fontSize: 12.5, color: 'var(--ink-soft)', marginTop: 4 }}>
              Uploaded & processing
            </div>
          </div>
        </div>

        {/* Job status */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '10px 18px',
          background: isDone ? 'rgba(47,93,80,0.06)' : 'rgba(247,231,193,0.35)',
          border: `1px solid ${isDone ? 'rgba(47,93,80,0.18)' : 'rgba(212,168,79,0.35)'}`,
          borderRadius: 12,
        }}>
          <span style={{
            width: 9, height: 9, borderRadius: '50%', flexShrink: 0,
            background: isDone ? 'var(--forest)' : 'var(--gold)',
            boxShadow: isDone ? '0 0 10px rgba(47,93,80,0.5)' : '0 0 10px rgba(212,168,79,0.7)',
            animation: isRunning ? 'pulseGold 1.4s ease-in-out infinite' : 'none',
          }} />
          <div>
            <div style={{
              fontFamily: 'var(--f-display-serif)', fontWeight: 600, fontSize: 16,
              color: 'var(--ink)', letterSpacing: '-0.01em',
            }}>
              {isDone ? 'Completed' : status === 'pending' ? 'Initializing' : 'In Progress'}
            </div>
            <div style={{ fontSize: 11.5, color: 'var(--ink-soft)', fontFamily: 'var(--f-mono)', letterSpacing: '0.04em' }}>
              {isDone ? 'All agents done' : 'Pipeline running'}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ── Status badge ── */
function StatusBadge({ status }: { status: 'done' | 'active' | 'pending' }) {
  if (status === 'done') return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 6,
      padding: '5px 12px',
      background: 'rgba(47,93,80,0.10)',
      border: '1px solid rgba(47,93,80,0.20)',
      borderRadius: 999, fontSize: 11.5, fontWeight: 600,
      color: 'var(--forest-deep)',
      fontFamily: 'var(--f-body)',
    }}>
      <svg width="11" height="11" viewBox="0 0 12 12">
        <path d="M2 6l2.5 2.5L10 3" stroke="currentColor" strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      Completed
    </span>
  )

  if (status === 'active') return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 6,
      padding: '5px 12px',
      background: 'linear-gradient(120deg, #FBF1D8, #F7E7C1)',
      border: '1px solid rgba(212,168,79,0.45)',
      borderRadius: 999, fontSize: 11.5, fontWeight: 600,
      color: 'var(--gold-deep)',
      fontFamily: 'var(--f-body)',
    }}>
      <span style={{
        width: 6, height: 6, borderRadius: '50%',
        background: 'var(--gold)',
        animation: 'pulseGold 1.2s ease-in-out infinite',
      }} />
      Running
    </span>
  )

  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 6,
      padding: '5px 12px',
      background: 'rgba(138,149,143,0.10)',
      border: '1px solid var(--line-strong)',
      borderRadius: 999, fontSize: 11.5, fontWeight: 600,
      color: 'var(--ink-soft)',
      fontFamily: 'var(--f-body)',
    }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--ni-muted)' }} />
      Pending
    </span>
  )
}

/* ── Agent row card ── */
function AgentRow({
  stage,
  status,
  animTick,
  currentActivity,
}: {
  stage: typeof stages[0]
  status: 'done' | 'active' | 'pending'
  animTick: number
  currentActivity: string | null
}) {
  const isDone    = status === 'done'
  const isActive  = status === 'active'
  const isPending = status === 'pending'
  const barPct    = isDone ? 100 : isActive ? (animTick % 100) : 0

  return (
    <div style={{
      position: 'relative',
      display: 'grid',
      gridTemplateColumns: '60px 1fr auto',
      gap: 16,
      padding: '20px 22px',
      background: isActive
        ? 'linear-gradient(180deg, #FFFEF8 0%, #FFF9E6 100%)'
        : isDone
        ? 'linear-gradient(180deg, #fff 0%, var(--sage-soft) 100%)'
        : '#fff',
      border: isActive
        ? '1px solid rgba(212,168,79,0.50)'
        : isDone
        ? '1px solid rgba(47,93,80,0.14)'
        : '1px solid var(--line-strong)',
      borderRadius: 16,
      boxShadow: isActive
        ? '0 0 0 5px rgba(247,231,193,0.45), 0 16px 32px rgba(212,168,79,0.16)'
        : isDone
        ? '0 2px 8px rgba(35,69,57,0.06)'
        : '0 1px 3px rgba(35,69,57,0.03)',
      transition: 'all .5s cubic-bezier(.2,.7,.2,1)',
      minHeight: 130,
      overflow: 'hidden',
    }}>
      {/* Spine — circle */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative' }}>
        <div style={{
          width: 46, height: 46, borderRadius: '50%',
          background: isDone
            ? 'var(--forest)'
            : isActive
            ? 'linear-gradient(180deg, #FBF1D8, #E0B663)'
            : '#fff',
          border: isDone
            ? '1.5px solid var(--forest)'
            : isActive
            ? '1.5px solid rgba(212,168,79,0.55)'
            : '1.5px solid var(--line-strong)',
          display: 'grid', placeItems: 'center', flexShrink: 0,
          boxShadow: isActive
            ? '0 0 0 5px rgba(247,231,193,0.55), 0 0 18px rgba(212,168,79,0.5)'
            : isDone
            ? '0 5px 14px rgba(47,93,80,0.20)'
            : 'none',
          animation: isActive ? 'pulseGoldRing 2s ease-in-out infinite' : 'none',
          transition: 'all .5s ease',
        }}>
          {isDone ? (
            <svg width="19" height="19" viewBox="0 0 20 20">
              <path d="M5 10l3.5 3.5L15 6" stroke="#fff" strokeWidth="2.2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          ) : isActive ? (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <path d="M12 3 L14 9 L20 11 L14 13 L12 19 L10 13 L4 11 L10 9 Z" fill="#2A1E08" />
              <circle cx="6" cy="6" r="0.9" fill="#2A1E08" />
              <circle cx="18" cy="18" r="0.9" fill="#2A1E08" />
            </svg>
          ) : (
            <span style={{
              fontFamily: 'var(--f-display-serif)', fontWeight: 700, fontSize: 17,
              color: 'var(--ink-soft)',
            }}>{String(stage.n).padStart(2, '0')}</span>
          )}
        </div>
        {/* Vertical connector */}
        <div style={{
          width: 2, flex: 1, minHeight: 20, marginTop: 6,
          background: isDone ? 'var(--gold)' : isActive ? 'rgba(212,168,79,0.35)' : 'rgba(212,168,79,0.15)',
          borderRadius: 999,
        }} />
      </div>

      {/* Body */}
      <div style={{ minWidth: 0 }}>
        <div style={{
          fontFamily: 'var(--f-mono)', fontWeight: 700, fontSize: 13,
          color: 'var(--gold-deep)', letterSpacing: '0.04em', marginBottom: 4,
        }}>
          {String(stage.n).padStart(2, '0')}
        </div>
        <div style={{
          fontFamily: 'var(--f-display-serif)', fontWeight: 600, fontSize: 20,
          color: isPending ? 'var(--ni-muted)' : 'var(--ink)',
          letterSpacing: '-0.01em', lineHeight: 1.15, marginBottom: 6,
        }}>
          {stage.title}
        </div>
        <div style={{
          fontSize: 13, color: isPending ? 'var(--ni-muted)' : 'var(--ink-soft)',
          lineHeight: 1.4, marginBottom: 10,
        }}>
          {isPending ? 'Waiting to start' : stage.sub}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <span style={{ fontSize: 12, color: 'var(--ink)', fontWeight: 600 }}>Model:</span>
          <span style={{ fontFamily: 'var(--f-mono)', fontSize: 11.5, color: 'var(--forest-soft)' }}>{stage.model}</span>
        </div>
        {/* Activity strip */}
        {isActive && currentActivity && (
          <div style={{
            marginTop: 10, padding: '7px 10px',
            background: 'rgba(212,168,79,0.08)',
            border: '1px solid rgba(212,168,79,0.22)',
            borderRadius: 8,
            fontSize: 11.5, color: 'var(--gold-deep)',
            fontStyle: 'italic', lineHeight: 1.4,
            display: 'flex', alignItems: 'center', gap: 8,
          }}>
            <span style={{ display: 'inline-flex', gap: 3, alignItems: 'center', flexShrink: 0 }}>
              {[0, 1, 2].map(d => (
                <span key={d} style={{
                  width: 4, height: 4, borderRadius: '50%',
                  background: 'var(--gold)',
                  animation: `pulseGold ${0.9 + d * 0.2}s ease-in-out infinite`,
                  animationDelay: `${d * 0.18}s`,
                }} />
              ))}
            </span>
            {currentActivity}
          </div>
        )}
      </div>

      {/* Right — status + progress */}
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'flex-end',
        justifyContent: 'space-between', gap: 8, minWidth: 120,
      }}>
        <StatusBadge status={status} />
        <div style={{ fontSize: 11.5, color: 'var(--ink-soft)', textAlign: 'right', fontStyle: 'italic' }}>
          {isDone ? 'Agent finished' : isActive ? 'In progress…' : 'Waiting to start'}
        </div>
        {isActive && (
          <div style={{ width: '100%' }}>
            <div style={{ height: 5, borderRadius: 999, background: 'rgba(212,168,79,0.15)', overflow: 'hidden' }}>
              <div style={{
                width: `${barPct}%`, height: '100%',
                background: 'linear-gradient(90deg, #E0B663, #D4A84F)',
                borderRadius: 999,
                transition: 'width .8s linear',
                boxShadow: '0 0 8px rgba(212,168,79,0.6)',
              }} />
            </div>
            <div style={{
              textAlign: 'right', fontSize: 10.5, fontWeight: 600,
              color: 'var(--gold-deep)', marginTop: 3,
              fontFamily: 'var(--f-mono)',
            }}>
              {barPct}%
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

/* ── Quality footer ── */
function QualityFooter({ email }: { email: string }) {
  return (
    <div style={{
      padding: '20px 26px',
      background: 'rgba(255,255,255,0.80)',
      border: '1px solid var(--line-strong)',
      borderRadius: 16,
      display: 'grid',
      gridTemplateColumns: '1.4fr 1fr auto',
      gap: 22,
      alignItems: 'center',
      boxShadow: '0 4px 18px rgba(35,69,57,0.05)',
      backdropFilter: 'blur(10px)',
      WebkitBackdropFilter: 'blur(10px)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <div style={{
          width: 42, height: 42, borderRadius: '50%',
          background: 'rgba(212,168,79,0.13)',
          border: '1px solid rgba(212,168,79,0.28)',
          display: 'grid', placeItems: 'center', flexShrink: 0,
        }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M12 3l8 3v6c0 4.5-3.5 8-8 9-4.5-1-8-4.5-8-9V6l8-3Z" stroke="#D4A84F" strokeWidth="1.6" />
            <path d="M8 12l3 3 5-5" stroke="#D4A84F" strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <div>
          <div style={{
            fontFamily: 'var(--f-display-serif)', fontWeight: 600, fontSize: 15,
            color: 'var(--ink)', marginBottom: 2,
          }}>Quality Assured</div>
          <div style={{ fontSize: 12.5, color: 'var(--ink-soft)', lineHeight: 1.4 }}>
            Every requirement addressed. Every detail verified.
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{
          width: 34, height: 34, borderRadius: '50%',
          background: 'rgba(47,93,80,0.08)',
          display: 'grid', placeItems: 'center', flexShrink: 0,
        }}>
          <svg width="16" height="16" viewBox="0 0 22 22" fill="none">
            <path d="M3 6l8 6 8-6 M3 6v10h16V6 M3 6l8-2 8 2" stroke="#2F5D50" strokeWidth="1.4" strokeLinejoin="round" fill="none" />
          </svg>
        </div>
        <div style={{ lineHeight: 1.3 }}>
          <div style={{ fontSize: 12, color: 'var(--ink-soft)' }}>You&apos;ll be notified at</div>
          <div style={{
            fontFamily: 'var(--f-mono)', fontSize: 12.5,
            color: 'var(--forest-deep)', fontWeight: 600,
          }}>{email}</div>
        </div>
      </div>

      <button style={{
        padding: '11px 18px',
        background: '#fff',
        border: '1px solid var(--line-strong)',
        borderRadius: 10,
        fontFamily: 'var(--f-body)', fontWeight: 600, fontSize: 13,
        color: 'var(--forest-deep)',
        cursor: 'pointer',
        display: 'inline-flex', alignItems: 'center', gap: 8,
        transition: 'all .25s',
        whiteSpace: 'nowrap',
      }}
        onMouseEnter={e => {
          (e.currentTarget as HTMLButtonElement).style.background = 'linear-gradient(120deg, #FBF1D8, #F7E7C1)'
          ;(e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(212,168,79,0.45)'
        }}
        onMouseLeave={e => {
          (e.currentTarget as HTMLButtonElement).style.background = '#fff'
          ;(e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--line-strong)'
        }}
      >
        View Live Logs
        <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
          <path d="M2 7h10 M8 3l4 4-4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
    </div>
  )
}

/* ── Quote block ── */
function QuoteBlock() {
  return (
    <div style={{
      position: 'relative',
      padding: '26px 36px 26px 28px',
      background: 'linear-gradient(120deg, #FFFCF4 0%, #FBF1D8 80%, #FDF5DE 100%)',
      border: '1px solid rgba(212,168,79,0.38)',
      borderRadius: 18,
      display: 'flex', alignItems: 'center', gap: 26,
      boxShadow: '0 10px 30px rgba(212,168,79,0.16)',
      overflow: 'hidden',
    }}>
      {/* Wave decoration */}
      <svg style={{
        position: 'absolute', top: 0, right: 0, width: 340, height: '100%',
        opacity: 0.55, pointerEvents: 'none',
      }} viewBox="0 0 340 120" preserveAspectRatio="none">
        <defs>
          <linearGradient id="waveGQ" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="rgba(212,168,79,0)" />
            <stop offset="100%" stopColor="rgba(212,168,79,0.65)" />
          </linearGradient>
        </defs>
        {[...Array(10)].map((_, i) => (
          <path key={i}
            d={`M -20 ${55 + i * 5} Q 80 ${45 + i * 5 + (i % 2 ? 8 : -5)}, 200 ${60 + i * 5} T 380 ${50 + i * 5}`}
            stroke="url(#waveGQ)" strokeWidth="0.8" fill="none"
          />
        ))}
        {[[240, 45], [290, 68], [210, 88], [310, 95], [270, 25]].map(([x, y], i) => (
          <circle key={i} cx={x} cy={y} r="1.5" fill="#D4A84F" />
        ))}
      </svg>

      {/* Medallion */}
      <div style={{
        width: 80, height: 80, borderRadius: '50%', flexShrink: 0,
        background: 'radial-gradient(circle at 35% 30%, #FBF1D8 0%, #E0B663 70%, #B88A2F 100%)',
        border: '3px solid #fff',
        display: 'grid', placeItems: 'center',
        boxShadow: '0 0 0 1px rgba(212,168,79,0.45), 0 10px 22px rgba(212,168,79,0.28)',
        position: 'relative', zIndex: 1,
      }}>
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none">
          <path d="M12 3 C 8 7, 8 13, 12 21 C 16 13, 16 7, 12 3 Z" fill="#2F5D50" />
          <path d="M5 9 C 4 13, 6 18, 11 20 C 9 16, 8 12, 5 9 Z" fill="#3d7565" />
          <path d="M19 9 C 20 13, 18 18, 13 20 C 15 16, 16 12, 19 9 Z" fill="#3d7565" />
          <circle cx="12" cy="11" r="1.5" fill="#FBF1D8" />
        </svg>
      </div>

      {/* Quote text */}
      <div style={{ position: 'relative', zIndex: 1, maxWidth: 580 }}>
        <span style={{
          fontFamily: 'var(--f-display-serif)', fontSize: 50, fontWeight: 700,
          color: 'rgba(212,168,79,0.50)', lineHeight: 1, display: 'inline-block',
          marginRight: 4, verticalAlign: '-10px',
        }}>&ldquo;</span>
        <span style={{
          fontFamily: 'var(--f-display-serif)', fontWeight: 500, fontSize: 18,
          color: 'var(--forest-deep)', lineHeight: 1.55, letterSpacing: '-0.005em',
          fontStyle: 'italic',
        }}>
          From understanding requirements to delivering a winning proposal —
          all in under{' '}
          <span style={{ color: 'var(--gold-deep)', fontWeight: 600, fontStyle: 'normal' }}>
            20 minutes.
          </span>
        </span>
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
      padding: '26px 28px',
      background: 'linear-gradient(180deg, #fff 0%, rgba(255,252,244,0.85) 100%)',
      border: '1.5px solid rgba(212,168,79,0.38)',
      borderRadius: 18,
      boxShadow: '0 14px 36px rgba(212,168,79,0.16)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 10 }}>
        <div style={{
          width: 40, height: 40, borderRadius: 11,
          background: 'linear-gradient(135deg, #FBF1D8, #E0B663)',
          display: 'grid', placeItems: 'center',
        }}>
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path d="M9 2l2 4.5L16 7l-3.5 3.3L13.4 16 9 13.4 4.6 16l.9-5.7L2 7l5-.5L9 2Z" fill="#2A1E08" />
          </svg>
        </div>
        <div>
          <div style={{
            fontFamily: 'var(--f-display-serif)', fontWeight: 600, fontSize: 18,
            color: 'var(--ink)',
          }}>
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
            borderRadius: 10, border: '1.5px solid rgba(212,168,79,0.38)',
            background: 'rgba(255,252,244,0.85)',
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
            fontFamily: 'var(--f-display)', fontWeight: 600, fontSize: 14.5,
            cursor: loading ? 'not-allowed' : 'pointer',
            boxShadow: '0 7px 18px rgba(35,69,57,0.24)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            transition: 'all .25s',
          }}
        >
          {loading === 'approve' ? 'Processing…' : (
            <>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M3 8l3.5 3.5 6.5-7" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Approve &amp; Export PDF
            </>
          )}
        </button>
        <button
          onClick={requestChanges}
          disabled={!!loading}
          style={{
            flex: 1, padding: '13px 20px',
            background: loading === 'changes' ? 'rgba(212,168,79,0.20)' : 'rgba(212,168,79,0.10)',
            color: 'var(--gold-deep)',
            border: '1.5px solid rgba(212,168,79,0.38)',
            borderRadius: 12,
            fontFamily: 'var(--f-display)', fontWeight: 600, fontSize: 14.5,
            cursor: loading ? 'not-allowed' : 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            transition: 'all .25s',
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
function CompletionPanel({ jobId }: { jobId: string }) {
  return (
    <div style={{
      padding: '22px 28px',
      background: 'linear-gradient(120deg, var(--forest-deep), var(--forest))',
      color: '#fff', borderRadius: 18,
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      boxShadow: '0 14px 36px rgba(35,69,57,0.26)',
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
          <div style={{ fontFamily: 'var(--f-display-serif)', fontWeight: 600, fontSize: 17 }}>
            Proposal exported — check your inbox
          </div>
          <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.72)', marginTop: 3 }}>
            Branded PDF delivered via email · Saved to your library
          </div>
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <a
          href={`/proposals/${jobId}`}
          style={{
            padding: '11px 20px', fontSize: 13.5, fontWeight: 600,
            background: 'rgba(255,255,255,0.15)',
            color: '#fff', borderRadius: 10,
            border: '1.5px solid rgba(255,255,255,0.3)', textDecoration: 'none',
            whiteSpace: 'nowrap',
            fontFamily: 'var(--f-display)',
          }}
        >
          View Proposal
        </a>
        <a
          href="/dashboard"
          style={{
            padding: '11px 20px', fontSize: 13.5, fontWeight: 600,
            background: 'linear-gradient(135deg, #FBF1D8, #E0B663)',
            color: '#2A1E08', borderRadius: 10,
            border: 'none', textDecoration: 'none',
            boxShadow: '0 5px 14px rgba(212,168,79,0.28)',
            whiteSpace: 'nowrap',
            fontFamily: 'var(--f-display)',
          }}
        >
          Back to Dashboard →
        </a>
      </div>
    </div>
  )
}

/* ── Main page ── */
export default function WorkflowPage() {
  const params = useParams()
  const jobId  = typeof params.jobId === 'string' ? params.jobId : ''
  const { user } = useUser()

  const [job, setJob]                 = useState<JobStatus | null>(null)
  const [error, setError]             = useState(false)
  const [elapsedSecs, setElapsedSecs] = useState(0)
  const [animTick, setAnimTick]       = useState(0)

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
    const pollId    = setInterval(poll, 3000)
    const elapsedId = setInterval(() => setElapsedSecs(s => s + 1), 1000)
    const animId    = setInterval(() => setAnimTick(t => (t + 2) % 100), 500)
    return () => { clearInterval(pollId); clearInterval(elapsedId); clearInterval(animId) }
  }, [poll])

  const isTerminal = job?.status === 'completed' || job?.status === 'failed' || job?.status === 'expired'

  useEffect(() => {
    if (isTerminal) return
  }, [isTerminal])

  /* Derived progress values */
  const overallPct = !job
    ? 0
    : job.status === 'awaiting_review' || job.status === 'completed'
    ? 100
    : !job.currentAgent
    ? 0
    : Math.min(99, ((job.currentAgent - 1) * 100 + animTick) / 6)

  const remainingStages = Math.max(0, 6 - (job?.currentAgent ?? 0))
  const etaMin = job?.status === 'running' ? Math.max(0, remainingStages * 3 - 1) : 0
  const etaMax = job?.status === 'running' ? remainingStages * 3 + 4 : 0

  const mins = Math.floor(elapsedSecs / 60)
  const secs = elapsedSecs % 60
  const elapsedStr = mins > 0 ? `${mins}m ${secs}s` : `${secs}s`

  const userEmail = job?.recipientEmail ?? user?.primaryEmailAddress?.emailAddress ?? 'you@yourcompany.com'

  return (
    <div style={{ position: 'relative', minHeight: '100vh', overflow: 'hidden' }}>
      <BgLayer />
      <PageHeader clientName={job?.clientName ?? null} fileName={job?.fileName ?? null} />

      <div style={{
        position: 'relative', zIndex: 1,
        maxWidth: 1100, margin: '0 auto',
        padding: '96px 48px 80px',
      }}>

        {/* Title row + circular progress */}
        <div style={{
          display: 'grid', gridTemplateColumns: '1fr auto', gap: 32,
          alignItems: 'flex-start', marginBottom: 28,
        }}>
          <div>
            {/* Eyebrow */}
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              padding: '5px 13px',
              background: 'linear-gradient(120deg, #FBF1D8, #F7E7C1)',
              border: '1px solid rgba(212,168,79,0.38)',
              borderRadius: 999,
              fontSize: 10.5, fontWeight: 600,
              color: 'var(--gold-deep)', letterSpacing: '0.12em', textTransform: 'uppercase',
              fontFamily: 'var(--f-mono)',
              boxShadow: '0 3px 12px rgba(212,168,79,0.16)',
              marginBottom: 14,
            }}>
              {job?.status === 'running' ? (
                <>
                  <span style={{
                    width: 6, height: 6, borderRadius: '50%', background: 'var(--gold)',
                    boxShadow: '0 0 8px var(--gold)',
                    animation: 'pulseGold 1.4s ease-in-out infinite',
                  }} />
                  6 agents active
                </>
              ) : job?.status === 'awaiting_review' ? (
                <><span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--forest)' }} /> Awaiting your review</>
              ) : job?.status === 'completed' ? (
                <><span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--forest)' }} /> Pipeline complete</>
              ) : (
                <><span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--gold)' }} /> Initializing</>
              )}
            </span>

            <h1 style={{
              fontFamily: 'var(--f-display-serif)',
              fontSize: 'clamp(32px, 3.8vw, 52px)',
              fontWeight: 700, lineHeight: 1.05,
              letterSpacing: '-0.02em',
              color: 'var(--forest-deep)',
              marginBottom: 12,
            }}>
              {job?.status === 'awaiting_review' ? 'Your proposal is ready.' : 'Proposal Pipeline'}
              <br />
              <span style={{
                background: 'linear-gradient(135deg, #D4A84F 0%, #B88A2F 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}>
                {job?.clientName ? `${job.clientName} RFP` : 'Agents are working.'}
              </span>
            </h1>
            <p style={{ fontSize: 15.5, color: 'var(--ink-soft)', lineHeight: 1.5 }}>
              {job?.status === 'running'
                ? `Agent ${job.currentAgent ?? 1} of 6 is running · Elapsed: ${elapsedStr} · Average total time is 15–20 minutes.`
                : job?.status === 'awaiting_review'
                ? 'All 6 agents have completed. Review and approve your proposal below.'
                : job?.status === 'completed'
                ? 'Proposal exported and delivered to your inbox.'
                : 'Pipeline is starting up…'}
            </p>
          </div>

          {/* Circular progress */}
          <CircularProgress
            value={overallPct}
            etaMin={etaMin}
            etaMax={etaMax}
            isDone={job?.status === 'awaiting_review' || job?.status === 'completed'}
          />
        </div>

        {/* RFP banner */}
        {job && (
          <div style={{ marginBottom: 26 }}>
            <RfpBanner fileName={job.fileName} status={job.status} />
          </div>
        )}

        {/* Error state */}
        {error && (
          <div style={{
            padding: '18px 22px', borderRadius: 12,
            background: 'rgba(192,57,43,0.07)',
            border: '1.5px solid rgba(192,57,43,0.22)',
            color: '#C0392B', fontSize: 14,
            marginBottom: 22,
          }}>
            Unable to load job status. Please refresh the page.
          </div>
        )}

        {/* 2×3 Agent grid */}
        {!error && (
          <div style={{
            display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20,
            marginBottom: 24,
          }}>
            {stages.map(s => {
              const st = job ? stageStatus(s.n, job) : 'pending'
              return (
                <AgentRow
                  key={s.n}
                  stage={s}
                  status={st}
                  animTick={animTick}
                  currentActivity={st === 'active' ? job?.currentActivity ?? null : null}
                />
              )
            })}
          </div>
        )}

        {/* Quality footer — visible while running or awaiting */}
        {(job?.status === 'running' || job?.status === 'awaiting_review') && (
          <div style={{ marginBottom: 24 }}>
            <QualityFooter email={userEmail} />
          </div>
        )}

        {/* HITL panel */}
        {job?.status === 'awaiting_review' && (
          <div style={{ marginBottom: 24 }}>
            <HitlPanel jobId={jobId} />
          </div>
        )}

        {/* View proposal link — awaiting review */}
        {job?.status === 'awaiting_review' && (
          <div style={{ marginBottom: 12, display: 'flex', justifyContent: 'flex-end' }}>
            <a
              href={`/proposals/${jobId}`}
              style={{
                padding: '10px 18px', fontSize: 13, fontWeight: 600,
                background: 'linear-gradient(135deg, var(--forest-deep), var(--forest))',
                color: '#fff', borderRadius: 10, textDecoration: 'none',
                boxShadow: '0 4px 12px rgba(35,69,57,0.2)',
              }}
            >
              View Proposal →
            </a>
          </div>
        )}

        {/* Completion panel */}
        {job?.status === 'completed' && (
          <div style={{ marginBottom: 24 }}>
            <CompletionPanel jobId={jobId} />
          </div>
        )}

        {/* Quote block */}
        <QuoteBlock />
      </div>
    </div>
  )
}
