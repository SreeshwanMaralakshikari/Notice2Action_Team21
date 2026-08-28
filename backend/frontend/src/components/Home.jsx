import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { getRecentNotices } from "../store/noticeStore";

// ── colour tokens (matches common.js) ──────────────────────────────────────
const C = {
  bg: "#070c18",
  surface: "#0d1929",
  border: "#1c3251",
  accent: "#f97316",
  accentHover: "#ea6c10",
  text: "#e4ecf7",
  muted: "#5e7ea8",
  danger: "#f43f5e",
  dangerBg: "#4c051922",
  success: "#10b981",
  badge: {
    Exam:        "#7c3aed",
    Fee:         "#d97706",
    Scholarship: "#0284c7",
    Hostel:      "#059669",
    Event:       "#e11d48",
    Other:       "#334155",
  },
};

const CATEGORY_COLORS = C.badge;

export default function Home() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [mode, setMode] = useState("paste"); // "paste" | "upload"
  const [text, setText] = useState("");
  const [file, setFile] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const recent = getRecentNotices();

  // ── validation ─────────────────────────────────────────────────────────────
  function validate() {
    if (mode === "paste" && text.trim().length < 20) {
      setError("Please paste the notice text (at least 20 characters).");
      return false;
    }
    if (mode === "upload" && !file) {
      setError("Please select a PDF file to upload.");
      return false;
    }
    setError("");
    return true;
  }

  // ── submit ─────────────────────────────────────────────────────────────────
  function handleGenerate() {
    if (!validate()) return;
    const payload =
      mode === "paste" ? { type: "paste", text } : { type: "upload", file };
    navigate("/processing", { state: payload });
  }

  // ── drag-and-drop helpers ──────────────────────────────────────────────────
  function onDrop(e) {
    e.preventDefault();
    setDragOver(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped && dropped.type === "application/pdf") {
      setFile(dropped);
      setError("");
    } else {
      setError("Only PDF files are accepted.");
    }
  }

  // ── relative date helper ───────────────────────────────────────────────────
  function relativeDate(iso) {
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  }

  // ── styles ─────────────────────────────────────────────────────────────────
  const s = {
    page: {
      minHeight: "100vh",
      background: C.bg,
      color: C.text,
      fontFamily: "'DM Sans', system-ui, sans-serif",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      padding: "48px 16px 80px",
    },
    logo: {
      fontSize: 28,
      fontWeight: 800,
      letterSpacing: "-0.5px",
      marginBottom: 4,
      background: "linear-gradient(135deg, #fbbf24, #f97316)",
      WebkitBackgroundClip: "text",
      WebkitTextFillColor: "transparent",
    },
    tagline: { color: C.muted, fontSize: 14, marginBottom: 40 },
    card: {
      width: "100%",
      maxWidth: 640,
      background: C.surface,
      border: `1px solid ${C.border}`,
      borderRadius: 16,
      padding: 28,
    },
    tabRow: {
      display: "flex",
      gap: 8,
      marginBottom: 20,
      background: C.bg,
      borderRadius: 10,
      padding: 4,
    },
    tab: (active) => ({
      flex: 1,
      padding: "8px 0",
      borderRadius: 8,
      border: "none",
      cursor: "pointer",
      fontWeight: 600,
      fontSize: 14,
      transition: "all .15s",
      background: active ? C.accent : "transparent",
      color: active ? "#fff" : C.muted,
    }),
    textarea: {
      width: "100%",
      minHeight: 200,
      background: C.bg,
      border: `1px solid ${error && mode === "paste" ? C.danger : C.border}`,
      borderRadius: 10,
      color: C.text,
      fontSize: 14,
      lineHeight: 1.6,
      padding: 14,
      resize: "vertical",
      outline: "none",
      boxSizing: "border-box",
      transition: "border-color .15s",
    },
    dropZone: {
      minHeight: 180,
      border: `2px dashed ${
        dragOver ? C.accent : error && mode === "upload" ? C.danger : C.border
      }`,
      borderRadius: 10,
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      gap: 10,
      cursor: "pointer",
      background: dragOver ? "#f9731611" : C.bg,
      transition: "all .15s",
      color: C.muted,
      fontSize: 14,
    },
    fileName: {
      fontSize: 13,
      color: C.success,
      marginTop: 8,
      textAlign: "center",
    },
    errorBox: {
      background: C.dangerBg,
      border: `1px solid ${C.danger}44`,
      borderRadius: 8,
      color: C.danger,
      fontSize: 13,
      padding: "10px 14px",
      marginTop: 12,
    },
    generateBtn: {
      marginTop: 20,
      width: "100%",
      padding: "13px 0",
      borderRadius: 10,
      border: "none",
      background: loading ? C.border : C.accent,
      color: "#fff",
      fontWeight: 700,
      fontSize: 15,
      cursor: loading ? "not-allowed" : "pointer",
      transition: "background .15s",
      letterSpacing: "0.3px",
    },
    recentHeader: {
      width: "100%",
      maxWidth: 640,
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      marginTop: 36,
      marginBottom: 12,
    },
    recentTitle: { fontWeight: 700, fontSize: 15, color: C.text },
    recentEmpty: {
      width: "100%",
      maxWidth: 640,
      color: C.muted,
      fontSize: 13,
      textAlign: "center",
      padding: "20px 0",
      border: `1px dashed ${C.border}`,
      borderRadius: 10,
    },
    recentRow: {
      width: "100%",
      maxWidth: 640,
      background: C.surface,
      border: `1px solid ${C.border}`,
      borderRadius: 10,
      padding: "12px 16px",
      marginBottom: 8,
      cursor: "pointer",
      display: "flex",
      alignItems: "flex-start",
      gap: 12,
      transition: "border-color .15s",
    },
    badge: (cat) => ({
      background: CATEGORY_COLORS[cat] || CATEGORY_COLORS.Other,
      color: "#fff",
      fontSize: 10,
      fontWeight: 700,
      padding: "2px 7px",
      borderRadius: 4,
      whiteSpace: "nowrap",
      flexShrink: 0,
      marginTop: 2,
    }),
    recentSnippet: { fontSize: 13, color: C.muted, flex: 1, lineHeight: 1.5 },
    recentDate: { fontSize: 11, color: C.border, flexShrink: 0, marginTop: 2 },
  };

  return (
    <div style={s.page}>
      {/* Header */}
      <div style={s.logo}>Notice2Action</div>
      <div style={s.tagline}>Turn any notice into a clear action plan — instantly.</div>

      {/* Input card */}
      <div style={s.card}>
        {/* Paste / Upload tabs */}
        <div style={s.tabRow}>
          {["paste", "upload"].map((m) => (
            <button
              key={m}
              style={s.tab(mode === m)}
              onClick={() => {
                setMode(m);
                setError("");
              }}
            >
              {m === "paste" ? "📋 Paste Text" : "📄 Upload PDF"}
            </button>
          ))}
        </div>

        {/* Paste area */}
        {mode === "paste" && (
          <textarea
            style={s.textarea}
            placeholder="Paste the full notice here — exam circular, fee reminder, scholarship announcement, hostel rule, anything…"
            value={text}
            onChange={(e) => {
              setText(e.target.value);
              if (error) setError("");
            }}
          />
        )}

        {/* Upload area */}
        {mode === "upload" && (
          <>
            <div
              style={s.dropZone}
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={onDrop}
            >
              <span style={{ fontSize: 32 }}>📁</span>
              <span>
                {dragOver ? "Drop it here!" : "Click or drag & drop a PDF"}
              </span>
              <span style={{ fontSize: 12 }}>Max 10 MB · PDF only</span>
              <input
                ref={fileInputRef}
                type="file"
                accept="application/pdf"
                style={{ display: "none" }}
                onChange={(e) => {
                  const f = e.target.files[0];
                  if (f) {
                    setFile(f);
                    setError("");
                  }
                }}
              />
            </div>
            {file && (
              <div style={s.fileName}>
                ✅ {file.name} ({(file.size / 1024).toFixed(1)} KB)
              </div>
            )}
          </>
        )}

        {/* Inline validation error */}
        {error && <div style={s.errorBox}>⚠️ {error}</div>}

        {/* Generate button */}
        <button
          style={s.generateBtn}
          onClick={handleGenerate}
          disabled={loading}
        >
          {loading ? "Processing…" : "Generate Action Plan →"}
        </button>
      </div>

      {/* Recent notices strip */}
      <div style={s.recentHeader}>
        <span style={s.recentTitle}>Recent Notices</span>
        {recent.length > 0 && (
          <span style={{ fontSize: 12, color: C.muted }}>
            {recent.length} notice{recent.length !== 1 ? "s" : ""}
          </span>
        )}
      </div>

      {recent.length === 0 ? (
        <div style={s.recentEmpty}>
          No notices yet — generate your first one above.
        </div>
      ) : (
        recent.map((n) => (
          <div
            key={n._id}
            style={s.recentRow}
            onClick={() => navigate(`/results/${n._id}`)}
            onMouseEnter={(e) =>
              (e.currentTarget.style.borderColor = C.accent)
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.borderColor = C.border)
            }
          >
            <span style={s.badge(n.category)}>{n.category || "Other"}</span>
            <span style={s.recentSnippet}>
              {n.summary
                ? n.summary.slice(0, 100) + (n.summary.length > 100 ? "…" : "")
                : "No summary available"}
            </span>
            <span style={s.recentDate}>{relativeDate(n.createdAt)}</span>
          </div>
        ))
      )}
    </div>
  );
}
