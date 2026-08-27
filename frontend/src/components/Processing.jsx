import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axiosInstance from "../axiosInstance";
import { saveToRecent } from "../store/noticeStore";

const C = {
  bg: "#0f172a",
  surface: "#1e293b",
  border: "#334155",
  accent: "#6366f1",
  text: "#f1f5f9",
  muted: "#94a3b8",
  danger: "#ef4444",
  dangerBg: "#7f1d1d22",
};

// Steps shown while the AI works
const STEPS = [
  { icon: "📥", label: "Reading the notice…" },
  { icon: "🧠", label: "Extracting key information…" },
  { icon: "📋", label: "Building your action checklist…" },
  { icon: "✅", label: "Finalising results…" },
];

export default function Processing() {
  const navigate = useNavigate();
  const location = useLocation();
  const payload = location.state; // { type: "paste"|"upload", text?, file? }

  const [stepIndex, setStepIndex] = useState(0);
  const [error, setError] = useState("");
  const called = useRef(false); // prevent double-call in StrictMode

  // ── animate steps every 1.4 s while the real API call is running ──────────
  useEffect(() => {
    const interval = setInterval(() => {
      setStepIndex((i) => Math.min(i + 1, STEPS.length - 1));
    }, 1400);
    return () => clearInterval(interval);
  }, []);

  // ── actual API call ────────────────────────────────────────────────────────
  useEffect(() => {
    if (called.current) return;
    called.current = true;

    // Guard: if somehow we land here with no payload, go home
    if (!payload) {
      navigate("/", { replace: true });
      return;
    }

    async function process() {
      try {
        const form = new FormData();
        if (payload.type === "paste") {
          form.append("text", payload.text);
        } else {
          form.append("pdf", payload.file);
        }

        const res = await axiosInstance.post("/process", form, {
          headers: { "Content-Type": "multipart/form-data" },
        });

        saveToRecent(res.data);
        navigate(`/results/${res.data._id}`, { replace: true });
      } catch (err) {
        const msg =
          err.response?.data?.message ||
          err.message ||
          "Something went wrong while processing the notice.";
        setError(msg);
      }
    }

    process();
  }, []);

  const s = {
    page: {
      minHeight: "100vh",
      background: C.bg,
      color: C.text,
      fontFamily: "'Inter', system-ui, sans-serif",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      padding: "24px 16px",
      gap: 32,
    },
    logo: {
      fontSize: 22,
      fontWeight: 800,
      background: "linear-gradient(135deg,#818cf8,#6366f1)",
      WebkitBackgroundClip: "text",
      WebkitTextFillColor: "transparent",
    },
    card: {
      width: "100%",
      maxWidth: 420,
      background: C.surface,
      border: `1px solid ${C.border}`,
      borderRadius: 16,
      padding: 36,
      textAlign: "center",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      gap: 24,
    },
    spinner: {
      width: 52,
      height: 52,
      border: `4px solid ${C.border}`,
      borderTop: `4px solid ${C.accent}`,
      borderRadius: "50%",
      animation: "spin 0.8s linear infinite",
    },
    stepList: {
      width: "100%",
      display: "flex",
      flexDirection: "column",
      gap: 10,
      textAlign: "left",
    },
    step: (active, done) => ({
      display: "flex",
      alignItems: "center",
      gap: 10,
      fontSize: 14,
      color: done ? C.accent : active ? C.text : C.muted,
      fontWeight: active ? 600 : 400,
      transition: "color .3s",
    }),
    stepDot: (active, done) => ({
      width: 8,
      height: 8,
      borderRadius: "50%",
      background: done ? C.accent : active ? C.text : C.border,
      flexShrink: 0,
      transition: "background .3s",
    }),
    errorBox: {
      background: C.dangerBg,
      border: `1px solid ${C.danger}44`,
      borderRadius: 10,
      color: C.danger,
      fontSize: 13,
      padding: "14px 18px",
      lineHeight: 1.6,
    },
    retryBtn: {
      marginTop: 8,
      padding: "10px 24px",
      borderRadius: 8,
      border: "none",
      background: C.accent,
      color: "#fff",
      fontWeight: 700,
      fontSize: 14,
      cursor: "pointer",
    },
  };

  return (
    <div style={s.page}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <div style={s.logo}>Notice2Action</div>

      <div style={s.card}>
        {error ? (
          // ── Error state ───────────────────────────────────────────────────
          <>
            <span style={{ fontSize: 40 }}>⚠️</span>
            <div style={s.errorBox}>
              <strong>Processing failed</strong>
              <br />
              {error}
            </div>
            <button style={s.retryBtn} onClick={() => navigate("/")}>
              ← Go back and try again
            </button>
          </>
        ) : (
          // ── Loading state ─────────────────────────────────────────────────
          <>
            <div style={s.spinner} />
            <div>
              <div style={{ fontWeight: 700, fontSize: 18, marginBottom: 4 }}>
                Analysing your notice
              </div>
              <div style={{ color: C.muted, fontSize: 13 }}>
                This usually takes 5 – 15 seconds
              </div>
            </div>
            <div style={s.stepList}>
              {STEPS.map((step, i) => (
                <div
                  key={i}
                  style={s.step(i === stepIndex, i < stepIndex)}
                >
                  <span style={s.stepDot(i === stepIndex, i < stepIndex)} />
                  {step.icon} {step.label}
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
