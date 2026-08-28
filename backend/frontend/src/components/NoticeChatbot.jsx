/**
 * NoticeChatbot.jsx — Phase 4 Priority 3
 *
 * "Ask This Notice" AI chat panel on the Results page.
 * Grounded strictly in the notice's text — no hallucination.
 *
 * Features:
 *  • Opening greeting with the notice title
 *  • Quick-question suggestion pills
 *  • Message thread (user/AI bubbles)
 *  • Loading spinner with cancel-safe state
 *  • Send on Enter (Shift+Enter = newline), or Send button
 *  • Last 6 turns of history sent with every request
 *  • Reads student profile from localStorage for personalised answers
 */

import { useState, useRef, useEffect } from 'react';
import axiosInstance from '../axiosInstance';
import { getProfile } from '../store/profileStore';

const C = {
  bg:       '#070c18',
  surface:  '#0d1929',
  border:   '#1c3251',
  accent:   '#f97316',
  text:     '#e4ecf7',
  muted:    '#5e7ea8',
  ai:       '#0e2340',
  aiBorder: '#1c4070',
  user:     '#1c2e08',
  userBorder:'#2d4a10',
  danger:   '#f43f5e',
};

const QUICK_QUESTIONS = [
  'Am I eligible for this?',
  'What documents do I need?',
  'When is the deadline?',
  'What actions do I need to take?',
  'Who issued this notice?',
];

function TypingDots() {
  return (
    <span style={{ display: 'inline-flex', gap: 4, alignItems: 'center', padding: '2px 0' }}>
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          style={{
            width: 7,
            height: 7,
            borderRadius: '50%',
            background: C.muted,
            display: 'inline-block',
            animation: `chatBounce 1.2s ${i * 0.2}s infinite ease-in-out`,
          }}
        />
      ))}
    </span>
  );
}

function Bubble({ role, content, isTyping }) {
  const isAI = role === 'ai';
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: isAI ? 'flex-start' : 'flex-end',
        marginBottom: 10,
      }}
    >
      <div
        style={{
          maxWidth: '82%',
          background:    isAI ? C.ai   : C.user,
          border:        `1px solid ${isAI ? C.aiBorder : C.userBorder}`,
          borderRadius:  isAI ? '4px 14px 14px 14px' : '14px 4px 14px 14px',
          padding:       '10px 14px',
          fontSize:      14,
          lineHeight:    1.6,
          color:         C.text,
          whiteSpace:    'pre-wrap',
          wordBreak:     'break-word',
        }}
      >
        {isTyping ? <TypingDots /> : content}
      </div>
    </div>
  );
}

