"use client";

import { useState, useEffect } from "react";

interface Stage {
  n: string;
  label: string;
  desc: string;
  icon: string;
}

const stages: Stage[] = [
  { n: "01", label: "RFP Upload", desc: "Document received", icon: "upload" },
  { n: "02", label: "RFP Parsing", desc: "Extracting requirements", icon: "doc" },
  { n: "03", label: "Client Research", desc: "Gathering intelligence", icon: "research" },
  { n: "04", label: "Requirements Matching", desc: "Mapping capabilities", icon: "match" },
  { n: "05", label: "Proposal Writing", desc: "Crafting proposal", icon: "write" },
  { n: "06", label: "Quality Review", desc: "Validating completeness", icon: "shield" },
  { n: "07", label: "PDF Export", desc: "Preparing final document", icon: "export" },
];

const agentLabels = ["Orchestrator", "Parser", "Researcher", "Matcher", "Writer", "Reviewer"];

function StageIcon({ icon, size = 18 }: { icon: string; size?: number }) {
  const vb = "0 0 24 24";
  if (icon === "upload")
    return (
      <svg width={size} height={size} viewBox={vb} fill="none">
        <path d="M12 15V3M8 7l4-4 4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M4 17v2a2 2 0 002 2h12a2 2 0 002-2v-2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    );
  if (icon === "doc")
    return (
      <svg width={size} height={size} viewBox={vb} fill="none">
        <path d="M6 3h9l4 4v14H6V3Z" stroke="currentColor" strokeWidth="1.5" />
        <path d="M15 3v4h4M9 12h6M9 16h4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      </svg>
    );
  if (icon === "research")
    return (
      <svg width={size} height={size} viewBox={vb} fill="none">
        <circle cx="11" cy="11" r="6" stroke="currentColor" strokeWidth="1.5" />
        <path d="M15.5 15.5L20 20" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      </svg>
    );
  if (icon === "match")
    return (
      <svg width={size} height={size} viewBox={vb} fill="none">
        <rect x="3" y="3" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.4" />
        <rect x="14" y="3" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.4" />
        <rect x="3" y="14" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.4" />
        <rect x="14" y="14" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.4" />
        <path d="M10 6.5h4M6.5 10v4M17.5 10v4M10 17.5h4" stroke="#D4A84F" strokeWidth="1.4" strokeLinecap="round" />
      </svg>
    );
  if (icon === "write")
    return (
      <svg width={size} height={size} viewBox={vb} fill="none">
        <path d="M3 21l4-1 13-13-3-3L4 17l-1 4Z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
        <path d="M15 6l3 3" stroke="currentColor" strokeWidth="1.4" />
      </svg>
    );
  if (icon === "shield")
    return (
      <svg width={size} height={size} viewBox={vb} fill="none">
        <path d="M12 3l8 3v6c0 4.5-3.5 8-8 9-4.5-1-8-4.5-8-9V6l8-3Z" stroke="currentColor" strokeWidth="1.4" />
        <path d="M8 12l3 3 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  // export / PDF
  return (
    <svg width={size} height={size} viewBox={vb} fill="none">
      <path d="M6 3h9l4 4v14H6V3Z" stroke="currentColor" strokeWidth="1.4" />
      <text x="12" y="18" textAnchor="middle" fontSize="5.5" fontWeight="700" fill="currentColor" fontFamily="monospace">PDF</text>
    </svg>
  );
}

function ArrowRight() {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
      <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
        <path d="M2 8h12M9 4l4 4-4 4" stroke="#D4A84F" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  );
}

function ArrowLeft() {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
      <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
        <path d="M14 8H2M7 4L3 8l4 4" stroke="#D4A84F" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  );
}

function ArrowDown() {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%" }}>
      <svg width="14" height="18" viewBox="0 0 14 20" fill="none">
        <path d="M7 2v16M3 13l4 5 4-5" stroke="#D4A84F" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  );
}

