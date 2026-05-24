'use client'

import React, { useState, useEffect, useRef, MutableRefObject } from 'react'
import type { proposals, rfpJobs } from '@/db/schema'

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

interface Props {
  proposal: typeof proposals.$inferSelect
  job:      typeof rfpJobs.$inferSelect
  exportRow: { pdfUrl: string; fileName: string | null } | null
  score:      number | null
  scoreColor: string
  scoreBg:    string
}

/* ── Background gradient ── */
function ProposalBg() {
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none',
      background: `
        radial-gradient(900px 600px at 90% -10%, rgba(247,231,193,0.50) 0%, transparent 55%),
        radial-gradient(700px 500px at -10% 30%, rgba(221,231,216,0.35) 0%, transparent 55%),
        linear-gradient(180deg, #FFFCF4 0%, #FAF7F2 100%)
      `,
    }} />
  )
}

/* ── Logo mark ── */
function Mark({ size = 28 }: { size?: number }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: size * 0.28,
      background: 'linear-gradient(180deg, #FBF1D8 0%, #E0B663 100%)',
      display: 'grid', placeItems: 'center',
      border: '1px solid rgba(212,168,79,0.5)',
      boxShadow: `0 ${size * 0.12}px ${size * 0.45}px rgba(212,168,79,0.30), inset 0 1px 0 rgba(255,255,255,0.7)`,
      flexShrink: 0,
    }}>
      <svg width={size * 0.62} height={size * 0.62} viewBox="0 0 24 24" fill="none">
        <path d="M12 3 C 8 7, 8 13, 12 21 C 16 13, 16 7, 12 3 Z" fill="#2F5D50" />
        <path d="M5 9 C 4 13, 6 18, 11 20 C 9 16, 8 12, 5 9 Z" fill="#3d7565" />
        <path d="M19 9 C 20 13, 18 18, 13 20 C 15 16, 16 12, 19 9 Z" fill="#3d7565" />
        <circle cx="12" cy="11" r="1.5" fill="#D4A84F" />
      </svg>
    </div>
  )
}

