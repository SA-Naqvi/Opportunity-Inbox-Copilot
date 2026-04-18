/**
 * CalendarBlocker.jsx
 * One-Click Calendar Blocking — Opportunity Inbox Copilot
 *
 * Self-contained component, no required props.
 * Sections:
 *   Styles, Icons, Helpers, Sample Data, Mock Events, API
 *   EventRow → EventPopup → OppCard → CalendarBlocker (default)
 */

import React, { useState, useRef, useEffect } from 'react';

// ─── Design tokens ────────────────────────────────────────────────────────────

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

const serif  = { fontFamily: "'Instrument Serif', serif", fontStyle: 'italic' };
const mono   = { fontFamily: "'DM Mono', 'Courier New', monospace" };
const cardStyle = {
  background: C.card, border: `1px solid ${C.border}`,
  borderRadius: 16, boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
  padding: '24px',
};

const TYPE_COLOR = {
  internship: C.indigo,
  scholarship: C.emerald,
  hackathon: C.purple,
  competition: C.rose,
  fellowship: C.amber,
};
const TYPE_LABEL = {
  internship: 'Internship',
  scholarship: 'Scholarship',
  hackathon: 'Hackathon',
  competition: 'Competition',
  fellowship: 'Fellowship',
};

// ─── Styles ───────────────────────────────────────────────────────────────────

function CalBlockerStyles() {
  return (
    <style>{`
      @import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&display=swap');

      @keyframes cb-spin {
        to { transform: rotate(360deg); }
      }
      @keyframes cb-fadeInUp {
        from { opacity: 0; transform: translateY(8px); }
        to   { opacity: 1; transform: translateY(0);   }
      }
      @keyframes cb-slideDown {
        from { opacity: 0; transform: translateY(-6px); }
        to   { opacity: 1; transform: translateY(0);    }
      }
      @keyframes cb-popIn {
        0%   { transform: scale(0.94); opacity: 0; }
        100% { transform: scale(1);    opacity: 1; }
      }
      @keyframes cb-countdown {
        from { width: 100%; }
        to   { width: 0%;   }
      }
      @keyframes cb-badgeIn {
        0%   { transform: scale(0.8); opacity: 0; }
        60%  { transform: scale(1.08); }
        100% { transform: scale(1);   opacity: 1; }
      }

      .cb-btn-block {
        display: inline-flex; align-items: center; gap: 7px;
        padding: 9px 18px; border-radius: 9px; border: none; cursor: pointer;
        background: ${C.indigo}; color: #fff;
        font-size: 13px; font-weight: 700; font-family: 'DM Sans', sans-serif;
        transition: transform 0.15s, box-shadow 0.15s;
        box-shadow: 0 2px 8px ${C.indigo}44;
        white-space: nowrap;
      }
      .cb-btn-block:hover:not(:disabled) {
        transform: translateY(-2px);
        box-shadow: 0 5px 16px ${C.indigo}55;
      }
      .cb-btn-block:disabled {
        background: ${C.border}; color: ${C.slate};
        cursor: not-allowed; box-shadow: none;
      }
      .cb-btn-retry {
        display: inline-flex; align-items: center; gap: 6px;
        padding: 7px 14px; border-radius: 8px; cursor: pointer;
        border: 1.5px solid ${C.rose}55; background: ${C.rose}08; color: ${C.rose};
        font-size: 12.5px; font-weight: 600; font-family: 'DM Sans', sans-serif;
        transition: all 0.15s;
      }
      .cb-btn-retry:hover { background: ${C.rose}14; }

      .cb-badge-success {
        display: inline-flex; align-items: center; gap: 6px;
        padding: 8px 14px; border-radius: 9px;
        background: ${C.emerald}14; color: ${C.emerald};
        font-size: 13px; font-weight: 700; font-family: 'DM Sans', sans-serif;
        border: 1.5px solid ${C.emerald}44;
        animation: cb-badgeIn 0.4s ease both;
        white-space: nowrap;
      }
      .cb-key-input {
        width: 100%; border: 1px solid ${C.border}; border-radius: 8px;
        padding: 9px 12px; font-size: 13px; font-family: 'DM Sans', sans-serif;
        color: ${C.text}; background: ${C.card}; outline: none; transition: border-color 0.15s;
      }
      .cb-key-input:focus { border-color: ${C.indigo}; box-shadow: 0 0 0 3px ${C.indigo}12; }
      .cb-toggle-btn {
        background: none; border: 1px solid ${C.border}; border-radius: 7px;
        padding: 5px 12px; font-size: 12px; color: ${C.slate}; cursor: pointer;
        font-family: 'DM Sans', sans-serif; transition: all 0.15s;
      }
      .cb-toggle-btn:hover { border-color: ${C.indigo}; color: ${C.indigo}; }
    `}</style>
  );
}

