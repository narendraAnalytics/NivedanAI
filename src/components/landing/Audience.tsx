"use client";

const audiences = [
  { name: "Software Agencies", desc: "Agencies responding to 10–15 RFPs per month from enterprise clients, hospitals, government, and corporates.", price: "₹16,000 – ₹25,000 /mo", icon: "building" },
  { name: "Freelance Developers", desc: "Bidders on Upwork, Toptal, and direct clients who need professional proposals before competitors do.", price: "₹8,000 – ₹12,000 /mo", icon: "briefcase" },
  { name: "SaaS Sales Teams", desc: "Enterprise teams responding to security RFPs and Fortune 500 questionnaires. Each deal is worth crores.", price: "₹25,000 – ₹40,000 /mo", icon: "chart" },
  { name: "Consulting Firms", desc: "Management and IT consultants for whom proposal writing is the core business cost. Cut it by 90%.", price: "₹25,000 – ₹40,000 /mo", icon: "compass" },
  { name: "Construction & Infra", desc: "Companies bidding on complex government tenders — roads, buildings, utilities — where a missed clause disqualifies the bid.", price: "₹12,000 – ₹20,000 /mo", icon: "infra" },
  { name: "EdTech & Research", desc: "Universities and research orgs applying for government grants, partnerships, and EdTech procurement contracts.", price: "₹8,000 – ₹16,000 /mo", icon: "academic" },
];

const AudienceIcon = ({ icon }: { icon: string }) => {
  const icons: Record<string, React.ReactNode> = {
    building: <path d="M4 21V8l8-4 8 4v13M9 21v-7h6v7M9 11h6" stroke="#2F5D50" strokeWidth="1.4" fill="none" strokeLinejoin="round" />,
    briefcase: <><rect x="3" y="7" width="18" height="13" rx="2" stroke="#2F5D50" strokeWidth="1.4" fill="none" /><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M3 13h18" stroke="#2F5D50" strokeWidth="1.4" fill="none" /></>,
    chart: <path d="M4 20V4M4 20h16M8 16V10M12 16V7M16 16V13" stroke="#2F5D50" strokeWidth="1.4" fill="none" strokeLinecap="round" />,
    compass: <><circle cx="12" cy="12" r="9" stroke="#2F5D50" strokeWidth="1.4" fill="none" /><path d="M14.5 9.5L11 13l-2 5 5-2 3.5-3.5-3-3Z" stroke="#2F5D50" strokeWidth="1.4" fill="none" strokeLinejoin="round" /></>,
    infra: <path d="M3 20h18M6 20V10l6-5 6 5v10M10 20v-6h4v6" stroke="#2F5D50" strokeWidth="1.4" fill="none" strokeLinejoin="round" />,
    academic: <><path d="M2 9l10-5 10 5-10 5L2 9Z" stroke="#2F5D50" strokeWidth="1.4" fill="none" strokeLinejoin="round" /><path d="M6 11v5c0 1 3 3 6 3s6-2 6-3v-5M22 9v6" stroke="#2F5D50" strokeWidth="1.4" fill="none" strokeLinecap="round" /></>,
  };
  return <svg width="22" height="22" viewBox="0 0 24 24">{icons[icon]}</svg>;
};

export default function Audience() {
  return (
    <section className="ni-section" id="audience" style={{ background: "linear-gradient(180deg, transparent 0%, var(--ivory-warm) 50%, transparent 100%)" }}>
      <div className="ni-container">
        <div className="ni-section-head">
          <span className="ni-eyebrow"><span className="dot" />WHO USES NIVEDAN AI</span>
          <h2 style={{ marginTop: 18 }}>Built for teams that <span className="ni-text-gradient-gold">live and breathe RFPs.</span></h2>
          <p>From solo freelancers to consulting firms running 30 bids a quarter.</p>
        </div>
        <div className="grid-3col" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 22 }}>
          {audiences.map((a, i) => (
            <div key={i} style={{ padding: "24px 24px 26px", background: "#fff", border: "1px solid var(--line-strong)", borderRadius: 18, transition: "transform .3s, box-shadow .3s, border-color .3s", cursor: "default" }}
              onMouseEnter={(e) => { const el = e.currentTarget; el.style.transform = "translateY(-3px)"; el.style.boxShadow = "0 18px 38px rgba(35,69,57,0.10)"; el.style.borderColor = "rgba(212,168,79,0.35)"; }}
              onMouseLeave={(e) => { const el = e.currentTarget; el.style.transform = "translateY(0)"; el.style.boxShadow = "none"; el.style.borderColor = "var(--line-strong)"; }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
                <div style={{ width: 42, height: 42, borderRadius: 12, background: "var(--sage-soft)", border: "1px solid rgba(47,93,80,0.10)", display: "grid", placeItems: "center", flexShrink: 0 }}>
                  <AudienceIcon icon={a.icon} />
                </div>
                <h3 style={{ fontSize: 17 }}>{a.name}</h3>
              </div>
              <p style={{ fontSize: 14, color: "var(--ink-soft)", lineHeight: 1.5, marginBottom: 16 }}>{a.desc}</p>
              <div style={{ display: "inline-block", padding: "6px 12px", background: "var(--ivory-warm)", borderRadius: 6, fontSize: 12, fontWeight: 600, color: "var(--forest-deep)", fontFamily: "var(--f-mono)" }}>{a.price}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
