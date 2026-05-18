"use client";

import { useState, useRef, useEffect } from "react";

const steps = [
  {
    n: "01",
    agent: "Orchestrator",
    title: "Session initialized",
    desc: "Reads file metadata, creates a session with job ID and company profile, decides the execution sequence.",
  },
  {
    n: "02",
    agent: "RFP Parser",
    title: "Requirements extracted",
    desc: "Converts a chaotic 40-page document into a clean JSON object — mandatory vs optional, budgets, timelines, evaluation weights.",
  },
  {
    n: "03",
    agent: "Client Research",
    title: "Client intelligence gathered",
    desc: "Web research surfaces recent news, funding rounds, strategic priorities — the context that makes proposals feel custom.",
  },
  {
    n: "04",
    agent: "Requirements Matcher",
    title: "Capabilities mapped",
    desc: "Every requirement linked to your strongest proof point from past case studies, certifications, and team bios.",
  },
  {
    n: "05",
    agent: "Proposal Writer",
    title: "Full proposal drafted",
    desc: "Executive Summary through Pricing — every sentence tailored to the client's mission, constraints, and language.",
  },
  {
    n: "06",
    agent: "Quality Review",
    title: "Validated & exported",
    desc: "Senior-editor pass catches conflicts. Exports a branded PDF and emails it. Saved to your library, instantly.",
  },
];

export default function HowItWorks() {
  const [activeStep, setActiveStep] = useState(0);
  const stepsRef = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            const idx = Number((e.target as HTMLElement).dataset.idx);
            setActiveStep(idx);
          }
        });
      },
      { rootMargin: "-45% 0px -45% 0px", threshold: 0 }
    );
    stepsRef.current.forEach((el) => el && obs.observe(el));
    return () => obs.disconnect();
  }, []);

  return (
    <section className="ni-section" id="how" style={{ paddingTop: 60 }}>
      <div className="ni-container">
        <div className="ni-section-head">
          <span className="ni-eyebrow">
            <span className="dot" />
            END-TO-END WORKFLOW
          </span>
          <h2 style={{ marginTop: 18 }}>
            From RFP upload to a{" "}
            <span className="ni-text-gradient-gold">submission-ready PDF</span>
          </h2>
          <p>Watch the pipeline as the document flows from one agent to the next.</p>
        </div>

        <div
          className="sticky-grid"
          style={{
            display: "grid",
            gridTemplateColumns: "1.05fr 1fr",
            gap: 80,
            alignItems: "flex-start",
          }}
        >
          {/* LEFT — scrolling steps */}
          <div>
            {steps.map((s, i) => (
              <div
                key={i}
                ref={(el) => { stepsRef.current[i] = el; }}
                data-idx={i}
                style={{
                  minHeight: "70vh",
                  display: "flex",
                  alignItems: "center",
                  paddingRight: 20,
                }}
              >
                <div
                  style={{
                    opacity: activeStep === i ? 1 : 0.32,
                    transform: activeStep === i ? "translateX(0)" : "translateX(-16px)",
                    transition: "all .6s cubic-bezier(.2,.7,.2,1)",
                  }}
                >
                  <div
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 10,
                      padding: "6px 14px",
                      background:
                        activeStep === i
                          ? "linear-gradient(180deg, #FBF1D8, #F7E7C1)"
                          : "var(--sage-soft)",
                      border: `1px solid ${activeStep === i ? "rgba(212,168,79,0.4)" : "var(--line-strong)"}`,
                      borderRadius: 999,
                      fontSize: 12,
                      fontWeight: 600,
                      color: "var(--forest-deep)",
                      letterSpacing: "0.06em",
                    }}
                  >
                    <span>STEP {s.n}</span>
                    <span style={{ opacity: 0.4 }}>·</span>
                    <span>{s.agent}</span>
                  </div>
                  <h3
                    style={{
                      fontSize: "clamp(28px, 3.5vw, 42px)",
                      lineHeight: 1.1,
                      margin: "20px 0 14px",
                    }}
                  >
                    {s.title}
                  </h3>
                  <p
                    style={{
                      fontSize: 17,
                      color: "var(--ink-soft)",
                      lineHeight: 1.55,
                      maxWidth: 520,
                    }}
                  >
                    {s.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* RIGHT — sticky visualization */}
          <div
            className="sticky-right"
            style={{ position: "sticky", top: 120, alignSelf: "flex-start" }}
          >
            <StickyVisualization step={activeStep} />
          </div>
        </div>
      </div>
    </section>
  );
}

