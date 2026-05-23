'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useUploadThing } from '@/utils/uploadthing'
import { PLAN_LIMITS, type PlanKey } from '@/lib/plans'

/* ── Types ── */
type KbItem = {
  id: string
  type: string
  title: string
  description: string | null
  tags: string[] | null
  fileUrl: string | null
  isActive: boolean
  createdAt: string
}

type Profile = {
  id: string
  companyName: string
  industry: string | null
  website: string | null
  tagline: string | null
}

const TYPE_META: Record<string, { label: string; color: string; bg: string }> = {
  past_proposal:  { label: 'Past Proposal',  color: '#2F5D50', bg: 'rgba(47,93,80,0.10)'   },
  case_study:     { label: 'Case Study',     color: '#B88A2F', bg: 'rgba(184,138,47,0.12)' },
  certification:  { label: 'Certification',  color: '#8B4A5E', bg: 'rgba(139,74,94,0.12)'  },
  team_bio:       { label: 'Team Bio',       color: '#C97548', bg: 'rgba(201,117,72,0.12)' },
  technology:     { label: 'Technology',     color: '#5A7FAA', bg: 'rgba(90,127,170,0.12)' },
  testimonial:    { label: 'Testimonial',    color: '#6B8F7A', bg: 'rgba(107,143,122,0.12)'},
}

/* ── Background ── */
function BgLayer() {
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none',
      background: `
        radial-gradient(900px 600px at 85% -5%, rgba(247,231,193,0.65) 0%, transparent 55%),
        radial-gradient(800px 600px at 0% 35%, rgba(221,231,216,0.40) 0%, transparent 55%),
        linear-gradient(180deg, #FFFCF4 0%, #FAF7F2 100%)
      `,
    }} />
  )
}

/* ── Top nav ── */
function Nav() {
  const router = useRouter()
  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 20,
      display: 'flex', alignItems: 'center',
      padding: '0 48px', height: 66,
      background: 'rgba(255,252,244,0.90)',
      backdropFilter: 'blur(16px) saturate(140%)',
      WebkitBackdropFilter: 'blur(16px) saturate(140%)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <button onClick={() => router.push('/dashboard')} style={{
          display: 'flex', alignItems: 'center', gap: 6,
          background: 'none', border: 'none', cursor: 'pointer',
          fontSize: 13, fontWeight: 600, color: 'var(--ink-soft)',
          padding: '6px 10px', borderRadius: 8,
        }}>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M9 11L5 7l4-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Dashboard
        </button>
        <span style={{ width: 1, height: 16, background: 'var(--line-strong)' }} />
        <span style={{ fontFamily: 'var(--f-display)', fontWeight: 600, fontSize: 15, color: 'var(--forest-deep)' }}>
          Knowledge Base
        </span>
      </div>
    </div>
  )
}