/* ── Sticky header ── */
function Header({
  activeIdx, score, scoreColor, scoreBg, status, version, exportPdfUrl,
}: {
  activeIdx: number
  score: number | null
  scoreColor: string
  scoreBg: string
  status: string
  version: number
  exportPdfUrl: string | null
}) {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const completion = Math.min(100, Math.round((activeIdx + 1) / SECTIONS.length * 100))

  const statusColors: Record<string, { bg: string; color: string }> = {
    completed:       { bg: 'rgba(47,93,80,0.10)',   color: 'var(--forest-deep)' },
    awaiting_review: { bg: 'rgba(212,168,79,0.18)', color: '#8A5E0A' },
  }
  const sColor = statusColors[status] ?? { bg: 'rgba(200,200,200,0.20)', color: '#666' }

  const statusLabel: Record<string, string> = {
    pending: 'Pending', running: 'Generating…',
    awaiting_review: 'Awaiting Review', completed: 'Completed', failed: 'Failed',
  }

  return (
    <div style={{
      position: 'sticky', top: 0, zIndex: 50,
      background: scrolled ? 'rgba(255,252,244,0.92)' : 'rgba(255,252,244,0.70)',
      backdropFilter: 'blur(18px) saturate(140%)',
      WebkitBackdropFilter: 'blur(18px) saturate(140%)',
      borderBottom: scrolled ? '1px solid rgba(212,168,79,0.20)' : '1px solid transparent',
      transition: 'all .35s ease',
    }}>
      {/* Gold top stripe */}
      <div style={{ height: 3, background: 'linear-gradient(90deg, #D4A84F 0%, #E0B663 50%, #B88A2F 100%)' }} />

      <div style={{
        maxWidth: 1180, margin: '0 auto', padding: '0 36px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        height: 66,
      }}>
        {/* Left */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <a
            href="/dashboard"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              padding: '6px 12px', borderRadius: 8,
              background: 'rgba(255,255,255,0.6)',
              border: '1px solid rgba(47,93,80,0.15)',
              fontSize: 13, fontWeight: 500, color: '#667',
              textDecoration: 'none', transition: 'all .2s',
            }}
            onMouseEnter={e => { e.currentTarget.style.color = 'var(--forest-deep)'; e.currentTarget.style.background = '#fff' }}
            onMouseLeave={e => { e.currentTarget.style.color = '#667'; e.currentTarget.style.background = 'rgba(255,255,255,0.6)' }}
          >
            <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
              <path d="M9 2L4 7l5 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Dashboard
          </a>
          <span style={{ width: 1, height: 18, background: 'rgba(47,93,80,0.15)' }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Mark size={28} />
            <span style={{
              fontFamily: 'var(--f-display-serif)',
              fontWeight: 600, fontSize: 15, color: 'var(--forest-deep)', letterSpacing: '-0.01em',
            }}>
              Nivedan AI <span style={{ color: '#aaa', fontWeight: 400 }}>— Proposal</span>
            </span>
          </div>
        </div>

        {/* Right */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{
            fontSize: 11, fontWeight: 600, padding: '5px 12px', borderRadius: 999,
            background: sColor.bg, color: sColor.color,
            letterSpacing: '0.02em', display: 'inline-flex', alignItems: 'center', gap: 6,
          }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'currentColor' }} />
            {statusLabel[status] ?? status}
          </span>

          <span style={{
            fontSize: 11, fontWeight: 600, padding: '5px 12px', borderRadius: 999,
            background: 'rgba(255,255,255,0.7)', color: '#666',
            border: '1px solid rgba(47,93,80,0.12)',
            fontFamily: 'var(--f-mono)',
          }}>
            v{version}
          </span>

          {score !== null && (
            <span style={{
              fontSize: 11, fontWeight: 700, padding: '5px 12px', borderRadius: 999,
              background: scoreBg, color: scoreColor,
              display: 'inline-flex', alignItems: 'center', gap: 4,
            }}>
              <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
                <path d="M6 1l1.5 3 3.5.5-2.5 2.5.5 3.5L6 9l-3 1.5.5-3.5L1 4.5 4.5 4 6 1Z" fill="currentColor" />
              </svg>
              Score {score}
            </span>
          )}

          {exportPdfUrl && (
            <a
              href={exportPdfUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                padding: '9px 16px', fontSize: 12.5, fontWeight: 600,
                background: 'linear-gradient(135deg, #E0B663, #D4A84F)',
                borderRadius: 9, border: 'none', cursor: 'pointer',
                display: 'inline-flex', alignItems: 'center', gap: 7,
                boxShadow: '0 4px 14px rgba(212,168,79,0.35), inset 0 1px 0 rgba(255,255,255,0.45)',
                transition: 'all .25s', color: 'rgb(35,69,57)', textDecoration: 'none',
              }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 8px 22px rgba(212,168,79,0.45), inset 0 1px 0 rgba(255,255,255,0.45)' }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 14px rgba(212,168,79,0.35), inset 0 1px 0 rgba(255,255,255,0.45)' }}
            >
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path d="M6 1v6 M3.5 5.5l2.5 2.5 2.5-2.5 M1.5 10h9" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Download PDF
            </a>
          )}
        </div>
      </div>

      {/* Reading progress */}
      <div style={{ height: 2, background: 'rgba(212,168,79,0.10)', position: 'relative' }}>
        <div style={{
          height: '100%', width: `${completion}%`,
          background: 'linear-gradient(90deg, #E0B663, #D4A84F)',
          transition: 'width .3s ease',
          boxShadow: '0 0 6px rgba(212,168,79,0.5)',
        }} />
      </div>
    </div>
  )
}

