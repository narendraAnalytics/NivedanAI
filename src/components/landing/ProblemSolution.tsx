"use client";

const before = [
  "Sales managers read 40-page RFPs manually — 3 hours just to understand",
  "Writing starts from a blank Google Doc, copy-pasting from old proposals",
  "Pinging 5 teammates: \"What was that case study from last year?\"",
  "Proposal feels generic — barely addresses the client's situation",
  "Reviewer finds missing sections — entire rewrite needed",
  "8–20 hours of senior staff time wasted per proposal",
];

const after = [
  "Upload an RFP — agents parse every requirement in 60 seconds",
  "Client Research Agent finds the company's latest news and priorities",
  "Past case studies retrieved from your knowledge base automatically",
  "Every section is tailored to that specific client's context",
  "Quality Review Agent checks every requirement before export",
  "Complete proposal ready in 15–20 minutes — zero hours of human writing",
];

export default function ProblemSolution() {
  return (
    <section className="ni-section" id="problem">
      <div className="ni-container">
        <div className="ni-section-head">
          <span className="ni-eyebrow">
            <span className="dot" />
            THE REAL-WORLD PROBLEM
          </span>
          <h2 style={{ marginTop: 18 }}>
            The way teams write proposals today is{" "}
            <span className="ni-text-gradient-gold">broken.</span>
          </h2>
          <p>
            One software agency handles 15 RFPs a month — that's up to 300 hours of senior staff
            time, every month, on work that should take minutes.
          </p>
        </div>

        <div
          className="grid-2col"
          style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 28 }}
        >
          {/* BEFORE */}
          <div
            style={{
              background: "#fff",
              border: "1px solid var(--line-strong)",
              borderRadius: 22,
              padding: "28px 28px 32px",
              boxShadow: "var(--shadow-card)",
            }}
          >
            <div
              style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 18 }}
            >
              <span
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 10,
                  background: "rgba(180,70,50,0.08)",
                  color: "#b44632",
                  display: "grid",
                  placeItems: "center",
                  fontWeight: 700,
                  fontSize: 18,
                  flexShrink: 0,
                }}
              >
                ✕
              </span>
              <div>
                <div
                  style={{
                    fontSize: 11,
                    fontWeight: 600,
                    color: "var(--ni-muted)",
                    letterSpacing: "0.12em",
                    textTransform: "uppercase",
                  }}
                >
                  Before
                </div>
                <div
                  style={{
                    fontFamily: "var(--f-display)",
                    fontWeight: 600,
                    fontSize: 20,
                    color: "var(--ink)",
                  }}
                >
                  The status quo
                </div>
              </div>
            </div>
            <ul
              style={{
                listStyle: "none",
                padding: 0,
                margin: 0,
                display: "flex",
                flexDirection: "column",
                gap: 10,
              }}
            >
              {before.map((b, i) => (
                <li
                  key={i}
                  style={{
                    display: "flex",
                    gap: 12,
                    alignItems: "flex-start",
                    padding: "11px 13px",
                    background: "rgba(180,70,50,0.04)",
                    borderRadius: 10,
                    fontSize: 14,
                    color: "var(--ink-soft)",
                    lineHeight: 1.45,
                  }}
                >
                  <span
                    style={{
                      flexShrink: 0,
                      marginTop: 2,
                      width: 18,
                      height: 18,
                      borderRadius: 6,
                      background: "rgba(180,70,50,0.12)",
                      color: "#b44632",
                      display: "grid",
                      placeItems: "center",
                      fontSize: 10,
                      fontWeight: 700,
                    }}
                  >
                    ✕
                  </span>
                  {b}
                </li>
              ))}
            </ul>
          </div>

          {/* AFTER */}
          <div
            style={{
              position: "relative",
              background: "linear-gradient(180deg, #fff 0%, var(--sage-soft) 100%)",
              border: "1px solid rgba(47,93,80,0.18)",
              borderRadius: 22,
              padding: "28px 28px 32px",
              boxShadow: "0 12px 32px rgba(47,93,80,0.08)",
              overflow: "hidden",
            }}
          >
            {/* Gold glow */}
            <div
              style={{
                position: "absolute",
                top: -80,
                right: -80,
                width: 240,
                height: 240,
                background: "radial-gradient(circle, rgba(212,168,79,0.18), transparent 65%)",
                pointerEvents: "none",
              }}
            />
            <div
              style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 18 }}
            >
              <span
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 10,
                  background: "rgba(47,93,80,0.10)",
                  color: "var(--forest)",
                  display: "grid",
                  placeItems: "center",
                  fontWeight: 700,
                  fontSize: 18,
                  flexShrink: 0,
                }}
              >
                ✓
              </span>
              <div>
                <div
                  style={{
                    fontSize: 11,
                    fontWeight: 600,
                    color: "var(--ni-muted)",
                    letterSpacing: "0.12em",
                    textTransform: "uppercase",
                  }}
                >
                  After Nivedan AI
                </div>
                <div
                  style={{
                    fontFamily: "var(--f-display)",
                    fontWeight: 600,
                    fontSize: 20,
                    color: "var(--ink)",
                  }}
                >
                  Proposals in 20 minutes
                </div>
              </div>
            </div>
            <ul
              style={{
                listStyle: "none",
                padding: 0,
                margin: 0,
                display: "flex",
                flexDirection: "column",
                gap: 10,
              }}
            >
              {after.map((a, i) => (
                <li
                  key={i}
                  style={{
                    display: "flex",
                    gap: 12,
                    alignItems: "flex-start",
                    padding: "11px 13px",
                    background: "rgba(47,93,80,0.05)",
                    borderRadius: 10,
                    fontSize: 14,
                    color: "var(--ink-soft)",
                    lineHeight: 1.45,
                  }}
                >
                  <span
                    style={{
                      flexShrink: 0,
                      marginTop: 2,
                      width: 18,
                      height: 18,
                      borderRadius: 6,
                      background: "var(--forest)",
                      color: "#fff",
                      display: "grid",
                      placeItems: "center",
                      fontSize: 10,
                      fontWeight: 700,
                    }}
                  >
                    ✓
                  </span>
                  {a}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
