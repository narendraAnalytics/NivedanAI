"use client";

import { useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
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
                onClick={() => router.push("/redirecting?to=sign-up")}
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
    </section>
  );
}

const trustedNames = [
  "Meridian", "Northwind", "Atlas", "Apex Consulting",
  "Vertex", "Stratum", "Lumen", "Praxis",
  "Meridian", "Northwind", "Atlas", "Apex Consulting",
  "Vertex", "Stratum", "Lumen", "Praxis",
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
        {trustedNames.map((name, i) => (
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
            <div
              style={{
                width: 28,
                height: 28,
                borderRadius: 8,
                background: "linear-gradient(135deg, var(--sage-soft), var(--sage))",
                border: "1px solid rgba(47,93,80,0.12)",
              }}
            />
            <span
              style={{
                fontFamily: "var(--f-display)",
                fontWeight: 600,
                fontSize: 15,
                color: "var(--ink-soft)",
                whiteSpace: "nowrap",
              }}
            >
              {name}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