/* ── TOC sidebar ── */
function Toc({ activeIdx, onJump }: { activeIdx: number; onJump: (i: number) => void }) {
  return (
    <nav style={{
      position: 'sticky', top: 110,
      padding: '22px 18px',
      background: 'rgba(255,255,255,0.78)',
      border: '1px solid rgba(47,93,80,0.10)',
      borderRadius: 16,
      backdropFilter: 'blur(10px)',
      WebkitBackdropFilter: 'blur(10px)',
      boxShadow: '0 6px 22px rgba(35,69,57,0.05)',
    }}>
      <div style={{
        fontFamily: 'var(--f-mono)', fontSize: 10, fontWeight: 600,
        color: 'var(--gold-deep)', letterSpacing: '0.16em', marginBottom: 14,
      }}>CONTENTS</div>

      <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 2 }}>
        {SECTIONS.map((s, i) => {
          const isActive = i === activeIdx
          return (
            <li key={s.num}>
              <a
                href={`#section-${s.num}`}
                onClick={e => { e.preventDefault(); onJump(i) }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '8px 10px', borderRadius: 8,
                  fontSize: 13, fontWeight: isActive ? 600 : 500,
                  color: isActive ? 'var(--forest-deep)' : '#667',
                  background: isActive ? 'linear-gradient(120deg, rgba(247,231,193,0.6), rgba(247,231,193,0.3))' : 'transparent',
                  borderLeft: isActive ? '2px solid var(--gold)' : '2px solid transparent',
                  transition: 'all .2s', textDecoration: 'none',
                }}
                onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = 'rgba(247,231,193,0.25)' }}
                onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'transparent' }}
              >
                <span style={{
                  fontFamily: 'var(--f-mono)', fontSize: 10, fontWeight: 600,
                  color: isActive ? 'var(--gold-deep)' : '#aaa',
                  width: 18, flexShrink: 0,
                }}>{s.num}</span>
                <span style={{ lineHeight: 1.3 }}>{s.label}</span>
              </a>
            </li>
          )
        })}
      </ul>

      <div style={{ marginTop: 18, paddingTop: 16, borderTop: '1px dashed rgba(47,93,80,0.12)' }}>
        <div style={{ fontSize: 11, color: '#aaa', marginBottom: 10 }}>Reading progress</div>
        <div style={{ height: 4, borderRadius: 999, background: 'rgba(212,168,79,0.15)', overflow: 'hidden' }}>
          <div style={{
            width: `${Math.min(100, Math.round((activeIdx + 1) / SECTIONS.length * 100))}%`,
            height: '100%',
            background: 'linear-gradient(90deg, #E0B663, #D4A84F)',
            borderRadius: 999, transition: 'width .3s',
          }} />
        </div>
      </div>
    </nav>
  )
}

