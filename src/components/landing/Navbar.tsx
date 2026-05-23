"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useUser, UserButton } from "@clerk/nextjs";
import { PLAN_LIMITS, type PlanKey } from "@/lib/plans";

const Logo = () => (
  <a href="#top" style={{ display: "flex", alignItems: "center", gap: 12 }}>
    <div
      style={{
        width: 40,
        height: 40,
        borderRadius: 12,
        background: "linear-gradient(180deg, #FBF1D8 0%, #F0DBA6 100%)",
        display: "grid",
        placeItems: "center",
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
      <span
        style={{
          fontFamily: "var(--f-display)",
          fontWeight: 700,
          fontSize: 19,
          color: "var(--ink)",
          letterSpacing: "-0.02em",
        }}
      >
        Nivedan AI
      </span>
      <span
        style={{
          fontFamily: "var(--f-body)",
          fontSize: 11,
          color: "var(--ni-muted)",
          letterSpacing: "0.04em",
          fontWeight: 500,
        }}
      >
        Autonomous Proposal Intelligence
      </span>
    </div>
  </a>
);

const NavLink = ({
  children,
  hasMenu,
  href = "#",
}: {
  children: React.ReactNode;
  hasMenu?: boolean;
  href?: string;
}) => {
  const [hover, setHover] = useState(false);
  return (
    <a
      href={href}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        fontSize: 14.5,
        fontWeight: 500,
        color: hover ? "var(--forest-deep)" : "var(--ink-soft)",
        padding: "8px 4px",
        position: "relative",
        transition: "color .2s",
      }}
    >
      {children}
      {hasMenu && (
        <svg width="10" height="10" viewBox="0 0 12 12">
          <path
            d="M3 4.5 L6 7.5 L9 4.5"
            stroke="currentColor"
            strokeWidth="1.5"
            fill="none"
            strokeLinecap="round"
          />
        </svg>
      )}
      <span
        style={{
          position: "absolute",
          bottom: 2,
          left: "50%",
          transform: "translateX(-50%)",
          width: hover ? 16 : 0,
          height: 2,
          background: "var(--gold)",
          borderRadius: 2,
          transition: "width .25s cubic-bezier(.2,.7,.2,1)",
        }}
      />
    </a>
  );
};

const MagneticButton = ({
  children,
  strength = 0.25,
}: {
  children: React.ReactNode;
  strength?: number;
}) => {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const onMove = (e: MouseEvent) => {
      const r = el.getBoundingClientRect();
      const x = e.clientX - r.left - r.width / 2;
      const y = e.clientY - r.top - r.height / 2;
      el.style.transform = `translate(${x * strength}px, ${y * strength}px)`;
    };
    const onLeave = () => {
      el.style.transform = "translate(0,0)";
    };
    el.addEventListener("mousemove", onMove);
    el.addEventListener("mouseleave", onLeave);
    return () => {
      el.removeEventListener("mousemove", onMove);
      el.removeEventListener("mouseleave", onLeave);
    };
  }, [strength]);
  return (
    <div
      ref={ref}
      style={{
        display: "inline-flex",
        transition: "transform .35s cubic-bezier(.2,.7,.2,1)",
      }}
    >
      {children}
    </div>
  );
};

export { MagneticButton };

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [navPlan, setNavPlan] = useState<string>('free');
  const { isSignedIn, user } = useUser();
  const router = useRouter();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (isSignedIn) {
      fetch('/api/user/plan').then(r => r.ok ? r.json() : { plan: 'free' }).then(d => setNavPlan(d.plan ?? 'free'))
    }
  }, [isSignedIn]);

  return (
    <nav
      style={{
        position: "fixed",
        top: scrolled ? 16 : 24,
        left: 0,
        right: 0,
        zIndex: 100,
        transition: "top .35s cubic-bezier(.2,.7,.2,1)",
      }}
    >
      <div style={{ maxWidth: 1380, margin: "0 auto", padding: "0 32px" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "12px 12px 12px 22px",
            borderRadius: 22,
            background: scrolled
              ? "linear-gradient(180deg, rgba(255,255,255,0.88) 0%, rgba(255,255,255,0.75) 100%)"
              : "linear-gradient(180deg, rgba(255,255,255,0.55) 0%, rgba(255,255,255,0.35) 100%)",
            border: `1px solid ${scrolled ? "rgba(255,255,255,0.85)" : "rgba(255,255,255,0.6)"}`,
            backdropFilter: `blur(${scrolled ? 24 : 12}px) saturate(150%)`,
            WebkitBackdropFilter: `blur(${scrolled ? 24 : 12}px) saturate(150%)`,
            boxShadow: scrolled
              ? "0 12px 40px rgba(35,69,57,0.10), inset 0 1px 0 rgba(255,255,255,0.7)"
              : "0 6px 24px rgba(35,69,57,0.05), inset 0 1px 0 rgba(255,255,255,0.5)",
            transition: "all .4s cubic-bezier(.2,.7,.2,1)",
          }}
        >
          <Logo />

          <div
            className="nav-links"
            style={{ display: "flex", alignItems: "center", gap: 36 }}
          >
            <NavLink>Product</NavLink>
            <NavLink>How It Works</NavLink>
            <NavLink>Agents</NavLink>
            <NavLink href="/redirecting?to=pricing">Pricing</NavLink>
            <NavLink hasMenu>Resources</NavLink>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            {isSignedIn ? (
              <>
                <span
                  style={{
                    fontSize: 14.5,
                    fontWeight: 500,
                    color: "var(--forest)",
                    padding: "10px 14px",
                    fontFamily: "var(--f-display)",
                  }}
                >
                  Welcome, {user?.username ?? user?.firstName ?? "there"}
                </span>
                <span style={{
                  padding: "3px 10px", borderRadius: 999, fontSize: 11, fontWeight: 700,
                  letterSpacing: "0.08em",
                  background: (PLAN_LIMITS[navPlan as PlanKey] ?? PLAN_LIMITS.free).badgeBg,
                  color: (PLAN_LIMITS[navPlan as PlanKey] ?? PLAN_LIMITS.free).badgeColor,
                }}>
                  {(PLAN_LIMITS[navPlan as PlanKey] ?? PLAN_LIMITS.free).label}
                </span>
                <UserButton />
              </>
            ) : (
              <>
                <button
                  onClick={() => router.push("/redirecting?to=sign-in")}
                  style={{
                    fontSize: 14.5,
                    fontWeight: 500,
                    color: "var(--ink-soft)",
                    padding: "10px 14px",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    fontFamily: "var(--f-body)",
                  }}
                >
                  Login
                </button>
                <MagneticButton>
                  <button
                    className="ni-btn ni-btn-gold"
                    style={{ padding: "12px 20px" }}
                    onClick={() => router.push("/redirecting?to=sign-up")}
                  >
                    Book a Demo
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                      <path
                        d="M3 11 L11 3 M5 3 H11 V9"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </button>
                </MagneticButton>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
