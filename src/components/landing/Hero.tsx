"use client";

import { useRef, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import WorkflowViz from "./WorkflowViz";

const avatarColors = [
  ["#E5C57A", "#2F5D50"],
  ["#D4A84F", "#234539"],
  ["#3d7565", "#FBF1D8"],
  ["#2F5D50", "#F0DBA6"],
];

const Stars = () => (
  <div style={{ display: "flex", gap: 3 }}>
    {[0, 1, 2, 3, 4].map((i) => (
      <svg key={i} width="14" height="14" viewBox="0 0 14 14">
        <path
          d="M7 1l1.7 4 4.3.4-3.3 2.8 1 4.3L7 10.3 3.3 12.5l1-4.3L1 5.4 5.3 5 7 1Z"
          fill="#D4A84F"
        />
      </svg>
    ))}
  </div>
);

const StatTile = ({
  icon,
  value,
  label,
}: {
  icon: React.ReactNode;
  value: string;
  label: string;
}) => (
  <div
    style={{
      padding: "14px 12px",
      background: "rgba(255,255,255,0.65)",
      border: "1px solid var(--line-strong)",
      borderRadius: 14,
      backdropFilter: "blur(8px)",
      WebkitBackdropFilter: "blur(8px)",
    }}
  >
    <div style={{ marginBottom: 6, color: "var(--forest)" }}>{icon}</div>
    <div
      style={{
        fontFamily: "var(--f-display)",
        fontWeight: 700,
        fontSize: 18,
        color: "var(--ink)",
        lineHeight: 1.1,
      }}
    >
      {value}
    </div>
    <div style={{ fontSize: 11, color: "var(--ink-soft)", marginTop: 2, fontWeight: 500 }}>
      {label}
    </div>
  </div>
);

export default function Hero() {
  const heroRef = useRef<HTMLElement>(null);
  const lightRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const { isSignedIn } = useUser();
  const [videoOpen, setVideoOpen] = useState(false);

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!lightRef.current || !heroRef.current) return;
      const rect = heroRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      lightRef.current.style.background = `radial-gradient(600px 400px at ${x}px ${y}px, rgba(247,231,193,0.45), transparent 60%)`;
    };
    document.addEventListener("mousemove", onMove);
    return () => document.removeEventListener("mousemove", onMove);
  }, []);

  return (
    <section
      ref={heroRef}
      id="top"
      style={{ position: "relative", paddingTop: 140, paddingBottom: 60, overflow: "hidden" }}
    >
      {/* Cursor light */}
      <div
        ref={lightRef}
        style={{ position: "absolute", inset: 0, pointerEvents: "none", transition: "background .3s ease" }}
      />

      {/* Wave lines */}
      <svg
        style={{ position: "absolute", top: 40, left: -100, width: 900, height: 800, opacity: 0.35, pointerEvents: "none" }}
        viewBox="0 0 900 800"
        fill="none"
      >
        {[...Array(28)].map((_, i) => (
          <path
            key={i}
            d={`M -100 ${50 + i * 28} Q 200 ${20 + i * 28}, 500 ${80 + i * 28} T 1000 ${60 + i * 28}`}
            stroke={i % 4 === 0 ? "rgba(212,168,79,0.18)" : "rgba(47,93,80,0.06)"}
            strokeWidth="1"
            fill="none"
          />
        ))}
      </svg>

      {/* Sparkle decorations */}
      {[
        { top: "18%", left: "42%", size: 8, delay: "0s" },
        { top: "32%", left: "78%", size: 6, delay: "0.4s" },
        { top: "55%", left: "12%", size: 5, delay: "0.8s" },
        { top: "72%", left: "58%", size: 7, delay: "0.2s" },
        { top: "10%", left: "88%", size: 5, delay: "1s" },
      ].map((s, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            top: s.top,
            left: s.left,
            width: s.size,
            height: s.size,
            borderRadius: "50%",
            background: "var(--gold)",
            animation: `twinkle 3s ${s.delay} ease-in-out infinite`,
            pointerEvents: "none",
          }}
        />
      ))}

      <div className="ni-container" style={{ position: "relative" }}>
        <div
          className="hero-grid"
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(0, 0.95fr) minmax(0, 1.2fr)",
            gap: 56,
            alignItems: "center",
          }}
        >
          {/* LEFT */}
          <div>
            <span className="ni-eyebrow">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M7 1l1.2 3.5L12 6 8.2 7.5 7 11 5.8 7.5 2 6l3.8-1.5L7 1Z" fill="#D4A84F" />
              </svg>
              AUTONOMOUS PROPOSAL INTELLIGENCE PLATFORM
            </span>

            <h1
              style={{
                marginTop: 28,
                fontSize: "clamp(44px, 5.4vw, 78px)",
                lineHeight: 1.02,
                letterSpacing: "-0.035em",
                fontWeight: 600,
              }}
            >
              <span style={{ color: "var(--forest)" }}>Proposals that win.</span>
              <br />
              <span style={{ color: "var(--forest)" }}>Written by </span>
              <span className="ni-text-gradient-gold">AI</span>
              <span style={{ color: "var(--forest)" }}>,</span>
              <br />
              <span className="ni-text-gradient-gold">in 20 minutes.</span>
            </h1>

            <p
              style={{
                marginTop: 28,
                fontSize: 18,
                lineHeight: 1.55,
                color: "var(--ink-soft)",
                maxWidth: 520,
              }}
            >
              Nivedan AI deploys six specialized AI agents to research, write, review, and perfect
              RFP responses that are tailored, compliant, and ready to win.
            </p>

            <div
              style={{
                display: "flex",
                gap: 14,
                marginTop: 36,
                flexWrap: "wrap",
                alignItems: "center",
              }}
            >
              <button
                className="ni-btn ni-btn-primary"
                style={{ padding: "15px 26px" }}
                onClick={() => router.push(isSignedIn ? "/redirecting?to=dashboard" : "/redirecting?to=sign-up")}
              >
                Start Free Trial
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path
                    d="M3 8h10M9 4l4 4-4 4"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
              <button
                className="ni-btn ni-btn-ghost"
                style={{ padding: "15px 22px", display: "flex", alignItems: "center", gap: 8 }}
                onClick={() => {
                  if (isSignedIn) {
                    router.push("/redirecting?to=how-it-works");
                  } else {
                    setVideoOpen(true);
                  }
                }}
              >
                <span
                  style={{
                    width: 22,
                    height: 22,
                    borderRadius: "50%",
                    background: "var(--gold)",
                    display: "grid",
                    placeItems: "center",
                  }}
                >
                  <svg width="9" height="9" viewBox="0 0 10 10">
                    <path d="M3 2 L8 5 L3 8 Z" fill="#2A1E08" />
                  </svg>
                </span>
                See How It Works
              </button>
            </div>

            {/* Social proof */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 18,
                marginTop: 36,
              }}
            >
              <div style={{ display: "flex" }}>
                {avatarColors.map((c, i) => (
                  <div
                    key={i}
                    style={{
                      width: 38,
                      height: 38,
                      borderRadius: "50%",
                      background: `linear-gradient(135deg, ${c[0]}, ${c[1]})`,
                      border: "2.5px solid var(--ivory)",
                      marginLeft: i > 0 ? -12 : 0,
                      display: "grid",
                      placeItems: "center",
                    }}
                  />
                ))}
              </div>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <Stars />
                  <span
                    style={{
                      fontFamily: "var(--f-display)",
                      fontWeight: 600,
                      color: "var(--ink)",
                      fontSize: 14,
                    }}
                  >
                    4.9/5
                  </span>
                </div>
                <div style={{ fontSize: 13, color: "var(--ink-soft)", marginTop: 2 }}>
                  Trusted by 250+ agencies &amp; enterprises worldwide
                </div>
              </div>
            </div>

            {/* Stat tiles */}
            <div
              className="stat-grid"
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(4, 1fr)",
                gap: 12,
                marginTop: 36,
              }}
            >
              <StatTile
                icon={
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.5" />
                    <path d="M12 6v6l4 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                }
                value="95%"
                label="Time Reduction"
              />
              <StatTile
                icon={
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                    <path d="M3 9l9-6 9 6v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9Z" stroke="currentColor" strokeWidth="1.5" />
                    <path d="M9 22V12h6v10" stroke="currentColor" strokeWidth="1.5" />
                  </svg>
                }
                value="3×"
                label="More Proposals"
              />
              <StatTile
                icon={
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                    <path d="M6 9l6-6 6 6M12 3v12M3 20h18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                }
                value="40–50%"
                label="Higher Win Rate"
              />
              <StatTile
                icon={
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                    <path d="M12 3l8 3v6c0 4.5-3.5 8-8 9-4.5-1-8-4.5-8-9V6l8-3Z" stroke="currentColor" strokeWidth="1.5" />
                  </svg>
                }
                value="Enterprise"
                label="Secure & Scalable"
              />
            </div>
          </div>

          {/* RIGHT — Workflow */}
          <div style={{ position: "relative" }}>
            <WorkflowViz />
          </div>
        </div>
      </div>

      {/* Trusted strip */}
      <TrustedStrip />

      {videoOpen && <VideoModal onClose={() => setVideoOpen(false)} />}
    </section>
  );
}