/* ── Hero block ── */
function Hero({
  clientName, rfpTitle, wordCount, generatedDate,
}: {
  clientName: string | null
  rfpTitle:   string | null
  wordCount:  number | null
  generatedDate: string
}) {
  const title = clientName ?? rfpTitle ?? 'Untitled RFP'
  const subtitle = clientName && rfpTitle ? rfpTitle : null

  return (
    <div style={{ marginBottom: 32 }}>
      {/* "Proposal for" label */}
      <div style={{
        display: 'inline-flex', alignItems: 'center', gap: 8,
        padding: '5px 13px',
        background: 'linear-gradient(120deg, #FBF1D8, #F7E7C1)',
        border: '1px solid rgba(212,168,79,0.40)',
        borderRadius: 999,
        fontFamily: 'var(--f-mono)',
        fontSize: 10, fontWeight: 600,
        color: 'var(--gold-deep)', letterSpacing: '0.16em', textTransform: 'uppercase' as const,
        marginBottom: 18,
      }}>
        <svg width="10" height="10" viewBox="0 0 12 12">
          <path d="M6 1l1.4 3 3.6.5-2.6 2.5.6 3.5L6 9l-3 1.5.6-3.5L1 4.5 4.6 4 6 1Z" fill="#D4A84F" />
        </svg>
        Proposal for
      </div>

      <h1 style={{
        fontFamily: 'var(--f-display-serif)',
        fontWeight: 700,
        fontSize: 'clamp(32px, 4.5vw, 52px)',
        lineHeight: 1.05, letterSpacing: '-0.02em',
        color: 'var(--forest-deep)',
        margin: '0 0 12px', wordBreak: 'break-word' as const,
      }}>
        {title}
      </h1>

      {subtitle && (
        <div style={{
          fontSize: 17, color: '#667', fontStyle: 'italic',
          fontFamily: 'var(--f-display-serif)', fontWeight: 500, marginBottom: 4,
        }}>{subtitle}</div>
      )}

      {/* Decorated gold rule */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 22, marginBottom: 20 }}>
        <div style={{ width: 64, height: 2.5, background: 'linear-gradient(90deg, #D4A84F, #B88A2F)', borderRadius: 2 }} />
        <svg width="14" height="14" viewBox="0 0 14 14">
          <path d="M7 1l1.5 3.5L12 5l-2.5 2.5L10 11 7 9 4 11l.5-3.5L2 5l3.5-.5L7 1Z" fill="#D4A84F" />
        </svg>
        <div style={{ width: 24, height: 2.5, background: 'linear-gradient(90deg, #B88A2F, transparent)', borderRadius: 2 }} />
      </div>

      {/* Meta row */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 18, flexWrap: 'wrap' as const,
        fontSize: 13, color: '#889',
      }}>
        {wordCount && (
          <>
            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <svg width="13" height="13" viewBox="0 0 12 12" fill="none">
                <rect x="2" y="2" width="8" height="8" rx="1.4" stroke="currentColor" strokeWidth="1.2" />
                <path d="M4 5h4 M4 7h3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
              </svg>
              {wordCount.toLocaleString()} words
            </span>
            <span style={{ width: 3, height: 3, borderRadius: '50%', background: '#ccc' }} />
          </>
        )}
        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <svg width="13" height="13" viewBox="0 0 12 12" fill="none">
            <circle cx="6" cy="6" r="5" stroke="currentColor" strokeWidth="1.2" />
            <path d="M6 3v3l2 1" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
          </svg>
          Generated {generatedDate}
        </span>
        <span style={{ width: 3, height: 3, borderRadius: '50%', background: '#ccc' }} />
        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <svg width="13" height="13" viewBox="0 0 12 12" fill="none">
            <path d="M6 1l4 1.5v3c0 2.5-2 4.5-4 5-2-0.5-4-2.5-4-5v-3L6 1Z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
            <path d="M4 6l1.5 1.5L8 5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Confidential
        </span>
      </div>
    </div>
  )
}

