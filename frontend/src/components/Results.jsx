import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axiosInstance from "../axiosInstance";
import MatchScoreCard from "./MatchScoreCard";
import NoticeChatbot from "./NoticeChatbot";

const C = {
  bg: "#070c18",
  surface: "#0d1929",
  border: "#1c3251",
  accent: "#f97316",
  text: "#e4ecf7",
  muted: "#5e7ea8",
  danger: "#f43f5e",
  dangerBg: "#4c051922",
  warn: "#fbbf24",
  warnBg: "#451a0322",
  success: "#10b981",
  successBg: "#02261e22",
};

// ── Category → colour mapping ─────────────────────────────────────────────────
const CATEGORY_COLORS = {
  Scholarship:              { bg: "#052e16", text: "#4ade80",  border: "#166534" },
  Internship:               { bg: "#0c1a4d", text: "#93c5fd",  border: "#1e40af" },
  Placement:                { bg: "#2d1a4f", text: "#c4b5fd",  border: "#6d28d9" },
  Examination:              { bg: "#3b1313", text: "#fca5a5",  border: "#991b1b" },
  Competition:              { bg: "#1c1007", text: "#fcd34d",  border: "#92400e" },
  Workshop:                 { bg: "#0b2020", text: "#6ee7b7",  border: "#065f46" },
  Event:                    { bg: "#1a0f2e", text: "#e879f9",  border: "#7e22ce" },
  "Academic Opportunity":   { bg: "#0c2340", text: "#7dd3fc",  border: "#075985" },
  "Government Opportunity": { bg: "#1a2a0a", text: "#bef264",  border: "#3f6212" },
  "General Notice":         { bg: "#1a1a2e", text: "#a5b4fc",  border: "#3730a3" },
  // Legacy values
  Exam:   { bg: "#3b1313", text: "#fca5a5", border: "#991b1b" },
  Fee:    { bg: "#1c1007", text: "#fcd34d", border: "#92400e" },
  Hostel: { bg: "#0c2340", text: "#7dd3fc", border: "#075985" },
  Other:  { bg: "#1a1a2e", text: "#a5b4fc", border: "#3730a3" },
};

function Skeleton({ width = "100%", height = 16, style = {} }) {
  return (
    <div
      style={{
        width,
        height,
        borderRadius: 6,
        background: "linear-gradient(90deg, #0d1929 25%, #1c3251 50%, #0d1929 75%)",
        backgroundSize: "200% 100%",
        animation: "shimmer 1.4s infinite",
        ...style,
      }}
    />
  );
}

