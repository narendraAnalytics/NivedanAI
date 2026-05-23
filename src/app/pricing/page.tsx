"use client";

import { PricingTable } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useState, useEffect, useMemo } from "react";

/* ─── Data ─────────────────────────────────────────────────────────── */

const FEATURE_MATRIX = [
  {
    group: "Workflow",
    rows: [
      ["Monthly proposals", "1", "5", "unlimited"],
      ["Six-agent pipeline", true, true, true],
      ["Quality review & scoring", true, true, true],
      ["PDF export", "watermarked", "branded", "branded"],
    ],
  },
  {
    group: "Knowledge",
    rows: [
      ["Knowledge base size", "1 doc", "10 docs", "unlimited"],
      ["Auto-retrieval in proposals", true, true, true],
      ["Versioned proposal library", false, true, true],
    ],
  },
  {
    group: "Enterprise",
    rows: [
      ["Custom branding", false, true, true],
      ["SSO (Okta, Azure AD)", false, false, true],
      ["Audit logs & DPDP reports", false, false, true],
      ["Dedicated CSM", false, false, true],
      ["SLA & priority support", "community", "email & chat", "24×7 + named CSM"],
    ],
  },
];

const FAQS = [
  {
    q: "Can I switch plans anytime?",
    a: "Yes. Upgrades take effect immediately and you are billed pro-rata. Downgrades take effect at the end of your current billing cycle, so you keep your remaining quota.",
  },
  {
    q: 'What counts as a "proposal"?',
    a: "One full proposal is one RFP run end-to-end through all six agents and exported. Revisions on the same RFP within 48 hours do not count as additional proposals.",
  },
  {
    q: "Is my RFP data secure?",
    a: "Every workspace is logically isolated. Documents are encrypted at rest and in transit. Pro plans add SOC 2 Type II reports and DPDP-aligned audit logs.",
  },
  {
    q: "Do you offer custom enterprise terms?",
    a: "Yes — on the Pro plan we offer custom commercial terms, on-prem deployment, and dedicated infrastructure. Talk to our sales team to scope it out.",
  },
  {
    q: "What if I exceed my monthly quota?",
    a: "You will be notified when you hit 80%. Beyond your limit, additional proposals are billed at a per-proposal rate, or you can upgrade your plan at any time.",
  },
];

/* ─── Twinkles ──────────────────────────────────────────────────────── */

const Twinkles = () => {
  const dots = useMemo(
    () =>
      Array.from({ length: 18 }, () => ({
        top: Math.random() * 70 + 8,
        left: Math.random() * 96,
        size: 3 + Math.random() * 6,
        delay: Math.random() * 4,
        duration: 3 + Math.random() * 3,
      })),
    []
  );
  return (
    <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0 }}>
      {dots.map((d, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            top: `${d.top}%`,
            left: `${d.left}%`,
            width: d.size,
            height: d.size,
            background: "var(--gold)",
            borderRadius: "50%",
            opacity: 0.2,
            boxShadow: `0 0 ${d.size * 2}px rgba(212,168,79,0.55)`,
            animation: `twinkle ${d.duration}s ease-in-out ${d.delay}s infinite`,
          }}
        />
      ))}
    </div>
  );
};

/* ─── Logo ──────────────────────────────────────────────────────────── */

