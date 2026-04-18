/**
 * GmailImport.jsx
 *
 * Auto-import emails from a Gmail account via the backend IMAP endpoint.
 * Renders a self-contained collapsible panel that fits inside the Email Inbox card.
 *
 * Props:
 *   gmailAddress  string   pre-fill the email field (from OnboardingForm)
 *   onImport      (emails: {subject, body}[]) => void   called when user confirms import
 */

import React, { useState, useRef } from 'react';

// ─── Colour tokens (light theme, matches App.jsx) ────────────────────────────

const C = {
  bg:      '#f8f7f4',
  card:    '#ffffff',
  border:  '#e2e8f0',
  indigo:  '#4f46e5',
  emerald: '#10b981',
  rose:    '#f43f5e',
  amber:   '#f59e0b',
  slate:   '#64748b',
  text:    '#1e293b',
  purple:  '#7c3aed',
};

// ─── Mini helpers ─────────────────────────────────────────────────────────────

const inputSt = {
  width: '100%', border: `1px solid ${C.border}`, borderRadius: 8,
  padding: '9px 12px', fontSize: 13, fontFamily: "'DM Sans', sans-serif",
  color: C.text, background: '#fff', outline: 'none',
  transition: 'border-color 0.15s, box-shadow 0.15s',
};

const labelSt = {
  display: 'block', fontSize: 11, fontWeight: 700, color: C.slate,
  textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 5,
};

function SpinnerIcon({ size = 14 }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      border: `2px solid ${C.indigo}33`,
      borderTop: `2px solid ${C.indigo}`,
      animation: 'gi-spin 0.7s linear infinite',
      flexShrink: 0,
    }} />
  );
}

// ─── GmailImport ──────────────────────────────────────────────────────────────