/* ── Company Profile card ── */
function ProfileCard({ profile, onSaved }: { profile: Profile; onSaved: (p: Profile) => void }) {
  const [editing, setEditing] = useState(false)
  const [form, setForm]       = useState({ companyName: profile.companyName, industry: profile.industry ?? '', website: profile.website ?? '', tagline: profile.tagline ?? '' })
  const [saving, setSaving]   = useState(false)

  const save = async () => {
    setSaving(true)
    const res = await fetch('/api/kb/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    const updated = await res.json()
    onSaved(updated)
    setSaving(false)
    setEditing(false)
  }

  const field = (label: string, key: keyof typeof form, placeholder: string) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
      <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--ni-muted)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>{label}</label>
      {editing ? (
        <input
          value={form[key]}
          onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
          placeholder={placeholder}
          style={{
            padding: '9px 12px', borderRadius: 8, fontSize: 13.5,
            border: '1.5px solid rgba(212,168,79,0.40)',
            background: 'rgba(255,252,244,0.8)',
            fontFamily: 'var(--f-body)', color: 'var(--ink)',
            outline: 'none', width: '100%', boxSizing: 'border-box',
          }}
        />
      ) : (
        <div style={{ fontSize: 13.5, color: form[key] ? 'var(--ink)' : 'var(--ni-muted)', padding: '9px 0' }}>
          {form[key] || placeholder}
        </div>
      )}
    </div>
  )

  return (
    <div style={{
      padding: '24px 26px',
      background: 'rgba(255,255,255,0.82)',
      border: '1px solid var(--line-strong)',
      borderRadius: 18,
      backdropFilter: 'blur(10px)',
      WebkitBackdropFilter: 'blur(10px)',
      boxShadow: '0 6px 20px rgba(35,69,57,0.05)',
      marginBottom: 28,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <h2 style={{ fontFamily: 'var(--f-display)', fontWeight: 600, fontSize: 17, color: 'var(--ink)', marginBottom: 3 }}>
            Company Profile
          </h2>
          <p style={{ fontSize: 12.5, color: 'var(--ink-soft)' }}>
            Used by agents to personalise every proposal
          </p>
        </div>
        {editing ? (
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => setEditing(false)} style={{
              padding: '8px 14px', fontSize: 12.5, fontWeight: 600,
              background: 'rgba(255,255,255,0.7)', border: '1px solid var(--line-strong)',
              borderRadius: 8, color: 'var(--ink-soft)', cursor: 'pointer',
            }}>Cancel</button>
            <button onClick={save} disabled={saving} style={{
              padding: '8px 16px', fontSize: 12.5, fontWeight: 600,
              background: 'var(--forest)', color: '#fff',
              border: 'none', borderRadius: 8, cursor: saving ? 'not-allowed' : 'pointer',
            }}>{saving ? 'Saving…' : 'Save'}</button>
          </div>
        ) : (
          <button onClick={() => setEditing(true)} style={{
            padding: '8px 16px', fontSize: 12.5, fontWeight: 600,
            background: 'rgba(212,168,79,0.12)', color: 'var(--gold-deep)',
            border: '1px solid rgba(212,168,79,0.30)',
            borderRadius: 8, cursor: 'pointer',
          }}>Edit profile</button>
        )}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px 24px' }}>
        {field('Company name', 'companyName', 'e.g. Acme Technologies')}
        {field('Industry', 'industry', 'e.g. Healthcare IT')}
        {field('Website', 'website', 'e.g. https://acme.com')}
        {field('Tagline', 'tagline', 'e.g. Powering digital health since 2015')}
      </div>
    </div>
  )
}