/* ── Quality callout ── */
function QualityCallout({ notes }: { notes: string }) {
  return (
    <div style={{
      padding: '18px 22px 18px 26px', borderRadius: 14, marginBottom: 28,
      background: 'linear-gradient(120deg, #FFFEF8 0%, #FFFCF4 100%)',
      border: '1px solid rgba(212,168,79,0.30)',
      borderLeft: '4px solid var(--gold)',
      boxShadow: '0 6px 18px rgba(212,168,79,0.10)',
      position: 'relative' as const,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
        <div style={{
          width: 26, height: 26, borderRadius: 7,
          background: 'linear-gradient(135deg, #FBF1D8, #E0B663)',
          display: 'grid', placeItems: 'center', flexShrink: 0,
        }}>
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
            <path d="M8 2l5 2v4c0 3-2 5-5 5.5C5 13 3 11 3 8V4l5-2Z" stroke="#2A1E08" strokeWidth="1.4" strokeLinejoin="round" />
            <path d="M5.5 8l1.8 1.8L10.5 6.5" stroke="#2A1E08" strokeWidth="1.6" fill="none" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <div style={{
          fontFamily: 'var(--f-mono)', fontSize: 10.5, fontWeight: 600,
          color: 'var(--gold-deep)', letterSpacing: '0.16em',
        }}>QUALITY REVIEW NOTES</div>
      </div>
      <div style={{ fontSize: 14, color: '#444', lineHeight: 1.65, paddingLeft: 36 }}>
        {notes}
      </div>
    </div>
  )
}

/* ── Section card ── */
const Section = React.forwardRef<HTMLDivElement, {
  s: typeof SECTIONS[number]
  i: number
  content: string | null
}>(function Section({ s, i, content }, ref) {
  const paragraphs = content ? content.split('\n\n') : []

  return (
    <article
      ref={ref}
      id={`section-${s.num}`}
      style={{
        background: '#fff',
        borderRadius: 18,
        overflow: 'hidden',
        border: '1px solid rgba(47,93,80,0.08)',
        boxShadow: '0 2px 6px rgba(35,69,57,0.04), 0 16px 36px rgba(35,69,57,0.06)',
        transition: 'box-shadow .3s',
      }}
    >
      {/* Section header */}
      <div style={{
        padding: '18px 28px',
        background: 'linear-gradient(120deg, #234539 0%, #2F5D50 65%, #3d7565 100%)',
        position: 'relative', overflow: 'hidden',
      }}>
        {/* Gold sheen overlay */}
        <div style={{
          position: 'absolute', top: 0, right: 0, width: 200, height: '100%',
          background: 'radial-gradient(circle at right, rgba(212,168,79,0.18), transparent 70%)',
          pointerEvents: 'none',
        }} />
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0, height: 1,
          background: 'linear-gradient(90deg, transparent, rgba(212,168,79,0.5), transparent)',
        }} />

        <div style={{ display: 'flex', alignItems: 'center', gap: 14, position: 'relative' }}>
          <span style={{
            width: 36, height: 36, borderRadius: 9,
            background: 'linear-gradient(135deg, #FBF1D8, #B88A2F)',
            display: 'grid', placeItems: 'center',
            fontFamily: 'var(--f-display)', fontWeight: 700, fontSize: 12,
            color: '#2A1E08',
            boxShadow: '0 3px 10px rgba(180,130,40,0.45), inset 0 1px 0 rgba(255,255,255,0.5)',
            letterSpacing: '0.02em', flexShrink: 0,
          }}>{s.num}</span>

          <div style={{ flex: 1 }}>
            <div style={{
              fontFamily: 'var(--f-mono)', fontSize: 10, fontWeight: 600,
              color: 'rgba(247,231,193,0.85)', letterSpacing: '0.16em', marginBottom: 2,
            }}>SECTION {s.num}</div>
            <h2 style={{
              fontFamily: 'var(--f-display-serif)',
              fontWeight: 600, fontSize: 22, color: '#FBF1D8',
              letterSpacing: '-0.01em', lineHeight: 1.1, margin: 0,
            }}>{s.label}</h2>
          </div>

          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            padding: '4px 10px',
            background: 'rgba(212,168,79,0.22)',
            border: '1px solid rgba(212,168,79,0.40)',
            borderRadius: 999,
            fontSize: 10.5, fontWeight: 600, color: '#F7E7C1',
            fontFamily: 'var(--f-mono)', letterSpacing: '0.04em',
          }}>
            {content ? (
              <>
                <svg width="10" height="10" viewBox="0 0 12 12">
                  <path d="M2 6l2.5 2.5L10 3" stroke="currentColor" strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                Generated
              </>
            ) : (
              <>
                <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
                  <circle cx="6" cy="6" r="5" stroke="currentColor" strokeWidth="1.4" />
                  <path d="M6 4v3M6 8.5v.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
                </svg>
                Pending
              </>
            )}
          </span>
        </div>
      </div>

      {/* Section body */}
      <div style={{ padding: '34px 44px 38px' }}>
        {content ? (
          paragraphs.map((para, idx) => {
            if (i === 0 && idx === 0) {
              const first = para.charAt(0)
              const rest  = para.slice(1)
              return (
                <p key={idx} style={{
                  fontSize: 16, lineHeight: 1.75, color: '#2a2a2a',
                  fontFamily: 'var(--f-body)', marginBottom: 18,
                }}>
                  <span style={{
                    float: 'left', fontSize: 64, fontWeight: 600,
                    lineHeight: 0.85, marginRight: 10, marginTop: 6,
                    fontFamily: 'var(--f-display-serif)',
                    background: 'linear-gradient(180deg, #E0B663, #B88A2F)',
                    WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent',
                  }}>{first}</span>
                  {rest}
                </p>
              )
            }
            return (
              <p key={idx} style={{
                fontSize: 16, lineHeight: 1.75, color: '#2a2a2a',
                fontFamily: 'var(--f-body)',
                marginBottom: idx < paragraphs.length - 1 ? 18 : 0,
              }}>
                {para}
              </p>
            )
          })
        ) : (
          <div style={{ fontSize: 13.5, color: '#bbb', fontStyle: 'italic' }}>
            Not yet generated
          </div>
        )}
      </div>
    </article>
  )
})

