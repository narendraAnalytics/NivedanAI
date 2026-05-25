"use client";

import { useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";

const CIRCLE_R = 38;
const CIRCLE_C = 2 * Math.PI * CIRCLE_R; // 238.76

function RedirectingContent() {
  const router = useRouter();
  const params = useSearchParams();
  const to = params.get("to") ?? "sign-in";
  const messageMap: Record<string, string> = {
    pricing: "Exploring your plans",
    "how-it-works": "Exploring how it works",
  }
  const message = messageMap[to] ?? "Preparing your workspace"
  const redirected = useRef(false);

  useEffect(() => {
    if (redirected.current) return;
    const timer = setTimeout(() => {
      redirected.current = true;
      router.push(to ? `/${to}` : '/');
    }, 2200);
    return () => clearTimeout(timer);
  }, [to, router]);

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: "#FAF7F2",
        padding: "40px 24px",
        fontFamily: "var(--f-body, 'Inter', sans-serif)",
      }}
    >
      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes circleIn {
          from { stroke-dashoffset: ${CIRCLE_C}; }
          to   { stroke-dashoffset: 0; }
        }
        @keyframes tickIn {
          from { stroke-dashoffset: 60; }
          to   { stroke-dashoffset: 0; }
        }
        @keyframes glowPulse {
          0%, 100% { filter: drop-shadow(0 0 8px rgba(47,93,80,0.25)); }
          50%       { filter: drop-shadow(0 0 20px rgba(47,93,80,0.45)); }
        }
        .ni-brand-card {
          animation: fadeUp 0.45s cubic-bezier(.2,.7,.2,1) both;
        }
        .ni-tick-svg {
          animation: glowPulse 2s ease-in-out 0.8s infinite;
        }
        .ni-circle-path {
          stroke-dasharray: ${CIRCLE_C};
          stroke-dashoffset: ${CIRCLE_C};
          animation: circleIn 0.85s cubic-bezier(.4,0,.2,1) 0.15s forwards;
        }
        .ni-tick-path {
          stroke-dasharray: 60;
          stroke-dashoffset: 60;
          animation: tickIn 0.45s cubic-bezier(.4,0,.2,1) 0.75s forwards;
        }
        @keyframes dotBlink {
          0%, 100% { opacity: 0.35; }
          50%       { opacity: 1; }
        }
        .ni-dot-1 { animation: dotBlink 1.1s 0.0s ease-in-out infinite; }
        .ni-dot-2 { animation: dotBlink 1.1s 0.2s ease-in-out infinite; }
        .ni-dot-3 { animation: dotBlink 1.1s 0.4s ease-in-out infinite; }
      `}</style>

      <div className="ni-brand-card" style={{ textAlign: "center" }}>

        {/* Logo icon */}
        <div
          style={{
            width: 56,
            height: 56,
            borderRadius: 16,
            background: "linear-gradient(180deg, #FBF1D8 0%, #F0DBA6 100%)",
            display: "grid",
            placeItems: "center",
            border: "1px solid rgba(212,168,79,0.4)",
            boxShadow: "0 4px 18px rgba(212,168,79,0.28), inset 0 1px 0 rgba(255,255,255,0.7)",
            margin: "0 auto 18px",
          }}
        >
          <svg width="30" height="30" viewBox="0 0 24 24" fill="none">
            <path d="M12 3 C 8 7, 8 13, 12 21 C 16 13, 16 7, 12 3 Z" fill="#2F5D50" />
            <path d="M5 9 C 4 13, 6 18, 11 20 C 9 16, 8 12, 5 9 Z" fill="#3d7565" />
            <path d="M19 9 C 20 13, 18 18, 13 20 C 15 16, 16 12, 19 9 Z" fill="#3d7565" />
            <circle cx="12" cy="11" r="1.4" fill="#D4A84F" />
          </svg>
        </div>

        {/* Brand name */}
        <div
          style={{
            fontFamily: "var(--f-display, 'Sora', sans-serif)",
            fontWeight: 700,
            fontSize: 24,
            color: "#2F5D50",
            letterSpacing: "-0.02em",
            lineHeight: 1.2,
          }}
        >
          Nivedan AI
        </div>
        <div
          style={{
            fontSize: 13,
            color: "#7A8E87",
            marginTop: 5,
            fontWeight: 500,
            letterSpacing: "0.02em",
          }}
        >
          Autonomous Proposal Intelligence
        </div>

        {/* Animated tick */}
        <div style={{ margin: "40px auto 0", width: 100, height: 100 }}>
          <svg
            className="ni-tick-svg"
            width="100"
            height="100"
            viewBox="0 0 100 100"
            fill="none"
          >
            {/* Background circle (faint) */}
            <circle
              cx="50"
              cy="50"
              r={CIRCLE_R}
              stroke="rgba(47,93,80,0.10)"
              strokeWidth="3"
              fill="none"
            />
            {/* Animating circle */}
            <circle
              className="ni-circle-path"
              cx="50"
              cy="50"
              r={CIRCLE_R}
              stroke="#2F5D50"
              strokeWidth="3"
              fill="none"
              strokeLinecap="round"
              transform="rotate(-90 50 50)"
            />
            {/* Checkmark */}
            <path
              className="ni-tick-path"
              d="M 30 52 L 44 66 L 70 36"
              stroke="#2F5D50"
              strokeWidth="3.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />
          </svg>
        </div>

        {/* Loading text */}
        <div
          style={{
            marginTop: 28,
            fontSize: 13.5,
            color: "#7A8E87",
            fontWeight: 500,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 3,
          }}
        >
          {message}
          <span className="ni-dot-1" style={{ display: "inline-block", marginLeft: 1 }}>.</span>
          <span className="ni-dot-2" style={{ display: "inline-block" }}>.</span>
          <span className="ni-dot-3" style={{ display: "inline-block" }}>.</span>
        </div>

      </div>
    </div>
  );
}

export default function RedirectingPage() {
  return (
    <Suspense>
      <RedirectingContent />
    </Suspense>
  );
}
