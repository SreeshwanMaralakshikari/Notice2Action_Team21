/**
 * MatchScoreCard.jsx — Phase 4 Priority 2
 *
 * Shows:
 *  • Circular SVG score gauge (0-100)
 *  • Eligibility headline + summary
 *  • Expandable criterion-by-criterion breakdown
 *  • "Edit Profile" modal (CGPA, year, branch, graduation year, interests, skills)
 *
 * All state is client-side — no backend, no auth.
 */

import { useState } from 'react';
import { getProfile, saveProfile } from '../store/profileStore';
import { evaluatePersonalizedEligibility } from '../utils/eligibilityEval';
import { calculateMatchScore } from '../utils/matchScore';

const C = {
  bg:        '#070c18',
  surface:   '#0d1929',
  border:    '#1c3251',
  accent:    '#f97316',
  text:      '#e4ecf7',
  muted:     '#5e7ea8',
  danger:    '#f43f5e',
  dangerBg:  '#4c051922',
  warn:      '#fbbf24',
  success:   '#10b981',
  successBg: '#02261e22',
};

const STATUS_META = {
  ELIGIBLE:      { color: C.success,  ring: '#10b981', glow: '#10b98133' },
  INCONCLUSIVE:  { color: C.warn,     ring: '#fbbf24', glow: '#fbbf2433' },
  NOT_ELIGIBLE:  { color: C.danger,   ring: '#f43f5e', glow: '#f43f5e33' },
};

const VERDICT_ICON = { pass: '✅', fail: '❌', unknown: '⚠️' };

const YEAR_OPTIONS    = ['1st Year', '2nd Year', '3rd Year', '4th Year'];
const BRANCH_OPTIONS  = ['CSE', 'IT', 'ECE', 'EEE', 'ME', 'CE', 'CHEM', 'BT', 'Other'];
const GRAD_YEAR_RANGE = Array.from({ length: 8 }, (_, i) => (new Date().getFullYear() + i).toString());
const INTEREST_OPTIONS = ['Scholarship', 'Internship', 'Placement', 'Research', 'Competition', 'Workshop'];

/** SVG circular arc gauge */
function ScoreArc({ score, color, glow }) {
  const R   = 52;         // radius
  const CX  = 64;         // centre x
  const CY  = 64;         // centre y
  const STROKE_W = 10;
  const CIRCUMFERENCE = 2 * Math.PI * R;
  const pct = Math.max(0, Math.min(100, score)) / 100;
  const dash = pct * CIRCUMFERENCE;

  return (
    <svg width="128" height="128" viewBox="0 0 128 128" style={{ filter: `drop-shadow(0 0 10px ${glow})` }}>
      {/* Track */}
      <circle
        cx={CX} cy={CY} r={R}
        fill="none"
        stroke={C.border}
        strokeWidth={STROKE_W}
      />
      {/* Arc — starts at top (−90°) */}
      <circle
        cx={CX} cy={CY} r={R}
        fill="none"
        stroke={color}
        strokeWidth={STROKE_W}
        strokeLinecap="round"
        strokeDasharray={`${dash} ${CIRCUMFERENCE}`}
        transform={`rotate(-90 ${CX} ${CY})`}
        style={{ transition: 'stroke-dasharray 0.8s ease' }}
      />
      {/* Score text */}
      <text
        x={CX} y={CY - 6}
        textAnchor="middle"
        dominantBaseline="middle"
        fill={color}
        fontSize="26"
        fontWeight="800"
        fontFamily="'DM Sans', system-ui, sans-serif"
      >
        {score}
      </text>
      <text
        x={CX} y={CY + 16}
        textAnchor="middle"
        dominantBaseline="middle"
        fill={C.muted}
        fontSize="11"
        fontFamily="'DM Sans', system-ui, sans-serif"
      >
        / 100
      </text>
    </svg>
  );
}

/** Tag pill used for interests/skills in the edit modal */
function TagPill({ label, active, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        padding: '4px 12px',
        borderRadius: 20,
        border: `1px solid ${active ? C.accent : C.border}`,
        background: active ? `${C.accent}22` : 'transparent',
        color: active ? C.accent : C.muted,
        fontSize: 13,
        cursor: 'pointer',
        fontWeight: active ? 600 : 400,
        transition: 'all .15s',
      }}
    >
      {label}
    </button>
  );
}