/* ── Upload zone ── */
function UploadZone({ onUploaded }: { onUploaded: (fileUrl: string) => void }) {
  const [drag, setDrag]         = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploaded, setUploaded]   = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const { startUpload } = useUploadThing('kbDocument', {
    onClientUploadComplete: (files) => {
      const fileUrl = files[0]?.ufsUrl
        ?? (files[0]?.serverData as { fileUrl?: string } | null)?.fileUrl
        ?? ''
      setUploading(false)
      if (fileUrl) {
        setUploaded(true)
        setTimeout(() => {
          setUploaded(false)
          onUploaded(fileUrl)
        }, 1500)
      }
    },
    onUploadError: () => { setUploading(false); setUploaded(false) },
  })

  const handle = (file: File | null | undefined) => {
    if (!file || uploading || uploaded) return
    setUploading(true)
    startUpload([file])
  }

  /* ── Uploading state ── */
  if (uploading) {
    return (
      <div style={{
        padding: '48px 24px', borderRadius: 16, textAlign: 'center',
        background: 'linear-gradient(180deg, #FFFCF4 0%, #fff 100%)',
        border: '1.5px dashed rgba(212,168,79,0.45)',
      }}>
        <style>{`
          @keyframes kb-ring-spin {
            from { stroke-dashoffset: 120; }
            to   { stroke-dashoffset: -120; }
          }
        `}</style>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
          <svg width="52" height="52" viewBox="0 0 52 52" fill="none">
            {/* Track */}
            <circle cx="26" cy="26" r="22" stroke="#F0EBE0" strokeWidth="3.5" fill="none" />
            {/* Animated ring */}
            <circle
              cx="26" cy="26" r="22"
              stroke="#D4A84F" strokeWidth="3.5" fill="none"
              strokeLinecap="round"
              strokeDasharray="60 80"
              style={{ animation: 'kb-ring-spin 1.1s linear infinite', transformOrigin: '26px 26px' }}
            />
            {/* Upload arrow inside */}
            <path d="M26 34V22M21 27l5-5 5 5" stroke="#B88A2F" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <div style={{ fontFamily: 'var(--f-display)', fontWeight: 600, fontSize: 16, color: 'var(--forest-deep)', marginBottom: 5 }}>
          Uploading PDF…
        </div>
        <div style={{ fontSize: 13, color: 'var(--ink-soft)' }}>
          AI will extract title, description and tags automatically
        </div>
      </div>
    )
  }

  /* ── Success state ── */
  if (uploaded) {
    return (
      <div style={{
        padding: '48px 24px', borderRadius: 16, textAlign: 'center',
        background: 'linear-gradient(180deg, #F0FAF5 0%, #fff 100%)',
        border: '1.5px solid rgba(47,93,80,0.20)',
      }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
          <div style={{
            width: 52, height: 52, borderRadius: '50%',
            background: '#E8F5F1',
            border: '2px solid #2F5D50',
            display: 'grid', placeItems: 'center',
            boxShadow: '0 4px 14px rgba(47,93,80,0.15)',
          }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M5 13l4.5 4.5L19 7" stroke="#2F5D50" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        </div>
        <div style={{ fontFamily: 'var(--f-display)', fontWeight: 600, fontSize: 16, color: 'var(--forest-deep)', marginBottom: 5 }}>
          Uploaded to knowledge base
        </div>
        <div style={{ fontSize: 13, color: 'var(--ink-soft)' }}>
          Processing document…
        </div>
      </div>
    )
  }

  /* ── Idle / drag state ── */
  return (
    <div
      onDragOver={e => { e.preventDefault(); setDrag(true) }}
      onDragLeave={() => setDrag(false)}
      onDrop={e => { e.preventDefault(); setDrag(false); handle(e.dataTransfer.files?.[0]) }}
      onClick={() => inputRef.current?.click()}
      style={{
        padding: '48px 24px', borderRadius: 16, textAlign: 'center',
        background: drag ? 'linear-gradient(180deg, #FFF9E6 0%, #FFFCF4 100%)' : 'linear-gradient(180deg, #FFFCF4 0%, #fff 100%)',
        border: `1.5px dashed ${drag ? '#D4A84F' : 'rgba(212,168,79,0.45)'}`,
        cursor: 'pointer', transition: 'all .25s ease',
        boxShadow: drag ? '0 0 0 5px rgba(247,231,193,0.45), 0 12px 28px rgba(212,168,79,0.15)' : 'none',
      }}
    >
      <input ref={inputRef} type="file" accept=".pdf" style={{ display: 'none' }}
        aria-label="Upload knowledge base document"
        onChange={e => handle(e.target.files?.[0])} />
      <div style={{
        width: 52, height: 52, borderRadius: 14, margin: '0 auto 14px',
        background: 'linear-gradient(180deg, #FBF1D8, #E0B663)',
        display: 'grid', placeItems: 'center',
        boxShadow: '0 8px 20px rgba(212,168,79,0.30)',
      }}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <path d="M12 17V7M7 12l5-5 5 5" stroke="#2A1E08" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M5 19h14" stroke="#2A1E08" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </div>
      <div style={{ fontFamily: 'var(--f-display)', fontWeight: 600, fontSize: 16, color: 'var(--forest-deep)', marginBottom: 5 }}>
        {drag ? 'Drop to upload' : 'Upload a document'}
      </div>
      <div style={{ fontSize: 13, color: 'var(--ink-soft)' }}>
        Past proposals, case studies, certifications — PDF up to 16 MB
      </div>
    </div>
  )
}

/* ── Manual form ── */
function ManualForm({ onAdded }: { onAdded: (item: KbItem) => void }) {
  const [form, setForm] = useState({ type: 'past_proposal', title: '', description: '', tags: '' })
  const [saving, setSaving] = useState(false)
  const [error, setError]   = useState('')

  const submit = async () => {
    if (!form.title.trim()) { setError('Title is required'); return }
    setSaving(true); setError('')
    const res = await fetch('/api/kb/items', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: form.type,
        title: form.title,
        description: form.description,
        tags: form.tags.split(',').map(t => t.trim()).filter(Boolean),
      }),
    })
    if (res.ok) {
      const item = await res.json()
      onAdded(item)
      setForm({ type: 'past_proposal', title: '', description: '', tags: '' })
    }
    setSaving(false)
  }

  const inp = (label: string, key: keyof typeof form, placeholder: string, multiline?: boolean) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
      <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--ni-muted)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>{label}</label>
      {multiline ? (
        <textarea value={form[key]} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
          placeholder={placeholder} rows={3}
          style={{
            padding: '9px 12px', borderRadius: 8, fontSize: 13.5, resize: 'vertical',
            border: '1.5px solid rgba(212,168,79,0.30)', background: 'rgba(255,252,244,0.8)',
            fontFamily: 'var(--f-body)', color: 'var(--ink)', outline: 'none',
            width: '100%', boxSizing: 'border-box', lineHeight: 1.45,
          }} />
      ) : (
        <input value={form[key]} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
          placeholder={placeholder}
          style={{
            padding: '9px 12px', borderRadius: 8, fontSize: 13.5,
            border: '1.5px solid rgba(212,168,79,0.30)', background: 'rgba(255,252,244,0.8)',
            fontFamily: 'var(--f-body)', color: 'var(--ink)', outline: 'none',
            width: '100%', boxSizing: 'border-box',
          }} />
      )}
    </div>
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 4 }}>
      {/* Type selector */}
      <div>
        <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--ni-muted)', letterSpacing: '0.08em', textTransform: 'uppercase', display: 'block', marginBottom: 8 }}>Document type</label>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
          {Object.entries(TYPE_META).map(([key, meta]) => (
            <button key={key} onClick={() => setForm(f => ({ ...f, type: key }))} style={{
              padding: '6px 12px', borderRadius: 999, fontSize: 12, fontWeight: 600,
              background: form.type === key ? meta.bg : 'rgba(255,255,255,0.7)',
              color: form.type === key ? meta.color : 'var(--ink-soft)',
              border: form.type === key ? `1.5px solid ${meta.color}55` : '1.5px solid var(--line-strong)',
              cursor: 'pointer', transition: 'all .2s',
            }}>{meta.label}</button>
          ))}
        </div>
      </div>
      {inp('Title', 'title', 'e.g. Apollo Hospitals — EHR Integration Proposal')}
      {inp('Description', 'description', 'What does this document demonstrate? What outcome was achieved?', true)}
      {inp('Tags (comma-separated)', 'tags', 'e.g. healthcare, EHR, integration, Node.js')}
      {error && <div style={{ fontSize: 12.5, color: '#C0392B' }}>{error}</div>}
      <button onClick={submit} disabled={saving} style={{
        padding: '11px 20px', fontSize: 13.5, fontWeight: 600,
        background: 'var(--forest)', color: '#fff',
        border: 'none', borderRadius: 10, cursor: saving ? 'not-allowed' : 'pointer',
        boxShadow: '0 6px 16px rgba(35,69,57,0.20)', alignSelf: 'flex-start',
      }}>
        {saving ? 'Saving…' : 'Add to knowledge base'}
      </button>
    </div>
  )
}