const VIDEO_URL =
  "https://res.cloudinary.com/dkqbzwicr/video/upload/q_auto/f_auto/v1780070947/nivedanaivideo_fgvlqu.webm";

function VideoModal({ onClose }: { onClose: () => void }) {
  const [vidPlaying, setVidPlaying] = useState(false);
  const [vidTime, setVidTime] = useState(0);
  const [vidDur, setVidDur] = useState(0);
  const vidRef = useRef<HTMLVideoElement>(null);
  const vidWrapRef = useRef<HTMLDivElement>(null);

  // ESC to close
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") handleClose(); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-play on mount
  useEffect(() => {
    vidRef.current?.play().then(() => setVidPlaying(true)).catch(() => {});
  }, []);

  function handleClose() {
    const v = vidRef.current;
    if (v) { v.pause(); v.currentTime = 0; }
    setVidPlaying(false);
    onClose();
  }

  const vidToggle = () => {
    const v = vidRef.current;
    if (!v) return;
    v.paused ? v.play().then(() => setVidPlaying(true)).catch(() => {}) : (v.pause(), setVidPlaying(false));
  };

  const vidSkip = (s: number) => {
    if (!vidRef.current) return;
    const newTime = Math.max(0, Math.min(vidRef.current.duration || 0, vidRef.current.currentTime + s));
    vidRef.current.currentTime = newTime;
    setVidTime(newTime);
  };

  const vidSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Number(e.target.value);
    setVidTime(val);
    if (vidRef.current) vidRef.current.currentTime = val;
  };

  const fmtTime = (s: number) =>
    `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;

  const vidFullscreen = () => {
    if (!vidWrapRef.current) return;
    document.fullscreenElement
      ? document.exitFullscreen()
      : vidWrapRef.current.requestFullscreen().catch(() => {});
  };

  return (
    <div
      onClick={handleClose}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        background: "rgba(15,30,25,0.85)",
        backdropFilter: "blur(10px)",
        WebkitBackdropFilter: "blur(10px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px 16px",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%",
          maxWidth: 920,
          background: "var(--forest-deep)",
          border: "1px solid rgba(212,168,79,0.25)",
          borderRadius: 20,
          overflow: "hidden",
          boxShadow: "0 32px 80px rgba(0,0,0,0.55)",
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "16px 20px",
            borderBottom: "1px solid rgba(212,168,79,0.15)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span
              style={{
                width: 28,
                height: 28,
                borderRadius: "50%",
                background: "var(--gold)",
                display: "grid",
                placeItems: "center",
                flexShrink: 0,
              }}
            >
              <svg width="10" height="10" viewBox="0 0 10 10">
                <path d="M3 2 L8 5 L3 8 Z" fill="#2A1E08" />
              </svg>
            </span>
            <span
              style={{
                fontFamily: "var(--f-display)",
                fontWeight: 600,
                fontSize: 15,
                color: "var(--ivory)",
                letterSpacing: "-0.01em",
              }}
            >
              Nivedan AI — Platform Demo
            </span>
          </div>
          <button
            onClick={handleClose}
            style={{
              width: 32,
              height: 32,
              borderRadius: "50%",
              border: "1px solid rgba(255,255,255,0.15)",
              background: "rgba(255,255,255,0.07)",
              color: "var(--ivory)",
              cursor: "pointer",
              display: "grid",
              placeItems: "center",
              fontSize: 16,
              lineHeight: 1,
            }}
          >
            ✕
          </button>
        </div>

        {/* Video */}
        <div ref={vidWrapRef} style={{ position: "relative", background: "#000" }}>
          <video
            ref={vidRef}
            src={VIDEO_URL}
            playsInline
            preload="metadata"
            style={{ width: "100%", display: "block", maxHeight: "60vh", objectFit: "contain" }}
            onLoadedMetadata={() => {
              const d = vidRef.current?.duration;
              if (d && isFinite(d)) setVidDur(d);
            }}
            onDurationChange={() => {
              const d = vidRef.current?.duration;
              if (d && isFinite(d)) setVidDur(d);
            }}
            onTimeUpdate={() => {
              const v = vidRef.current;
              if (!v) return;
              setVidTime(v.currentTime);
              if (v.duration && isFinite(v.duration)) setVidDur(v.duration);
            }}
            onEnded={() => setVidPlaying(false)}
          />

          {/* Play overlay — only when paused */}
          {!vidPlaying && (
            <div
              onClick={vidToggle}
              style={{
                position: "absolute",
                inset: 0,
                zIndex: 2,
                display: "grid",
                placeItems: "center",
                cursor: "pointer",
                background: "rgba(0,0,0,0.18)",
              }}
            >
              <div
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: "50%",
                  background: "var(--gold)",
                  display: "grid",
                  placeItems: "center",
                  boxShadow: "0 8px 32px rgba(212,168,79,0.45)",
                }}
              >
                <svg width="22" height="22" viewBox="0 0 22 22">
                  <path d="M7 4 L18 11 L7 18 Z" fill="#2A1E08" />
                </svg>
              </div>
            </div>
          )}

          {/* Controls bar */}
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              position: "absolute",
              bottom: 0,
              left: 0,
              right: 0,
              zIndex: 10,
              background: "rgba(15,30,25,0.88)",
              backdropFilter: "blur(10px)",
              WebkitBackdropFilter: "blur(10px)",
              padding: "10px 16px 14px",
            }}
          >
            {/* Seek slider */}
            <div style={{ marginBottom: 10 }}>
              <input
                type="range"
                title="Seek video"
                min={0}
                max={vidDur > 0 ? vidDur : 100}
                step={0.1}
                value={vidTime}
                onChange={vidSeek}
                style={{
                  width: "100%",
                  height: 4,
                  accentColor: "var(--gold)",
                  cursor: "pointer",
                }}
              />
            </div>

            {/* Controls row */}
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              {/* Skip back */}
              <button
                type="button"
                onClick={() => vidSkip(-10)}
                title="Back 10s"
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: "var(--ivory)",
                  padding: "4px 6px",
                  borderRadius: 6,
                  display: "flex",
                  alignItems: "center",
                  gap: 3,
                  fontSize: 12,
                  fontWeight: 600,
                  opacity: 0.8,
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path d="M12 5V1L7 6l5 5V7c3.31 0 6 2.69 6 6s-2.69 6-6 6-6-2.69-6-6H4c0 4.42 3.58 8 8 8s8-3.58 8-8-3.58-8-8-8z" fill="currentColor"/>
                </svg>
                10
              </button>

              {/* Play/Pause */}
              <button
                type="button"
                onClick={vidToggle}
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: "50%",
                  background: "var(--gold)",
                  border: "none",
                  cursor: "pointer",
                  display: "grid",
                  placeItems: "center",
                  flexShrink: 0,
                }}
              >
                {vidPlaying ? (
                  <svg width="14" height="14" viewBox="0 0 14 14">
                    <rect x="2" y="1" width="4" height="12" rx="1" fill="#2A1E08" />
                    <rect x="8" y="1" width="4" height="12" rx="1" fill="#2A1E08" />
                  </svg>
                ) : (
                  <svg width="14" height="14" viewBox="0 0 14 14">
                    <path d="M3 2 L12 7 L3 12 Z" fill="#2A1E08" />
                  </svg>
                )}
              </button>

              {/* Skip forward */}
              <button
                type="button"
                onClick={() => vidSkip(10)}
                title="Forward 10s"
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: "var(--ivory)",
                  padding: "4px 6px",
                  borderRadius: 6,
                  display: "flex",
                  alignItems: "center",
                  gap: 3,
                  fontSize: 12,
                  fontWeight: 600,
                  opacity: 0.8,
                }}
              >
                10
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path d="M12 5V1l5 5-5 5V7c-3.31 0-6 2.69-6 6s2.69 6 6 6 6-2.69 6-6h2c0 4.42-3.58 8-8 8s-8-3.58-8-8 3.58-8 8-8z" fill="currentColor"/>
                </svg>
              </button>

              {/* Time */}
              <span
                style={{
                  fontFamily: "var(--f-mono)",
                  fontSize: 12,
                  color: "rgba(250,247,242,0.7)",
                  marginLeft: 6,
                  whiteSpace: "nowrap",
                }}
              >
                {fmtTime(vidTime)} / {fmtTime(vidDur)}
              </span>

              {/* Spacer */}
              <div style={{ flex: 1 }} />

              {/* Fullscreen */}
              <button
                type="button"
                onClick={vidFullscreen}
                title="Fullscreen"
                style={{
                  background: "none",
                  border: "1px solid rgba(255,255,255,0.15)",
                  borderRadius: 6,
                  cursor: "pointer",
                  color: "var(--ivory)",
                  padding: "5px 8px",
                  display: "grid",
                  placeItems: "center",
                  opacity: 0.8,
                }}
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
                  <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"
                    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const trustedNames = [
  { name: "Meridian" ,logoUrl:"https://res.cloudinary.com/dkqbzwicr/image/upload/q_auto/f_auto/v1779797957/meridian_nwgm1f.png"},
  { name: "Northwind" ,logoUrl:"https://res.cloudinary.com/dkqbzwicr/image/upload/q_auto/f_auto/v1779798598/northwind_h6qmth.png"},
  { name: "Atlas", logoUrl: "https://res.cloudinary.com/dkqbzwicr/image/upload/q_auto/f_auto/v1779778486/atlas_fn6wr0.png" },
  { name: "Apex Consulting" ,logoUrl:"https://res.cloudinary.com/dkqbzwicr/image/upload/q_auto/f_auto/v1779798948/apexconsulting_vvmfln.png"},
  { name: "Vertex",logoUrl:"https://res.cloudinary.com/dkqbzwicr/image/upload/q_auto/f_auto/v1779799173/vertex_paamp5.png" },
  { name: "Stratum",logoUrl :"https://res.cloudinary.com/dkqbzwicr/image/upload/q_auto/f_auto/v1779799434/stratum_r06ucw.png" },
  { name: "Lumen" ,logoUrl :"https://res.cloudinary.com/dkqbzwicr/image/upload/q_auto/f_auto/v1779799720/lumen_cc4obc.png"},
  { name: "Praxis" ,logoUrl :"https://res.cloudinary.com/dkqbzwicr/image/upload/q_auto/f_auto/v1779799966/praxis_algmey.png"},
  { name: "Meridian" ,logoUrl :"https://res.cloudinary.com/dkqbzwicr/image/upload/q_auto/f_auto/v1779797957/meridian_nwgm1f.png" },
  { name: "Northwind",logoUrl:"https://res.cloudinary.com/dkqbzwicr/image/upload/q_auto/f_auto/v1779798598/northwind_h6qmth.png"},
  { name: "Atlas", logoUrl: "https://res.cloudinary.com/dkqbzwicr/image/upload/q_auto/f_auto/v1779778486/atlas_fn6wr0.png" },
  { name: "Apex Consulting",logoUrl:"https://res.cloudinary.com/dkqbzwicr/image/upload/q_auto/f_auto/v1779798948/apexconsulting_vvmfln.png"},
  { name: "Vertex" ,logoUrl:"https://res.cloudinary.com/dkqbzwicr/image/upload/q_auto/f_auto/v1779799173/vertex_paamp5.png"},
  { name: "Stratum",logoUrl :"https://res.cloudinary.com/dkqbzwicr/image/upload/q_auto/f_auto/v1779799434/stratum_r06ucw.png" },
  { name: "Lumen" ,logoUrl :"https://res.cloudinary.com/dkqbzwicr/image/upload/q_auto/f_auto/v1779799720/lumen_cc4obc.png"},
  { name: "Praxis" ,logoUrl :"https://res.cloudinary.com/dkqbzwicr/image/upload/q_auto/f_auto/v1779799966/praxis_algmey.png"},
];

function TrustedStrip() {
  return (
    <div style={{ marginTop: 80, position: "relative", overflow: "hidden" }}>
      <div style={{ textAlign: "center", marginBottom: 24 }}>
        <span
          style={{
            fontSize: 12,
            fontWeight: 600,
            color: "var(--ni-muted)",
            letterSpacing: "0.14em",
            textTransform: "uppercase",
          }}
        >
          Trusted by agencies &amp; enterprises
        </span>
      </div>
      <div
        style={{
          display: "flex",
          animation: "marquee 28s linear infinite",
          gap: 0,
        }}
      >
        {trustedNames.map((item, i) => (
          <div
            key={i}
            style={{
              flexShrink: 0,
              padding: "0 40px",
              display: "flex",
              alignItems: "center",
              gap: 8,
              borderRight: "1px solid var(--line-strong)",
            }}
          >
            {item.logoUrl ? (
              <img
                src={item.logoUrl}
                alt={item.name}
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: "50%",
                  objectFit: "contain",
                  border: "1px solid rgba(47,93,80,0.12)",
                  background: "#fff",
                }}
              />
            ) : (
              <div
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 8,
                  background: "linear-gradient(135deg, var(--sage-soft), var(--sage))",
                  border: "1px solid rgba(47,93,80,0.12)",
                }}
              />
            )}
            <span
              style={{
                fontFamily: "var(--f-display)",
                fontWeight: 600,
                fontSize: 15,
                color: "var(--ink-soft)",
                whiteSpace: "nowrap",
              }}
            >
              {item.name}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
