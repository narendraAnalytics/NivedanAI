'use client'
import { useCallback, useEffect, useRef, useState } from 'react'
import styles from './IntroSplash.module.css'

export default function IntroSplash() {
  const [visible, setVisible] = useState(true)
  const [closing, setClosing] = useState(false)
  const [scale, setScale] = useState(1)
  const [offset, setOffset] = useState({ x: 0, y: 0 })
  const scaleRef = useRef(1)
  const dragRef = useRef({ active: false, startX: 0, startY: 0, ox: 0, oy: 0 })
  const particlesRef = useRef<HTMLDivElement>(null)
  const frameRef = useRef<HTMLDivElement>(null)

  const dismiss = useCallback(() => {
    if (closing) return
    setClosing(true)
    document.body.style.overflow = ''
    setTimeout(() => setVisible(false), 850)
  }, [closing])

  const applyZoom = useCallback((delta: number) => {
    setScale(prev => {
      const next = Math.min(4, Math.max(0.5, Math.round((prev + delta) * 10) / 10))
      scaleRef.current = next
      if (next === 1) setOffset({ x: 0, y: 0 })
      return next
    })
  }, [])

  const reset = useCallback(() => {
    setScale(1)
    scaleRef.current = 1
    setOffset({ x: 0, y: 0 })
  }, [])

  // Body scroll lock + particles
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    const pc = particlesRef.current
    if (pc) {
      for (let i = 0; i < 22; i++) {
        const p = document.createElement('span')
        p.className = styles.introParticle
        p.style.left = `${Math.random() * 100}vw`
        p.style.bottom = `${-10 - Math.random() * 30}px`
        p.style.animationDuration = `${8 + Math.random() * 9}s`
        p.style.animationDelay = `${Math.random() * 6}s`
        const s = 0.5 + Math.random() * 1.4
        p.style.transform = `scale(${s})`
        p.style.opacity = `${0.45 + Math.random() * 0.55}`
        pc.appendChild(p)
      }
    }
    return () => { document.body.style.overflow = '' }
  }, [])

  // Keyboard: Esc / + / - / 0
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') dismiss()
      else if (e.key === '+' || e.key === '=') applyZoom(0.25)
      else if (e.key === '-') applyZoom(-0.25)
      else if (e.key === '0') reset()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [dismiss, applyZoom, reset])

  // Non-passive wheel on frame — prevents page scroll while zooming
  useEffect(() => {
    const el = frameRef.current
    if (!el) return
    const handler = (e: WheelEvent) => {
      e.preventDefault()
      applyZoom(e.deltaY < 0 ? 0.2 : -0.2)
    }
    el.addEventListener('wheel', handler, { passive: false })
    return () => el.removeEventListener('wheel', handler)
  }, [applyZoom])

  if (!visible) return null

  // Drag-to-pan handlers (pointer capture keeps tracking outside the element)
  const onPointerDown = (e: React.PointerEvent<HTMLImageElement>) => {
    if (scaleRef.current <= 1) return
    e.currentTarget.setPointerCapture(e.pointerId)
    dragRef.current = { active: true, startX: e.clientX, startY: e.clientY, ox: offset.x, oy: offset.y }
  }
  const onPointerMove = (e: React.PointerEvent<HTMLImageElement>) => {
    if (!dragRef.current.active) return
    setOffset({
      x: dragRef.current.ox + (e.clientX - dragRef.current.startX),
      y: dragRef.current.oy + (e.clientY - dragRef.current.startY),
    })
  }
  const onPointerUp = () => { dragRef.current.active = false }

  const imgCursor = dragRef.current.active ? 'grabbing' : scale > 1 ? 'grab' : 'default'

  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const frame = e.currentTarget.querySelector(`.${styles.frame}`)
    const inFrame = frame?.contains(e.target as Node)
    const inControl = (e.target as HTMLElement).closest(
      `.${styles.closeBtn}, .${styles.cta}, .${styles.brand}, .${styles.zoomBar}`
    )
    if (!inFrame && !inControl) dismiss()
  }

  return (
    <div
      className={`${styles.splash} ${closing ? styles.closing : ''}`}
      role="dialog"
      aria-label="Welcome to Nivedan AI"
      onClick={handleOverlayClick}
    >
      <div className={styles.aurora} />
      <div className={styles.grid} />
      <div ref={particlesRef} aria-hidden="true" />

      {/* Brand — top left */}
      <div className={styles.brand}>
        <div className={styles.brandMark}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M12 3 C 8 7, 8 13, 12 21 C 16 13, 16 7, 12 3 Z" fill="#2F5D50" />
            <path d="M5 9 C 4 13, 6 18, 11 20 C 9 16, 8 12, 5 9 Z" fill="#3d7565" />
            <path d="M19 9 C 20 13, 18 18, 13 20 C 15 16, 16 12, 19 9 Z" fill="#3d7565" />
            <circle cx="12" cy="11" r="1.6" fill="#D4A84F" />
          </svg>
        </div>
        <span className={styles.brandName}><b>Nivedan</b> AI</span>
      </div>

      {/* Close — top right */}
      <button className={styles.closeBtn} onClick={dismiss} type="button" aria-label="Close intro and enter site">
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
          <path d="M3 3 L11 11 M11 3 L3 11" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
        <span>Enter site</span>
      </button>

      {/* Eyebrow — top center */}
      <div className={styles.eyebrow}>
        <span className={styles.pulse} />
        A FIRST LOOK AT NIVEDAN AI
      </div>

      {/* Frame + zoom toolbar */}
      <div className={styles.frameWrap}>
        {/* .frame has entry animation — img inside has zoom transform (no animation = no override) */}
        <div className={styles.frame} ref={frameRef}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="https://res.cloudinary.com/dkqbzwicr/image/upload/q_auto/f_auto/v1779775573/infographic_lp6njf.png"
            alt="Nivedan AI — AI-Powered RFP Response infographic"
            className={styles.frameImg}
            draggable={false}
            style={{
              transform: `scale(${scale}) translate(${offset.x / scale}px, ${offset.y / scale}px)`,
              transformOrigin: 'center center',
              transition: dragRef.current.active ? 'none' : 'transform 0.2s cubic-bezier(0.16,1,0.3,1)',
              cursor: imgCursor,
            }}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onDoubleClick={reset}
          />
        </div>

        {/* Zoom toolbar */}
        <div className={styles.zoomBar}>
          <button className={styles.zoomBtn} onClick={() => applyZoom(-0.25)} type="button" aria-label="Zoom out">−</button>
          <span className={styles.zoomLabel}>{Math.round(scale * 100)}%</span>
          <button className={styles.zoomBtn} onClick={() => applyZoom(0.25)} type="button" aria-label="Zoom in">+</button>
          <div className={styles.zoomDivider} />
          <button className={styles.zoomBtn} onClick={reset} type="button" aria-label="Reset zoom">
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
              <path d="M10 6A4 4 0 1 1 6 2M6 2L8 4M6 2L4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
      </div>

      {/* CTA row — bottom */}
      <div className={styles.ctaRow}>
        <button className={styles.cta} onClick={dismiss} type="button">
          Enter Nivedan AI
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
            <path d="M3 7 H11 M8 4 L11 7 L8 10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <span className={styles.hint}>
          press <kbd>Esc</kbd> or click outside
        </span>
      </div>
    </div>
  )
}