export default function NoticeChatbot({ noticeId, noticeTitle }) {
  const [open,     setOpen]     = useState(false);
  const [input,    setInput]    = useState('');
  const [messages, setMessages] = useState([]);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState('');

  const bottomRef   = useRef(null);
  const inputRef    = useRef(null);
  const loadingRef  = useRef(false); // guard against double-sends

  // Greeting injected once when the panel first opens
  const greeting = `Hi! I'm your Notice Assistant 🤖\nAsk me anything about "${noticeTitle || 'this notice'}" — eligibility, deadlines, documents, or actions needed.`;

  function handleOpen() {
    setOpen(true);
    if (messages.length === 0) {
      setMessages([{ role: 'ai', content: greeting }]);
    }
    setTimeout(() => inputRef.current?.focus(), 100);
  }

  // Auto-scroll to latest message
  useEffect(() => {
    if (open) bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, open]);

  async function send(text) {
    const msg = (text ?? input).trim();
    if (!msg || loadingRef.current) return;

    setInput('');
    setError('');
    loadingRef.current = true;
    setLoading(true);

    const userMsg   = { role: 'user', content: msg };
    const typingMsg = { role: 'ai',   content: '',  isTyping: true };

    setMessages((prev) => [...prev, userMsg, typingMsg]);

    // Build history from current messages (exclude greeting if it's the first)
    const history = messages
      .filter((m) => !m.isTyping)
      .slice(-6)
      .map((m) => ({ role: m.role, content: m.content }));

    try {
      const profile = getProfile();
      const res = await axiosInstance.post(`/notice/${noticeId}/chat`, {
        message:        msg,
        history,
        studentProfile: profile,
      });

      const reply = res.data?.data?.reply || "Sorry, I couldn't get a response.";
      setMessages((prev) => [
        ...prev.filter((m) => !m.isTyping),
        { role: 'ai', content: reply },
      ]);
    } catch (err) {
      const errMsg =
        err.response?.data?.message ||
        'Something went wrong. Please try again.';
      setError(errMsg);
      setMessages((prev) => prev.filter((m) => !m.isTyping));
    } finally {
      loadingRef.current = false;
      setLoading(false);
    }
  }

  function handleKey(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  }

  // ── Collapsed trigger button ───────────────────────────────────────────────
  if (!open) {
    return (
      <div
        style={{
          width: '100%',
          maxWidth: 680,
          marginTop: 12,
        }}
      >
        <button
          onClick={handleOpen}
          style={{
            width: '100%',
            background: C.surface,
            border: `1px dashed ${C.border}`,
            borderRadius: 14,
            color: C.muted,
            fontSize: 14,
            padding: '16px 20px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            transition: 'border-color .15s, color .15s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = C.accent;
            e.currentTarget.style.color = C.text;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = C.border;
            e.currentTarget.style.color = C.muted;
          }}
        >
          <span style={{ fontSize: 20 }}>💬</span>
          <span>
            <strong style={{ color: C.text }}>Ask This Notice</strong>
            <span style={{ fontSize: 13, marginLeft: 8 }}>
              — Get instant answers about eligibility, deadlines &amp; more
            </span>
          </span>
          <span style={{ marginLeft: 'auto', fontSize: 18 }}>›</span>
        </button>
      </div>
    );
  }

  // ── Expanded chat panel ────────────────────────────────────────────────────
  return (
    <div
      style={{
        width: '100%',
        maxWidth: 680,
        background: C.surface,
        border: `1px solid ${C.border}`,
        borderRadius: 16,
        marginTop: 12,
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <style>{`
        @keyframes chatBounce {
          0%, 80%, 100% { transform: scale(0.7); opacity: .5; }
          40%            { transform: scale(1.0); opacity: 1;  }
        }
      `}</style>

      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '14px 20px',
          borderBottom: `1px solid ${C.border}`,
          background: C.ai,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 18 }}>💬</span>
          <div>
            <div style={{ fontWeight: 700, fontSize: 14, color: C.text }}>
              Ask This Notice
            </div>
            <div style={{ fontSize: 11, color: C.muted }}>
              Answers grounded strictly in the notice text
            </div>
          </div>
        </div>
        <button
          onClick={() => setOpen(false)}
          style={{
            background: 'none',
            border: 'none',
            color: C.muted,
            fontSize: 20,
            cursor: 'pointer',
            lineHeight: 1,
            padding: '0 4px',
          }}
          title="Collapse"
        >
          ×
        </button>
      </div>

      {/* Message thread */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '16px 16px 8px',
          minHeight: 220,
          maxHeight: 400,
        }}
      >
        {messages.map((m, i) => (
          <Bubble key={i} role={m.role} content={m.content} isTyping={m.isTyping} />
        ))}

        {/* Error */}
        {error && (
          <div
            style={{
              fontSize: 13,
              color: C.danger,
              background: `${C.danger}11`,
              border: `1px solid ${C.danger}33`,
              borderRadius: 8,
              padding: '8px 12px',
              marginBottom: 8,
            }}
          >
            ⚠️ {error}
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Quick-question pills — shown only before any user message */}
      {messages.filter((m) => m.role === 'user').length === 0 && (
        <div
          style={{
            padding: '4px 16px 12px',
            display: 'flex',
            flexWrap: 'wrap',
            gap: 6,
          }}
        >
          {QUICK_QUESTIONS.map((q) => (
            <button
              key={q}
              onClick={() => send(q)}
              disabled={loading}
              style={{
                background: 'transparent',
                border: `1px solid ${C.border}`,
                borderRadius: 20,
                color: C.muted,
                fontSize: 12,
                padding: '4px 12px',
                cursor: loading ? 'not-allowed' : 'pointer',
                transition: 'border-color .15s, color .15s',
              }}
              onMouseEnter={(e) => {
                if (!loading) {
                  e.currentTarget.style.borderColor = C.accent;
                  e.currentTarget.style.color = C.text;
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = C.border;
                e.currentTarget.style.color = C.muted;
              }}
            >
              {q}
            </button>
          ))}
        </div>
      )}

      {/* Input row */}
      <div
        style={{
          display: 'flex',
          gap: 8,
          padding: '10px 16px 14px',
          borderTop: `1px solid ${C.border}`,
          alignItems: 'flex-end',
        }}
      >
        <textarea
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKey}
          placeholder="Ask about eligibility, deadlines, documents…"
          disabled={loading}
          rows={1}
          style={{
            flex: 1,
            background: C.bg,
            border: `1px solid ${C.border}`,
            borderRadius: 10,
            color: C.text,
            fontSize: 14,
            padding: '9px 12px',
            resize: 'none',
            outline: 'none',
            fontFamily: "'DM Sans', system-ui, sans-serif",
            lineHeight: 1.5,
            maxHeight: 100,
            overflowY: 'auto',
            opacity: loading ? 0.6 : 1,
          }}
        />
        <button
          onClick={() => send()}
          disabled={loading || !input.trim()}
          style={{
            background: loading || !input.trim() ? C.border : C.accent,
            border: 'none',
            borderRadius: 10,
            color: '#fff',
            fontWeight: 700,
            fontSize: 14,
            padding: '10px 18px',
            cursor: loading || !input.trim() ? 'not-allowed' : 'pointer',
            flexShrink: 0,
            transition: 'background .15s',
          }}
        >
          {loading ? '…' : 'Send'}
        </button>
      </div>
    </div>
  );
}
