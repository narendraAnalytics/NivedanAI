"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useUser, UserButton } from "@clerk/nextjs";

/* ── Pipeline stages ── */
const pipelineStages = [
  { n: "01", title: "Orchestrator",         sub: "Routing pipeline" },
  { n: "02", title: "RFP Parser",           sub: "Extracting 24 requirements" },
  { n: "03", title: "Client Research",      sub: "Apollo Hospitals · ₹2,000 Cr digital health" },
  { n: "04", title: "Requirements Match",   sub: "Mapping 24 / 24 capabilities" },
  { n: "05", title: "Proposal Writer",      sub: "Drafting 12 sections" },
  { n: "06", title: "Quality Review",       sub: "Validating & exporting PDF" },
];

/* ── Agents ── */
const agents = [
  { name: "Orchestrator",  desc: "Routing pipeline",        bg: "linear-gradient(135deg, #FBF1D8, #D4A84F)", ring: "rgba(212,168,79,0.30)",   fg: "#2A1E08" },
  { name: "RFP Parser",    desc: "Requirement extraction",  bg: "linear-gradient(135deg, #6FAE99, #2F5D50)", ring: "rgba(47,93,80,0.25)",    fg: "#FFFFFF" },
  { name: "Researcher",    desc: "Company intelligence",    bg: "linear-gradient(135deg, #E8A87C, #C97548)", ring: "rgba(201,117,72,0.25)",   fg: "#FFFFFF" },
  { name: "Matcher",       desc: "Capability alignment",    bg: "linear-gradient(135deg, #B7CDB1, #6B8F7A)", ring: "rgba(107,143,122,0.25)",  fg: "#FFFFFF" },
  { name: "Writer",        desc: "Long-form drafting",      bg: "linear-gradient(135deg, #E5C57A, #B88A2F)", ring: "rgba(184,138,47,0.30)",   fg: "#2A1E08" },
  { name: "Reviewer",      desc: "Validation & export",     bg: "linear-gradient(135deg, #B97D8E, #8B4A5E)", ring: "rgba(139,74,94,0.25)",    fg: "#FFFFFF" },
];

/* ── Proposal entry type ── */
type ProposalEntry = { name: string; status: string; score: number; date: string; win?: boolean; isOwn?: boolean };

/* ── Sample proposals (always shown) ── */
const sampleProposals: ProposalEntry[] = [
  { name: "Apollo Hospitals — Digital Health RFP",  status: "Submitted",   score: 96, date: "2 days ago",  win: true },
  { name: "Tata Power — Grid Modernization",         status: "Draft Ready", score: 89, date: "4 days ago" },
  { name: "Govt. of Telangana — Smart City Tier 2",  status: "Submitted",   score: 94, date: "1 week ago",  win: true },
  { name: "Reliance JioMart — Logistics Platform",   status: "Reviewing",   score: 82, date: "1 week ago" },
  { name: "IIT Bombay — Research Grant",             status: "Submitted",   score: 91, date: "2 weeks ago" },
];

/* ─────────────────────────────────────────────
   Sub-components
───────────────────────────────────────────── */

function DashLogo() {
  const router = useRouter();
  return (
    <div onClick={() => router.push("/")} style={{ display: "flex", alignItems: "center", gap: 12, cursor: "pointer" }}>
      <div style={{
        width: 42, height: 42, borderRadius: 12,
        background: "linear-gradient(180deg, #FBF1D8 0%, #E0B663 100%)",
        display: "grid", placeItems: "center",
        border: "1px solid rgba(212,168,79,0.5)",
        boxShadow: "0 6px 18px rgba(212,168,79,0.30), inset 0 1px 0 rgba(255,255,255,0.7)",
      }}>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
          <path d="M12 3 C 8 7, 8 13, 12 21 C 16 13, 16 7, 12 3 Z" fill="#2F5D50" />
          <path d="M5 9 C 4 13, 6 18, 11 20 C 9 16, 8 12, 5 9 Z" fill="#3d7565" />
          <path d="M19 9 C 20 13, 18 18, 13 20 C 15 16, 16 12, 19 9 Z" fill="#3d7565" />
          <circle cx="12" cy="11" r="1.4" fill="#D4A84F" />
        </svg>
      </div>
      <div style={{ display: "flex", flexDirection: "column", lineHeight: 1.15 }}>
        <span style={{ fontFamily: "var(--f-display)", fontWeight: 700, fontSize: 18, color: "var(--forest-deep)", letterSpacing: "-0.02em" }}>
          Nivedan AI
        </span>
        <span style={{ fontSize: 10.5, color: "var(--gold-deep)", letterSpacing: "0.18em", fontWeight: 600, textTransform: "uppercase" }}>
          Workspace
        </span>
      </div>
    </div>
  );
}