const Logo = () => (
  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
    <div
      style={{
        width: 40, height: 40, borderRadius: 12,
        background: "linear-gradient(180deg, #FBF1D8 0%, #F0DBA6 100%)",
        display: "grid", placeItems: "center",
        border: "1px solid rgba(212,168,79,0.4)",
        boxShadow: "0 4px 14px rgba(212,168,79,0.25), inset 0 1px 0 rgba(255,255,255,0.7)",
        flexShrink: 0,
      }}
    >
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <path d="M12 3 C 8 7, 8 13, 12 21 C 16 13, 16 7, 12 3 Z" fill="#2F5D50" />
        <path d="M5 9 C 4 13, 6 18, 11 20 C 9 16, 8 12, 5 9 Z" fill="#3d7565" />
        <path d="M19 9 C 20 13, 18 18, 13 20 C 15 16, 16 12, 19 9 Z" fill="#3d7565" />
        <circle cx="12" cy="11" r="1.4" fill="#D4A84F" />
      </svg>
    </div>
    <div style={{ display: "flex", flexDirection: "column", lineHeight: 1.15 }}>
      <span style={{
        fontFamily: "var(--f-display)", fontWeight: 700, fontSize: 19,
        color: "var(--ink)", letterSpacing: "-0.02em",
      }}>
        Nivedan AI
      </span>
      <span style={{
        fontFamily: "var(--f-body)", fontSize: 11,
        color: "var(--ni-muted)", letterSpacing: "0.04em", fontWeight: 500,
      }}>
        Autonomous Proposal Intelligence
      </span>
    </div>
  </div>
);

/* ─── Feature cell ──────────────────────────────────────────────────── */

const FeatureCell = ({ v }: { v: boolean | string }) => {
  if (v === true)
    return (
      <span style={{
        display: "inline-grid", placeItems: "center",
        width: 22, height: 22, borderRadius: "50%",
        background: "rgba(47,93,80,0.10)",
      }}>
        <svg width="12" height="12" viewBox="0 0 12 12">
          <path d="M2 6l2.5 2.5L10 3" stroke="var(--forest)" strokeWidth="1.8" fill="none"
            strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
    );
  if (v === false)
    return (
      <span style={{
        display: "inline-block",
        width: 18, height: 1.5,
        background: "var(--ni-muted)", borderRadius: 2, opacity: 0.5,
      }} />
    );
  return <span style={{ fontSize: 13, color: "var(--ink)", fontWeight: 500 }}>{v}</span>;
};

/* ─── Comparison table ──────────────────────────────────────────────── */

const ComparisonTable = () => (
  <div style={{
    background: "rgba(255,255,255,0.85)",
    border: "1px solid rgba(47,93,80,0.12)",
    borderRadius: 20,
    overflow: "hidden",
    backdropFilter: "blur(10px)",
    WebkitBackdropFilter: "blur(10px)",
    boxShadow: "0 8px 28px rgba(35,69,57,0.06)",
  }}>
    {/* Header row */}
    <div style={{
      display: "grid", gridTemplateColumns: "1.6fr 1fr 1fr 1fr",
      padding: "20px 28px",
      background: "linear-gradient(120deg, #234539 0%, #2F5D50 65%, #3d7565 100%)",
      color: "#fff",
    }}>
      <div style={{
        fontFamily: "var(--f-mono)", fontSize: 10, fontWeight: 600,
        color: "rgba(247,231,193,0.85)", letterSpacing: "0.16em",
        display: "flex", alignItems: "center",
      }}>
        COMPARE PLANS
      </div>
      {["free", "plus", "pro"].map((p, i) => (
        <div key={i} style={{
          fontFamily: "var(--f-display-serif)", fontWeight: 600, fontSize: 22,
          letterSpacing: "-0.02em",
          color: p === "plus" ? "#F7E7C1" : "#fff",
          textAlign: "center",
        }}>
          {p}
        </div>
      ))}
    </div>

    {FEATURE_MATRIX.map((group, gi) => (
      <div key={gi}>
        <div style={{
          padding: "14px 28px",
          background: "linear-gradient(120deg, #FFFCF4, #FBF1D8)",
          fontFamily: "var(--f-mono)", fontSize: 10.5, fontWeight: 600,
          color: "var(--gold-deep)", letterSpacing: "0.16em",
          borderTop: "1px solid rgba(47,93,80,0.08)",
        }}>
          {group.group.toUpperCase()}
        </div>
        {group.rows.map((row, ri) => (
          <div key={ri} className="compare-row" style={{
            display: "grid", gridTemplateColumns: "1.6fr 1fr 1fr 1fr",
            padding: "14px 28px",
            borderTop: "1px solid rgba(47,93,80,0.06)",
            alignItems: "center",
            transition: "background .2s",
          }}>
            <div style={{ fontSize: 14, color: "var(--ink)" }}>{row[0]}</div>
            <div style={{ textAlign: "center" }}><FeatureCell v={row[1] as boolean | string} /></div>
            <div style={{ textAlign: "center" }}>
              <span style={{
                display: "inline-block", padding: "2px 10px",
                background: row[2] !== false ? "rgba(212,168,79,0.10)" : "transparent",
                borderRadius: 8,
              }}>
                <FeatureCell v={row[2] as boolean | string} />
              </span>
            </div>
            <div style={{ textAlign: "center" }}><FeatureCell v={row[3] as boolean | string} /></div>
          </div>
        ))}
      </div>
    ))}
  </div>
);

