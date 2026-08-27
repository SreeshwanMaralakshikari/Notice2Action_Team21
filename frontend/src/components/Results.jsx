import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axiosInstance from "../axiosInstance";

const C = {
  bg: "#0f172a",
  surface: "#1e293b",
  border: "#334155",
  accent: "#6366f1",
  text: "#f1f5f9",
  muted: "#94a3b8",
  danger: "#ef4444",
  dangerBg: "#7f1d1d22",
  warn: "#f59e0b",
  warnBg: "#78350f22",
  success: "#22c55e",
  successBg: "#14532d22",
};

function Skeleton({ width = "100%", height = 16, style = {} }) {
  return (
    <div
      style={{
        width,
        height,
        borderRadius: 6,
        background: "linear-gradient(90deg,#1e293b 25%,#334155 50%,#1e293b 75%)",
        backgroundSize: "200% 100%",
        animation: "shimmer 1.4s infinite",
        ...style,
      }}
    />
  );
}

export default function Results() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [notice, setNotice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchNotice() {
      try {
        const res = await axiosInstance.get(`/notice/${id}`);
        setNotice(res.data);
      } catch (err) {
        if (err.response?.status === 404) {
          setError("Notice not found. It may have been removed.");
        } else {
          setError(
            err.response?.data?.message ||
              "Could not load the notice. Please try again."
          );
        }
      } finally {
        setLoading(false);
      }
    }
    fetchNotice();
  }, [id]);

  const s = {
    page: {
      minHeight: "100vh",
      background: C.bg,
      color: C.text,
      fontFamily: "'Inter', system-ui, sans-serif",
      padding: "40px 16px 80px",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
    },
    topBar: {
      width: "100%",
      maxWidth: 680,
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: 28,
    },
    logo: {
      fontSize: 20,
      fontWeight: 800,
      background: "linear-gradient(135deg,#818cf8,#6366f1)",
      WebkitBackgroundClip: "text",
      WebkitTextFillColor: "transparent",
      cursor: "pointer",
    },
    backBtn: {
      background: "transparent",
      border: `1px solid ${C.border}`,
      borderRadius: 8,
      color: C.muted,
      fontSize: 13,
      padding: "6px 14px",
      cursor: "pointer",
    },
    card: {
      width: "100%",
      maxWidth: 680,
      background: C.surface,
      border: `1px solid ${C.border}`,
      borderRadius: 16,
      padding: 28,
      marginBottom: 16,
    },
    cardTitle: {
      fontWeight: 700,
      fontSize: 13,
      textTransform: "uppercase",
      letterSpacing: "0.8px",
      color: C.muted,
      marginBottom: 12,
    },
    summaryText: { fontSize: 15, lineHeight: 1.7, color: C.text },
    deadlineRow: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      padding: "9px 0",
      borderBottom: `1px solid ${C.border}`,
      fontSize: 14,
    },
    deadlineLabel: { color: C.muted },
    deadlineDate: {
      fontWeight: 600,
      color: C.warn,
      background: C.warnBg,
      padding: "2px 10px",
      borderRadius: 6,
      fontSize: 13,
    },
    eligItem: {
      display: "flex",
      alignItems: "flex-start",
      gap: 8,
      fontSize: 14,
      color: C.text,
      lineHeight: 1.5,
      marginBottom: 8,
    },
    checklistBtn: {
      display: "block",
      width: "100%",
      maxWidth: 680,
      padding: "14px 0",
      borderRadius: 12,
      border: "none",
      background: C.accent,
      color: "#fff",
      fontWeight: 700,
      fontSize: 15,
      cursor: "pointer",
      letterSpacing: "0.3px",
      marginTop: 8,
    },
    errorBox: {
      background: C.dangerBg,
      border: `1px solid ${C.danger}44`,
      borderRadius: 12,
      color: C.danger,
      fontSize: 14,
      padding: "20px 24px",
      textAlign: "center",
      width: "100%",
      maxWidth: 680,
    },
    emptyNote: {
      color: C.muted,
      fontSize: 13,
      fontStyle: "italic",
      padding: "8px 0",
    },
  };

  // ── Loading skeleton ─────────────────────────────────────────────────────
  if (loading) {
    return (
      <div style={s.page}>
        <style>{`@keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }`}</style>
        <div style={s.topBar}>
          <span style={s.logo} onClick={() => navigate("/")}>
            Notice2Action
          </span>
          <button style={s.backBtn} onClick={() => navigate("/")}>
            ← Home
          </button>
        </div>
        {["Summary", "Deadlines & Eligibility", "Checklist"].map((sec) => (
          <div key={sec} style={{ ...s.card, marginBottom: 16 }}>
            <div style={s.cardTitle}>{sec}</div>
            <Skeleton height={14} style={{ marginBottom: 8 }} />
            <Skeleton width="80%" height={14} style={{ marginBottom: 8 }} />
            <Skeleton width="60%" height={14} />
          </div>
        ))}
      </div>
    );
  }

  // ── Error state ──────────────────────────────────────────────────────────
  if (error) {
    return (
      <div style={s.page}>
        <div style={s.topBar}>
          <span style={s.logo} onClick={() => navigate("/")}>
            Notice2Action
          </span>
        </div>
        <div style={s.errorBox}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>⚠️</div>
          <strong>{error}</strong>
          <br />
          <button
            style={{
              marginTop: 16,
              background: C.accent,
              border: "none",
              borderRadius: 8,
              color: "#fff",
              padding: "9px 22px",
              fontWeight: 600,
              cursor: "pointer",
              fontSize: 14,
            }}
            onClick={() => navigate("/")}
          >
            ← Back to Home
          </button>
        </div>
      </div>
    );
  }

  // ── Results ──────────────────────────────────────────────────────────────
  return (
    <div style={s.page}>
      <style>{`@keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }`}</style>

      <div style={s.topBar}>
        <span style={s.logo} onClick={() => navigate("/")}>
          Notice2Action
        </span>
        <button style={s.backBtn} onClick={() => navigate("/")}>
          ← Home
        </button>
      </div>

      {/* Summary */}
      <div style={s.card}>
        <div style={s.cardTitle}>📄 Summary</div>
        {notice.summary ? (
          <p style={s.summaryText}>{notice.summary}</p>
        ) : (
          <p style={s.emptyNote}>No summary was generated for this notice.</p>
        )}
      </div>

      {/* Deadlines */}
      <div style={s.card}>
        <div style={s.cardTitle}>⏰ Key Deadlines</div>
        {notice.deadlines && notice.deadlines.length > 0 ? (
          notice.deadlines.map((d, i) => (
            <div
              key={i}
              style={{
                ...s.deadlineRow,
                ...(i === notice.deadlines.length - 1
                  ? { borderBottom: "none" }
                  : {}),
              }}
            >
              <span style={s.deadlineLabel}>{d.label}</span>
              <span style={s.deadlineDate}>{d.date}</span>
            </div>
          ))
        ) : (
          <p style={s.emptyNote}>No specific deadlines were found in this notice.</p>
        )}
      </div>

      {/* Eligibility */}
      <div style={s.card}>
        <div style={s.cardTitle}>👥 Who This Applies To</div>
        {notice.eligibility && notice.eligibility.length > 0 ? (
          notice.eligibility.map((e, i) => (
            <div key={i} style={s.eligItem}>
              <span style={{ color: C.success, marginTop: 1 }}>✓</span>
              <span>{e}</span>
            </div>
          ))
        ) : (
          <p style={s.emptyNote}>Eligibility details were not specified in this notice.</p>
        )}
      </div>

      {/* CTA */}
      <button
        style={s.checklistBtn}
        onClick={() => navigate(`/checklist/${id}`)}
      >
        Open Action Checklist →
      </button>
    </div>
  );
}