/* ── KB item row ── */
function ItemRow({ item, onDelete }: { item: KbItem; onDelete: (id: string) => void }) {
  const [deleting, setDeleting] = useState(false)
  const meta = TYPE_META[item.type] ?? TYPE_META.past_proposal

  const del = async () => {
    setDeleting(true)
    await fetch(`/api/kb/items/${item.id}`, { method: 'DELETE' })
    onDelete(item.id)
  }

  return (
    <div style={{
      display: 'flex', alignItems: 'flex-start', gap: 14,
      padding: '16px 18px',
      borderBottom: '1px solid var(--line)',
      transition: 'background .2s',
    }}
      onMouseEnter={e => (e.currentTarget.style.background = 'rgba(247,231,193,0.18)')}
      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
    >
      {/* PDF icon */}
      <div style={{
        width: 38, height: 46, borderRadius: 6, flexShrink: 0,
        background: 'linear-gradient(180deg, #fff 0%, var(--ivory-warm) 100%)',
        border: '1px solid var(--line-strong)',
        display: 'grid', placeItems: 'center',
      }}>
        <span style={{ fontFamily: 'var(--f-mono)', fontSize: 9, fontWeight: 700, color: 'var(--forest-deep)' }}>PDF</span>
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
          <span style={{
            padding: '2px 8px', borderRadius: 999, fontSize: 10.5, fontWeight: 600,
            color: meta.color, background: meta.bg,
          }}>{meta.label}</span>
          <span style={{
            fontFamily: 'var(--f-display)', fontWeight: 600, fontSize: 14,
            color: 'var(--ink)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>{item.title}</span>
        </div>
        {item.description && (
          <div style={{ fontSize: 12.5, color: 'var(--ink-soft)', lineHeight: 1.4, marginBottom: 6 }}>
            {item.description}
          </div>
        )}
        {item.tags && item.tags.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
            {item.tags.map(t => (
              <span key={t} style={{
                padding: '2px 7px', borderRadius: 999, fontSize: 10.5,
                background: 'rgba(47,93,80,0.08)', color: 'var(--forest)',
                fontWeight: 500,
              }}>{t}</span>
            ))}
          </div>
        )}
      </div>

      <button onClick={del} disabled={deleting} title="Remove" style={{
        flexShrink: 0, width: 30, height: 30, borderRadius: 8,
        background: 'transparent', border: '1px solid var(--line-strong)',
        display: 'grid', placeItems: 'center', cursor: deleting ? 'not-allowed' : 'pointer',
        color: 'var(--ni-muted)',
      }}>
        <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
          <path d="M2 2l9 9M11 2l-9 9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      </button>
    </div>
  )
}

/* ── Extracting overlay ── */
function ExtractingCard({ fileName }: { fileName: string }) {
  return (
    <div style={{
      padding: '28px 24px', borderRadius: 14, textAlign: 'center',
      background: 'linear-gradient(180deg, #FFFCF4 0%, #FBF1D8 100%)',
      border: '1.5px solid rgba(212,168,79,0.40)',
      boxShadow: '0 8px 24px rgba(212,168,79,0.18)',
    }}>
      <div style={{
        width: 48, height: 48, borderRadius: '50%', margin: '0 auto 14px',
        background: 'linear-gradient(135deg, #FBF1D8, #E0B663)',
        display: 'grid', placeItems: 'center',
        animation: 'pulseGold 1.6s ease-in-out infinite',
      }}>
        <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
          <path d="M11 4v4M11 14v4M4 11h4M14 11h4" stroke="#2A1E08" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </div>
      <div style={{ fontFamily: 'var(--f-display)', fontWeight: 600, fontSize: 15, color: 'var(--forest-deep)', marginBottom: 5 }}>
        Extracting from {fileName}
      </div>
      <div style={{ fontSize: 12.5, color: 'var(--ink-soft)' }}>
        AI is reading your document and generating title, description and tags…
      </div>
    </div>
  )
}

/* ── Main page ── */
export default function KnowledgeBasePage() {
  const router = useRouter()
  const [profile, setProfile]   = useState<Profile | null>(null)
  const [items, setItems]       = useState<KbItem[]>([])
  const [loading, setLoading]   = useState(true)
  const [addMode, setAddMode]   = useState<'upload' | 'manual'>('upload')
  const [extracting, setExtracting] = useState<string | null>(null)
  const [userPlan, setUserPlan] = useState<string>('free')

  useEffect(() => {
    Promise.all([
      fetch('/api/kb/profile').then(r => r.ok ? r.json() : null),
      fetch('/api/kb/items').then(r => r.ok ? r.json() : []),
      fetch('/api/user/plan').then(r => r.ok ? r.json() : { plan: 'free' }),
    ]).then(([p, kbItems, planData]) => {
      setProfile(p)
      setItems(Array.isArray(kbItems) ? kbItems : [])
      setUserPlan(planData?.plan ?? 'free')
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  const onUploaded = async (fileUrl: string) => {
    const fileName = fileUrl.split('/').pop() ?? 'document.pdf'
    setExtracting(fileName)
    const res = await fetch('/api/kb/items', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fileUrl }),
    })
    if (res.ok) {
      const item = await res.json()
      setItems(prev => [item, ...prev])
    }
    setExtracting(null)
  }

  return (
    <div style={{ position: 'relative', minHeight: '100vh', overflow: 'hidden' }}>
      <BgLayer />
      <Nav />

      <div style={{
        position: 'relative', zIndex: 1,
        maxWidth: 1280, margin: '0 auto',
        padding: '90px 48px 80px',
        display: 'grid',
        gridTemplateColumns: '1.6fr 1fr',
        gap: 40,
        alignItems: 'start',
      }}>

        {/* LEFT — profile + add */}
        <div>
          {/* Page header */}
          <div style={{ marginBottom: 28 }}>
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: 7,
              padding: '5px 13px',
              background: 'linear-gradient(120deg, #FBF1D8, #F7E7C1)',
              border: '1px solid rgba(212,168,79,0.35)',
              borderRadius: 999, marginBottom: 12,
              fontSize: 11, fontWeight: 600, color: 'var(--gold-deep)', letterSpacing: '0.12em', textTransform: 'uppercase',
            }}>
              <span style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--gold)' }} />
              {items.length} document{items.length !== 1 ? 's' : ''}
            </span>
            <h1 style={{
              fontFamily: 'var(--f-display)', fontWeight: 600,
              fontSize: 'clamp(26px, 3vw, 38px)', lineHeight: 1.1,
              letterSpacing: '-0.03em', color: 'var(--forest-deep)', marginBottom: 8,
            }}>
              Knowledge Base
            </h1>
            <p style={{ fontSize: 15, color: 'var(--ink-soft)', lineHeight: 1.5 }}>
              Upload past proposals, case studies and certifications.
              The Requirements Matcher reads these to find proof points for every RFP.
            </p>
          </div>

          {/* Company profile */}
          {profile && <ProfileCard profile={profile} onSaved={setProfile} />}

          {/* Add document card */}
          <div style={{
            padding: '24px 26px',
            background: 'rgba(255,255,255,0.82)',
            border: '1px solid var(--line-strong)',
            borderRadius: 18,
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)',
            boxShadow: '0 6px 20px rgba(35,69,57,0.05)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
              <h2 style={{ fontFamily: 'var(--f-display)', fontWeight: 600, fontSize: 17, color: 'var(--ink)' }}>
                Add document
              </h2>
              <div style={{ display: 'flex', borderRadius: 8, overflow: 'hidden', border: '1px solid var(--line-strong)' }}>
                {(['upload', 'manual'] as const).map(m => (
                  <button key={m} onClick={() => setAddMode(m)} style={{
                    padding: '6px 14px', fontSize: 12, fontWeight: 600,
                    background: addMode === m ? 'var(--forest)' : 'rgba(255,255,255,0.7)',
                    color: addMode === m ? '#fff' : 'var(--ink-soft)',
                    border: 'none', cursor: 'pointer', transition: 'all .2s',
                    textTransform: 'capitalize',
                  }}>{m === 'upload' ? 'Upload PDF' : 'Manual entry'}</button>
                ))}
              </div>
            </div>

            {extracting ? (
              <ExtractingCard fileName={extracting} />
            ) : userPlan === 'free' && items.length >= PLAN_LIMITS[userPlan as PlanKey].kbDocsPerMonth ? (
                /* ── KB limit reached card (blocks both Upload PDF and Manual entry tabs) ── */
                <div style={{
                  padding: '40px 28px', borderRadius: 18, textAlign: 'center',
                  background: 'linear-gradient(180deg, #FFFCF4 0%, #FBF1D8 60%, rgba(255,252,244,0.9) 100%)',
                  border: '1.5px solid rgba(212,168,79,0.45)',
                  boxShadow: '0 0 0 5px rgba(247,231,193,0.30), 0 12px 32px rgba(212,168,79,0.15)',
                  position: 'relative', overflow: 'hidden',
                }}>
                  <div style={{
                    position: 'absolute', top: -40, left: '50%', transform: 'translateX(-50%)',
                    width: 300, height: 200,
                    background: 'radial-gradient(ellipse, rgba(212,168,79,0.25), transparent 65%)',
                    pointerEvents: 'none',
                  }} />
                  <div style={{
                    width: 58, height: 58, margin: '0 auto 18px', borderRadius: '50%',
                    background: 'linear-gradient(135deg, #FBF1D8, #E0B663)',
                    display: 'grid', placeItems: 'center',
                    boxShadow: '0 0 0 7px rgba(212,168,79,0.12), 0 8px 22px rgba(212,168,79,0.28)',
                  }}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                      <rect x="5" y="11" width="14" height="10" rx="2" stroke="#2A1E08" strokeWidth="1.8" />
                      <path d="M8 11V7a4 4 0 0 1 8 0v4" stroke="#2A1E08" strokeWidth="1.8" strokeLinecap="round" />
                      <circle cx="12" cy="16" r="1.5" fill="#2A1E08" />
                    </svg>
                  </div>
                  <div style={{ position: 'relative' }}>
                    <div style={{
                      fontFamily: 'var(--f-mono)', fontSize: 10, fontWeight: 700,
                      letterSpacing: '0.14em', color: 'var(--gold-deep)',
                      textTransform: 'uppercase', marginBottom: 8,
                    }}>Free plan · KB limit reached</div>
                    <div style={{
                      fontFamily: 'var(--f-display)', fontWeight: 600, fontSize: 19,
                      color: 'var(--forest-deep)', letterSpacing: '-0.02em', marginBottom: 8,
                    }}>
                      1 document limit reached
                    </div>
                    <div style={{
                      fontSize: 13.5, color: 'var(--ink-soft)', lineHeight: 1.6,
                      maxWidth: 320, margin: '0 auto 22px',
                    }}>
                      Free plan supports 1 KB document. Upgrade to{' '}
                      <strong style={{ color: 'var(--forest)' }}>Plus</strong> for 10 docs or{' '}
                      <strong style={{ color: 'var(--forest)' }}>Pro</strong> for unlimited.
                    </div>
                    <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
                      <a href="/pricing" style={{
                        display: 'inline-flex', alignItems: 'center', gap: 7,
                        padding: '11px 20px', borderRadius: 10,
                        background: 'var(--forest)', color: '#fff',
                        fontFamily: 'var(--f-display)', fontWeight: 600, fontSize: 13.5,
                        textDecoration: 'none',
                        boxShadow: '0 5px 16px rgba(47,93,80,0.25)',
                      }}>
                        Upgrade to Pro
                        <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
                          <path d="M3 11 L11 3 M5 3 H11 V9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </a>
                      <a href="/pricing" style={{
                        display: 'inline-flex', alignItems: 'center',
                        padding: '11px 20px', borderRadius: 10,
                        background: 'rgba(212,168,79,0.15)',
                        border: '1px solid rgba(212,168,79,0.40)',
                        color: 'var(--gold-deep)',
                        fontFamily: 'var(--f-display)', fontWeight: 600, fontSize: 13.5,
                        textDecoration: 'none',
                      }}>
                        View plans
                      </a>
                    </div>
                    <div style={{ marginTop: 18, fontSize: 11.5, color: 'var(--ni-muted)' }}>
                      Limit resets on the 1st of each month
                    </div>
                  </div>
                </div>
            ) : addMode === 'upload' ? (
              <UploadZone onUploaded={onUploaded} />
            ) : (
              <ManualForm onAdded={item => setItems(prev => [item, ...prev])} />
            )}
          </div>
        </div>

        {/* RIGHT — items list */}
        <div style={{ position: 'sticky', top: 84 }}>
          <div style={{
            background: 'rgba(255,255,255,0.82)',
            border: '1px solid var(--line-strong)',
            borderRadius: 18,
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)',
            boxShadow: '0 6px 20px rgba(35,69,57,0.05)',
            overflow: 'hidden',
          }}>
            <div style={{
              padding: '18px 18px 14px',
              borderBottom: '1px solid var(--line)',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}>
              <h3 style={{ fontFamily: 'var(--f-display)', fontWeight: 600, fontSize: 15, color: 'var(--ink)' }}>
                Your documents
              </h3>
              <span style={{
                padding: '3px 9px', borderRadius: 999, fontSize: 11, fontWeight: 600,
                background: 'rgba(47,93,80,0.10)', color: 'var(--forest)',
              }}>{items.length}</span>
            </div>

            {loading ? (
              <div style={{ padding: '32px', textAlign: 'center', color: 'var(--ni-muted)', fontSize: 13 }}>Loading…</div>
            ) : items.length === 0 ? (
              <div style={{ padding: '40px 24px', textAlign: 'center' }}>
                <div style={{
                  width: 48, height: 48, borderRadius: 12, margin: '0 auto 14px',
                  background: 'var(--sage-soft)', display: 'grid', placeItems: 'center',
                }}>
                  <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
                    <path d="M5 4a1 1 0 0 1 1-1h5l4 4v11a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V4Z" stroke="var(--forest)" strokeWidth="1.5" fill="none" />
                    <path d="M11 3v5h5" stroke="var(--forest)" strokeWidth="1.5" strokeLinejoin="round" />
                  </svg>
                </div>
                <div style={{ fontFamily: 'var(--f-display)', fontWeight: 600, fontSize: 14, color: 'var(--ink)', marginBottom: 5 }}>No documents yet</div>
                <div style={{ fontSize: 12.5, color: 'var(--ink-soft)', lineHeight: 1.45 }}>
                  Upload a past proposal or case study to power the Requirements Matcher.
                </div>
              </div>
            ) : (
              <div>
                {items.map(item => (
                  <ItemRow key={item.id} item={item} onDelete={id => setItems(prev => prev.filter(i => i.id !== id))} />
                ))}
              </div>
            )}
          </div>

          {/* Info box */}
          <div style={{
            marginTop: 16, padding: '16px 18px',
            background: 'linear-gradient(180deg, #FFFCF4 0%, #FBF1D8 100%)',
            border: '1px solid rgba(212,168,79,0.35)',
            borderRadius: 14,
            boxShadow: '0 4px 14px rgba(212,168,79,0.12)',
          }}>
            <div style={{ fontFamily: 'var(--f-mono)', fontSize: 10, fontWeight: 600, color: 'var(--gold-deep)', letterSpacing: '0.12em', marginBottom: 8 }}>HOW IT WORKS</div>
            <div style={{ fontSize: 12.5, color: 'var(--ink-soft)', lineHeight: 1.5 }}>
              When you submit an RFP, Agent 4 (Requirements Matcher) searches these documents for evidence that matches each requirement — with a confidence score per match.
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
