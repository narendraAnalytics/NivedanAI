"use client";

import { PricingTable } from "@clerk/nextjs";
import { useRouter } from "next/navigation";

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
    // Outer wrapper
    pricingTable: {
      gap: "24px",
    },

    // Individual plan card
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

    // Highlighted / most-popular card
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

    // Plan name — lowercase as set in Clerk Dashboard (free / plus / pro)
    pricingTableCardTitle: {
      fontFamily: "var(--f-display), Sora, system-ui",
      fontWeight: 700,
      letterSpacing: "-0.02em",
      fontSize: "22px",
      color: "#D4A84F",          // gold — branded accent on light cards
      textTransform: "none",     // keep lowercase exactly as in Clerk
    },

    // Plan name on the highlighted (featured) card
    pricingTableCardHighlightedTitle: {
      color: "#F7E7C1",          // champagne — reads clearly on deep forest bg
      textTransform: "none",
    },

    // Price value
    pricingTableCardPrice: {
      fontFamily: "var(--f-display), Sora, system-ui",
      fontWeight: 700,
      letterSpacing: "-0.04em",
      fontSize: "52px",
      lineHeight: "1",
    },

    // Price period (/mo, /yr)
    pricingTableCardPricePeriod: {
      fontSize: "14px",
      color: "#8A958F",
    },

    // Description / tagline under plan name
    pricingTableCardDescription: {
      fontSize: "13.5px",
      color: "#8A958F",
      lineHeight: "1.5",
    },

    // Divider line between price and features
    pricingTableCardDivider: {
      background: "rgba(47,93,80,0.08)",
      height: "1px",
      margin: "20px 0",
    },

    // Feature list item
    pricingTableCardFeatureItem: {
      fontSize: "14px",
      color: "#1A2420",
      lineHeight: "1.5",
      gap: "10px",
    },

    // Feature checkmark icon
    pricingTableCardFeatureItemIcon: {
      color: "#2F5D50",
      width: "16px",
      height: "16px",
    },

    // CTA button — default (non-highlighted cards)
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

    // CTA button on highlighted card
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

    // "Current plan" button (free tier, already subscribed)
    pricingTableCardButtonDisabled: {
      background: "rgba(255,255,255,0.55)",
      border: "1px solid rgba(47,93,80,0.16)",
      color: "#8A958F",
      cursor: "default",
      boxShadow: "none",
      borderRadius: "12px",
      fontWeight: 500,
    },

    // Badge ("Most popular", "Best value" etc.)
    pricingTableCardBadge: {
      background: "linear-gradient(135deg, #E0B663, #C99437)",
      color: "#2A1E08",
      fontWeight: 700,
      fontSize: "10.5px",
      letterSpacing: "0.10em",
      borderRadius: "999px",
      padding: "4px 12px",
    },

    // Monthly / Yearly billing toggle container
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

    // Toggle track — solid forest pill so it's clearly a toggle, not a line
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
    // Toggle thumb — white circle with shadow so it pops against the green track
    pricingTableToggleThumb: {
      width: "18px",
      height: "18px",
      borderRadius: "50%",
      background: "#ffffff",
      boxShadow: "0 1px 5px rgba(0,0,0,0.28), 0 0 0 1px rgba(255,255,255,0.6)",
    },

    // Toggle label text
    pricingTableToggleLabel: {
      fontFamily: "var(--f-body)",
      fontSize: "13.5px",
      fontWeight: 500,
      color: "#1A2420",
    },

    // "Save X%" pill next to yearly label
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

export default function PricingPage() {
  const router = useRouter();

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "var(--ivory)",
        backgroundImage:
          "radial-gradient(1100px 500px at 70% -80px, rgba(247,231,193,0.50), transparent 60%), radial-gradient(800px 400px at -5% 15%, rgba(221,231,216,0.38), transparent 60%)",
        fontFamily: "var(--f-body)",
        animation: "pageEnter 0.7s cubic-bezier(0.16,1,0.3,1)",
      }}
    >
      {/* ── Sticky header ── */}
      <header
        style={{
          position: "sticky", top: 0, zIndex: 50,
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "16px 48px",
          background: "linear-gradient(180deg, rgba(250,247,242,0.92) 0%, rgba(250,247,242,0.75) 100%)",
          backdropFilter: "blur(20px) saturate(140%)",
          WebkitBackdropFilter: "blur(20px) saturate(140%)",
          borderBottom: "1px solid rgba(47,93,80,0.08)",
        }}
      >
        <BackButton onClick={() => router.push("/")} />
        <Logo />
        <div style={{ width: 120 }} />
      </header>

      {/* ── Main content ── */}
      <main style={{ maxWidth: 1160, margin: "0 auto", padding: "72px 48px 120px" }}>

        {/* Hero text */}
        <div style={{ textAlign: "center", marginBottom: 56 }}>
          <div
            className="ni-eyebrow"
            style={{ marginBottom: 24, display: "inline-flex" }}
          >
            <span className="dot" />
            simple pricing
          </div>

          <h1 style={{
            fontFamily: "var(--f-display)", fontWeight: 700,
            fontSize: "clamp(38px, 5vw, 60px)",
            letterSpacing: "-0.03em", lineHeight: 1.05,
            color: "var(--ink)", marginBottom: 18,
          }}>
            Choose your{" "}
            <span className="ni-text-gradient-gold">workflow plan</span>
          </h1>

          <p style={{
            fontSize: 18, color: "var(--ink-soft)",
            maxWidth: 520, margin: "0 auto",
            lineHeight: 1.6,
          }}>
            Turn RFPs into submission-ready proposals in minutes.
            <br />Scale as your pipeline grows.
          </p>
        </div>

        {/* ── Clerk PricingTable ── */}
        <PricingTable appearance={nivedanAppearance} />

        {/* Footer note */}
        <p style={{
          textAlign: "center", marginTop: 48,
          fontSize: 13.5, color: "var(--ni-muted)", lineHeight: 1.7,
        }}>
          All plans include email delivery, quality scoring &amp; the full 6-agent pipeline.
          <br />Upgrade or cancel anytime. Annual plans billed as a single payment.
        </p>
      </main>
    </div>
  );
}

function BackButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: "inline-flex", alignItems: "center", gap: 8,
        fontSize: 14, fontWeight: 500, color: "var(--ink-soft)",
        padding: "8px 14px", borderRadius: 10,
        background: "rgba(255,255,255,0.7)",
        border: "1px solid rgba(47,93,80,0.12)",
        cursor: "pointer",
        fontFamily: "var(--f-body)",
        transition: "all .2s",
      }}
      onMouseEnter={e => {
        (e.currentTarget as HTMLButtonElement).style.color = "var(--forest)";
        (e.currentTarget as HTMLButtonElement).style.background = "#fff";
        (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 2px 8px rgba(35,69,57,0.10)";
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLButtonElement).style.color = "var(--ink-soft)";
        (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.7)";
        (e.currentTarget as HTMLButtonElement).style.boxShadow = "none";
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
