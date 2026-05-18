"use client";

const agentsList = [
  {
    n: "01",
    name: "Orchestrator Agent",
    role: "Root ADK Agent · Pipeline Manager",
    model: "gemini-3.1-pro-preview",
    desc: "Manages the entire pipeline. Creates session state, routes downstream agents, handles failures gracefully — the conductor that ensures all six instruments play in the right order.",
    icon: "shield",
  },
  {
    n: "02",
    name: "RFP Parser Agent",
    role: "Document Intelligence · Requirement Extractor",
    model: "gemini-3.1-flash-lite",
    desc: "Reads the entire RFP — no matter how long, no matter how messy — and extracts mandatory requirements, budget ceilings, timelines, evaluation criteria, and compliance flags.",
    icon: "doc",
  },
  {
    n: "03",
    name: "Client Research Agent",
    role: "Company Intelligence · Context Builder",
    model: "gemini-3.1-flash-lite",
    desc: "Researches the client's recent news, funding, leadership changes, product launches, and strategic priorities — so every proposal feels deeply informed.",
    icon: "research",
  },
  {
    n: "04",
    name: "Requirements Matcher Agent",
    role: "Capability Alignment · Proof Finder",
    model: "gemini-3.1-flash-lite",
    desc: "Compares what the client needs against what you actually offer. Mines your knowledge base for the strongest evidence and maps every requirement to a proof point.",
    icon: "match",
  },
  {
    n: "05",
    name: "Proposal Writer Agent",
    role: "Full Document Drafter · Section Builder",
    model: "gemini-3.1-pro-preview",
    desc: "The core creative agent. Writes the full proposal from Executive Summary through Pricing — every sentence written with this specific client in mind.",
    icon: "write",
  },
  {
    n: "06",
    name: "Quality Review & Export Agent",
    role: "Editor · Validator · PDF Generator",
    model: "gemini-3.1-flash-lite",
    desc: "Senior-editor pass. Validates every mandatory requirement is addressed, fixes conflicts, then exports a clean, branded PDF ready for submission.",
    icon: "export",
  },
];

const AgentIcon = ({ icon }: { icon: string }) => {
  if (icon === "shield")
    return (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <path d="M12 3l8 3v6c0 4.5-3.5 8-8 9-4.5-1-8-4.5-8-9V6l8-3Z" stroke="#2F5D50" strokeWidth="1.4" />
        <path d="M8 12l3 3 5-5" stroke="#2F5D50" strokeWidth="1.6" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  if (icon === "doc")
    return (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <path d="M6 3h9l4 4v14H6V3Z" stroke="#2F5D50" strokeWidth="1.4" />
        <path d="M15 3v4h4M9 12h6M9 16h6M9 8h3" stroke="#2F5D50" strokeWidth="1.4" strokeLinecap="round" />
      </svg>
    );
  if (icon === "research")
    return (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <circle cx="11" cy="11" r="6" stroke="#2F5D50" strokeWidth="1.4" />
        <path d="M15.5 15.5L20 20" stroke="#2F5D50" strokeWidth="1.6" strokeLinecap="round" />
        <path d="M8 11h6M11 8v6" stroke="#2F5D50" strokeWidth="1.2" strokeLinecap="round" />
      </svg>
    );
  if (icon === "match")
    return (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <rect x="3" y="3" width="7" height="7" rx="1.4" stroke="#2F5D50" strokeWidth="1.4" />
        <rect x="14" y="3" width="7" height="7" rx="1.4" stroke="#2F5D50" strokeWidth="1.4" />
        <rect x="3" y="14" width="7" height="7" rx="1.4" stroke="#2F5D50" strokeWidth="1.4" />
        <rect x="14" y="14" width="7" height="7" rx="1.4" stroke="#2F5D50" strokeWidth="1.4" />
        <path d="M10 6.5h4M6.5 10v4M17.5 10v4M10 17.5h4" stroke="#D4A84F" strokeWidth="1.4" strokeLinecap="round" />
      </svg>
    );
  if (icon === "write")
    return (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <path d="M3 21l4-1 13-13-3-3L4 17l-1 4Z" stroke="#2F5D50" strokeWidth="1.4" strokeLinejoin="round" />
        <path d="M15 6l3 3" stroke="#2F5D50" strokeWidth="1.4" />
      </svg>
    );
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <path d="M6 3h9l4 4v14H6V3Z" stroke="#2F5D50" strokeWidth="1.4" />
      <text x="12" y="18" textAnchor="middle" fontSize="6" fontWeight="700" fill="#2F5D50" fontFamily="var(--f-mono)">PDF</text>
    </svg>
  );
};

