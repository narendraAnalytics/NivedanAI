import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
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
      }}
    >
      {/* Brand header */}
      <div style={{ marginBottom: 32, textAlign: "center" }}>
        <div
          style={{
            width: 48,
            height: 48,
            borderRadius: 14,
            background: "linear-gradient(180deg, #FBF1D8 0%, #F0DBA6 100%)",
            display: "grid",
            placeItems: "center",
            border: "1px solid rgba(212,168,79,0.4)",
            boxShadow: "0 4px 14px rgba(212,168,79,0.25)",
            margin: "0 auto 16px",
          }}
        >
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
            <path d="M12 3 C 8 7, 8 13, 12 21 C 16 13, 16 7, 12 3 Z" fill="#2F5D50" />
            <path d="M5 9 C 4 13, 6 18, 11 20 C 9 16, 8 12, 5 9 Z" fill="#3d7565" />
            <path d="M19 9 C 20 13, 18 18, 13 20 C 15 16, 16 12, 19 9 Z" fill="#3d7565" />
            <circle cx="12" cy="11" r="1.4" fill="#D4A84F" />
          </svg>
        </div>
        <div
          style={{
            fontFamily: "var(--f-display, 'Sora', sans-serif)",
            fontWeight: 700,
            fontSize: 22,
            color: "#2F5D50",
            letterSpacing: "-0.02em",
          }}
        >
          Nivedan AI
        </div>
        <div
          style={{
            fontFamily: "var(--f-body, 'Inter', sans-serif)",
            fontSize: 13,
            color: "#7A8E87",
            marginTop: 4,
          }}
        >
          Autonomous Proposal Intelligence
        </div>
      </div>

      <SignIn />
    </div>
  );
}
