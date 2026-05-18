"use client";

const Logo = () => (
  <a href="#top" style={{ display: "flex", alignItems: "center", gap: 12 }}>
    <div style={{ width: 36, height: 36, borderRadius: 10, background: "linear-gradient(180deg, #FBF1D8 0%, #F0DBA6 100%)", display: "grid", placeItems: "center", border: "1px solid rgba(212,168,79,0.4)", flexShrink: 0 }}>
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
        <path d="M12 3 C 8 7, 8 13, 12 21 C 16 13, 16 7, 12 3 Z" fill="#2F5D50" />
        <path d="M5 9 C 4 13, 6 18, 11 20 C 9 16, 8 12, 5 9 Z" fill="#3d7565" />
        <path d="M19 9 C 20 13, 18 18, 13 20 C 15 16, 16 12, 19 9 Z" fill="#3d7565" />
        <circle cx="12" cy="11" r="1.4" fill="#D4A84F" />
      </svg>
    </div>
    <span style={{ fontFamily: "var(--f-display)", fontWeight: 700, fontSize: 17, color: "var(--ink)", letterSpacing: "-0.02em" }}>Nivedan AI</span>
  </a>
);

const SocialIcon = ({ name }: { name: string }) => {
  if (name === "twitter") return <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor"><path d="M12.5 1H15l-5.4 6.2L16 15h-5L7.2 10 2.7 15H.2l5.8-6.6L0 1h5.1l3.5 4.6L12.5 1Zm-.9 12.5h1.4L4.5 2.4H3L11.6 13.5Z" /></svg>;
  if (name === "linkedin") return <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor"><path d="M3 6h2.5v8H3V6Zm1.3-3.5a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3ZM7 6h2.4v1.2c.4-.7 1.4-1.3 2.6-1.3 2.8 0 3 1.8 3 4.2V14h-2.5v-3.6c0-.9 0-2-1.3-2s-1.5 1-1.5 2V14H7V6Z" /></svg>;
  return <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor"><path d="M8 0a8 8 0 0 0-2.5 15.6c.4.1.6-.2.6-.4v-1.4c-2.2.5-2.7-1-2.7-1-.4-.9-.9-1.2-.9-1.2-.7-.5 0-.5 0-.5.8 0 1.2.8 1.2.8.7 1.2 1.9.9 2.4.7.1-.5.3-.9.5-1.1-1.8-.2-3.6-.9-3.6-4 0-.9.3-1.6.8-2.1-.1-.2-.4-1 .1-2.1 0 0 .7-.2 2.2.8.6-.2 1.3-.3 2-.3.7 0 1.4.1 2 .3 1.5-1 2.2-.8 2.2-.8.5 1.1.2 1.9.1 2.1.5.5.8 1.2.8 2.1 0 3.1-1.8 3.8-3.6 4 .3.3.5.8.5 1.6V15c0 .2.2.5.6.4A8 8 0 0 0 8 0Z" /></svg>;
};

const cols = [
  { title: "Product", links: ["Overview", "Agents", "Pricing", "Integrations", "Changelog"] },
  { title: "Solutions", links: ["Agencies", "Consulting", "SaaS Sales", "Government RFPs", "Construction"] },
  { title: "Resources", links: ["Documentation", "API", "Case Studies", "Blog", "Templates"] },
  { title: "Company", links: ["About", "Customers", "Security", "Careers", "Contact"] },
];

export default function Footer() {
  return (
    <footer style={{ padding: "64px 0 32px", borderTop: "1px solid var(--line-strong)", background: "rgba(255,255,255,0.4)" }}>
      <div className="ni-container">
        <div className="footer-grid" style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr 1fr 1fr 1fr", gap: 40, marginBottom: 48 }}>
          <div>
            <Logo />
            <p style={{ marginTop: 18, fontSize: 14, color: "var(--ink-soft)", maxWidth: 320, lineHeight: 1.55 }}>
              &ldquo;निवेदन&rdquo; — the formal submission that wins contracts. Written by AI in 20 minutes, not 20 hours.
            </p>
            <div style={{ display: "flex", gap: 10, marginTop: 24 }}>
              {["twitter", "linkedin", "github"].map((s) => (
                <a key={s} href="#" style={{ width: 34, height: 34, borderRadius: 9, background: "rgba(255,255,255,0.6)", border: "1px solid var(--line-strong)", display: "grid", placeItems: "center", color: "var(--ink-soft)", transition: "all .2s" }}
                  onMouseEnter={(e) => { const el = e.currentTarget as HTMLElement; el.style.background = "var(--forest)"; el.style.color = "#fff"; el.style.borderColor = "var(--forest)"; }}
                  onMouseLeave={(e) => { const el = e.currentTarget as HTMLElement; el.style.background = "rgba(255,255,255,0.6)"; el.style.color = "var(--ink-soft)"; el.style.borderColor = "var(--line-strong)"; }}>
                  <SocialIcon name={s} />
                </a>
              ))}
            </div>
          </div>
          {cols.map((col, i) => (
            <div key={i}>
              <div style={{ fontFamily: "var(--f-display)", fontWeight: 600, fontSize: 14, color: "var(--ink)", marginBottom: 16 }}>{col.title}</div>
              <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 10 }}>
                {col.links.map((l, j) => (
                  <li key={j}>
                    <a href="#" style={{ fontSize: 13.5, color: "var(--ink-soft)", transition: "color .2s" }}
                      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "var(--forest-deep)"; }}
                      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "var(--ink-soft)"; }}>{l}</a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="ni-divider" />
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 16, marginTop: 28, fontSize: 12.5, color: "var(--ni-muted)" }}>
          <div>© 2026 Nivedan AI · Built with Google ADK + Gemini 3.1 + Next.js 16</div>
          <div style={{ display: "flex", gap: 24 }}>
            {["Privacy", "Terms", "Security", "Status"].map((l) => (
              <a key={l} href="#" style={{ color: "var(--ni-muted)" }}>{l}</a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