/* ── Floating action bar ── */
function FloatBar({ onTop }: { onTop: () => void }) {
  const btnStyle: React.CSSProperties = {
    width: 44, height: 44, borderRadius: '50%',
    background: 'rgba(255,255,255,0.85)',
    border: '1px solid rgba(47,93,80,0.12)',
    backdropFilter: 'blur(10px)',
    WebkitBackdropFilter: 'blur(10px)',
    display: 'grid', placeItems: 'center',
    cursor: 'pointer',
    boxShadow: '0 6px 16px rgba(35,69,57,0.08)',
    transition: 'transform .2s, box-shadow .2s',
  }

  const onEnter = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.currentTarget.style.transform = 'translateY(-2px)'
    e.currentTarget.style.boxShadow = '0 10px 22px rgba(35,69,57,0.14)'
  }
  const onLeave = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.currentTarget.style.transform = 'translateY(0)'
    e.currentTarget.style.boxShadow = '0 6px 16px rgba(35,69,57,0.08)'
  }

  return (
    <div style={{
      position: 'fixed', right: 24, bottom: 24, zIndex: 40,
      display: 'flex', flexDirection: 'column', gap: 10,
    }}>
      <button onClick={onTop} title="Back to top" style={btnStyle} onMouseEnter={onEnter} onMouseLeave={onLeave}>
        <svg width="16" height="16" viewBox="0 0 14 14" fill="none">
          <path d="M7 11V3 M3 7l4-4 4 4" stroke="#2F5D50" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      <button title="Print" style={btnStyle} onMouseEnter={onEnter} onMouseLeave={onLeave}
        onClick={() => window.print()}>
        <svg width="16" height="16" viewBox="0 0 14 14" fill="none">
          <path d="M4 5V2h6v3 M2 5h10v5h-2v2H4v-2H2V5Z" stroke="#2F5D50" strokeWidth="1.4" strokeLinejoin="round" />
        </svg>
      </button>
    </div>
  )
}