export default function GmailImport({ gmailAddress = '', onImport }) {
  // ui state
  const [open,    setOpen]    = useState(false);
  const [phase,   setPhase]   = useState('config'); // 'config' | 'loading' | 'results'

  // form
  const [email,    setEmail]    = useState(gmailAddress);
  const [password, setPassword] = useState('');
  const [count,    setCount]    = useState(15);
  const [showPass, setShowPass] = useState(false);

  // results
  const [fetched,   setFetched]   = useState([]);   // [{subject,sender,date,body}]
  const [selected,  setSelected]  = useState(new Set());
  const [error,     setError]     = useState('');
  const [loadMsg,   setLoadMsg]   = useState('Connecting to Gmail…');

  const loadTimerRef = useRef(null);

  // ── Animate loading message ────────────────────────────────────────────────
  const LOAD_MSGS = [
    'Connecting to Gmail…',
    'Authenticating via IMAP…',
    'Reading your inbox…',
    'Parsing email content…',
    'Almost there…',
  ];

  const startLoadAnim = () => {
    let i = 0;
    setLoadMsg(LOAD_MSGS[0]);
    loadTimerRef.current = setInterval(() => {
      i = (i + 1) % LOAD_MSGS.length;
      setLoadMsg(LOAD_MSGS[i]);
    }, 2200);
  };

  const stopLoadAnim = () => {
    clearInterval(loadTimerRef.current);
  };

  // ── Fetch handler ─────────────────────────────────────────────────────────
  const handleFetch = async () => {
    if (!email.trim())    { setError('Enter your Gmail address.'); return; }
    if (!password.trim()) { setError('Enter your App Password.'); return; }

    setError('');
    setPhase('loading');
    startLoadAnim();

    try {
      const res = await fetch('http://localhost:8000/api/fetch-emails', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          email_address: email.trim(),
          app_password:  password,
          max_emails:    count,
          folder:        'INBOX',
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || `Server error ${res.status}`);
      }

      stopLoadAnim();
      const emails = data.emails || [];
      setFetched(emails);
      setSelected(new Set(emails.map((_, i) => i)));
      setPhase('results');
    } catch (err) {
      stopLoadAnim();
      setError(err.message);
      setPhase('config');
    }
  };

  // ── Selection helpers ─────────────────────────────────────────────────────
  const toggleOne  = (i) => {
    const next = new Set(selected);
    if (next.has(i)) next.delete(i); else next.add(i);
    setSelected(next);
  };
  const selectAll  = () => setSelected(new Set(fetched.map((_, i) => i)));
  const selectNone = () => setSelected(new Set());

  // ── Confirm import ────────────────────────────────────────────────────────
  const handleImport = () => {
    const chosen = fetched
      .filter((_, i) => selected.has(i))
      .map(e => ({ subject: e.subject, body: e.body }));
    onImport(chosen);
    setPhase('config');
    setFetched([]);
    setSelected(new Set());
    setPassword('');
    setOpen(false);
  };

  const reset = () => {
    setPhase('config');
    setFetched([]);
    setSelected(new Set());
    setError('');
  };

  // ── Sender truncation helper ──────────────────────────────────────────────
  const parseSender = (raw) => {
    if (!raw) return '—';
    const match = raw.match(/^"?([^"<]+)"?\s*<?/);
    const name  = match ? match[1].trim() : raw;
    return name.length > 28 ? name.slice(0, 25) + '…' : name;
  };

  // ── Render ────────────────────────────────────────────────────────────────
  const selectedCount = selected.size;

  return (
    <>
      {/* ── Keyframes ── */}
      <style>{`
        @keyframes gi-spin { to { transform: rotate(360deg); } }
        @keyframes gi-fadein { from { opacity:0; transform:translateY(-6px); } to { opacity:1; transform:translateY(0); } }
        .gi-input:focus { border-color: ${C.indigo} !important; box-shadow: 0 0 0 3px ${C.indigo}22 !important; }
        .gi-row:hover { background: ${C.indigo}06 !important; }
        .gi-btn-primary {
          background: ${C.indigo}; color: #fff; border: none; border-radius: 9px;
          padding: 9px 20px; font-size: 13px; font-weight: 700;
          font-family: 'DM Sans',sans-serif; cursor: pointer;
          transition: background 0.15s, transform 0.1s;
          display: inline-flex; align-items: center; gap: 6px;
        }
        .gi-btn-primary:hover { background: #4338ca; transform: translateY(-1px); }
        .gi-btn-primary:disabled { background: ${C.border}; color: ${C.slate}; cursor: not-allowed; transform: none; }
        .gi-btn-ghost {
          background: none; border: 1px solid ${C.border}; border-radius: 9px;
          padding: 8px 16px; font-size: 12.5px; font-weight: 600;
          font-family: 'DM Sans',sans-serif; cursor: pointer; color: ${C.slate};
          transition: all 0.15s;
        }
        .gi-btn-ghost:hover { border-color: ${C.slate}; color: ${C.text}; }
        .gi-email-row { animation: gi-fadein 0.2s ease; }
      `}</style>

      {/* ── Toggle button (shown in email card header) ── */}
      <button
        onClick={() => { setOpen(o => !o); if (phase === 'results') reset(); }}
        style={{
          display:    'inline-flex', alignItems: 'center', gap: 6,
          padding:    '6px 13px', borderRadius: 8, cursor: 'pointer',
          fontSize:   12, fontWeight: 700, fontFamily: "'DM Sans', sans-serif",
          background: open ? C.indigo + '14' : C.bg,
          color:      open ? C.indigo : C.slate,
          border:     `1px solid ${open ? C.indigo + '40' : C.border}`,
          transition: 'all 0.15s',
        }}
      >
        {/* Gmail icon SVG */}
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
          <path d="M20 4H4C2.9 4 2 4.9 2 6v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2z" stroke="currentColor" strokeWidth="1.8" fill="none"/>
          <path d="M2 6l10 7 10-7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
        </svg>
        Auto-import Gmail
        <span style={{
          marginLeft: 2, fontSize: 10,
          transform: open ? 'rotate(180deg)' : 'none',
          transition: 'transform 0.2s',
          display: 'inline-block',
        }}>▾</span>
      </button>

      {/* ── Collapsible panel ── */}
      {open && (
        <div style={{
          marginTop: 10, border: `1px solid ${C.indigo}33`,
          borderRadius: 12, background: C.indigo + '05',
          overflow: 'hidden',
          animation: 'gi-fadein 0.22s ease',
        }}>

          {/* ─── Config phase ─────────────────────────────────────────────── */}
          {phase === 'config' && (
            <div style={{ padding: '18px 18px 16px' }}>
              {/* Title row */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: C.text }}>Import from Gmail</div>
                  <div style={{ fontSize: 11.5, color: C.slate, marginTop: 1 }}>
                    Fetches your latest emails via IMAP — no data stored
                  </div>
                </div>
                <a
                  href="https://support.google.com/accounts/answer/185833"
                  target="_blank"
                  rel="noreferrer"
                  style={{ fontSize: 11, color: C.indigo, textDecoration: 'none', whiteSpace: 'nowrap' }}
                >
                  Get App Password ↗
                </a>
              </div>

              {/* Form grid */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
                {/* Gmail address */}
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={labelSt}>Gmail Address</label>
                  <input
                    type="email"
                    className="gi-input"
                    style={inputSt}
                    placeholder="you@gmail.com"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleFetch()}
                  />
                </div>

                {/* App password */}
                <div>
                  <label style={labelSt}>App Password</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type={showPass ? 'text' : 'password'}
                      className="gi-input"
                      style={{ ...inputSt, fontFamily: showPass ? "'DM Sans',sans-serif" : 'monospace', letterSpacing: showPass ? 0 : '0.15em', paddingRight: 40 }}
                      placeholder="16-char app password"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleFetch()}
                    />
                    <button
                      onClick={() => setShowPass(s => !s)}
                      style={{
                        position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
                        background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, color: C.slate,
                      }}
                      title={showPass ? 'Hide' : 'Show'}
                    >{showPass ? '🙈' : '👁'}</button>
                  </div>
                </div>

                {/* Email count */}
                <div>
                  <label style={labelSt}>Emails to fetch</label>
                  <select
                    style={{ ...inputSt, cursor: 'pointer', appearance: 'none' }}
                    value={count}
                    onChange={e => setCount(+e.target.value)}
                  >
                    {[5, 10, 15, 20, 25, 30].map(n => (
                      <option key={n} value={n}>Last {n} emails</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Error */}
              {error && (
                <div style={{
                  fontSize: 12.5, color: C.rose,
                  background: C.rose + '0d', border: `1px solid ${C.rose}44`,
                  borderRadius: 8, padding: '8px 12px', marginBottom: 10,
                  lineHeight: 1.5,
                }}>
                  ⚠ {error}
                </div>
              )}

              {/* Info callout */}
              <div style={{
                fontSize: 11.5, color: C.slate,
                background: C.amber + '11', border: `1px solid ${C.amber}33`,
                borderRadius: 8, padding: '8px 12px', marginBottom: 12, lineHeight: 1.6,
              }}>
                💡 <strong>How to get an App Password:</strong>&ensp;
                Google Account → Security → 2-Step Verification → App Passwords → Create one for "Mail".
                Use the 16-character code above (not your real password).
              </div>

              {/* Action */}
              <button className="gi-btn-primary" onClick={handleFetch} style={{ width: '100%', justifyContent: 'center' }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                  <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
                </svg>
                Fetch Emails from Gmail
              </button>
            </div>
          )}

          {/* ─── Loading phase ────────────────────────────────────────────── */}
          {phase === 'loading' && (
            <div style={{
              padding: '32px 24px', display: 'flex', flexDirection: 'column',
              alignItems: 'center', gap: 14,
            }}>
              {/* Multi-ring spinner */}
              <div style={{ position: 'relative', width: 48, height: 48 }}>
                <div style={{
                  position: 'absolute', inset: 0, borderRadius: '50%',
                  border: `3px solid ${C.indigo}22`, borderTop: `3px solid ${C.indigo}`,
                  animation: 'gi-spin 0.8s linear infinite',
                }} />
                <div style={{
                  position: 'absolute', inset: 7, borderRadius: '50%',
                  border: `2px solid ${C.indigo}15`, borderTop: `2px solid ${C.purple}`,
                  animation: 'gi-spin 1.2s linear infinite reverse',
                }} />
                <div style={{
                  position: 'absolute', inset: 16, borderRadius: '50%',
                  background: C.indigo + '15',
                }} />
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: C.text, marginBottom: 4 }}>
                  {loadMsg}
                </div>
                <div style={{ fontSize: 12, color: C.slate }}>This takes a few seconds…</div>
              </div>

              {/* Animated dots bar */}
              <div style={{ display: 'flex', gap: 5 }}>
                {[0, 1, 2].map(i => (
                  <div key={i} style={{
                    width: 6, height: 6, borderRadius: '50%', background: C.indigo,
                    animation: `gi-spin ${0.8 + i * 0.2}s ease-in-out infinite alternate`,
                    opacity: 0.6,
                  }} />
                ))}
              </div>
            </div>
          )}

          {/* ─── Results phase ────────────────────────────────────────────── */}
          {phase === 'results' && (
            <div style={{ padding: '16px 18px 18px' }}>
              {/* Header row */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{
                    width: 20, height: 20, borderRadius: '50%',
                    background: C.emerald + '20', color: C.emerald,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 10, fontWeight: 700,
                  }}>✓</div>
                  <span style={{ fontSize: 13, fontWeight: 700, color: C.text }}>
                    {fetched.length} email{fetched.length !== 1 ? 's' : ''} fetched
                  </span>
                  <span style={{
                    fontSize: 11, color: C.indigo,
                    background: C.indigo + '12', borderRadius: 6, padding: '1px 7px',
                    border: `1px solid ${C.indigo}30`, fontWeight: 600,
                  }}>
                    {selectedCount} selected
                  </span>
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button className="gi-btn-ghost" style={{ padding: '4px 10px', fontSize: 11 }} onClick={selectAll}>All</button>
                  <button className="gi-btn-ghost" style={{ padding: '4px 10px', fontSize: 11 }} onClick={selectNone}>None</button>
                  <button className="gi-btn-ghost" style={{ padding: '4px 10px', fontSize: 11 }} onClick={reset}>← Back</button>
                </div>
              </div>

              {/* Scrollable email list */}
              <div style={{
                maxHeight: 280, overflowY: 'auto', borderRadius: 10,
                border: `1px solid ${C.border}`,
                background: '#fff',
              }}>
                {fetched.length === 0 ? (
                  <div style={{ padding: '20px', textAlign: 'center', fontSize: 13, color: C.slate }}>
                    No emails found in this folder.
                  </div>
                ) : (
                  fetched.map((em, i) => (
                    <label
                      key={i}
                      className="gi-row"
                      style={{
                        display: 'flex', alignItems: 'flex-start', gap: 10,
                        padding: '9px 12px', cursor: 'pointer', userSelect: 'none',
                        background: selected.has(i) ? C.indigo + '07' : '#fff',
                        borderBottom: i < fetched.length - 1 ? `1px solid ${C.border}` : 'none',
                        transition: 'background 0.1s',
                      }}
                    >
                      {/* Checkbox */}
                      <input
                        type="checkbox"
                        checked={selected.has(i)}
                        onChange={() => toggleOne(i)}
                        style={{ accentColor: C.indigo, width: 14, height: 14, marginTop: 2, flexShrink: 0 }}
                      />

                      {/* Email number badge */}
                      <span style={{
                        fontSize: 10, fontWeight: 700, color: C.slate,
                        minWidth: 28, marginTop: 1, flexShrink: 0,
                        fontFamily: "'DM Mono', monospace",
                      }}>#{String(i + 1).padStart(2, '0')}</span>

                      {/* Content */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        {/* Subject */}
                        <div style={{
                          fontSize: 12.5, fontWeight: 600,
                          color: selected.has(i) ? C.text : C.slate,
                          overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis',
                          marginBottom: 2,
                        }}>
                          {em.subject}
                        </div>

                        {/* Sender + date */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{
                            fontSize: 11, color: C.slate,
                            overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis',
                          }}>
                            {parseSender(em.sender)}
                          </span>
                          {em.date && (
                            <span style={{
                              fontSize: 10, color: C.slate + '99', flexShrink: 0,
                              fontFamily: "'DM Mono', monospace",
                            }}>
                              {em.date.slice(0, 16)}
                            </span>
                          )}
                        </div>

                        {/* Body preview */}
                        {em.body && (
                          <div style={{
                            fontSize: 11, color: C.slate,
                            overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis',
                            marginTop: 2, opacity: 0.75,
                          }}>
                            {em.body.replace(/\n/g, ' ').slice(0, 80)}…
                          </div>
                        )}
                      </div>
                    </label>
                  ))
                )}
              </div>

              {/* Add button */}
              <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                <button
                  className="gi-btn-primary"
                  disabled={selectedCount === 0}
                  onClick={handleImport}
                  style={{ flex: 1, justifyContent: 'center' }}
                >
                  ✓ Add {selectedCount > 0 ? `${selectedCount} ` : ''}Email{selectedCount !== 1 ? 's' : ''} to Pipeline
                </button>
                <button className="gi-btn-ghost" onClick={reset}>Re-fetch</button>
              </div>

              {/* Notice */}
              <p style={{ fontSize: 11, color: C.slate, marginTop: 8, lineHeight: 1.6 }}>
                Only selected emails will be passed to the AI pipeline. Emails are not stored on any server.
              </p>
            </div>
          )}
        </div>
      )}
    </>
  );
}