/* ─── Enterprise strip ──────────────────────────────────────────────── */

const EnterpriseStrip = () => {
  const [hover, setHover] = useState(false);
  return (
    <div style={{
      position: "relative",
      padding: "36px 44px",
      borderRadius: 22,
      background: "linear-gradient(135deg, #234539 0%, #2F5D50 60%, #3d7565 100%)",
      color: "#fff",
      overflow: "hidden",
      boxShadow: "0 24px 60px rgba(35,69,57,0.25)",
    }}>
      <div style={{
        position: "absolute", top: -80, right: -80, width: 380, height: 380,
        background: "radial-gradient(circle, rgba(212,168,79,0.35), transparent 65%)",
        pointerEvents: "none",
      }} />
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        gap: 28, flexWrap: "wrap", position: "relative",
      }}>
        <div style={{ maxWidth: 620 }}>
          <div style={{
            fontFamily: "var(--f-mono)", fontSize: 10.5, fontWeight: 600,
            color: "#F7E7C1", letterSpacing: "0.16em", marginBottom: 10,
          }}>
            ENTERPRISE
          </div>
          <h3 style={{
            fontFamily: "var(--f-display-serif)", fontWeight: 600, fontSize: 28,
            lineHeight: 1.15, letterSpacing: "-0.02em",
            color: "#fff", marginBottom: 8,
          }}>
            Need higher volume, custom contracts, or on-prem deployment?
          </h3>
          <p style={{ fontSize: 15, color: "rgba(255,255,255,0.75)", lineHeight: 1.5 }}>
            We work with consulting firms and enterprises on custom commercial terms,
            dedicated infrastructure, and white-label deployments.
          </p>
        </div>
        <button
          onMouseEnter={() => setHover(true)}
          onMouseLeave={() => setHover(false)}
          style={{
            padding: "15px 26px",
            background: "linear-gradient(180deg, #E0B663 0%, #C99437 100%)",
            color: "#2A1E08",
            fontFamily: "var(--f-body)", fontWeight: 600, fontSize: 14,
            borderRadius: 12, border: "none", cursor: "pointer",
            boxShadow: "0 10px 24px rgba(212,168,79,0.40), inset 0 1px 0 rgba(255,255,255,0.45)",
            display: "inline-flex", alignItems: "center", gap: 10,
            transform: hover ? "translateY(-2px)" : "translateY(0)",
            transition: "transform .25s, box-shadow .25s",
          }}
        >
          talk to sales
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M2 7h10 M8 3l4 4-4 4" stroke="currentColor" strokeWidth="1.8"
              strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>
    </div>
  );
};

/* ─── FAQ ───────────────────────────────────────────────────────────── */