function StageCard({ stage, stageIdx, active }: { stage: Stage; stageIdx: number; active: number }) {
  const isDone = stageIdx < active;
  const isActive = stageIdx === active;
  const progress = isDone ? 100 : isActive ? 84 : -1;

  return (
    <div
      style={{
        position: "relative",
        padding: "14px 13px 16px",
        background: isActive ? "rgba(247,231,193,0.38)" : "#fff",
        border: `1px solid ${isActive ? "rgba(212,168,79,0.6)" : "rgba(0,0,0,0.07)"}`,
        borderRadius: 14,
        boxShadow: isActive
          ? "0 2px 14px rgba(212,168,79,0.18)"
          : "0 1px 4px rgba(0,0,0,0.05)",
        minHeight: 148,
        transition: "border-color .4s, background .4s, box-shadow .4s",
      }}
    >
      {/* Number badge + gold dot */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
        <span
          style={{
            fontSize: 11,
            fontWeight: 700,
            color: "var(--forest-deep)",
            background: "rgba(47,93,80,0.09)",
            padding: "2px 5px",
            borderRadius: 4,
            fontFamily: "var(--f-mono)",
            lineHeight: 1.4,
          }}
        >
          {stage.n}
        </span>
        {isActive && (
          <span
            style={{
              width: 6,
              height: 6,
              borderRadius: "50%",
              background: "#D4A84F",
              display: "block",
              flexShrink: 0,
            }}
          />
        )}
      </div>

      {/* Icon */}
      <div style={{ color: isActive ? "#B88A2F" : "var(--forest)", marginBottom: 8 }}>
        <StageIcon icon={stage.icon} size={22} />
      </div>

      {/* Label */}
      <div
        style={{
          fontFamily: "var(--f-display)",
          fontWeight: 600,
          fontSize: 13.5,
          color: isActive ? "var(--forest-deep)" : "var(--ink)",
          lineHeight: 1.3,
          marginBottom: 4,
        }}
      >
        {stage.label}
      </div>

      {/* Desc */}
      <div style={{ fontSize: 11.5, color: "var(--ni-muted)", marginBottom: 10, lineHeight: 1.3 }}>
        {stage.desc}
      </div>

      {/* File chip for stage 01 */}
      {stageIdx === 0 && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 4,
            padding: "4px 7px",
            background: "rgba(47,93,80,0.06)",
            borderRadius: 5,
            marginBottom: 9,
          }}
        >
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none">
            <path d="M6 3h9l4 4v14H6V3Z" stroke="#2F5D50" strokeWidth="1.5" />
          </svg>
          <span style={{ fontSize: 10, color: "var(--forest-deep)", fontFamily: "var(--f-mono)", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            Hospital_RFP.pdf
          </span>
          <span
            style={{
              width: 18,
              height: 18,
              borderRadius: "50%",
              background: "#22c55e",
              display: "grid",
              placeItems: "center",
              flexShrink: 0,
            }}
          >
            <svg width="7" height="7" viewBox="0 0 10 10">
              <path d="M2 5l2.5 2.5L8 3" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
        </div>
      )}

      {/* Progress bar or Pending */}
      {progress === -1 ? (
        <div style={{ fontSize: 11, color: "var(--ni-muted)", fontFamily: "var(--f-mono)" }}>Pending</div>
      ) : (
        <div>
          <div style={{ height: 4, background: "rgba(47,93,80,0.09)", borderRadius: 2, overflow: "hidden" }}>
            <div
              style={{
                height: "100%",
                width: `${progress}%`,
                background: "linear-gradient(90deg, #E8C97A 0%, #C99437 100%)",
                borderRadius: 2,
                transition: "width .6s ease",
              }}
            />
          </div>
          <div
            style={{
              fontSize: 11,
              color: "var(--gold-deep)",
              fontWeight: 700,
              marginTop: 4,
              fontFamily: "var(--f-mono)",
            }}
          >
            {progress}%
          </div>
        </div>
      )}
    </div>
  );
}