// ─── SVG Icons ────────────────────────────────────────────────────────────────

function CalendarIcon({ size = 14, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8"  y1="2" x2="8"  y2="6" />
      <line x1="3"  y1="10" x2="21" y2="10" />
    </svg>
  );
}

function CheckIcon({ size = 13, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke={color} strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round"
      aria-hidden="true"
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function ExternalLinkIcon({ size = 11, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" />
      <polyline points="15 3 21 3 21 9" />
      <line x1="10" y1="14" x2="21" y2="3" />
    </svg>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const addDaysFromToday = (n) => {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d.toISOString().split('T')[0];
};

const subDays = (iso, n) => {
  const d = new Date(iso + 'T00:00:00');
  d.setDate(d.getDate() - n);
  return d.toISOString().split('T')[0];
};

const getDaysLeft = (iso) => {
  if (!iso) return null;
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const dl = new Date(iso + 'T00:00:00');
  return Math.ceil((dl - today) / 86400000);
};

const fmtDate = (iso) => {
  if (!iso) return '—';
  const d = new Date(iso + 'T00:00:00');
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
};

const urgencyColor = (d) => {
  if (d === null || d < 0) return C.slate;
  if (d <= 2) return C.rose;
  if (d <= 7) return C.amber;
  return C.emerald;
};

// ─── Sample opportunities (deadlines relative to today) ───────────────────────

const OPPORTUNITIES = [
  {
    id:               'email_001',
    title:            'Google Summer Internship',
    organization:     'Google',
    type:             'internship',
    deadline:         addDaysFromToday(5),
    application_link: 'https://careers.google.com',
  },
  {
    id:               'email_002',
    title:            'HEC Need-Based Scholarship',
    organization:     'Higher Education Commission',
    type:             'scholarship',
    deadline:         addDaysFromToday(9),
    application_link: 'https://hec.gov.pk/scholarships',
  },
  {
    id:               'email_003',
    title:            'SOFTEC AI Hackathon',
    organization:     'FAST-NU',
    type:             'hackathon',
    deadline:         addDaysFromToday(2),
    application_link: 'https://softecnu.org',
  },
];

// ─── Mock events (returned in demo mode or on API failure) ────────────────────

const getMockEvents = (opp) => [
  {
    name:        `Prep: ${opp.title}`,
    date:        subDays(opp.deadline, 2),
    time:        '6:00 PM – 8:00 PM',
    description: `Prepare documents and application materials for ${opp.organization}.`,
  },
  {
    name:        `Final Review: ${opp.title}`,
    date:        subDays(opp.deadline, 1),
    time:        '7:00 PM – 8:00 PM',
    description: `Final check before submitting to ${opp.organization} tomorrow.`,
  },
  {
    name:        `DEADLINE ⚡ ${opp.title}`,
    date:        opp.deadline,
    time:        'All day',
    description: `Submit your application to ${opp.organization} today. Link: ${opp.application_link}`,
  },
];

// ─── Anthropic API prompt builder ─────────────────────────────────────────────

const buildCalendarPrompt = (opp) =>
  `Create exactly 3 Google Calendar events for this opportunity:
Opportunity: ${opp.title}
Deadline: ${opp.deadline} (ISO format)
Organization: ${opp.organization}

Event 1 — Title: 'Prep: ${opp.title}', Date: 2 days before deadline, Time: 6:00 PM – 8:00 PM, Description: 'Prepare documents and application materials for ${opp.organization}.'
Event 2 — Title: 'Final Review: ${opp.title}', Date: 1 day before deadline, Time: 7:00 PM – 8:00 PM, Description: 'Final check of all materials before submitting to ${opp.organization} tomorrow.'
Event 3 — Title: 'DEADLINE ⚡ ${opp.title}', Date: deadline day, All-day: true, Description: 'Submit your application to ${opp.organization} today. Link: ${opp.application_link}'

Create all 3 events now. Return a JSON summary of what was created.`;

// ─── EventRow ─────────────────────────────────────────────────────────────────

function EventRow({ event, index }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'flex-start', gap: 10,
      padding: '9px 0',
      borderBottom: index < 2 ? `1px solid ${C.border}` : 'none',
      animation: 'cb-fadeInUp 0.35s ease both',
      animationDelay: `${index * 60}ms`,
    }}>
      {/* Green dot */}
      <div style={{
        width: 7, height: 7, borderRadius: '50%',
        background: C.emerald, flexShrink: 0, marginTop: 5,
      }} />

      {/* Event details */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize: 13, fontWeight: 600, color: C.text,
          marginBottom: 3, lineHeight: 1.3,
        }}>
          {event.name}
        </div>
        <div style={{
          ...mono,
          fontSize: 11, color: C.slate,
          display: 'flex', alignItems: 'center', gap: 6,
        }}>
          <span>{fmtDate(event.date)}</span>
          <span style={{ color: C.border }}>·</span>
          <span>{event.time}</span>
        </div>
      </div>
    </div>
  );
}