/* ── Footer attribution ── */
function FootAttribution({ score, scoreColor }: { score: number | null; scoreColor: string }) {
  return (
    <div style={{
      marginTop: 56, paddingTop: 28,
      borderTop: '1px solid rgba(47,93,80,0.12)',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      flexWrap: 'wrap' as const, gap: 16,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <Mark size={26} />
        <div style={{ fontSize: 12.5, color: '#aaa', lineHeight: 1.45 }}>
          Generated by{' '}
          <span style={{ color: 'var(--forest-deep)', fontWeight: 600 }}>Nivedan AI</span>
          {' · '}
          <span style={{ color: '#bbb' }}>Confidential &amp; Proprietary</span>
        </div>
      </div>
      {score !== null && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
          <span style={{ fontSize: 12, color: '#aaa' }}>Confidence Score</span>
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            padding: '6px 14px',
            background: 'linear-gradient(120deg, rgba(47,93,80,0.08), rgba(47,93,80,0.04))',
            border: '1px solid rgba(47,93,80,0.18)',
            borderRadius: 999,
            fontFamily: 'var(--f-display-serif)', fontWeight: 600, fontSize: 14,
            color: scoreColor,
          }}>
            <svg width="12" height="12" viewBox="0 0 12 12">
              <circle cx="6" cy="6" r="5" stroke="currentColor" strokeWidth="1.4" fill="none" />
              <path d="M3.5 6l1.8 1.8L8.5 4.5" stroke="currentColor" strokeWidth="1.6" fill="none" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            {score}%
          </span>
        </div>
      )}
    </div>
  )
}

/* ── Thank You closing card ── */
function ThankYou({ clientName }: { clientName: string }) {
  return (
    <div style={{
      marginTop: 22,
      borderRadius: 18,
      overflow: 'hidden',
      border: '1px solid rgba(47,93,80,0.08)',
      boxShadow: '0 2px 6px rgba(35,69,57,0.04), 0 16px 36px rgba(35,69,57,0.06)',
      background: 'linear-gradient(120deg, #234539 0%, #2F5D50 65%, #3d7565 100%)',
      position: 'relative' as const,
    }}>
      {/* Gold sheen overlay */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        background: 'radial-gradient(ellipse at 80% 50%, rgba(212,168,79,0.18) 0%, transparent 60%)',
      }} />
      {/* Bottom gold line */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0, height: 1,
        background: 'linear-gradient(90deg, transparent, rgba(212,168,79,0.5), transparent)',
      }} />

      <div style={{
        position: 'relative', zIndex: 1,
        padding: '56px 44px 52px',
        display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center',
      }}>
        {/* THANK YOU heading */}
        <h2 style={{
          fontFamily: 'var(--f-display-serif)',
          fontSize: 'clamp(42px, 6vw, 68px)',
          fontWeight: 700,
          letterSpacing: '-0.02em',
          lineHeight: 1,
          margin: '0 0 20px',
          background: 'linear-gradient(180deg, #E0B663 0%, #B88A2F 100%)',
          WebkitBackgroundClip: 'text',
          backgroundClip: 'text',
          color: 'transparent',
        }}>
          THANK YOU
        </h2>

        {/* Gold divider */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 28 }}>
          <div style={{ width: 48, height: 1.5, background: 'linear-gradient(90deg, transparent, #D4A84F)', borderRadius: 2 }} />
          <svg width="12" height="12" viewBox="0 0 14 14">
            <path d="M7 1l1.5 3.5L12 5l-2.5 2.5L10 11 7 9 4 11l.5-3.5L2 5l3.5-.5L7 1Z" fill="#D4A84F" />
          </svg>
          <div style={{ width: 48, height: 1.5, background: 'linear-gradient(90deg, #D4A84F, transparent)', borderRadius: 2 }} />
        </div>

        {/* Body text */}
        <p style={{
          fontFamily: 'var(--f-body)',
          fontSize: 17, lineHeight: 1.7,
          color: '#FBF1D8',
          margin: '0 0 8px',
          maxWidth: 520,
        }}>
          Thank you for the opportunity to respond.
        </p>
        <p style={{
          fontFamily: 'var(--f-body)',
          fontSize: 17, lineHeight: 1.7,
          color: 'rgba(251,241,216,0.80)',
          margin: '0 0 40px',
          maxWidth: 520,
        }}>
          We appreciate the opportunity to partner with
          <span style={{ display: 'block', color: '#E0B663', fontWeight: 600, marginTop: 2 }}>{clientName}.</span>
        </p>

        {/* Mark + name */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
          <Mark size={36} />
          <div style={{ fontSize: 14, fontWeight: 600, color: '#FBF1D8', fontFamily: 'var(--f-display-serif)' }}>
            Nivedan AI
          </div>
          <div style={{ fontSize: 12, color: 'rgba(251,241,216,0.55)', fontFamily: 'var(--f-body)' }}>
            Autonomous Proposal Intelligence Platform
          </div>
        </div>

        {/* Confidential */}
        <div style={{
          marginTop: 32,
          fontFamily: 'var(--f-mono)',
          fontSize: 10, fontWeight: 600,
          letterSpacing: '0.18em',
          color: 'rgba(212,168,79,0.55)',
          textTransform: 'uppercase' as const,
        }}>
          Confidential &amp; Proprietary
        </div>
      </div>
    </div>
  )
}