function CategoryBadge({ category }) {
  const colors = CATEGORY_COLORS[category] || CATEGORY_COLORS["General Notice"];
  return (
    <span
      style={{
        display: "inline-block",
        fontSize: 11,
        fontWeight: 700,
        letterSpacing: "0.6px",
        textTransform: "uppercase",
        padding: "3px 10px",
        borderRadius: 20,
        background: colors.bg,
        color: colors.text,
        border: `1px solid ${colors.border}`,
      }}
    >
      {category || "General Notice"}
    </span>
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
      fontFamily: "'DM Sans', system-ui, sans-serif",
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
    // Dates
    dateRow: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      padding: "9px 0",
      borderBottom: `1px solid ${C.border}`,
      fontSize: 14,
      gap: 12,
    },
    dateLabel: { color: C.muted, flex: 1 },
    dateBadgeDeadline: {
      fontWeight: 600,
      color: C.danger,
      background: C.dangerBg,
      padding: "2px 10px",
      borderRadius: 6,
      fontSize: 13,
      flexShrink: 0,
    },
    dateBadgeRegular: {
      fontWeight: 600,
      color: C.warn,
      background: C.warnBg,
      padding: "2px 10px",
      borderRadius: 6,
      fontSize: 13,
      flexShrink: 0,
    },
    // Eligibility
    eligItem: {
      display: "flex",
      alignItems: "flex-start",
      gap: 10,
      padding: "10px 0",
      borderBottom: `1px solid ${C.border}`,
      fontSize: 14,
    },
    // Documents
    docItem: {
      display: "flex",
      alignItems: "center",
      gap: 8,
      padding: "8px 0",
      borderBottom: `1px solid ${C.border}`,
      fontSize: 14,
      color: C.text,
    },
    // Links / contacts
    linkItem: {
      display: "flex",
      alignItems: "center",
      gap: 8,
      padding: "6px 0",
      fontSize: 14,
    },
    linkAnchor: {
      color: "#60a5fa",
      textDecoration: "none",
      fontWeight: 500,
      wordBreak: "break-all",
    },
    contactItem: {
      display: "flex",
      alignItems: "center",
      gap: 8,
      padding: "6px 0",
      fontSize: 14,
      color: C.text,
    },
    // Uncertainties
    uncertaintyBox: {
      background: "#2d1f00",
      border: `1px solid ${C.warn}44`,
      borderRadius: 12,
      padding: "16px 20px",
      marginBottom: 16,
      width: "100%",
      maxWidth: 680,
      boxSizing: "border-box",
    },
    // CTA
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

  // ── Loading skeleton ──────────────────────────────────────────────────────
  if (loading) {
    return (
      <div style={s.page}>
        <style>{`@keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }`}</style>
        <div style={s.topBar}>
          <span style={s.logo} onClick={() => navigate("/")}>Notice2Action</span>
          <button style={s.backBtn} onClick={() => navigate("/")}>← Home</button>
        </div>
        {["Header", "Summary", "Dates", "Eligibility", "Documents"].map((sec) => (
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

  // ── Error state ────────────────────────────────────────────────────────────
  if (error) {
    return (
      <div style={s.page}>
        <div style={s.topBar}>
          <span style={s.logo} onClick={() => navigate("/")}>Notice2Action</span>
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

  // ── Derived data ───────────────────────────────────────────────────────────
  // Support both new importantDates and legacy deadlines
  const dates =
    notice.importantDates && notice.importantDates.length > 0
      ? notice.importantDates
      : (notice.deadlines || []).map((d) => ({
          type:       d.label,
          date:       d.date,
          source:     "",
          isDeadline: true,
        }));

  const eligibility   = notice.eligibility   || [];
  const documents     = notice.documents     || [];
  const links         = notice.links         || [];
  const contacts      = notice.contacts      || [];
  const uncertainties = notice.uncertainties || [];

  // ── Results ────────────────────────────────────────────────────────────────
  return (
    <div style={s.page}>
      <style>{`@keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }`}</style>

      {/* Top bar */}
      <div style={s.topBar}>
        <span style={s.logo} onClick={() => navigate("/")}>Notice2Action</span>
        <button style={s.backBtn} onClick={() => navigate("/")}>← Home</button>
      </div>

      {/* ── Header: category badge + org + title ─── */}
      <div style={{ ...s.card, marginBottom: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", marginBottom: notice.title ? 10 : 0 }}>
          <CategoryBadge category={notice.category} />
          {notice.organization && (
            <span style={{ fontSize: 13, color: C.muted }}>{notice.organization}</span>
          )}
        </div>
        {notice.title && (
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: C.text, lineHeight: 1.4 }}>
            {notice.title}
          </h2>
        )}
      </div>

      {/* ── Summary ─────────────────────────────── */}
      <div style={s.card}>
        <div style={s.cardTitle}>📄 Summary</div>
        {notice.summary ? (
          <p style={s.summaryText}>{notice.summary}</p>
        ) : (
          <p style={s.emptyNote}>No summary was generated for this notice.</p>
        )}
      </div>

      {/* ── Match Score (Phase 4 P2) ─────────────── */}
      <MatchScoreCard notice={notice} />

      {/* ── Important Dates ──────────────────────── */}
      <div style={s.card}>
        <div style={s.cardTitle}>⏰ Important Dates</div>
        {dates.length > 0 ? (
          dates.map((d, i) => (
            <div
              key={i}
              style={{
                ...s.dateRow,
                ...(i === dates.length - 1 ? { borderBottom: "none" } : {}),
              }}
            >
              <span style={s.dateLabel}>{d.type}</span>
              <span style={d.isDeadline ? s.dateBadgeDeadline : s.dateBadgeRegular}>
                {d.isDeadline ? "🔴 " : ""}{d.date}
              </span>
            </div>
          ))
        ) : (
          <p style={s.emptyNote}>No specific dates were found in this notice.</p>
        )}
      </div>

      {/* ── Eligibility ──────────────────────────── */}
      <div style={s.card}>
        <div style={s.cardTitle}>👥 Who This Applies To</div>
        {eligibility.length > 0 ? (
          eligibility.map((e, i) => {
            const isObj = typeof e === "object" && e !== null;
            return (
              <div
                key={i}
                style={{
                  ...s.eligItem,
                  ...(i === eligibility.length - 1 ? { borderBottom: "none" } : {}),
                }}
              >
                {isObj ? (
                  <>
                    <span style={{ fontSize: 15, flexShrink: 0, marginTop: 1 }}>
                      {e.isMandatory !== false ? "🔒" : "📌"}
                    </span>
                    <div>
                      <div style={{ color: C.muted, fontSize: 12, marginBottom: 2 }}>
                        {e.criterion}
                      </div>
                      <div style={{ color: C.text, fontWeight: 500 }}>{e.value}</div>
                    </div>
                  </>
                ) : (
                  <>
                    <span style={{ color: C.success, marginTop: 1 }}>✓</span>
                    <span>{e}</span>
                  </>
                )}
              </div>
            );
          })
        ) : (
          <p style={s.emptyNote}>Eligibility details were not specified in this notice.</p>
        )}
      </div>

      {/* ── Documents Needed ─────────────────────── */}
      {documents.length > 0 && (
        <div style={s.card}>
          <div style={s.cardTitle}>📎 Documents Needed</div>
          {documents.map((doc, i) => (
            <div
              key={i}
              style={{
                ...s.docItem,
                ...(i === documents.length - 1 ? { borderBottom: "none" } : {}),
              }}
            >
              <span style={{ fontSize: 16, flexShrink: 0 }}>
                {doc.required ? "📋" : "📄"}
              </span>
              <div style={{ flex: 1 }}>
                <span style={{ fontWeight: 500 }}>{doc.name}</span>
              </div>
              {doc.required && (
                <span
                  style={{
                    fontSize: 11,
                    color: C.danger,
                    background: C.dangerBg,
                    borderRadius: 4,
                    padding: "1px 6px",
                    fontWeight: 600,
                    flexShrink: 0,
                  }}
                >
                  Required
                </span>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ── Links & Contacts ─────────────────────── */}
      {(links.length > 0 || contacts.length > 0) && (
        <div style={s.card}>
          {links.length > 0 && (
            <>
              <div style={s.cardTitle}>🔗 Official Links</div>
              {links.map((l, i) => (
                <div key={i} style={s.linkItem}>
                  <span style={{ color: C.muted, fontSize: 13 }}>↗</span>
                  <a
                    href={l.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={s.linkAnchor}
                  >
                    {l.label || l.url}
                  </a>
                </div>
              ))}
            </>
          )}
          {contacts.length > 0 && (
            <>
              <div style={{ ...s.cardTitle, marginTop: links.length > 0 ? 18 : 0 }}>
                📞 Contact
              </div>
              {contacts.map((c, i) => (
                <div key={i} style={s.contactItem}>
                  <span style={{ fontSize: 16 }}>
                    {c.type === "email" ? "✉️" : c.type === "phone" ? "📱" : "🏢"}
                  </span>
                  <span>{c.value}</span>
                  <span style={{ fontSize: 11, color: C.muted, textTransform: "capitalize", marginLeft: 4 }}>
                    ({c.type})
                  </span>
                </div>
              ))}
            </>
          )}
        </div>
      )}

      {/* ── Uncertainties warning ────────────────── */}
      {uncertainties.length > 0 && (
        <div style={s.uncertaintyBox}>
          <div
            style={{
              fontWeight: 700,
              fontSize: 13,
              color: C.warn,
              marginBottom: 10,
              textTransform: "uppercase",
              letterSpacing: "0.6px",
            }}
          >
            ⚠️ Verify Before Applying
          </div>
          {uncertainties.map((u, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: 8,
                fontSize: 13,
                color: "#fde68a",
                lineHeight: 1.5,
                marginBottom: i === uncertainties.length - 1 ? 0 : 6,
              }}
            >
              <span style={{ flexShrink: 0 }}>•</span>
              <span>{u}</span>
            </div>
          ))}
        </div>
      )}

      {/* ── CTA ──────────────────────────────────── */}
      <button
        style={s.checklistBtn}
        onClick={() => navigate(`/checklist/${id}`)}
      >
        Open Action Checklist →
      </button>

      {/* ── Ask This Notice chatbot (Phase 4 P3) ── */}
      <NoticeChatbot noticeId={id} noticeTitle={notice.title} />
    </div>
  );
}