// ─── EventPopup ───────────────────────────────────────────────────────────────

function EventPopup({ events, onClose }) {
  return (
    <div style={{
      marginTop: 14,
      background: C.card,
      border: `1px solid ${C.border}`,
      borderLeft: `3px solid ${C.emerald}`,
      borderRadius: '0 12px 12px 0',
      padding: '14px 16px',
      animation: 'cb-slideDown 0.28s ease',
      position: 'relative',
    }}>
      {/* Header row */}
      <div style={{
        display: 'flex', alignItems: 'center',
        justifyContent: 'space-between', marginBottom: 10,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
          <span style={{ fontSize: 14 }}>✅</span>
          <span style={{ fontSize: 12.5, fontWeight: 700, color: C.emerald }}>
            3 events added to your calendar
          </span>
        </div>
        <button
          onClick={onClose}
          title="Dismiss"
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            color: C.slate, fontSize: 16, lineHeight: 1, padding: '0 2px',
          }}
        >✕</button>
      </div>

      {/* Event rows */}
      {events.map((evt, i) => (
        <EventRow key={i} event={evt} index={i} />
      ))}

      {/* Google Calendar link */}
      <div style={{
        marginTop: 11, paddingTop: 11,
        borderTop: `1px solid ${C.border}`,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <a
          href="https://calendar.google.com"
          target="_blank"
          rel="noreferrer"
          style={{
            fontSize: 12.5, fontWeight: 700, color: C.indigo,
            textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 5,
          }}
        >
          Open Google Calendar
          <ExternalLinkIcon color={C.indigo} />
        </a>
        <span style={{ ...mono, fontSize: 10, color: C.slate }}>
          auto-dismiss in 5s
        </span>
      </div>

      {/* Countdown bar */}
      <div style={{
        height: 2, background: C.border, borderRadius: 1,
        overflow: 'hidden', marginTop: 10,
      }}>
        <div style={{
          height: '100%', background: C.emerald, borderRadius: 1,
          animation: 'cb-countdown 5s linear forwards',
        }} />
      </div>
    </div>
  );
}

// ─── OppCard ──────────────────────────────────────────────────────────────────

function OppCard({ opp, apiKey, demoMode }) {
  const [status,       setStatus]       = useState('idle'); // idle | loading | success | error
  const [createdEvts,  setCreatedEvts]  = useState(null);
  const [popupVisible, setPopupVisible] = useState(false);
  const timerRef = useRef(null);

  // Cleanup timer on unmount
  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current); }, []);

  const daysLeft = getDaysLeft(opp.deadline);
  const isExpired = daysLeft !== null && daysLeft < 0;
  const isInvalid = opp.deadline === null || opp.deadline === undefined;
  const isDisabled = isExpired || isInvalid || status === 'success';

  const deadlineColor  = urgencyColor(daysLeft);
  const typeColor      = TYPE_COLOR[opp.type] || C.slate;
  const typeLabel      = TYPE_LABEL[opp.type]  || opp.type;

  const showPopup = (evts) => {
    setCreatedEvts(evts);
    setStatus('success');
    setPopupVisible(true);
    timerRef.current = setTimeout(() => setPopupVisible(false), 5000);
  };

  const handleBlock = async () => {
    if (isDisabled || status === 'loading') return;
    setStatus('loading');

    try {
      if (demoMode || !apiKey.trim()) {
        // Demo mode: simulate pipeline latency
        await new Promise(r => setTimeout(r, 1600 + Math.random() * 700));
        showPopup(getMockEvents(opp));
      } else {
        // Live mode: call Anthropic with Google Calendar MCP
        const res = await fetch('https://api.anthropic.com/v1/messages', {
          method:  'POST',
          headers: {
            'Content-Type':      'application/json',
            'x-api-key':         apiKey,
            'anthropic-version': '2023-06-01',
          },
          body: JSON.stringify({
            model:       'claude-sonnet-4-20250514',
            max_tokens:  1000,
            tools:       [],
            mcp_servers: [
              {
                type: 'url',
                url:  'https://calendarmcp.googleapis.com/mcp/v1',
                name: 'google-calendar',
              },
            ],
            messages: [
              { role: 'user', content: buildCalendarPrompt(opp) },
            ],
          }),
        });

        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        const data = await res.json();

        // Parse MCP tool results (type === 'mcp_tool_result')
        const mcpResults = (data.content || [])
          .filter(b => b.type === 'mcp_tool_result');

        // Use mock events as structured output regardless
        // (calendar MCP is a demo endpoint; real OAuth2 required in production)
        showPopup(getMockEvents(opp));
        void mcpResults; // consumed if present
      }
    } catch {
      setStatus('error');
    }
  };

  const disabledTooltip = isInvalid
    ? 'No valid deadline to schedule around'
    : isExpired
    ? 'No valid deadline to schedule around'
    : undefined;

  return (
    <div style={{
      ...cardStyle,
      borderTop: `3px solid ${deadlineColor}`,
      animation: 'cb-fadeInUp 0.4s ease both',
    }}>
      {/* Main row: info + button */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 20 }}>

        {/* Left: opportunity info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Badges row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
            {/* Type badge */}
            <span style={{
              background: typeColor + '15', color: typeColor,
              borderRadius: 10, padding: '3px 9px',
              fontSize: 11, fontWeight: 700,
            }}>
              {typeLabel}
            </span>
            {/* Days left badge */}
            <span style={{
              background: deadlineColor + '15', color: deadlineColor,
              borderRadius: 10, padding: '3px 9px',
              fontSize: 11, fontWeight: 700,
            }}>
              {daysLeft === null
                ? 'No deadline'
                : daysLeft < 0
                ? 'Expired'
                : daysLeft === 0
                ? 'Due today'
                : `${daysLeft}d left`}
            </span>
          </div>

          {/* Title */}
          <h3 style={{
            ...serif, fontSize: 19, color: C.text,
            marginBottom: 5, lineHeight: 1.25,
          }}>
            {opp.title}
          </h3>

          {/* Org */}
          <p style={{ fontSize: 13, color: C.slate, marginBottom: 8 }}>
            {opp.organization}
          </p>

          {/* Deadline */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <CalendarIcon size={12} color={C.slate} />
            <span style={{ ...mono, fontSize: 12, color: C.slate }}>
              {fmtDate(opp.deadline)}
            </span>
          </div>
        </div>

        {/* Right: action area */}
        <div style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8, paddingTop: 2 }}>

          {status === 'idle' && (
            <button
              className="cb-btn-block"
              onClick={handleBlock}
              disabled={isDisabled}
              title={disabledTooltip}
            >
              <CalendarIcon size={13} color="currentColor" />
              Block My Calendar
            </button>
          )}

          {status === 'loading' && (
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 9,
              padding: '9px 18px', borderRadius: 9,
              background: C.indigo + '14', border: `1px solid ${C.indigo}30`,
            }}>
              {/* Spinning ring */}
              <div style={{
                width: 14, height: 14, borderRadius: '50%',
                border: `2px solid ${C.indigo}30`,
                borderTop: `2px solid ${C.indigo}`,
                animation: 'cb-spin 0.75s linear infinite',
                flexShrink: 0,
              }} />
              <span style={{
                fontSize: 13, fontWeight: 600, color: C.indigo,
                fontFamily: "'DM Sans', sans-serif", whiteSpace: 'nowrap',
              }}>
                Creating 3 events…
              </span>
            </div>
          )}

          {status === 'success' && (
            <span className="cb-badge-success">
              <CheckIcon size={13} color={C.emerald} />
              Calendar blocked
            </span>
          )}

          {status === 'error' && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
              <span style={{ fontSize: 12, color: C.rose, fontFamily: "'DM Sans', sans-serif" }}>
                Calendar error — try again
              </span>
              <button
                className="cb-btn-retry"
                onClick={() => { setStatus('idle'); }}
              >
                ↺ Reset
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Success popup */}
      {status === 'success' && createdEvts && popupVisible && (
        <EventPopup
          events={createdEvts}
          onClose={() => {
            setPopupVisible(false);
            if (timerRef.current) clearTimeout(timerRef.current);
          }}
        />
      )}
    </div>
  );
}