const FaqItem = ({
  q, a, idx, openIdx, setOpenIdx,
}: {
  q: string; a: string; idx: number; openIdx: number; setOpenIdx: (i: number) => void;
}) => {
  const isOpen = openIdx === idx;
  return (
    <div style={{
      background: "#fff",
      border: "1px solid rgba(47,93,80,0.12)",
      borderRadius: 14, overflow: "hidden",
      transition: "all .25s",
      boxShadow: isOpen ? "0 6px 18px rgba(35,69,57,0.07)" : "none",
    }}>
      <button
        onClick={() => setOpenIdx(isOpen ? -1 : idx)}
        style={{
          width: "100%", padding: "18px 22px",
          display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16,
          background: "transparent", border: "none", cursor: "pointer", textAlign: "left",
        }}
      >
        <span style={{
          fontFamily: "var(--f-display-serif)", fontWeight: 600, fontSize: 16,
          color: "var(--ink)", letterSpacing: "-0.01em",
        }}>
          {q}
        </span>
        <span style={{
          width: 28, height: 28, borderRadius: "50%",
          background: isOpen ? "var(--forest)" : "rgba(212,168,79,0.18)",
          color: isOpen ? "#fff" : "var(--gold-deep)",
          display: "grid", placeItems: "center", flexShrink: 0,
          transition: "all .25s",
        }}>
          <svg
            width="12" height="12" viewBox="0 0 12 12"
            style={{ transform: isOpen ? "rotate(45deg)" : "rotate(0)", transition: "transform .3s" }}
          >
            <path d="M6 2v8 M2 6h8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          </svg>
        </span>
      </button>
      <div style={{
        maxHeight: isOpen ? 200 : 0,
        opacity: isOpen ? 1 : 0,
        overflow: "hidden",
        transition: "max-height .35s cubic-bezier(.2,.7,.2,1), opacity .25s",
      }}>
        <div style={{
          padding: "0 22px 20px",
          fontSize: 14, color: "var(--ink-soft)", lineHeight: 1.6,
        }}>
          {a}
        </div>
      </div>
    </div>
  );
};

const Faq = () => {
  const [openIdx, setOpenIdx] = useState(0);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12, maxWidth: 760, margin: "0 auto" }}>
      {FAQS.map((f, i) => (
        <FaqItem key={i} idx={i} q={f.q} a={f.a} openIdx={openIdx} setOpenIdx={setOpenIdx} />
      ))}
    </div>
  );
};

/* ─── Clerk appearance ──────────────────────────────────────────────── */

