export default function FinalCTA() {
  return (
    <section className="ni-section" id="cta" style={{ paddingBottom: 80 }}>
      <div className="ni-container">
        <div style={{ position: "relative", padding: "72px 56px", borderRadius: 28, background: "linear-gradient(135deg, var(--forest-deep) 0%, var(--forest) 60%, #3d7565 100%)", color: "#fff", overflow: "hidden", boxShadow: "0 30px 80px rgba(35,69,57,0.30)" }}>
          {/* Radial accents */}
          <div style={{ position: "absolute", top: -120, right: -120, width: 460, height: 460, background: "radial-gradient(circle, rgba(212,168,79,0.40), transparent 65%)", pointerEvents: "none" }} />
          <div style={{ position: "absolute", bottom: -100, left: -100, width: 360, height: 360, background: "radial-gradient(circle, rgba(247,231,193,0.18), transparent 65%)", pointerEvents: "none" }} />
          {/* Wave lines */}
          <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%", opacity: 0.18 }} viewBox="0 0 1200 400" preserveAspectRatio="none">
            {[...Array(12)].map((_, i) => (
              <path key={i} d={`M -50 ${i * 32 + 40} Q 300 ${i * 32 + 10}, 600 ${i * 32 + 60} T 1300 ${i * 32 + 30}`} stroke="rgba(212,168,79,0.5)" strokeWidth="0.6" fill="none" />
            ))}
          </svg>

          <div style={{ position: "relative", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 40, flexWrap: "wrap" }}>
            <div style={{ maxWidth: 660 }}>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "8px 16px", background: "rgba(255,255,255,0.10)", border: "1px solid rgba(212,168,79,0.30)", borderRadius: 999, fontSize: 11, fontWeight: 600, letterSpacing: "0.14em", textTransform: "uppercase" as const, color: "var(--champagne)" }}>
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--gold)", boxShadow: "0 0 8px var(--gold)" }} />
                Ready in 20 minutes
              </span>
              <h2 style={{ fontSize: "clamp(36px, 4.5vw, 60px)", lineHeight: 1.05, letterSpacing: "-0.03em", marginTop: 22, marginBottom: 18, color: "#fff" }}>
                Win the next RFP <span className="ni-text-gradient-gold">before</span> your competitors finish reading it.
              </h2>
              <p style={{ fontSize: 18, color: "rgba(255,255,255,0.78)", lineHeight: 1.55, maxWidth: 560 }}>
                Spin up your first proposal in under five minutes. No credit card. No infrastructure to install.
              </p>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <button className="ni-btn ni-btn-gold" style={{ padding: "16px 28px", fontSize: 16 }}>
                Start Free Trial
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
              <button className="ni-btn" style={{ padding: "16px 28px", background: "rgba(255,255,255,0.08)", color: "#fff", border: "1px solid rgba(255,255,255,0.18)", fontSize: 16 }}>
                Book a Demo
              </button>
              <div style={{ fontSize: 12, color: "rgba(255,255,255,0.55)", textAlign: "center" as const, marginTop: 4 }}>
                SOC 2 · Enterprise SSO · ISO 27001
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