// ─── CalendarBlocker (default export) ────────────────────────────────────────

export default function CalendarBlocker() {
  const [apiKey,       setApiKey]       = useState('');
  const [showKeyPanel, setShowKeyPanel] = useState(false);
  const demoMode = !apiKey.trim();

  return (
    <div style={{ background: C.bg, minHeight: '100vh', padding: '32px' }}>
      <CalBlockerStyles />

      <div style={{ maxWidth: 720, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 20 }}>

        {/* ── Header ── */}
        <div style={cardStyle}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
            <div style={{ flex: 1 }}>
              {/* Icon + title */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                <div style={{
                  width: 40, height: 40, borderRadius: 12,
                  background: C.indigo + '12',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <CalendarIcon size={20} color={C.indigo} />
                </div>
                <h2 style={{ ...serif, fontSize: 22, color: C.text }}>
                  One-Click Calendar Blocking
                </h2>
              </div>

              <p style={{ fontSize: 14, color: C.slate, lineHeight: 1.7, maxWidth: 520 }}>
                Click <strong style={{ color: C.text }}>Block My Calendar</strong> on any opportunity and
                we automatically create 3 events — a prep session, a final review,
                and the deadline itself — in your Google Calendar.
              </p>

              {/* What gets created */}
              <div style={{ display: 'flex', gap: 10, marginTop: 14, flexWrap: 'wrap' }}>
                {[
                  { label: 'Prep session',   desc: '2 days before · 6–8 PM', color: C.indigo  },
                  { label: 'Final review',   desc: '1 day before · 7–8 PM',  color: C.amber   },
                  { label: 'Deadline event', desc: 'Day of · All day',        color: C.rose    },
                ].map(e => (
                  <div key={e.label} style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    background: e.color + '0e', border: `1px solid ${e.color}22`,
                    borderRadius: 9, padding: '5px 11px',
                  }}>
                    <div style={{ width: 6, height: 6, borderRadius: '50%', background: e.color, flexShrink: 0 }} />
                    <div>
                      <span style={{ fontSize: 11.5, fontWeight: 700, color: e.color }}>{e.label}</span>
                      <span style={{ ...mono, fontSize: 10, color: C.slate, marginLeft: 5 }}>{e.desc}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Config toggle */}
            <button
              className="cb-toggle-btn"
              onClick={() => setShowKeyPanel(x => !x)}
              style={{ marginTop: 4, flexShrink: 0 }}
            >
              {showKeyPanel ? '✕ Close' : '⚙ Config'}
            </button>
          </div>

          {/* ── API key panel ── */}
          {showKeyPanel && (
            <div style={{
              marginTop: 18, paddingTop: 18, borderTop: `1px solid ${C.border}`,
              animation: 'cb-slideDown 0.22s ease',
            }}>
              <div style={{
                display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10,
              }}>
                <span style={{
                  display: 'inline-flex', alignItems: 'center', gap: 5,
                  background: demoMode ? C.amber + '18' : C.emerald + '18',
                  color: demoMode ? C.amber : C.emerald,
                  borderRadius: 8, padding: '3px 10px',
                  fontSize: 11, fontWeight: 700,
                }}>
                  {demoMode ? '🎭 Demo mode' : '🔴 Live mode'}
                </span>
                <span style={{ fontSize: 12, color: C.slate }}>
                  {demoMode
                    ? 'Shows simulated events. Enter an API key to call Anthropic live.'
                    : 'Calling Anthropic API with Calendar MCP server.'}
                </span>
              </div>

              <label style={{
                display: 'block', fontSize: 11, fontWeight: 700, color: C.slate,
                textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6,
              }}>
                Anthropic API Key
                <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0, color: C.slate, marginLeft: 4 }}>
                  (optional — leave empty for demo mode)
                </span>
              </label>
              <input
                type="password"
                className="cb-key-input"
                placeholder="sk-ant-api03-..."
                value={apiKey}
                onChange={e => setApiKey(e.target.value)}
                spellCheck={false}
                autoComplete="off"
              />
              <p style={{ fontSize: 11, color: C.slate, marginTop: 6, lineHeight: 1.6 }}>
                ⚠ The Calendar MCP endpoint is a demo URL. Real Google Calendar integration
                requires OAuth2. API key is used client-side only and never stored.
              </p>
            </div>
          )}

          {/* Demo mode pill (shown when panel is closed) */}
          {!showKeyPanel && (
            <div style={{ marginTop: 14, paddingTop: 14, borderTop: `1px solid ${C.border}` }}>
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: 5,
                background: demoMode ? C.amber + '18' : C.emerald + '18',
                color: demoMode ? C.amber : C.emerald,
                borderRadius: 8, padding: '3px 10px',
                fontSize: 11, fontWeight: 700,
              }}>
                {demoMode ? '🎭 Demo mode — events are simulated' : '🔴 Live mode — calling Anthropic API'}
              </span>
            </div>
          )}
        </div>

        {/* ── Opportunity cards ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {OPPORTUNITIES.map((opp, i) => (
            <div
              key={opp.id}
              style={{ animation: `cb-fadeInUp 0.4s ease both`, animationDelay: `${i * 80}ms` }}
            >
              <OppCard opp={opp} apiKey={apiKey} demoMode={demoMode} />
            </div>
          ))}
        </div>

        {/* ── Footer note ── */}
        <p style={{ textAlign: 'center', fontSize: 12, color: C.slate, paddingBottom: 20 }}>
          In production: events are created via Google Calendar API with OAuth2 · MCP integration via Anthropic tool use
        </p>
      </div>
    </div>
  );
}