const nivedanAppearance = {
  variables: {
    colorPrimary: "#2F5D50",
    colorBackground: "transparent",
    colorText: "#1A2420",
    colorTextSecondary: "#8A958F",
    colorNeutral: "#4A5550",
    fontFamily: "var(--f-body), Inter, system-ui, sans-serif",
    borderRadius: "14px",
    spacingUnit: "1rem",
  },
  elements: {
    pricingTable: { gap: "24px" },

    pricingTableCard: {
      background: "linear-gradient(180deg, rgba(255,255,255,0.90) 0%, rgba(255,255,255,0.68) 100%)",
      border: "1px solid rgba(255,255,255,0.80)",
      boxShadow: "0 2px 6px rgba(35,69,57,0.05), 0 20px 56px rgba(35,69,57,0.09)",
      backdropFilter: "blur(20px) saturate(140%)",
      WebkitBackdropFilter: "blur(20px) saturate(140%)",
      borderRadius: "20px",
      padding: "36px 32px",
      transition: "transform 0.30s cubic-bezier(0.2,0.7,0.2,1), box-shadow 0.30s",
    },
    "pricingTableCard:hover": {
      transform: "translateY(-4px)",
      boxShadow: "0 4px 12px rgba(35,69,57,0.08), 0 28px 70px rgba(35,69,57,0.14)",
    },

    pricingTableCardHighlighted: {
      background: "linear-gradient(160deg, #2F5D50 0%, #234539 100%)",
      border: "1px solid rgba(212,168,79,0.38)",
      boxShadow: "0 0 0 1px rgba(212,168,79,0.18), 0 24px 64px rgba(35,69,57,0.28)",
      transform: "translateY(-8px)",
      color: "#fff",
      borderRadius: "20px",
      padding: "36px 32px",
    },
    "pricingTableCardHighlighted:hover": {
      transform: "translateY(-12px)",
      boxShadow: "0 0 0 1px rgba(212,168,79,0.30), 0 32px 80px rgba(35,69,57,0.34)",
    },

    pricingTableCardTitle: {
      fontFamily: "var(--f-display), Sora, system-ui",
      fontWeight: 700,
      letterSpacing: "-0.02em",
      fontSize: "22px",
      color: "#D4A84F",
      textTransform: "none",
    },
    pricingTableCardHighlightedTitle: {
      color: "#F7E7C1",
      textTransform: "none",
    },

    pricingTableCardPrice: {
      fontFamily: "var(--f-display), Sora, system-ui",
      fontWeight: 700,
      letterSpacing: "-0.04em",
      fontSize: "52px",
      lineHeight: "1",
    },
    pricingTableCardPricePeriod: {
      fontSize: "14px",
      color: "#8A958F",
    },
    pricingTableCardDescription: {
      fontSize: "13.5px",
      color: "#8A958F",
      lineHeight: "1.5",
    },
    pricingTableCardDivider: {
      background: "rgba(47,93,80,0.08)",
      height: "1px",
      margin: "20px 0",
    },
    pricingTableCardFeatureItem: {
      fontSize: "14px",
      color: "#1A2420",
      lineHeight: "1.5",
      gap: "10px",
    },
    pricingTableCardFeatureItemIcon: {
      color: "#2F5D50",
      width: "16px",
      height: "16px",
    },

    pricingTableCardButton: {
      background: "linear-gradient(180deg, #E0B663 0%, #C99437 100%)",
      color: "#2A1E08",
      fontFamily: "var(--f-body), Inter, system-ui",
      fontWeight: 600,
      fontSize: "14px",
      boxShadow: "0 6px 18px rgba(212,168,79,0.40), inset 0 1px 0 rgba(255,255,255,0.45)",
      border: "none",
      borderRadius: "12px",
      padding: "13px 20px",
      width: "100%",
      transition: "transform 0.25s cubic-bezier(0.2,0.7,0.2,1), box-shadow 0.25s",
    },
    "pricingTableCardButton:hover": {
      transform: "translateY(-1px)",
      boxShadow: "0 10px 28px rgba(212,168,79,0.55), inset 0 1px 0 rgba(255,255,255,0.45)",
    },

    pricingTableCardHighlightedButton: {
      background: "linear-gradient(180deg, #E0B663 0%, #C99437 100%)",
      color: "#2A1E08",
      fontFamily: "var(--f-body), Inter, system-ui",
      fontWeight: 700,
      fontSize: "14px",
      boxShadow: "0 8px 24px rgba(212,168,79,0.50), inset 0 1px 0 rgba(255,255,255,0.45)",
      border: "none",
      borderRadius: "12px",
      padding: "13px 20px",
      width: "100%",
    },

    pricingTableCardButtonDisabled: {
      background: "rgba(255,255,255,0.55)",
      border: "1px solid rgba(47,93,80,0.16)",
      color: "#8A958F",
      cursor: "default",
      boxShadow: "none",
      borderRadius: "12px",
      fontWeight: 500,
    },

    pricingTableCardBadge: {
      background: "linear-gradient(135deg, #E0B663, #C99437)",
      color: "#2A1E08",
      fontWeight: 700,
      fontSize: "10.5px",
      letterSpacing: "0.10em",
      borderRadius: "999px",
      padding: "4px 12px",
    },

    pricingTableToggleContainer: {
      background: "rgba(255,255,255,0.75)",
      border: "1px solid rgba(47,93,80,0.12)",
      borderRadius: "999px",
      padding: "5px 5px 5px 14px",
      boxShadow: "0 2px 10px rgba(35,69,57,0.06)",
      display: "inline-flex",
      alignItems: "center",
      gap: "12px",
      marginBottom: "48px",
    },
    pricingTableToggle: {
      background: "#2F5D50",
      borderRadius: "999px",
      width: "44px",
      height: "24px",
      minWidth: "44px",
      boxShadow: "inset 0 1px 3px rgba(0,0,0,0.22), 0 0 0 2px rgba(47,93,80,0.15)",
      border: "none",
      cursor: "pointer",
      flexShrink: 0,
    },
    pricingTableToggleThumb: {
      width: "18px",
      height: "18px",
      borderRadius: "50%",
      background: "#ffffff",
      boxShadow: "0 1px 5px rgba(0,0,0,0.28), 0 0 0 1px rgba(255,255,255,0.6)",
    },
    pricingTableToggleLabel: {
      fontFamily: "var(--f-body)",
      fontSize: "13.5px",
      fontWeight: 500,
      color: "#1A2420",
    },
    pricingTableToggleSavingsBadge: {
      background: "linear-gradient(135deg, #E0B663, #C99437)",
      color: "#2A1E08",
      fontWeight: 700,
      fontSize: "11px",
      letterSpacing: "0.06em",
      borderRadius: "999px",
      padding: "3px 9px",
    },
  },
};