export default function WorkflowViz() {
  const [active, setActive] = useState(4); // Start at stage 4 (05 Proposal Writing)

  useEffect(() => {
    const interval = setInterval(() => {
      setActive((prev) => (prev + 1) % stages.length);
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  const activeAgent = Math.min(active, agentLabels.length - 1);

  return (
    <div style={{ animation: "drift 8s ease-in-out infinite" }}>
      <div
        className="ni-glass"
        style={{ padding: "22px 20px 20px", position: "relative", overflow: "hidden", borderRadius: 18 }}
      >
        {/* Gold radial glow */}
        <div
          style={{
            position: "absolute",
            top: -50,
            right: -50,
            width: 180,
            height: 180,
            background: "radial-gradient(circle, rgba(247,231,193,0.55) 0%, transparent 65%)",
            pointerEvents: "none",
          }}
        />

        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16, position: "relative" }}>
          <div>
            <div style={{ fontFamily: "var(--f-display)", fontWeight: 600, fontSize: 16, color: "var(--ink)" }}>
              Live AI Workflow
            </div>
            <div style={{ fontSize: 12, color: "var(--ink-soft)", marginTop: 2 }}>Generating Proposal</div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {/* Bar chart icon */}
            <svg width="16" height="14" viewBox="0 0 16 14" fill="none">
              <rect x="0" y="9" width="3" height="5" rx="0.5" fill="var(--forest)" opacity="0.35" />
              <rect x="4.5" y="5" width="3" height="9" rx="0.5" fill="var(--forest)" opacity="0.55" />
              <rect x="9" y="1" width="3" height="13" rx="0.5" fill="var(--forest)" opacity="0.75" />
              <rect x="13.5" y="3" width="2.5" height="11" rx="0.5" fill="var(--forest)" />
            </svg>
            {/* In Progress badge */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 5,
                padding: "4px 10px",
                background: "rgba(47,93,80,0.08)",
                borderRadius: 999,
                fontSize: 12,
                fontWeight: 600,
                color: "var(--forest-deep)",
              }}
            >
              <span
                style={{
                  width: 5,
                  height: 5,
                  borderRadius: "50%",
                  background: "#22c55e",
                  display: "block",
                  animation: "pulseGold 1.5s ease-in-out infinite",
                }}
              />
              In Progress
            </div>
          </div>
        </div>

        {/* Stage grid: 7-column, 3-row */}
        {/* gridTemplateColumns: [card][arrow][card][arrow][card][arrow][card] */}
        {/* Row 1: 01(col1), →(col2), 02(col3), →(col4), 03(col5), →(col6), 04(col7) */}
        {/* Connector row2: ↓ at col7 only */}
        {/* Row 2 (row3): 07(col3), ←(col4), 06(col5), ←(col6), 05(col7) — col1/2 empty */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 15px 1fr 15px 1fr 15px 1fr",
            gridTemplateRows: "auto 28px auto",
            rowGap: 6,
            columnGap: 0,
            alignItems: "center",
            marginBottom: 12,
          }}
        >
          {/* Row 1 */}
          <div style={{ gridColumn: "1", gridRow: "1" }}>
            <StageCard stage={stages[0]} stageIdx={0} active={active} />
          </div>
          <div style={{ gridColumn: "2", gridRow: "1" }}>
            <ArrowRight />
          </div>
          <div style={{ gridColumn: "3", gridRow: "1" }}>
            <StageCard stage={stages[1]} stageIdx={1} active={active} />
          </div>
          <div style={{ gridColumn: "4", gridRow: "1" }}>
            <ArrowRight />
          </div>
          <div style={{ gridColumn: "5", gridRow: "1" }}>
            <StageCard stage={stages[2]} stageIdx={2} active={active} />
          </div>
          <div style={{ gridColumn: "6", gridRow: "1" }}>
            <ArrowRight />
          </div>
          <div style={{ gridColumn: "7", gridRow: "1" }}>
            <StageCard stage={stages[3]} stageIdx={3} active={active} />
          </div>

          {/* Connector: down arrow at col7, spanning into row2 */}
          <div style={{ gridColumn: "7", gridRow: "2", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <ArrowDown />
          </div>

          {/* Row 2: 07 at col3, ← at col4, 06 at col5, ← at col6, 05 at col7 */}
          {/* cols 1–2 are implicitly empty */}
          <div style={{ gridColumn: "3", gridRow: "3" }}>
            <StageCard stage={stages[6]} stageIdx={6} active={active} />
          </div>
          <div style={{ gridColumn: "4", gridRow: "3" }}>
            <ArrowLeft />
          </div>
          <div style={{ gridColumn: "5", gridRow: "3" }}>
            <StageCard stage={stages[5]} stageIdx={5} active={active} />
          </div>
          <div style={{ gridColumn: "6", gridRow: "3" }}>
            <ArrowLeft />
          </div>
          <div style={{ gridColumn: "7", gridRow: "3" }}>
            <StageCard stage={stages[4]} stageIdx={4} active={active} />
          </div>
        </div>

        {/* Bottom panels */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          {/* Proposal Preview */}
          <div
            style={{
              padding: "14px 13px",
              background: "#fff",
              border: "1px solid rgba(0,0,0,0.07)",
              borderRadius: 12,
              boxShadow: "0 1px 4px rgba(0,0,0,0.05)",
            }}
          >
            <div
              style={{
                fontFamily: "var(--f-display)",
                fontWeight: 600,
                fontSize: 13,
                color: "var(--ink)",
                marginBottom: 12,
              }}
            >
              Proposal Preview
            </div>
            <div style={{ display: "flex", alignItems: "flex-start", gap: 9 }}>
              {/* Mini doc with star */}
              <div style={{ position: "relative", flexShrink: 0 }}>
                <div
                  style={{
                    width: 30,
                    height: 40,
                    background: "#fff",
                    border: "1px solid rgba(47,93,80,0.15)",
                    borderRadius: 4,
                    boxShadow: "0 2px 6px rgba(0,0,0,0.08)",
                    padding: "4px 3px",
                    display: "flex",
                    flexDirection: "column",
                    gap: 2,
                  }}
                >
                  {[80, 55, 70, 55, 80, 60].map((w, i) => (
                    <div
                      key={i}
                      style={{
                        height: 1.5,
                        background: `rgba(47,93,80,${0.12 + i * 0.04})`,
                        borderRadius: 1,
                        width: `${w}%`,
                      }}
                    />
                  ))}
                </div>
                <div
                  style={{
                    position: "absolute",
                    top: -5,
                    right: -5,
                    width: 13,
                    height: 13,
                    borderRadius: "50%",
                    background: "#D4A84F",
                    display: "grid",
                    placeItems: "center",
                  }}
                >
                  <svg width="7" height="7" viewBox="0 0 8 8">
                    <path d="M4 1l.8 2H7L5.4 4.3l.6 2.2L4 5l-2 1.5.6-2.2L1 3h2.2L4 1Z" fill="#fff" />
                  </svg>
                </div>
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontFamily: "var(--f-display)",
                    fontWeight: 600,
                    fontSize: 11,
                    color: "var(--ink)",
                    marginBottom: 5,
                  }}
                >
                  Executive Summary
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 2, marginBottom: 7 }}>
                  {[85, 60, 75, 50].map((w, i) => (
                    <div
                      key={i}
                      style={{
                        height: 2,
                        background: `rgba(47,93,80,${0.1 + i * 0.03})`,
                        borderRadius: 1,
                        width: `${w}%`,
                      }}
                    />
                  ))}
                </div>
                <div style={{ fontSize: 11, color: "var(--ni-muted)", marginBottom: 5 }}>
                  10 of 12 sections generated
                </div>
                <div style={{ height: 4, background: "rgba(47,93,80,0.08)", borderRadius: 2 }}>
                  <div style={{ height: "100%", width: "83%", background: "var(--forest)", borderRadius: 2 }} />
                </div>
              </div>
            </div>
          </div>

          {/* AI Agents Active */}
          <div
            style={{
              padding: "14px 13px",
              background: "#fff",
              border: "1px solid rgba(0,0,0,0.07)",
              borderRadius: 12,
              boxShadow: "0 1px 4px rgba(0,0,0,0.05)",
            }}
          >
            <div
              style={{
                fontFamily: "var(--f-display)",
                fontWeight: 600,
                fontSize: 13,
                color: "var(--ink)",
                marginBottom: 12,
              }}
            >
              AI Agents Active
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              {agentLabels.map((label, i) => {
                const isCurrent = i === activeAgent;
                const agentIcons = ["shield", "doc", "research", "match", "write", "shield"];
                return (
                  <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3 }}>
                    <div
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: "50%",
                        background: isCurrent
                          ? "linear-gradient(180deg, #FBF1D8, #E0B663)"
                          : "rgba(47,93,80,0.07)",
                        border: `1px solid ${isCurrent ? "rgba(212,168,79,0.65)" : "rgba(47,93,80,0.1)"}`,
                        display: "grid",
                        placeItems: "center",
                        color: isCurrent ? "#B88A2F" : "var(--forest)",
                        boxShadow: isCurrent ? "0 0 0 3px rgba(247,231,193,0.5)" : "none",
                        transition: "all .4s ease",
                      }}
                    >
                      <StageIcon icon={agentIcons[i]} size={14} />
                    </div>
                    <span
                      style={{
                        fontSize: 9.5,
                        color: isCurrent ? "var(--forest-deep)" : "var(--ni-muted)",
                        fontWeight: isCurrent ? 600 : 400,
                        textAlign: "center",
                        lineHeight: 1.2,
                      }}
                    >
                      {label}
                    </span>
                    {isCurrent && (
                      <span
                        style={{
                          width: 5,
                          height: 5,
                          borderRadius: "50%",
                          background: "#D4A84F",
                          display: "block",
                          animation: "pulseGold 1s ease-in-out infinite",
                        }}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