function StickyVisualization({ step }: { step: number }) {
  return (
    <div
      style={{
        borderRadius: 24,
        padding: 28,
        background:
          "linear-gradient(180deg, rgba(255,255,255,0.88) 0%, rgba(250,247,242,0.72) 100%)",
        border: "1px solid rgba(255,255,255,0.7)",
        boxShadow: "var(--shadow-card-lg)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        minHeight: 480,
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: -80,
          right: -80,
          width: 240,
          height: 240,
          background: "radial-gradient(circle, rgba(247,231,193,0.5), transparent 65%)",
          pointerEvents: "none",
        }}
      />

      <div
        style={{
          position: "relative",
          height: 420,
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
          {steps.map((s, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 16,
                padding: "11px 0",
                position: "relative",
              }}
            >
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: "50%",
                  background:
                    i <= step
                      ? "linear-gradient(180deg, #FBF1D8, #E0B663)"
                      : "rgba(255,255,255,0.85)",
                  border:
                    i <= step
                      ? "1.5px solid rgba(212,168,79,0.5)"
                      : "1px solid var(--line-strong)",
                  display: "grid",
                  placeItems: "center",
                  fontFamily: "var(--f-display)",
                  fontWeight: 600,
                  color: i <= step ? "#2A1E08" : "var(--ni-muted)",
                  fontSize: 13,
                  boxShadow:
                    i === step
                      ? "0 0 0 6px rgba(247,231,193,0.4), 0 0 16px rgba(212,168,79,0.4)"
                      : "none",
                  transition: "all .5s ease",
                  flexShrink: 0,
                  zIndex: 2,
                }}
              >
                {i < step ? (
                  <svg width="14" height="14" viewBox="0 0 14 14">
                    <path
                      d="M2.5 7l3 3 6-6"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      fill="none"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                ) : (
                  s.n
                )}
              </div>
              <div
                style={{
                  fontFamily: "var(--f-display)",
                  fontWeight: i <= step ? 600 : 500,
                  fontSize: 14,
                  color:
                    i === step
                      ? "var(--forest-deep)"
                      : i < step
                      ? "var(--ink)"
                      : "var(--ni-muted)",
                  transition: "color .4s ease",
                }}
              >
                {s.agent}
              </div>
              <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 8 }}>
                {i === step && (
                  <span
                    style={{
                      fontSize: 11,
                      color: "var(--gold-deep)",
                      fontWeight: 600,
                      display: "flex",
                      gap: 3,
                      alignItems: "center",
                    }}
                  >
                    Processing
                    {[0, 1, 2].map((dot) => (
                      <span
                        key={dot}
                        style={{
                          width: 3,
                          height: 3,
                          borderRadius: "50%",
                          background: "var(--gold-deep)",
                          display: "inline-block",
                          animation: `dotsTyping 1.2s ${dot * 0.2}s ease-in-out infinite`,
                        }}
                      />
                    ))}
                  </span>
                )}
              </div>
              {i < steps.length - 1 && (
                <div
                  style={{
                    position: "absolute",
                    left: 17,
                    top: 47,
                    width: 2,
                    height: 22,
                    background:
                      i < step ? "var(--gold)" : "rgba(212,168,79,0.20)",
                    transition: "background .4s ease",
                    zIndex: 1,
                  }}
                />
              )}
            </div>
          ))}
        </div>

        {/* Output card */}
        <div
          style={{
            marginTop: 12,
            padding: "14px 16px",
            background:
              step >= steps.length - 1
                ? "linear-gradient(120deg, #FBF1D8, #F7E7C1)"
                : "rgba(255,255,255,0.6)",
            border: `1px solid ${step >= steps.length - 1 ? "rgba(212,168,79,0.45)" : "var(--line-strong)"}`,
            borderRadius: 12,
            display: "flex",
            alignItems: "center",
            gap: 12,
            transition: "all .5s ease",
            opacity: step >= steps.length - 1 ? 1 : 0.55,
          }}
        >
          <div
            style={{
              width: 36,
              height: 44,
              borderRadius: 4,
              background: "#fff",
              border: "1px solid rgba(47,93,80,0.15)",
              display: "grid",
              placeItems: "center",
              boxShadow: "0 3px 8px rgba(35,69,57,0.08)",
              flexShrink: 0,
            }}
          >
            <span
              style={{
                fontFamily: "var(--f-mono)",
                fontSize: 9,
                fontWeight: 700,
                color: "var(--forest-deep)",
              }}
            >
              PDF
            </span>
          </div>
          <div>
            <div
              style={{
                fontFamily: "var(--f-display)",
                fontWeight: 600,
                fontSize: 14,
                color: "var(--ink)",
              }}
            >
              Proposal_Apollo_v1.pdf
            </div>
            <div style={{ fontSize: 12, color: "var(--ink-soft)" }}>
              {step >= steps.length - 1
                ? "Ready · 12 sections · 32 pages · sent to your inbox"
                : "Awaiting completion…"}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