/* ─── Page ──────────────────────────────────────────────────────────── */

export default function PricingPage() {
  const router = useRouter();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div style={{ position: "relative", minHeight: "100vh", fontFamily: "var(--f-body)" }}>

      {/* Fixed background */}
      <div style={{
        position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none",
        background: `
          radial-gradient(1100px 600px at 90% -10%, rgba(247,231,193,0.60) 0%, transparent 55%),
          radial-gradient(900px 600px at -5% 30%, rgba(221,231,216,0.40) 0%, transparent 55%),
          radial-gradient(700px 500px at 70% 90%, rgba(247,231,193,0.40) 0%, transparent 55%),
          linear-gradient(180deg, #FFFCF4 0%, #FAF7F2 100%)
        `,
      }} />
      <Twinkles />

      {/* Sticky header */}
      <header style={{
        position: "sticky", top: 0, zIndex: 50,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "14px 48px",
        background: scrolled ? "rgba(255,252,244,0.92)" : "rgba(255,252,244,0.65)",
        borderBottom: scrolled ? "1px solid rgba(212,168,79,0.18)" : "1px solid transparent",
        backdropFilter: "blur(18px) saturate(140%)",
        WebkitBackdropFilter: "blur(18px) saturate(140%)",
        transition: "all .35s ease",
      }}>
        <BackButton onClick={() => router.push("/")} />
        <Logo />
        <div style={{ width: 130 }} />
      </header>

      {/* Main */}
      <main style={{
        position: "relative", zIndex: 1,
        maxWidth: 1240, margin: "0 auto",
        padding: "56px 48px 100px",
        animation: "pageEnter 0.7s cubic-bezier(0.16,1,0.3,1)",
      }}>

        {/* Hero */}
        <div style={{ textAlign: "center", marginBottom: 40 }}>
          <span style={{
            display: "inline-flex", alignItems: "center", gap: 8,
            padding: "6px 16px",
            background: "linear-gradient(120deg, #FBF1D8, #F7E7C1)",
            border: "1px solid rgba(212,168,79,0.4)",
            borderRadius: 999,
            fontFamily: "var(--f-mono)",
            fontSize: 10, fontWeight: 600,
            color: "var(--gold-deep)", letterSpacing: "0.18em", textTransform: "uppercase",
            marginBottom: 24,
            boxShadow: "0 4px 14px rgba(212,168,79,0.18)",
          }}>
            <span style={{
              width: 6, height: 6, borderRadius: "50%",
              background: "var(--gold)",
              boxShadow: "0 0 8px var(--gold)",
              animation: "pulseGold 1.6s ease-in-out infinite",
            }} />
            simple pricing
          </span>

          <h1 style={{
            fontFamily: "var(--f-display)", fontWeight: 700,
            fontSize: "clamp(40px, 5.4vw, 68px)",
            letterSpacing: "-0.03em", lineHeight: 1.02,
            color: "var(--ink)", marginBottom: 18,
          }}>
            choose your{" "}
            <span style={{
              fontFamily: "var(--f-display-serif)",
              fontStyle: "italic",
              color: "var(--gold-deep)",
            }}>
              workflow plan
            </span>
          </h1>

          <p style={{
            fontSize: 17, color: "var(--ink-soft)",
            maxWidth: 540, margin: "0 auto", lineHeight: 1.55,
          }}>
            Turn RFPs into submission-ready proposals in minutes.
            Start free, scale as your pipeline grows.
          </p>
        </div>

        {/* Clerk PricingTable (handles billing toggle + all plan cards) */}
        <PricingTable appearance={nivedanAppearance} />

        {/* Comparison table */}
        <div style={{ marginBottom: 80, marginTop: 20 }}>
          <div style={{ textAlign: "center", marginBottom: 32 }}>
            <h2 style={{
              fontFamily: "var(--f-display-serif)", fontWeight: 600,
              fontSize: "clamp(28px, 3.4vw, 40px)", letterSpacing: "-0.02em",
              color: "var(--ink)", marginBottom: 10,
            }}>
              compare features{" "}
              <span style={{ color: "var(--gold-deep)", fontStyle: "italic" }}>side by side</span>
            </h2>
            <p style={{ fontSize: 15, color: "var(--ink-soft)" }}>
              Every plan ships with the full six-agent pipeline. Differences are scale and enterprise controls.
            </p>
          </div>
          <ComparisonTable />
        </div>

        {/* Enterprise strip */}
        <div style={{ marginBottom: 80 }}>
          <EnterpriseStrip />
        </div>

        {/* FAQ */}
        <div style={{ marginBottom: 56 }}>
          <div style={{ textAlign: "center", marginBottom: 32 }}>
            <h2 style={{
              fontFamily: "var(--f-display-serif)", fontWeight: 600,
              fontSize: "clamp(28px, 3.4vw, 40px)", letterSpacing: "-0.02em",
              color: "var(--ink)", marginBottom: 10,
            }}>
              frequently asked{" "}
              <span style={{ color: "var(--gold-deep)", fontStyle: "italic" }}>questions</span>
            </h2>
            <p style={{ fontSize: 15, color: "var(--ink-soft)" }}>
              Everything you need to know before you upgrade.
            </p>
          </div>
          <Faq />
        </div>

        {/* Footer note */}
        <p style={{
          textAlign: "center", marginTop: 56,
          fontSize: 13.5, color: "var(--ni-muted)", lineHeight: 1.7,
        }}>
          All plans include email delivery, quality scoring &amp; the full 6-agent pipeline.
          <br />
          Upgrade or cancel anytime · Annual plans billed as a single payment
        </p>
      </main>

      {/* Hover row highlight for comparison table */}
      <style>{`
        .compare-row:hover { background: rgba(247,231,193,0.18) !important; }
        @media (max-width: 760px) {
          .compare-row { grid-template-columns: 1fr !important; gap: 8px; }
          .compare-row > div { text-align: left !important; }
        }
      `}</style>
    </div>
  );
}

/* ─── Back button ───────────────────────────────────────────────────── */

function BackButton({ onClick }: { onClick: () => void }) {
  const [hover, setHover] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        display: "inline-flex", alignItems: "center", gap: 8,
        fontSize: 13.5, fontWeight: 500,
        color: hover ? "var(--forest)" : "var(--ink-soft)",
        padding: "8px 14px", borderRadius: 10,
        background: hover ? "#fff" : "rgba(255,255,255,0.7)",
        border: "1px solid rgba(47,93,80,0.12)",
        cursor: "pointer",
        fontFamily: "var(--f-body)",
        boxShadow: hover ? "0 2px 8px rgba(35,69,57,0.10)" : "none",
        transition: "all .2s",
      }}
    >
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
        <path d="M9 11 L5 7 L9 3" stroke="currentColor" strokeWidth="1.8"
          strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      back to home
    </button>
  );
}