export default function Agents() {
  return (
    <section
      className="ni-section"
      id="agents"
      style={{
        background:
          "linear-gradient(180deg, transparent 0%, rgba(221,231,216,0.25) 30%, transparent 100%)",
      }}
    >
      <div className="ni-container">
        <div className="ni-section-head">
          <span className="ni-eyebrow">
            <span className="dot" />
            SIX SPECIALIZED AGENTS
          </span>
          <h2 style={{ marginTop: 18 }}>
            One pipeline. Six instruments.{" "}
            <span className="ni-text-gradient-gold">Played in perfect order.</span>
          </h2>
          <p>
            Each agent has one clearly defined job — and passes its structured output to the next,
            building your proposal layer by layer.
          </p>
        </div>

        <div
          className="grid-3col"
          style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 24 }}
        >
          {agentsList.map((a, i) => (
            <AgentCard key={i} a={a} />
          ))}
        </div>
      </div>
    </section>
  );
}

function AgentCard({ a }: { a: (typeof agentsList)[0] }) {
  return (
    <div
      style={{
        position: "relative",
        border: "1px solid var(--line-strong)",
        borderRadius: 20,
        padding: "24px 24px 26px",
        background: "#fff",
        overflow: "hidden",
        transition: "transform .35s cubic-bezier(.2,.7,.2,1), box-shadow .35s, border-color .35s",
        cursor: "default",
      }}
      onMouseEnter={(e) => {
        const el = e.currentTarget;
        el.style.transform = "translateY(-4px)";
        el.style.boxShadow = "0 24px 50px rgba(35,69,57,0.12)";
        el.style.borderColor = "rgba(212,168,79,0.4)";
        const glow = el.querySelector<HTMLElement>(".agent-glow");
        if (glow) glow.style.opacity = "1";
      }}
      onMouseLeave={(e) => {
        const el = e.currentTarget;
        el.style.transform = "translateY(0)";
        el.style.boxShadow = "none";
        el.style.borderColor = "var(--line-strong)";
        const glow = el.querySelector<HTMLElement>(".agent-glow");
        if (glow) glow.style.opacity = "0";
      }}
    >
      <div
        className="agent-glow"
        style={{
          position: "absolute",
          top: -60,
          right: -60,
          width: 180,
          height: 180,
          background: "radial-gradient(circle, rgba(247,231,193,0.40) 0%, transparent 60%)",
          pointerEvents: "none",
          opacity: 0,
          transition: "opacity .4s",
        }}
      />

      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          marginBottom: 18,
        }}
      >
        <div
          style={{
            width: 48,
            height: 48,
            borderRadius: 14,
            background: "linear-gradient(180deg, var(--sage-soft), var(--sage))",
            display: "grid",
            placeItems: "center",
            border: "1px solid rgba(47,93,80,0.12)",
          }}
        >
          <AgentIcon icon={a.icon} />
        </div>
        <span
          style={{
            fontFamily: "var(--f-display)",
            fontWeight: 600,
            fontSize: 13,
            color: "var(--gold-deep)",
            letterSpacing: "0.02em",
            background: "rgba(247,231,193,0.5)",
            padding: "4px 10px",
            borderRadius: 8,
          }}
        >
          {a.n}
        </span>
      </div>

      <h3 style={{ fontSize: 19, marginBottom: 4, color: "var(--ink)" }}>{a.name}</h3>
      <div
        style={{
          fontSize: 11,
          fontWeight: 600,
          color: "var(--forest)",
          textTransform: "uppercase",
          letterSpacing: "0.10em",
          marginBottom: 12,
        }}
      >
        {a.role}
      </div>
      <p style={{ fontSize: 14, lineHeight: 1.55, color: "var(--ink-soft)", marginBottom: 18 }}>
        {a.desc}
      </p>
      <div
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          padding: "5px 10px",
          background: "var(--ivory-warm)",
          borderRadius: 6,
          fontSize: 11,
          fontFamily: "var(--f-mono)",
          color: "var(--ink-soft)",
        }}
      >
        <span
          style={{
            width: 5,
            height: 5,
            borderRadius: "50%",
            background: "var(--gold)",
          }}
        />
        {a.model}
      </div>
    </div>
  );
}