/* ── Main exported component ── */
export function ProposalViewer({ proposal, job, exportRow, score, scoreColor, scoreBg }: Props) {
  const [activeIdx, setActiveIdx] = useState(0)
  const sectionRefs = useRef<(HTMLDivElement | null)[]>([])

  useEffect(() => {
    const obs = new IntersectionObserver(
      entries => {
        entries.forEach(e => {
          if (e.isIntersecting) {
            const idx = Number((e.target as HTMLElement).dataset.idx)
            setActiveIdx(idx)
          }
        })
      },
      { rootMargin: '-40% 0px -55% 0px', threshold: 0 },
    )
    sectionRefs.current.forEach(el => el && obs.observe(el))
    return () => obs.disconnect()
  }, [])

  const handleJump = (i: number) => {
    sectionRefs.current[i]?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const formatDate = (d: Date | null) =>
    d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'

  return (
    <div style={{ position: 'relative', minHeight: '100vh' }}>
      <ProposalBg />

      <Header
        activeIdx={activeIdx}
        score={score}
        scoreColor={scoreColor}
        scoreBg={scoreBg}
        status={job.status}
        version={proposal.version}
        exportPdfUrl={exportRow?.pdfUrl ?? null}
      />

      {/* Two-column layout */}
      <div style={{
        maxWidth: 1180, margin: '0 auto', padding: '28px 36px 96px',
        display: 'grid', gridTemplateColumns: '220px minmax(0, 1fr)', gap: '56px',
        alignItems: 'flex-start', position: 'relative', zIndex: 1,
      }}>
        {/* TOC sidebar */}
        <aside style={{ display: 'block' }} className="proposal-toc">
          <Toc activeIdx={activeIdx} onJump={handleJump} />
        </aside>

        {/* Reading column */}
        <main style={{ minWidth: 0 }}>
          <Hero
            clientName={job.clientName ?? null}
            rfpTitle={job.rfpTitle ?? null}
            wordCount={proposal.wordCount ?? null}
            generatedDate={formatDate(proposal.createdAt)}
          />

          {proposal.qualityReviewNotes && (
            <QualityCallout notes={proposal.qualityReviewNotes} />
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
            {SECTIONS.map((s, i) => {
              const content = proposal[s.key as keyof typeof proposal] as string | null
              return (
                <div
                  key={s.num}
                  data-idx={i}
                  ref={el => { sectionRefs.current[i] = el }}
                  style={{ scrollMarginTop: 110 }}
                >
                  <Section s={s} i={i} content={content} />
                </div>
              )
            })}
          </div>

          <ThankYou clientName={job.clientName ?? job.rfpTitle ?? 'your organization'} />

          <FootAttribution score={score} scoreColor={scoreColor} />
        </main>
      </div>

      <FloatBar onTop={() => window.scrollTo({ top: 0, behavior: 'smooth' })} />

      <style>{`
        @media (max-width: 960px) {
          .proposal-toc { display: none !important; }
          div[style*="220px minmax"] {
            grid-template-columns: 1fr !important;
            gap: 28px !important;
          }
        }
        @media print {
          .proposal-toc, [style*="position: fixed"] { display: none !important; }
        }
      `}</style>
    </div>
  )
}