function UserPill() {
  const { user } = useUser();
  const first = user?.firstName ?? "";
  const last  = user?.lastName  ?? "";
  const initials = (first[0] ?? "") + (last[0] ?? "");
  const name = [first, last].filter(Boolean).join(" ") || "User";

  return (
    <div style={{
      display: "inline-flex", alignItems: "center", gap: 12,
      padding: "8px 16px 8px 8px",
      background: "rgba(255,255,255,0.78)",
      border: "1px solid rgba(212,168,79,0.30)",
      borderRadius: 999,
      backdropFilter: "blur(14px) saturate(140%)",
      WebkitBackdropFilter: "blur(14px) saturate(140%)",
      boxShadow: "0 4px 18px rgba(212,168,79,0.15)",
    }}>
      <div style={{
        width: 34, height: 34, borderRadius: "50%",
        background: "linear-gradient(135deg, #2F5D50, #D4A84F)",
        display: "grid", placeItems: "center",
        color: "#fff", fontFamily: "var(--f-display)", fontWeight: 600, fontSize: 13,
        border: "2px solid #fff",
      }}>
        {initials || "?"}
      </div>
      <div style={{ display: "flex", flexDirection: "column", lineHeight: 1.2 }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: "var(--forest-deep)" }}>{name}</span>
        <span style={{ fontSize: 11, color: "var(--ink-soft)", fontWeight: 500 }}>Free Plan</span>
      </div>
      <svg width="12" height="12" viewBox="0 0 12 12" style={{ marginLeft: 4, color: "var(--ink-soft)" }}>
        <path d="M3 4.5 L6 7.5 L9 4.5" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" />
      </svg>
    </div>
  );
}

