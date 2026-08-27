import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axiosInstance from "../axiosInstance";

const C = {
  bg: "#070c18",
  surface: "#0d1929",
  border: "#1c3251",
  accent: "#f97316",
  text: "#e4ecf7",
  muted: "#5e7ea8",
  danger: "#f43f5e",
  dangerBg: "#4c051922",
  success: "#10b981",
  successBg: "#02261e22",
};

export default function Checklist() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [items, setItems] = useState([]);     // [{task, done}]
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(null); // index being saved

  useEffect(() => {
    async function load() {
      try {
        const res = await axiosInstance.get(`/notice/${id}`);
        setItems(res.data.checklist || []);
      } catch (err) {
        if (err.response?.status === 404) {
          setError("Checklist not found.");
        } else {
          setError(err.response?.data?.message || "Could not load checklist.");
        }
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  async function toggle(index) {
    const updated = items.map((item, i) =>
      i === index ? { ...item, done: !item.done } : item
    );
    setItems(updated); // optimistic update

    setSaving(index);
    try {
      await axiosInstance.put(`/notice/${id}/checklist`, {
        index,
        done: updated[index].done,
      });
    } catch {
      // rollback on failure
      setItems(items);
    } finally {
      setSaving(null);
    }
  }

  const doneCount = items.filter((i) => i.done).length;
  const allDone = items.length > 0 && doneCount === items.length;

  const s = {
    page: {
      minHeight: "100vh",
      background: C.bg,
      color: C.text,
      fontFamily: "'DM Sans', system-ui, sans-serif",
      padding: "40px 16px 80px",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
    },
    topBar: {
      width: "100%",
      maxWidth: 620,
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: 28,
    },
    logo: {
      fontSize: 20,
      fontWeight: 800,
      background: "linear-gradient(135deg, #fbbf24, #f97316)",
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
      maxWidth: 620,
      background: C.surface,
      border: `1px solid ${C.border}`,
      borderRadius: 16,
      overflow: "hidden",
    },
    progressBar: {
      height: 4,
      background: C.border,
      position: "relative",
    },
    progressFill: {
      height: "100%",
      background: C.accent,
      transition: "width .4s ease",
      width: items.length
        ? `${(doneCount / items.length) * 100}%`
        : "0%",
    },
    header: {
      padding: "20px 24px 16px",
      borderBottom: `1px solid ${C.border}`,
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
    },
    headerTitle: { fontWeight: 700, fontSize: 16 },
    counter: {
      fontSize: 13,
      color: allDone ? C.success : C.muted,
      fontWeight: 600,
    },
    row: (done) => ({
      display: "flex",
      alignItems: "flex-start",
      gap: 14,
      padding: "14px 24px",
      borderBottom: `1px solid ${C.border}`,
      cursor: "pointer",
      background: done ? `${C.success}08` : "transparent",
      transition: "background .15s",
    }),
    checkbox: (done, saving) => ({
      width: 20,
      height: 20,
      borderRadius: 6,
      border: `2px solid ${done ? C.success : C.border}`,
      background: done ? C.success : "transparent",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      flexShrink: 0,
      marginTop: 1,
      opacity: saving ? 0.5 : 1,
      transition: "all .15s",
    }),
    taskText: (done) => ({
      fontSize: 14,
      lineHeight: 1.6,
      color: done ? C.muted : C.text,
      textDecoration: done ? "line-through" : "none",
      flex: 1,
    }),
    emptyState: {
      padding: "40px 24px",
      textAlign: "center",
      color: C.muted,
      fontSize: 14,
    },
    allDoneBanner: {
      background: C.successBg,
      border: `1px solid ${C.success}33`,
      borderRadius: 12,
      width: "100%",
      maxWidth: 620,
      marginTop: 16,
      padding: "16px 24px",
      display: "flex",
      alignItems: "center",
      gap: 12,
      fontSize: 14,
      color: C.success,
      fontWeight: 600,
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
      maxWidth: 620,
    },
    skeleton: {
      height: 20,
      borderRadius: 6,
      background: "linear-gradient(90deg, #0d1929 25%, #1c3251 50%, #0d1929 75%)",
      backgroundSize: "200% 100%",
      animation: "shimmer 1.4s infinite",
      marginBottom: 12,
    },
  };

  // ── Loading ────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div style={s.page}>
        <style>{`@keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }`}</style>
        <div style={s.topBar}>
          <span style={s.logo} onClick={() => navigate("/")}>Notice2Action</span>
          <button style={s.backBtn} onClick={() => navigate(`/results/${id}`)}>← Results</button>
        </div>
        <div style={{ ...s.card, padding: 24 }}>
          {[80, 60, 90, 50].map((w, i) => (
            <div key={i} style={{ ...s.skeleton, width: `${w}%` }} />
          ))}
        </div>
      </div>
    );
  }

  // ── Error ──────────────────────────────────────────────────────────────────
  if (error) {
    return (
      <div style={s.page}>
        <div style={s.topBar}>
          <span style={s.logo} onClick={() => navigate("/")}>Notice2Action</span>
        </div>
        <div style={s.errorBox}>
          ⚠️ {error}
          <br />
          <button
            style={{ marginTop: 12, background: C.accent, border: "none", borderRadius: 8, color: "#fff", padding: "8px 20px", fontWeight: 600, cursor: "pointer" }}
            onClick={() => navigate("/")}
          >
            ← Home
          </button>
        </div>
      </div>
    );
  }

  // ── Checklist ──────────────────────────────────────────────────────────────
  return (
    <div style={s.page}>
      <style>{`@keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }`}</style>

      <div style={s.topBar}>
        <span style={s.logo} onClick={() => navigate("/")}>Notice2Action</span>
        <button style={s.backBtn} onClick={() => navigate(`/results/${id}`)}>
          ← Results
        </button>
      </div>

      <div style={s.card}>
        {/* Progress bar */}
        <div style={s.progressBar}>
          <div style={s.progressFill} />
        </div>

        {/* Header */}
        <div style={s.header}>
          <span style={s.headerTitle}>📋 Action Checklist</span>
          <span style={s.counter}>
            {doneCount} / {items.length} done
          </span>
        </div>

        {/* Items */}
        {items.length === 0 ? (
          <div style={s.emptyState}>
            <div style={{ fontSize: 32, marginBottom: 10 }}>🎉</div>
            No action items were extracted for this notice.
            <br />
            <span style={{ fontSize: 12 }}>
              The notice may be informational only.
            </span>
          </div>
        ) : (
          items.map((item, i) => (
            <div
              key={i}
              style={{
                ...s.row(item.done),
                ...(i === items.length - 1 ? { borderBottom: "none" } : {}),
              }}
              onClick={() => toggle(i)}
            >
              <div style={s.checkbox(item.done, saving === i)}>
                {item.done && (
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                    <path
                      d="M2 6l3 3 5-5"
                      stroke="#fff"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                )}
              </div>
              <span style={s.taskText(item.done)}>{item.task}</span>
            </div>
          ))
        )}
      </div>

      {/* All-done banner */}
      {allDone && (
        <div style={s.allDoneBanner}>
          <span style={{ fontSize: 24 }}>🎉</span>
          All done! You've completed every action for this notice.
        </div>
      )}

      {/* Back to home */}
      <button
        style={{
          marginTop: 20,
          background: "transparent",
          border: `1px solid ${C.border}`,
          borderRadius: 10,
          color: C.muted,
          fontSize: 14,
          padding: "11px 28px",
          cursor: "pointer",
          width: "100%",
          maxWidth: 620,
        }}
        onClick={() => navigate("/")}
      >
        ← Process another notice
      </button>
    </div>
  );
}