/** Edit Profile modal overlay */
function ProfileModal({ profile, onSave, onClose }) {
  const [draft, setDraft] = useState({ ...profile });
  const [skillInput, setSkillInput] = useState('');

  function set(key, val) {
    setDraft((prev) => ({ ...prev, [key]: val }));
  }

  function toggleInterest(interest) {
    const lower = interest.toLowerCase();
    const next  = draft.interests.includes(lower)
      ? draft.interests.filter((i) => i !== lower)
      : [...draft.interests, lower];
    set('interests', next);
  }

  function addSkill(e) {
    e.preventDefault();
    const sk = skillInput.trim().toLowerCase();
    if (sk && !draft.skills.includes(sk)) {
      set('skills', [...draft.skills, sk]);
    }
    setSkillInput('');
  }

  function removeSkill(sk) {
    set('skills', draft.skills.filter((s) => s !== sk));
  }

  const inputStyle = {
    width: '100%',
    background: C.bg,
    border: `1px solid ${C.border}`,
    borderRadius: 8,
    color: C.text,
    fontSize: 14,
    padding: '9px 12px',
    boxSizing: 'border-box',
    outline: 'none',
  };

  const labelStyle = {
    display: 'block',
    fontSize: 12,
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: '0.6px',
    color: C.muted,
    marginBottom: 6,
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(7,12,24,.85)',
        backdropFilter: 'blur(4px)',
        zIndex: 100,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: C.surface,
          border: `1px solid ${C.border}`,
          borderRadius: 20,
          padding: 28,
          width: '100%',
          maxWidth: 460,
          maxHeight: '90vh',
          overflowY: 'auto',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 22 }}>
          <h3 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: C.text }}>
            👤 Your Profile
          </h3>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: C.muted, fontSize: 20, cursor: 'pointer', lineHeight: 1 }}
          >
            ×
          </button>
        </div>

        {/* CGPA */}
        <div style={{ marginBottom: 18 }}>
          <label style={labelStyle}>CGPA</label>
          <input
            type="number"
            min="0" max="10" step="0.1"
            value={draft.cgpa}
            onChange={(e) => set('cgpa', parseFloat(e.target.value) || 0)}
            style={inputStyle}
          />
        </div>

        {/* Year */}
        <div style={{ marginBottom: 18 }}>
          <label style={labelStyle}>Year of Study</label>
          <select
            value={draft.year}
            onChange={(e) => set('year', e.target.value)}
            style={inputStyle}
          >
            {YEAR_OPTIONS.map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>

        {/* Branch */}
        <div style={{ marginBottom: 18 }}>
          <label style={labelStyle}>Branch / Department</label>
          <select
            value={draft.branch}
            onChange={(e) => set('branch', e.target.value)}
            style={inputStyle}
          >
            {BRANCH_OPTIONS.map((b) => (
              <option key={b} value={b}>{b}</option>
            ))}
          </select>
        </div>

        {/* Graduation Year */}
        <div style={{ marginBottom: 18 }}>
          <label style={labelStyle}>Expected Graduation Year</label>
          <select
            value={draft.graduationYear}
            onChange={(e) => set('graduationYear', parseInt(e.target.value))}
            style={inputStyle}
          >
            {GRAD_YEAR_RANGE.map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>

        {/* Interests */}
        <div style={{ marginBottom: 18 }}>
          <label style={labelStyle}>Interests</label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {INTEREST_OPTIONS.map((interest) => (
              <TagPill
                key={interest}
                label={interest}
                active={draft.interests.includes(interest.toLowerCase())}
                onClick={() => toggleInterest(interest)}
              />
            ))}
          </div>
        </div>

        {/* Skills */}
        <div style={{ marginBottom: 24 }}>
          <label style={labelStyle}>Skills (type + Enter)</label>
          <form onSubmit={addSkill} style={{ display: 'flex', gap: 8 }}>
            <input
              value={skillInput}
              onChange={(e) => setSkillInput(e.target.value)}
              placeholder="e.g. python, react, java"
              style={{ ...inputStyle, flex: 1 }}
            />
            <button
              type="submit"
              style={{
                background: C.accent,
                border: 'none',
                borderRadius: 8,
                color: '#fff',
                fontWeight: 700,
                fontSize: 14,
                padding: '0 16px',
                cursor: 'pointer',
                flexShrink: 0,
              }}
            >
              Add
            </button>
          </form>
          {draft.skills.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
              {draft.skills.map((sk) => (
                <span
                  key={sk}
                  style={{
                    background: `${C.accent}22`,
                    border: `1px solid ${C.accent}44`,
                    color: C.accent,
                    borderRadius: 12,
                    fontSize: 12,
                    padding: '2px 10px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                  }}
                >
                  {sk}
                  <span
                    style={{ cursor: 'pointer', opacity: 0.7 }}
                    onClick={() => removeSkill(sk)}
                  >
                    ×
                  </span>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Save */}
        <button
          onClick={() => { onSave(draft); onClose(); }}
          style={{
            width: '100%',
            background: C.accent,
            border: 'none',
            borderRadius: 10,
            color: '#fff',
            fontWeight: 700,
            fontSize: 15,
            padding: '12px 0',
            cursor: 'pointer',
          }}
        >
          Save Profile & Recalculate
        </button>
      </div>
    </div>
  );
}

/** Main exported component */
export default function MatchScoreCard({ notice }) {
  const [profile,       setProfile]       = useState(() => getProfile());
  const [showModal,     setShowModal]      = useState(false);
  const [showReasons,   setShowReasons]    = useState(false);

  // Derived — recalculated whenever profile changes
  const evalResult = evaluatePersonalizedEligibility(profile, notice.eligibility || []);
  const score      = calculateMatchScore(profile, notice, evalResult);
  const meta       = STATUS_META[evalResult.status] || STATUS_META.INCONCLUSIVE;

  function handleSave(updatedProfile) {
    saveProfile(updatedProfile);
    setProfile(updatedProfile);
  }

  return (
    <>
      {showModal && (
        <ProfileModal
          profile={profile}
          onSave={handleSave}
          onClose={() => setShowModal(false)}
        />
      )}

      <div
        style={{
          width: '100%',
          maxWidth: 680,
          background: C.surface,
          border: `1px solid ${C.border}`,
          borderRadius: 16,
          padding: 24,
          marginBottom: 16,
          boxSizing: 'border-box',
        }}
      >
        {/* Card header row */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 20,
          }}
        >
          <span
            style={{
              fontWeight: 700,
              fontSize: 13,
              textTransform: 'uppercase',
              letterSpacing: '0.8px',
              color: C.muted,
            }}
          >
            🎯 Match Score
          </span>
          <button
            onClick={() => setShowModal(true)}
            style={{
              background: 'transparent',
              border: `1px solid ${C.border}`,
              borderRadius: 8,
              color: C.muted,
              fontSize: 12,
              padding: '4px 12px',
              cursor: 'pointer',
            }}
          >
            ✏️ Edit Profile
          </button>
        </div>

        {/* Gauge + headline */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 24,
            flexWrap: 'wrap',
          }}
        >
          <ScoreArc score={score} color={meta.ring} glow={meta.glow} />

          <div style={{ flex: 1, minWidth: 180 }}>
            <div
              style={{
                fontSize: 18,
                fontWeight: 800,
                color: meta.color,
                marginBottom: 6,
                lineHeight: 1.2,
              }}
            >
              {evalResult.headline}
            </div>
            <p
              style={{
                margin: 0,
                fontSize: 13,
                color: C.muted,
                lineHeight: 1.5,
              }}
            >
              {evalResult.summary}
            </p>

            {/* Profile snapshot */}
            <div
              style={{
                marginTop: 10,
                fontSize: 12,
                color: C.muted,
                display: 'flex',
                gap: 12,
                flexWrap: 'wrap',
              }}
            >
              <span>📊 CGPA {profile.cgpa}</span>
              <span>📅 {profile.year}</span>
              <span>🎓 {profile.branch}</span>
            </div>
          </div>
        </div>

        {/* Expandable reasons */}
        {evalResult.reasons.length > 0 && (
          <div style={{ marginTop: 18 }}>
            <button
              onClick={() => setShowReasons((v) => !v)}
              style={{
                background: 'transparent',
                border: 'none',
                color: C.muted,
                fontSize: 13,
                cursor: 'pointer',
                padding: 0,
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <span style={{ transition: 'transform .2s', display: 'inline-block', transform: showReasons ? 'rotate(90deg)' : 'rotate(0deg)' }}>▶</span>
              {showReasons ? 'Hide' : 'Show'} criterion-by-criterion breakdown
            </button>

            {showReasons && (
              <div
                style={{
                  marginTop: 12,
                  borderTop: `1px solid ${C.border}`,
                  paddingTop: 12,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 10,
                }}
              >
                {evalResult.reasons.map((r, i) => (
                  <div
                    key={i}
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: 10,
                      fontSize: 13,
                      padding: '8px 10px',
                      borderRadius: 8,
                      background:
                        r.verdict === 'pass'    ? `${C.success}10` :
                        r.verdict === 'fail'    ? `${C.danger}10`  :
                        `${C.warn}08`,
                    }}
                  >
                    <span style={{ flexShrink: 0, fontSize: 15 }}>
                      {VERDICT_ICON[r.verdict] || '⚠️'}
                    </span>
                    <div>
                      <div style={{ fontWeight: 600, color: C.text, marginBottom: 2 }}>
                        {r.criterion}
                      </div>
                      <div style={{ color: C.muted }}>{r.detail}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}