function ProcessingPipeline({ fileName, onComplete }: { fileName: string; onComplete?: () => void }) {
  const [active, setActive]       = useState(0);
  const [progress, setProgress]   = useState(0);
  const [completed, setCompleted] = useState(false);

  useEffect(() => {
    const STAGE_MS = 2400;
    const TICK = 60;
    let elapsed = 0;
    let stage = 0;
    setActive(0); setProgress(0); setCompleted(false);

    const id = setInterval(() => {
      elapsed += TICK;
      const pct = Math.min(100, Math.round(elapsed / STAGE_MS * 100));
      setProgress(pct);
      if (elapsed >= STAGE_MS) {
        elapsed = 0;
        stage++;
        if (stage >= pipelineStages.length) {
          clearInterval(id);
          setCompleted(true);
          setTimeout(() => onComplete?.(), 1200);
          return;
        }
        setActive(stage);
        setProgress(0);
      }
    }, TICK);

    return () => clearInterval(id);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fileName]);

  const getStatus = (i: number) => {
    if (completed || i < active) return "done";
    if (i === active) return "active";
    return "pending";
  };

  return (
    <div style={{ position: "relative" }}>
      {/* Current file banner */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "18px 22px",
        background: "linear-gradient(120deg, #FBF1D8 0%, #FFFCF4 100%)",
        border: "1px solid rgba(212,168,79,0.40)",
        borderRadius: 16,
        boxShadow: "0 8px 22px rgba(212,168,79,0.18)",
        marginBottom: 28,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{
            width: 44, height: 56, borderRadius: 6,
            background: "#fff", border: "1px solid rgba(47,93,80,0.15)",
            display: "grid", placeItems: "center",
            boxShadow: "0 4px 10px rgba(35,69,57,0.10)",
          }}>
            <span style={{ fontFamily: "var(--f-mono)", fontSize: 10, fontWeight: 700, color: "var(--forest-deep)" }}>PDF</span>
          </div>
          <div>
            <div style={{ fontFamily: "var(--f-display)", fontWeight: 600, fontSize: 15.5, color: "var(--ink)" }}>{fileName}</div>
            <div style={{ fontSize: 12.5, color: "var(--ink-soft)" }}>38 pages · 24 requirements detected · processing started</div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {!completed ? (
            <>
              <span style={{
                width: 8, height: 8, borderRadius: "50%", background: "var(--gold)",
                boxShadow: "0 0 8px rgba(212,168,79,0.7)",
                animation: "pulseGold 1.4s ease-in-out infinite",
              }} />
              <span style={{ fontSize: 12, fontWeight: 600, color: "var(--gold-deep)" }}>Generating</span>
            </>
          ) : (
            <>
              <span style={{
                width: 18, height: 18, borderRadius: "50%", background: "var(--forest)",
                display: "grid", placeItems: "center",
              }}>
                <svg width="10" height="10" viewBox="0 0 10 10"><path d="M2 5l2 2 4-4" stroke="#fff" strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round" /></svg>
              </span>
              <span style={{ fontSize: 12, fontWeight: 600, color: "var(--forest-deep)" }}>Completed</span>
            </>
          )}
        </div>
      </div>

      {/* Stage grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
        {pipelineStages.map((s, i) => {
          const status    = getStatus(i);
          const isActive  = status === "active";
          const isDone    = status === "done";
          const isPending = status === "pending";
          const pct       = isDone ? 100 : isActive ? progress : 0;

          return (
            <div key={i} style={{
              position: "relative",
              padding: "18px 18px 20px",
              background: isActive  ? "linear-gradient(180deg, #FFFCF4 0%, #FBF1D8 100%)"
                        : isDone    ? "linear-gradient(180deg, #fff 0%, var(--sage-soft) 100%)"
                        : "#fff",
              border: isActive ? "1.5px solid rgba(212,168,79,0.6)"
                    : isDone   ? "1px solid rgba(47,93,80,0.20)"
                    : "1px solid var(--line-strong)",
              borderRadius: 14,
              boxShadow: isActive
                ? "0 0 0 4px rgba(247,231,193,0.55), 0 12px 24px rgba(212,168,79,0.18)"
                : "0 1px 2px rgba(35,69,57,0.04), 0 6px 14px rgba(35,69,57,0.05)",
              transition: "all .5s cubic-bezier(.2,.7,.2,1)",
            }}>
              {isActive && (
                <span style={{
                  position: "absolute", top: 12, right: 12,
                  width: 8, height: 8, borderRadius: "50%",
                  background: "var(--gold)",
                  boxShadow: "0 0 0 4px rgba(212,168,79,0.18), 0 0 10px rgba(212,168,79,0.7)",
                  animation: "pulseGold 1.4s ease-in-out infinite",
                }} />
              )}
              {isDone && (
                <span style={{
                  position: "absolute", top: 12, right: 12,
                  width: 18, height: 18, borderRadius: "50%",
                  background: "var(--forest)", display: "grid", placeItems: "center",
                }}>
                  <svg width="9" height="9" viewBox="0 0 10 10"><path d="M2 5l2 2 4-4" stroke="#fff" strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round" /></svg>
                </span>
              )}
              <div style={{
                fontFamily: "var(--f-mono)", fontSize: 10.5, fontWeight: 600,
                color: isPending ? "var(--ni-muted)" : "var(--gold-deep)",
                letterSpacing: "0.06em", marginBottom: 6,
              }}>STAGE {s.n}</div>
              <div style={{
                fontFamily: "var(--f-display)", fontWeight: 600, fontSize: 15,
                color: isPending ? "var(--ni-muted)" : "var(--ink)", marginBottom: 4,
              }}>{s.title}</div>
              <div style={{ fontSize: 12, color: "var(--ink-soft)", minHeight: 30, lineHeight: 1.35 }}>
                {isPending ? "Awaiting upstream output" : s.sub}
              </div>
              <div style={{
                marginTop: 12, height: 4, borderRadius: 999,
                background: "rgba(47,93,80,0.08)", overflow: "hidden",
              }}>
                <div style={{
                  width: `${pct}%`, height: "100%",
                  background: isDone
                    ? "linear-gradient(90deg, #3d7565, #2F5D50)"
                    : "linear-gradient(90deg, #E0B663, #D4A84F)",
                  borderRadius: 999,
                  transition: "width .3s linear",
                  boxShadow: isActive ? "0 0 6px rgba(212,168,79,0.6)" : "none",
                }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function UploadZone({ onFile }: { onFile: (name: string) => void }) {
  const [drag, setDrag] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handle = (file: File | null | undefined) => {
    if (!file) return;
    onFile(file.name || "Hospital_RFP.pdf");
  };

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
      onDragLeave={() => setDrag(false)}
      onDrop={(e) => { e.preventDefault(); setDrag(false); handle(e.dataTransfer.files?.[0]); }}
      onClick={() => inputRef.current?.click()}
      style={{
        position: "relative",
        padding: "52px 32px",
        borderRadius: 22,
        background: drag
          ? "linear-gradient(180deg, #FFF9E6 0%, #FFFCF4 100%)"
          : "linear-gradient(180deg, #FFFCF4 0%, #FFFFFF 100%)",
        border: `1.5px dashed ${drag ? "#D4A84F" : "rgba(212,168,79,0.50)"}`,
        cursor: "pointer",
        textAlign: "center",
        transition: "all .3s ease",
        boxShadow: drag
          ? "0 0 0 6px rgba(247,231,193,0.5), 0 16px 36px rgba(212,168,79,0.18)"
          : "0 6px 18px rgba(212,168,79,0.10)",
        overflow: "hidden",
      }}
    >
      <div style={{
        position: "absolute", top: -100, left: "50%", transform: "translateX(-50%)",
        width: 600, height: 400,
        background: "radial-gradient(ellipse, rgba(247,231,193,0.55), transparent 65%)",
        pointerEvents: "none",
      }} />

      <input
        ref={inputRef}
        type="file"
        accept=".pdf,.docx"
        style={{ display: "none" }}
        aria-label="Upload RFP document"
        onChange={(e) => handle(e.target.files?.[0])}
      />

      <div style={{
        position: "relative", zIndex: 1,
        width: 96, height: 96, margin: "0 auto 24px",
        borderRadius: 24,
        background: "linear-gradient(180deg, #FBF1D8 0%, #E0B663 100%)",
        display: "grid", placeItems: "center",
        boxShadow: "0 10px 28px rgba(212,168,79,0.35), inset 0 1px 0 rgba(255,255,255,0.7)",
        animation: drag ? "bounce 0.8s ease-in-out infinite" : "floatSlow 4s ease-in-out infinite",
      }}>
        <svg width="44" height="44" viewBox="0 0 44 44" fill="none">
          <path d="M22 30 V12 M14 20 L22 12 L30 20" stroke="#2A1E08" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M10 30 V34 H34 V30" stroke="#2A1E08" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>

      <div style={{ position: "relative", zIndex: 1 }}>
        <div style={{
          fontFamily: "var(--f-display)", fontSize: 26, fontWeight: 600,
          color: "var(--forest-deep)", letterSpacing: "-0.02em", marginBottom: 8,
        }}>
          {drag ? "Drop your RFP to begin" : "Drag & drop your RFP here"}
        </div>
        <div style={{ fontSize: 15, color: "var(--ink-soft)", marginBottom: 24 }}>
          or <span style={{ color: "var(--gold-deep)", fontWeight: 600 }}>browse files</span> from your computer
        </div>
        <div style={{
          display: "inline-flex", alignItems: "center", gap: 22,
          padding: "10px 20px",
          background: "rgba(255,255,255,0.7)",
          border: "1px solid var(--line-strong)",
          borderRadius: 999,
          fontSize: 12, color: "var(--ink-soft)",
        }}>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--gold)" }} />
            PDF, DOCX
          </span>
          <span style={{ width: 1, height: 12, background: "var(--line-strong)" }} />
          <span>Up to 50 MB</span>
          <span style={{ width: 1, height: 12, background: "var(--line-strong)" }} />
          <span>Encrypted in transit</span>
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, hint, accent }: {
  icon: React.ReactNode; label: string; value: string; hint: string; accent?: string;
}) {
  return (
    <div
      style={{
        padding: "18px 18px",
        background: "linear-gradient(180deg, #fff 0%, rgba(255,252,244,0.7) 100%)",
        border: "1px solid var(--line-strong)",
        borderRadius: 14,
        boxShadow: "0 1px 2px rgba(35,69,57,0.04), 0 6px 16px rgba(35,69,57,0.05)",
        transition: "transform .25s, box-shadow .25s",
        cursor: "default",
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)";
        (e.currentTarget as HTMLElement).style.boxShadow = "0 12px 24px rgba(35,69,57,0.08)";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.transform = "translateY(0)";
        (e.currentTarget as HTMLElement).style.boxShadow = "0 1px 2px rgba(35,69,57,0.04), 0 6px 16px rgba(35,69,57,0.05)";
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
        <div style={{
          width: 32, height: 32, borderRadius: 9,
          background: accent || "var(--sage-soft)",
          display: "grid", placeItems: "center",
        }}>{icon}</div>
        <div style={{ fontSize: 12, color: "var(--ink-soft)", fontWeight: 500 }}>{label}</div>
      </div>
      <div style={{
        fontFamily: "var(--f-display)", fontWeight: 600, fontSize: 26,
        color: "var(--forest-deep)", lineHeight: 1, letterSpacing: "-0.02em",
      }}>{value}</div>
      <div style={{ fontSize: 11.5, color: "var(--gold-deep)", fontWeight: 600, marginTop: 6 }}>{hint}</div>
    </div>
  );
}

function ProposalRow({ p, isLast }: { p: ProposalEntry; isLast: boolean }) {
  return (
    <div
      style={{
        display: "flex", alignItems: "center", gap: 16,
        padding: "14px 18px",
        borderBottom: !isLast ? "1px solid var(--line)" : "none",
        transition: "background .2s",
        cursor: "pointer",
        borderRadius: 8,
        background: p.isOwn ? "rgba(47,93,80,0.04)" : "transparent",
      }}
      onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(247,231,193,0.25)")}
      onMouseLeave={(e) => (e.currentTarget.style.background = p.isOwn ? "rgba(47,93,80,0.04)" : "transparent")}
    >
      <div style={{
        width: 36, height: 44, borderRadius: 5,
        background: p.isOwn
          ? "linear-gradient(180deg, #EBF1E7 0%, #DDE7D8 100%)"
          : "linear-gradient(180deg, #fff 0%, var(--ivory-warm) 100%)",
        border: `1px solid ${p.isOwn ? "rgba(47,93,80,0.25)" : "var(--line-strong)"}`,
        display: "grid", placeItems: "center", flexShrink: 0,
        position: "relative",
      }}>
        <span style={{ fontFamily: "var(--f-mono)", fontSize: 9, fontWeight: 700, color: "var(--forest-deep)" }}>PDF</span>
        {p.win && (
          <span style={{
            position: "absolute", top: -5, right: -5,
            width: 14, height: 14, borderRadius: "50%",
            background: "var(--gold)", display: "grid", placeItems: "center",
            boxShadow: "0 2px 6px rgba(212,168,79,0.5)",
          }}>
            <svg width="7" height="7" viewBox="0 0 10 10"><path d="M5 1l1.2 2.8L9 4 7 6l.5 3L5 7.5 2.5 9 3 6 1 4l2.8-.2L5 1Z" fill="#2A1E08" /></svg>
          </span>
        )}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{
            fontFamily: "var(--f-display)", fontWeight: 600, fontSize: 14,
            color: "var(--ink)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
          }}>{p.name}</div>
          {p.isOwn && (
            <span style={{
              flexShrink: 0, padding: "2px 7px", borderRadius: 999, fontSize: 10, fontWeight: 600,
              background: "rgba(47,93,80,0.12)", color: "var(--forest)",
            }}>Yours</span>
          )}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 3, fontSize: 11.5, color: "var(--ink-soft)" }}>
          <span>{p.date}</span>
          <span style={{ opacity: 0.4 }}>·</span>
          <span>Quality {p.score}%</span>
        </div>
      </div>
      <span style={{
        padding: "4px 10px", borderRadius: 999, fontSize: 11, fontWeight: 600,
        background: p.status === "Submitted"
          ? "rgba(47,93,80,0.10)"
          : p.status === "Draft Ready"
          ? "rgba(212,168,79,0.18)"
          : "rgba(138,149,143,0.15)",
        color: p.status === "Submitted"
          ? "var(--forest-deep)"
          : p.status === "Draft Ready"
          ? "var(--gold-deep)"
          : "var(--ink-soft)",
      }}>{p.status}</span>
    </div>
  );
}

function RecentList({ userProposals }: { userProposals: ProposalEntry[] }) {
  const all = [...userProposals, ...sampleProposals];
  return (
    <div style={{ padding: "4px 0", display: "flex", flexDirection: "column" }}>
      {userProposals.length > 0 && (
        <div style={{
          padding: "6px 18px 4px",
          fontSize: 10.5, fontWeight: 600, color: "var(--forest)",
          letterSpacing: "0.08em", textTransform: "uppercase",
        }}>Your uploads</div>
      )}
      {userProposals.map((p, i) => (
        <ProposalRow key={`u-${i}`} p={p} isLast={false} />
      ))}
      {userProposals.length > 0 && (
        <div style={{
          margin: "6px 18px",
          height: 1, background: "var(--line-strong)",
          display: "flex", alignItems: "center", gap: 8,
        }}>
          <span style={{
            fontSize: 10, fontWeight: 600, color: "var(--ni-muted)",
            letterSpacing: "0.08em", textTransform: "uppercase",
            background: "rgba(255,255,255,0.9)", padding: "0 8px",
            marginLeft: 8,
          }}>Sample proposals</span>
        </div>
      )}
      {sampleProposals.map((p, i) => (
        <ProposalRow key={`s-${i}`} p={p} isLast={i === sampleProposals.length - 1} />
      ))}
    </div>
  );
}

function AgentRoster() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {agents.map((a, i) => (
        <div key={i} style={{
          display: "flex", alignItems: "center", gap: 12,
          padding: "10px 12px",
          background: "rgba(255,255,255,0.55)",
          border: "1px solid var(--line)",
          borderRadius: 10,
        }}>
          <div style={{
            width: 28, height: 28, borderRadius: "50%",
            background: a.bg,
            display: "grid", placeItems: "center",
            fontFamily: "var(--f-display)", fontWeight: 700, fontSize: 11,
            color: a.fg,
            boxShadow: `0 0 0 3px ${a.ring}, 0 2px 6px rgba(35,69,57,0.12)`,
          }}>{i + 1}</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: "var(--f-display)", fontWeight: 600, fontSize: 13, color: "var(--ink)" }}>{a.name}</div>
            <div style={{ fontSize: 11, color: "var(--ink-soft)" }}>{a.desc}</div>
          </div>
          <span style={{
            width: 8, height: 8, borderRadius: "50%", background: "#3d7565",
            boxShadow: "0 0 6px rgba(61,117,101,0.5)",
          }} />
        </div>
      ))}
    </div>
  );
}

type TwinkleDot = { top: number; left: number; size: number; delay: number; duration: number };

function Twinkles() {
  const [dots, setDots] = useState<TwinkleDot[]>([]);

  useEffect(() => {
    setDots(Array.from({ length: 22 }, () => ({
      top:      Math.random() * 80 + 5,
      left:     Math.random() * 95,
      size:     3 + Math.random() * 7,
      delay:    Math.random() * 4,
      duration: 3 + Math.random() * 3,
    })));
  }, []);

  return (
    <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0 }}>
      {dots.map((d, i) => (
        <div key={i} style={{
          position: "absolute",
          top: `${d.top}%`, left: `${d.left}%`,
          width: d.size, height: d.size,
          background: "var(--gold)",
          borderRadius: "50%",
          opacity: 0.25,
          boxShadow: `0 0 ${d.size * 2}px rgba(212,168,79,0.6)`,
          animation: `twinkle ${d.duration}s ease-in-out ${d.delay}s infinite`,
        }} />
      ))}
    </div>
  );
}

function BgLayer() {
  return (
    <>
      <div style={{
        position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none",
        background: `
          radial-gradient(900px 600px at 90% -10%, rgba(247,231,193,0.85) 0%, transparent 55%),
          radial-gradient(800px 600px at 0% 30%, rgba(221,231,216,0.55) 0%, transparent 55%),
          radial-gradient(700px 500px at 80% 80%, rgba(247,231,193,0.6) 0%, transparent 55%),
          linear-gradient(180deg, #FFFCF4 0%, #FAF7F2 100%)
        `,
      }} />
      <svg style={{
        position: "fixed", top: 200, left: -50, width: "110vw", height: 700,
        opacity: 0.18, pointerEvents: "none", zIndex: 0,
      }} viewBox="0 0 1500 700" preserveAspectRatio="none" fill="none">
        {[...Array(36)].map((_, i) => (
          <path key={i}
            d={`M -100 ${i * 22 + 30} Q 400 ${i * 22 + 5}, 800 ${i * 22 + 50} T 1700 ${i * 22 + 20}`}
            stroke={i % 5 === 0 ? "rgba(212,168,79,0.30)" : "rgba(47,93,80,0.08)"}
            strokeWidth="1" fill="none"
          />
        ))}
      </svg>
      <Twinkles />
    </>
  );
}

/* ─────────────────────────────────────────────
   Dashboard page
───────────────────────────────────────────── */
export default function Dashboard() {
  const { user } = useUser();
  const firstName = user?.firstName ?? "there";

  const [fileName, setFileName]         = useState<string | null>(null);
  const [completed, setCompleted]       = useState(false);
  const [userProposals, setUserProposals] = useState<ProposalEntry[]>([]);
  const [proposalCount, setProposalCount] = useState(0);

  return (
    <div className="ni-page-enter" style={{ position: "relative", minHeight: "100vh", overflow: "hidden" }}>
      <BgLayer />

      {/* Floating header */}
      <div style={{
        position: "absolute", top: 28, left: 0, right: 0, zIndex: 10,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "0 48px",
      }}>
        <DashLogo />
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <button type="button" aria-label="Notifications" style={{
            width: 40, height: 40, borderRadius: "50%",
            background: "rgba(255,255,255,0.78)",
            border: "1px solid rgba(212,168,79,0.30)",
            display: "grid", placeItems: "center",
            backdropFilter: "blur(10px)",
            WebkitBackdropFilter: "blur(10px)",
            cursor: "pointer",
          }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M12 3a6 6 0 0 0-6 6c0 5-3 6-3 6h18s-3-1-3-6a6 6 0 0 0-6-6Z" stroke="#2F5D50" strokeWidth="1.5" strokeLinejoin="round" />
              <path d="M10 19a2 2 0 0 0 4 0" stroke="#2F5D50" strokeWidth="1.5" strokeLinecap="round" />
              <circle cx="17" cy="6" r="3" fill="#D4A84F" />
            </svg>
          </button>
          <UserPill />
          <UserButton />
        </div>
      </div>

      {/* Content */}
      <div style={{ position: "relative", maxWidth: 1320, margin: "0 auto", padding: "120px 48px 80px" }}>

        {/* Welcome header */}
        <div className="reveal in" style={{ marginBottom: 36 }}>
          <span style={{
            display: "inline-flex", alignItems: "center", gap: 8,
            padding: "7px 16px",
            background: "linear-gradient(120deg, #FBF1D8, #F7E7C1)",
            border: "1px solid rgba(212,168,79,0.4)",
            borderRadius: 999,
            fontSize: 11, fontWeight: 600,
            color: "var(--gold-deep)", letterSpacing: "0.12em", textTransform: "uppercase",
            boxShadow: "0 4px 14px rgba(212,168,79,0.20)",
          }}>
            <span style={{
              width: 6, height: 6, borderRadius: "50%", background: "var(--gold)",
              boxShadow: "0 0 8px var(--gold)",
              animation: "pulseGold 1.6s ease-in-out infinite",
            }} />
            Workspace active · 6 agents online
          </span>
          <h1 style={{
            marginTop: 16,
            fontFamily: "var(--f-display)",
            fontSize: "clamp(36px, 4.4vw, 56px)",
            lineHeight: 1.05,
            letterSpacing: "-0.035em",
            fontWeight: 600,
            color: "var(--forest-deep)",
          }}>
            Welcome back, {firstName}.<br />
            <span className="text-gradient-gold">Let&apos;s draft your next winning proposal.</span>
          </h1>
          <p style={{
            marginTop: 16, fontSize: 17, color: "var(--ink-soft)",
            maxWidth: 680, lineHeight: 1.55,
          }}>
            Upload an RFP and our six AI agents will research, write, review, and export
            a submission-ready PDF in under 20 minutes.
          </p>
        </div>

        {/* Stats row */}
        <div
          className="reveal in d1"
          style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 32 }}
        >
          <StatCard
            label="Proposals this month"
            value={proposalCount === 0 ? "0" : String(proposalCount)}
            hint={proposalCount === 0 ? "Upload your first RFP to begin" : `${proposalCount} proposal${proposalCount > 1 ? "s" : ""} generated`}
            accent="linear-gradient(135deg, #FBF1D8, #E0B663)"
            icon={<svg width="16" height="16" viewBox="0 0 16 16"><path d="M3 13V3h10v10H3Z M5 6h6 M5 9h6 M5 11h3" stroke="#2A1E08" strokeWidth="1.4" fill="none" strokeLinecap="round" /></svg>}
          />
          <StatCard
            label="Win rate" value="—" hint="Calculated after first proposal"
            accent="linear-gradient(135deg, #DDE7D8, #2F5D50)"
            icon={<svg width="16" height="16" viewBox="0 0 16 16"><path d="M5 3h6v4a3 3 0 1 1-6 0V3Z" stroke="#fff" strokeWidth="1.4" fill="none" strokeLinejoin="round" /><path d="M5 5H3 a2 2 0 0 0 2 3M11 5h2 a2 2 0 0 1-2 3" stroke="#fff" strokeWidth="1.4" fill="none" /><path d="M6 13h4 M8 10v3" stroke="#fff" strokeWidth="1.4" strokeLinecap="round" /></svg>}
          />
          <StatCard
            label="Avg. time saved"
            value={proposalCount === 0 ? "0h" : `${proposalCount * 19}h`}
            hint={proposalCount === 0 ? "Tracked per completed proposal" : "~19h saved per proposal"}
            accent="linear-gradient(135deg, #FBF1D8, #E0B663)"
            icon={<svg width="16" height="16" viewBox="0 0 16 16"><circle cx="8" cy="8" r="6" stroke="#2A1E08" strokeWidth="1.4" fill="none" /><path d="M8 5v3l2 1" stroke="#2A1E08" strokeWidth="1.4" fill="none" strokeLinecap="round" /></svg>}
          />
          <StatCard
            label="Knowledge base" value="0 docs" hint="Add docs to power the Matcher Agent"
            accent="linear-gradient(135deg, #DDE7D8, #2F5D50)"
            icon={<svg width="16" height="16" viewBox="0 0 16 16"><path d="M3 4a1 1 0 0 1 1-1h3l1 1h4a1 1 0 0 1 1 1v7a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V4Z" stroke="#fff" strokeWidth="1.4" fill="none" /></svg>}
          />
        </div>

        {/* Two-column main */}
        <div style={{ display: "grid", gridTemplateColumns: "1.6fr 1fr", gap: 32 }} className="dash-grid">

          {/* LEFT — upload / processing */}
          <div className="reveal in d2">
            <div style={{
              padding: 28,
              borderRadius: 24,
              background: "linear-gradient(180deg, rgba(255,255,255,0.85) 0%, rgba(255,252,244,0.72) 100%)",
              border: "1px solid rgba(212,168,79,0.25)",
              boxShadow: "0 24px 60px rgba(212,168,79,0.12), 0 2px 6px rgba(35,69,57,0.04)",
              backdropFilter: "blur(14px) saturate(140%)",
              WebkitBackdropFilter: "blur(14px) saturate(140%)",
              position: "relative", overflow: "hidden",
            }}>
              <div style={{
                position: "absolute", top: -100, right: -100, width: 300, height: 300,
                background: "radial-gradient(circle, rgba(247,231,193,0.5), transparent 65%)",
                pointerEvents: "none",
              }} />

              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 22, position: "relative" }}>
                <div>
                  <div style={{ fontFamily: "var(--f-display)", fontWeight: 600, fontSize: 22, color: "var(--ink)" }}>
                    {!fileName ? "New proposal" : completed ? "Proposal ready" : "Generating proposal"}
                  </div>
                  <div style={{ fontSize: 13.5, color: "var(--ink-soft)", marginTop: 4 }}>
                    {!fileName
                      ? "Drop an RFP to kick off the pipeline"
                      : completed
                      ? "Your branded PDF is in your inbox — and saved to the library below."
                      : "Six agents are working through your RFP. ETA 18 minutes."}
                  </div>
                </div>
                {fileName && (
                  <button
                    onClick={() => { setFileName(null); setCompleted(false); }}
                    style={{
                      padding: "8px 14px", fontSize: 12.5, fontWeight: 600,
                      background: "rgba(255,255,255,0.7)",
                      border: "1px solid var(--line-strong)",
                      borderRadius: 8, color: "var(--ink-soft)", cursor: "pointer",
                    }}
                  >
                    New upload
                  </button>
                )}
              </div>

              {!fileName ? (
                <UploadZone onFile={(name) => { setFileName(name); setCompleted(false); }} />
              ) : (
                <ProcessingPipeline fileName={fileName} onComplete={() => {
                  setCompleted(true);
                  setProposalCount(prev => prev + 1);
                  setUserProposals(prev => [{
                    name: fileName?.replace(/\.[^.]+$/, "") ?? "Proposal",
                    status: "Draft Ready",
                    score: 96,
                    date: "Just now",
                    isOwn: true,
                  }, ...prev]);
                }} />
              )}

              {completed && (
                <div style={{
                  marginTop: 24, padding: "18px 22px",
                  background: "linear-gradient(120deg, var(--forest-deep), var(--forest))",
                  color: "#fff", borderRadius: 14,
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  boxShadow: "0 12px 30px rgba(35,69,57,0.25)",
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                    <div style={{
                      width: 38, height: 38, borderRadius: 10,
                      background: "linear-gradient(180deg, #FBF1D8, #E0B663)",
                      display: "grid", placeItems: "center",
                    }}>
                      <svg width="20" height="20" viewBox="0 0 20 20"><path d="M5 10l3 3 7-7" stroke="#2A1E08" strokeWidth="2.2" fill="none" strokeLinecap="round" strokeLinejoin="round" /></svg>
                    </div>
                    <div>
                      <div style={{ fontFamily: "var(--f-display)", fontWeight: 600, fontSize: 15 }}>Proposal_Apollo_v1.pdf · 32 pages</div>
                      <div style={{ fontSize: 12, color: "rgba(255,255,255,0.7)" }}>Quality score: 96 / 100 · All 24 requirements addressed</div>
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 10 }}>
                    <button className="btn btn-gold" style={{ padding: "10px 18px", fontSize: 13 }}>
                      Download PDF
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M6 2v6 M3 5l3 3 3-3 M2 10h8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg>
                    </button>
                    <button style={{
                      padding: "10px 18px", fontSize: 13, fontWeight: 600,
                      background: "rgba(255,255,255,0.10)", color: "#fff",
                      border: "1px solid rgba(255,255,255,0.20)", borderRadius: 10, cursor: "pointer",
                    }}>
                      Open in editor
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Recent proposals */}
            <div style={{ marginTop: 28 }} className="reveal in d3">
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <h3 style={{ fontFamily: "var(--f-display)", fontWeight: 600, fontSize: 18, color: "var(--ink)" }}>Recent proposals</h3>
                  <span style={{
                    padding: "3px 9px", borderRadius: 999, fontSize: 10.5, fontWeight: 600,
                    background: "rgba(212,168,79,0.15)", color: "var(--gold-deep)",
                    letterSpacing: "0.06em", textTransform: "uppercase",
                  }}>Sample</span>
                </div>
                <a href="#" style={{ fontSize: 13, color: "var(--gold-deep)", fontWeight: 600 }}>View all →</a>
              </div>
              <div style={{
                background: "rgba(255,255,255,0.78)",
                border: "1px solid var(--line-strong)",
                borderRadius: 16, padding: "6px 4px",
                backdropFilter: "blur(10px)",
                WebkitBackdropFilter: "blur(10px)",
                boxShadow: "0 6px 20px rgba(35,69,57,0.05)",
              }}>
                <RecentList userProposals={userProposals} />
              </div>
            </div>
          </div>

          {/* RIGHT — agents + tips */}
          <div className="reveal in d3" style={{ display: "flex", flexDirection: "column", gap: 24 }}>

            {/* Agent roster */}
            <div style={{
              padding: 22, borderRadius: 18,
              background: "rgba(255,255,255,0.78)",
              border: "1px solid var(--line-strong)",
              backdropFilter: "blur(10px)",
              WebkitBackdropFilter: "blur(10px)",
              boxShadow: "0 6px 20px rgba(35,69,57,0.05)",
            }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
                <h3 style={{ fontFamily: "var(--f-display)", fontWeight: 600, fontSize: 16, color: "var(--ink)" }}>Your AI agents</h3>
                <span style={{
                  display: "inline-flex", alignItems: "center", gap: 6,
                  fontSize: 11, fontWeight: 600, color: "var(--forest)",
                  padding: "4px 10px",
                  background: "rgba(61,117,101,0.10)",
                  borderRadius: 999,
                }}>
                  <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#3d7565" }} />
                  All online
                </span>
              </div>
              <AgentRoster />
            </div>

            {/* Pro tip */}
            <div style={{
              padding: 22, borderRadius: 18,
              background: "linear-gradient(180deg, #FFFCF4 0%, #FBF1D8 100%)",
              border: "1px solid rgba(212,168,79,0.40)",
              boxShadow: "0 8px 24px rgba(212,168,79,0.18)",
              position: "relative", overflow: "hidden",
            }}>
              <div style={{
                position: "absolute", top: -40, right: -40, width: 180, height: 180,
                background: "radial-gradient(circle, rgba(212,168,79,0.30), transparent 65%)",
                pointerEvents: "none",
              }} />
              <div style={{ position: "relative" }}>
                <div style={{ fontFamily: "var(--f-mono)", fontSize: 10.5, fontWeight: 600, color: "var(--gold-deep)", letterSpacing: "0.14em", marginBottom: 8 }}>PRO TIP</div>
                <h3 style={{ fontFamily: "var(--f-display)", fontWeight: 600, fontSize: 17, color: "var(--forest-deep)", marginBottom: 10, lineHeight: 1.3 }}>
                  Add a company profile for better tailoring
                </h3>
                <p style={{ fontSize: 13.5, color: "var(--ink-soft)", lineHeight: 1.5, marginBottom: 16 }}>
                  Upload past proposals, case studies, and team bios.
                  The Requirements Matcher Agent uses this to find proof points automatically.
                </p>
                <button style={{
                  padding: "10px 16px", fontSize: 13, fontWeight: 600,
                  background: "var(--forest)", color: "#fff",
                  borderRadius: 10, cursor: "pointer", border: "none",
                  boxShadow: "0 4px 12px rgba(47,93,80,0.25)",
                }}>
                  Manage knowledge base →
                </button>
              </div>
            </div>

            {/* Plan status */}
            <div style={{
              padding: "18px 22px", borderRadius: 18,
              background: "rgba(255,255,255,0.78)",
              border: "1px solid var(--line-strong)",
              backdropFilter: "blur(10px)",
              WebkitBackdropFilter: "blur(10px)",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
                <div style={{
                  width: 36, height: 36, borderRadius: "50%",
                  background: "linear-gradient(135deg, #DDE7D8, #2F5D50)",
                  display: "grid", placeItems: "center", color: "#fff",
                }}>
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path d="M8 1l2.2 4.5L15 6.2l-3.5 3.4L12.4 15 8 12.4 3.6 15l.9-5.4L1 6.2l4.8-.7L8 1Z" fill="currentColor" />
                  </svg>
                </div>
                <div>
                  <div style={{ fontFamily: "var(--f-display)", fontWeight: 600, fontSize: 14, color: "var(--ink)" }}>You&apos;re on a Free trial</div>
                  <div style={{ fontSize: 12, color: "var(--ink-soft)" }}>3 proposals remaining</div>
                </div>
              </div>
              <div style={{ height: 5, borderRadius: 999, background: "rgba(47,93,80,0.10)", overflow: "hidden", marginBottom: 12 }}>
                <div style={{ width: "30%", height: "100%", background: "linear-gradient(90deg, #E0B663, #D4A84F)", borderRadius: 999 }} />
              </div>
              <a href="#" style={{ fontSize: 12.5, color: "var(--gold-deep)", fontWeight: 600 }}>Upgrade to Pro →</a>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
