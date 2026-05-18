"use client";

import { useState, useRef, useEffect } from "react";

const stats = [
  {
    value: 95,
    suffix: "%",
    label: "Time Reduction",
    desc: "From 8–20 hours per proposal down to 15–20 minutes. Senior staff reclaim hundreds of hours monthly.",
  },
  {
    value: null,
    display: "2×",
    label: "Higher Win Rate",
    desc: "Tailored, research-backed proposals convert at 40–50% — double the industry average of 20–25%.",
  },
  {
    value: null,
    display: "3×",
    label: "More Bids Submitted",
    desc: "The same team capacity handles 3× more RFPs per month — without hiring additional headcount.",
  },
  {
    value: 0,
    suffix: "",
    label: "Missed Requirements",
    desc: "The Quality Review Agent checks every mandatory item before export. Nothing gets missed.",
  },
  {
    value: null,
    display: "₹0",
    label: "Extra Infrastructure",
    desc: "A single Next.js monorepo on Vercel. No separate backend, no extra servers, minimal overhead.",
  },
  {
    value: null,
    display: "∞",
    label: "Knowledge Retention",
    desc: "Every approved proposal is stored — and becomes part of the knowledge base making the next one smarter.",
  },
];

function useCountUp(target: number, active: boolean, duration = 1200) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (!active) return;
    let start: number | null = null;
    let raf: number;
    const animate = (ts: number) => {
      if (!start) start = ts;
      const p = Math.min(1, (ts - start) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      setVal(target * eased);
      if (p < 1) raf = requestAnimationFrame(animate);
    };
    raf = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(raf);
  }, [target, active, duration]);
  return val;
}

function StatCard({
  stat,
  active,
}: {
  stat: (typeof stats)[0];
  active: boolean;
}) {
  const numericValue = stat.value !== null && stat.value !== undefined ? stat.value : 0;
  const isNumeric = stat.value !== null && stat.value !== undefined;
  const v = useCountUp(numericValue, active && isNumeric);

  const displayValue = isNumeric
    ? `${Math.round(v)}${stat.suffix ?? ""}`
    : stat.display ?? "";

  return (
    <div
      style={{
        padding: "32px 28px",
        background:
          "linear-gradient(180deg, rgba(255,255,255,0.7) 0%, rgba(255,255,255,0.45) 100%)",
        border: "1px solid var(--line-strong)",
        borderRadius: 20,
        backdropFilter: "blur(8px)",
        WebkitBackdropFilter: "blur(8px)",
        transition: "transform .35s, box-shadow .35s, border-color .35s",
        cursor: "default",
      }}
      onMouseEnter={(e) => {
        const el = e.currentTarget;
        el.style.transform = "translateY(-4px)";
        el.style.boxShadow = "0 18px 40px rgba(35,69,57,0.10)";
        el.style.borderColor = "rgba(212,168,79,0.4)";
      }}
      onMouseLeave={(e) => {
        const el = e.currentTarget;
        el.style.transform = "translateY(0)";
        el.style.boxShadow = "none";
        el.style.borderColor = "var(--line-strong)";
      }}
    >
      <div
        className="ni-text-gradient-gold"
        style={{
          fontFamily: "var(--f-display)",
          fontWeight: 600,
          fontSize: "clamp(40px, 4.5vw, 64px)",
          lineHeight: 1,
          letterSpacing: "-0.03em",
          marginBottom: 14,
        }}
      >
        {displayValue}
      </div>
      <div
        style={{
          fontFamily: "var(--f-display)",
          fontWeight: 600,
          fontSize: 17,
          marginBottom: 8,
          color: "var(--ink)",
        }}
      >
        {stat.label}
      </div>
      <p style={{ fontSize: 14, color: "var(--ink-soft)", lineHeight: 1.5 }}>{stat.desc}</p>
    </div>
  );
}

export default function Benefits() {
  const [active, setActive] = useState(false);
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) setActive(true);
        });
      },
      { threshold: 0.2 }
    );
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);

  return (
    <section className="ni-section" id="benefits" ref={ref}>
      <div className="ni-container">
        <div className="ni-section-head">
          <span className="ni-eyebrow">
            <span className="dot" />
            KEY BENEFITS
          </span>
          <h2 style={{ marginTop: 18 }}>
            The numbers behind{" "}
            <span className="ni-text-gradient-gold">winning more.</span>
          </h2>
          <p>Same team. 3× the bids. Twice the win rate. Zero missed requirements.</p>
        </div>

        <div
          className="grid-3col"
          style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 24 }}
        >
          {stats.map((stat, i) => (
            <StatCard key={i} stat={stat} active={active} />
          ))}
        </div>
      </div>
    </section>
  );
}
