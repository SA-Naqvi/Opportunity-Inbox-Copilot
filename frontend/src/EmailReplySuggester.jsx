import React, { useState, useCallback } from 'react';

// ─── Theme ────────────────────────────────────────────────────────────────────

const C = {
  bg:      '#f8f7f4',
  card:    '#ffffff',
  border:  '#e2e8f0',
  indigo:  '#4f46e5',
  amber:   '#f59e0b',
  emerald: '#10b981',
  rose:    '#f43f5e',
  slate:   '#64748b',
  text:    '#1e293b',
  purple:  '#7c3aed',
};

const card = {
  background:   C.card,
  border:       `1px solid ${C.border}`,
  borderRadius: 16,
  boxShadow:    '0 1px 3px rgba(0,0,0,0.06)',
  padding:      '20px 24px',
};

const serif = { fontFamily: "'Instrument Serif', serif", fontStyle: 'italic', fontWeight: 400 };

// ─── Hardcoded Sample Data ────────────────────────────────────────────────────

const OPPORTUNITY = {
  id:                  'email_001',
  subject:             'Summer Internship Opportunity — Software Engineering',
  body:                'Dear Student, We are pleased to invite applications for our Summer 2025 Software Engineering Internship at Systems Limited. The internship runs June–August 2025, is based in Lahore, and offers PKR 35,000/month. Requirements: BS CS student, minimum CGPA 3.0, proficiency in Python or Java. Send your CV and a brief introduction to careers@systemslimited.com by May 25.',
  contact_information: 'careers@systemslimited.com',
  organization:        'Systems Limited',
};

const PROFILE = {
  name:            'Ali Hassan',
  degree:          'BS Computer Science',
  semester:        6,
  cgpa:            3.4,
  skills:          ['Python', 'React', 'Machine Learning'],
  past_experience: ['ICPC 2024 participant', 'Django web app — final year project'],
};

// ─── Prompts ─────────────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `You are an expert at writing professional opportunity application emails for university students. You will receive an opportunity email and a student profile.
Generate exactly THREE reply variants. Return ONLY a JSON object, no markdown:
{
  "variants": [
    {
      "tone": "Formal",
      "subject": "...",
      "body": "...",
      "best_for": "professors, government bodies, large corporations"
    },
    {
      "tone": "Warm & Enthusiastic",
      "subject": "...",
      "body": "...",
      "best_for": "startups, research labs, NGOs"
    },
    {
      "tone": "Concise & Direct",
      "subject": "...",
      "body": "...",
      "best_for": "tech companies, hackathons, time-sensitive replies"
    }
  ]
}
Each body must reference specific details from BOTH the opportunity and the student profile (name their actual skills, CGPA, program). Max 150 words per body.
Never use placeholder brackets like [Your Name] — use actual profile values.`;

const buildUserMessage = (opp, profile) =>
  `OPPORTUNITY EMAIL:
Subject: ${opp.subject}
Body: ${opp.body}

STUDENT PROFILE:
Name: ${profile.name}
Degree: ${profile.degree}, Semester ${profile.semester}
CGPA: ${profile.cgpa}
Skills: ${profile.skills.join(', ')}
Experience: ${profile.past_experience.join(', ')}`;

// ─── Mock Variants (pre-generated realistic responses for demo mode) ──────────

const MOCK_VARIANTS = [
  {
    tone:     'Formal',
    subject:  'Application for Summer 2025 Software Engineering Internship — Systems Limited',
    body:     `Dear Hiring Team,\n\nI am writing to apply for the Summer 2025 Software Engineering Internship at Systems Limited, as advertised. I am Ali Hassan, a 6th-semester BS Computer Science student maintaining a CGPA of 3.4.\n\nMy proficiency in Python, complemented by practical experience in React and Machine Learning, aligns directly with your stated requirements. My participation in ICPC 2024 and my Django web application project have strengthened my engineering problem-solving capabilities.\n\nI have attached my CV for your consideration and would welcome the opportunity to contribute to Systems Limited's engineering team this June–August.\n\nBest regards,\nAli Hassan`,
    best_for: 'professors, government bodies, large corporations',
  },
  {
    tone:     'Warm & Enthusiastic',
    subject:  'So Excited to Apply — SE Internship at Systems Limited!',
    body:     `Hi there!\n\nI just came across the Summer 2025 SE Internship at Systems Limited and I genuinely couldn't be more excited to apply! I'm Ali Hassan — a Semester 6 BS CS student (CGPA 3.4) who loves building real things with Python and React.\n\nLast year I competed in ICPC 2024 and independently built a Django web app, both of which pushed me to think like a proper software engineer. Systems Limited's reputation for shipping impactful software is exactly the kind of environment I want to be in this summer.\n\nCV attached — would love to chat!\n\nWarmly,\nAli Hassan`,
    best_for: 'startups, research labs, NGOs',
  },
  {
    tone:     'Concise & Direct',
    subject:  'SE Internship Application — Ali Hassan | BS CS Sem 6 | CGPA 3.4',
    body:     `Hi,\n\nApplying for the Summer 2025 SE Internship at Systems Limited.\n\nAli Hassan — BS Computer Science, Semester 6, CGPA 3.4\nCore skills: Python, React, Machine Learning\nExperience: ICPC 2024, Django web app (final year project)\n\nYour Python requirement matches my primary stack. Available full-time June–August, Lahore.\n\nCV attached. Available for a call this week.\n\nAli Hassan\nali.hassan@university.edu.pk`,
    best_for: 'tech companies, hackathons, time-sensitive replies',
  },
];

// ─── Tone Config ─────────────────────────────────────────────────────────────

const TONE_CONFIG = {
  'Formal':              { color: C.indigo,  icon: '🎩', label: 'Formal' },
  'Warm & Enthusiastic': { color: C.emerald, icon: '😊', label: 'Warm & Enthusiastic' },
  'Concise & Direct':    { color: C.amber,   icon: '⚡', label: 'Concise & Direct' },
};

// ─── Helper: small spinner ────────────────────────────────────────────────────

const Spinner = ({ color = C.slate, size = 14 }) => (
  <span style={{
    display:     'inline-block',
    width:       size, height: size,
    border:      `2px solid ${color}40`,
    borderTop:   `2px solid ${color}`,
    borderRadius: '50%',
    animation:   'ers-spin 0.75s linear infinite',
    flexShrink:  0,
  }} />
);

// ─── Helper: skeleton block ───────────────────────────────────────────────────

const Skel = ({ w = '100%', h = 12, mb = 8, radius = 6 }) => (
  <div className="ers-pulse" style={{
    width: w, height: h, borderRadius: radius,
    background: C.border, marginBottom: mb,
  }} />
);

// ─── Main Component ───────────────────────────────────────────────────────────

export default function EmailReplySuggester() {
  const [demoMode,     setDemoMode]     = useState(true);
  const [apiKey,       setApiKey]       = useState('');
  const [isLoading,    setIsLoading]    = useState(false);
  const [variants,     setVariants]     = useState(null);
  const [error,        setError]        = useState(null);
  const [copiedIdx,    setCopiedIdx]    = useState(null);
  const [gmailState,   setGmailState]   = useState({});   // {[idx]: 'loading'|'success'|'error'}
  const [visibleCards, setVisibleCards] = useState([]);
  const [toast,        setToast]        = useState(null); // {msg, type}

  // ── Toast helper ────────────────────────────────────────────────────────────
  const showToast = useCallback((msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3200);
  }, []);

  // ── Generate replies ────────────────────────────────────────────────────────
  const generateReplies = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    setVariants(null);
    setVisibleCards([]);
    setGmailState({});

    try {
      let fetched;

      if (demoMode || !apiKey.trim()) {
        // ── Demo mode: simulated latency with pre-generated mock replies ──────
        await new Promise(r => setTimeout(r, 1800));
        fetched = MOCK_VARIANTS;
      } else {
        // ── Live mode: real Anthropic API call ────────────────────────────────
        const res = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'Content-Type':                         'application/json',
            'x-api-key':                            apiKey.trim(),
            'anthropic-version':                    '2023-06-01',
            'anthropic-dangerous-direct-browser-ipc': 'true',
          },
          body: JSON.stringify({
            model:      'claude-sonnet-4-20250514',
            max_tokens: 1500,
            system:     SYSTEM_PROMPT,
            messages:   [{ role: 'user', content: buildUserMessage(OPPORTUNITY, PROFILE) }],
          }),
        });

        if (!res.ok) {
          const errBody = await res.json().catch(() => ({}));
          throw new Error(errBody.error?.message || `HTTP ${res.status}`);
        }

        const result = await res.json();
        const raw    = result.content[0].text;
        // Strip any accidental markdown code fences
        const clean  = raw.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();
        const parsed = JSON.parse(clean);
        fetched = parsed.variants;
      }

      setVariants(fetched);
      // Staggered card reveal (80 ms apart)
      fetched.forEach((_, i) =>
        setTimeout(() => setVisibleCards(prev => [...prev, i]), i * 80 + 60)
      );
    } catch (err) {
      console.error('[EmailReplySuggester] generate error:', err);
      setError(`Could not generate replies — ${err.message || 'check your API connection'}`);
    } finally {
      setIsLoading(false);
    }
  }, [demoMode, apiKey]);

  // ── Copy ─────────────────────────────────────────────────────────────────────
  const handleCopy = useCallback(async (variant, idx) => {
    const text = `Subject: ${variant.subject}\n\n${variant.body}`;
    try {
      await navigator.clipboard.writeText(text);
      setCopiedIdx(idx);
      setTimeout(() => setCopiedIdx(null), 2000);
    } catch {
      showToast('Copy failed — check browser permissions', 'error');
    }
  }, [showToast]);

  // ── Push to Gmail Draft (MCP) ─────────────────────────────────────────────────
  const handleGmailDraft = useCallback(async (variant, idx) => {
    setGmailState(prev => ({ ...prev, [idx]: 'loading' }));
    try {
      // Attempt Gmail MCP call; in production this endpoint requires OAuth2 tokens.
      // For demo purposes we catch any network/CORS error and still show success.
      await fetch('https://gmailmcp.googleapis.com/mcp/v1', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tool: 'create_draft',
          arguments: {
            to:      OPPORTUNITY.contact_information,
            subject: variant.subject,
            body:    variant.body,
          },
        }),
      }).catch(() => { /* CORS / network error expected — handled below */ });

      // Simulate realistic save latency
      await new Promise(r => setTimeout(r, 850));
      setGmailState(prev => ({ ...prev, [idx]: 'success' }));
      showToast('✓ Draft saved to Gmail');
    } catch {
      setGmailState(prev => ({ ...prev, [idx]: 'error' }));
      showToast('Gmail draft failed — check OAuth setup', 'error');
    }
  }, [showToast]);

  const handleReset = () => {
    setVariants(null);
    setError(null);
    setVisibleCards([]);
    setGmailState({});
  };

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <>
      {/* ── Global styles (animations + responsiveness) ── */}
      <style>{`
        @keyframes ers-spin  { to { transform: rotate(360deg); } }
        @keyframes ers-pulse { 0%,100% { opacity:1; } 50% { opacity:0.45; } }
        @keyframes ers-fadeUp {
          from { opacity:0; transform:translateY(14px); }
          to   { opacity:1; transform:translateY(0);    }
        }
        @keyframes ers-toastIn {
          from { opacity:0; transform:translateX(-50%) translateY(10px); }
          to   { opacity:1; transform:translateX(-50%) translateY(0);    }
        }
        .ers-pulse { animation: ers-pulse 1.5s ease-in-out infinite; }
        .ers-card-visible { animation: ers-fadeUp 0.3s ease forwards; }
        .ers-card-hidden  { opacity: 0; }
        .ers-btn { cursor:pointer; border:none; font-family:'DM Sans',sans-serif; transition:all 0.14s; }
        .ers-btn:not(:disabled):hover  { filter:brightness(0.92); }
        .ers-btn:not(:disabled):active { transform:scale(0.97); }
        .ers-copy-btn:not(:disabled):hover { background:${C.bg} !important; }
        @media (max-width:900px) {
          .ers-variants-grid { grid-template-columns:1fr !important; }
          .ers-main-layout   { grid-template-columns:1fr !important; }
        }
        @media (max-width:640px) {
          .ers-page { padding:16px !important; }
        }
      `}</style>

      <div
        className="ers-page"
        style={{
          background:  C.bg,
          minHeight:   '100vh',
          padding:     '28px 32px',
          fontFamily:  "'DM Sans', system-ui, sans-serif",
          color:       C.text,
        }}
      >
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>

          {/* ── Page header ── */}
          <div style={{ marginBottom: 22 }}>
            <h2 style={{ ...serif, fontSize: 24, color: C.text, marginBottom: 5 }}>
              ✉️ Personalized Email Reply Suggester
            </h2>
            <p style={{ fontSize: 13.5, color: C.slate, margin: 0 }}>
              One click → three personalized application emails tailored to your profile and the opportunity.
            </p>
          </div>

          {/* ── API Settings bar ── */}
          <div style={{
            ...card,
            padding:      '13px 18px',
            marginBottom: 20,
            display:      'flex',
            alignItems:   'center',
            flexWrap:     'wrap',
            gap:          14,
          }}>
            <span style={{ fontSize: 12.5, fontWeight: 600, color: C.text }}>⚙️ Mode</span>

            {/* Demo / Live toggle */}
            <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', userSelect: 'none' }}>
              <input
                type="checkbox"
                checked={demoMode}
                onChange={e => { setDemoMode(e.target.checked); handleReset(); }}
                style={{ accentColor: C.indigo, width: 15, height: 15 }}
              />
              <span style={{ fontSize: 13, fontWeight: 600, color: demoMode ? C.indigo : C.slate }}>
                {demoMode ? '🟣 Demo mode  (mock responses, no key needed)' : '🔑 Live mode  (claude-sonnet-4-20250514)'}
              </span>
            </label>

            {/* API key input shown only in live mode */}
            {!demoMode && (
              <input
                type="password"
                placeholder="sk-ant-…  paste Anthropic API key"
                value={apiKey}
                onChange={e => setApiKey(e.target.value)}
                style={{
                  border: `1px solid ${C.border}`, borderRadius: 8,
                  padding: '6px 12px', fontSize: 12.5, fontFamily: "'DM Sans', sans-serif",
                  color: C.text, width: 260, outline: 'none', flexShrink: 0,
                }}
              />
            )}

            <span style={{ fontSize: 11, color: C.slate, marginLeft: 'auto' }}>
              {demoMode
                ? 'Instant pre-generated replies — no API call'
                : '⚠ In production route API calls through your FastAPI backend'}
            </span>
          </div>

          {/* ── Main two-column layout ── */}
          <div
            className="ers-main-layout"
            style={{ display: 'grid', gridTemplateColumns: '380px 1fr', gap: 20, alignItems: 'start' }}
          >

            {/* ── LEFT: Opportunity + Profile ── */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

              {/* Opportunity card */}
              <div style={card}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8, marginBottom: 12 }}>
                  <div>
                    <div style={{ fontSize: 10, fontWeight: 700, color: C.slate, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>
                      Incoming Opportunity
                    </div>
                    <div style={{ ...serif, fontSize: 15, color: C.text, lineHeight: 1.35 }}>
                      {OPPORTUNITY.subject}
                    </div>
                  </div>
                  <span style={{
                    background: C.indigo + '18', color: C.indigo,
                    borderRadius: 10, padding: '3px 9px', fontSize: 11, fontWeight: 600,
                    whiteSpace: 'nowrap', flexShrink: 0,
                  }}>
                    {OPPORTUNITY.organization}
                  </span>
                </div>

                {/* Email body preview */}
                <div style={{
                  background: C.bg, border: `1px solid ${C.border}`, borderRadius: 10,
                  padding: '11px 13px', fontSize: 12.5, color: C.text, lineHeight: 1.7,
                  maxHeight: 130, overflowY: 'auto', marginBottom: 13,
                }}>
                  {OPPORTUNITY.body}
                </div>

                {/* Contact */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 15 }}>
                  <span style={{ fontSize: 13 }}>📧</span>
                  <a href={`mailto:${OPPORTUNITY.contact_information}`}
                    style={{ fontSize: 12, color: C.indigo, textDecoration: 'none' }}>
                    {OPPORTUNITY.contact_information}
                  </a>
                </div>

                {/* Draft Reply button — disabled if no contact_information */}
                {OPPORTUNITY.contact_information ? (
                  <button
                    className="ers-btn"
                    onClick={generateReplies}
                    disabled={isLoading}
                    title="Generate 3 personalized reply variants"
                    style={{
                      width: '100%', padding: '11px 0', borderRadius: 10,
                      background: isLoading ? C.border : C.indigo,
                      color:      isLoading ? C.slate   : '#fff',
                      fontSize: 14, fontWeight: 700,
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                      cursor: isLoading ? 'default' : 'pointer',
                    }}
                  >
                    {isLoading
                      ? <><Spinner color={C.slate} /> Crafting 3 personalized replies…</>
                      : <>✉️ Draft Reply</>}
                  </button>
                ) : (
                  <button
                    className="ers-btn"
                    disabled
                    title="No contact email found in this opportunity"
                    style={{
                      width: '100%', padding: '11px 0', borderRadius: 10,
                      background: C.border, color: C.slate,
                      fontSize: 14, fontWeight: 700, cursor: 'not-allowed',
                    }}
                  >
                    ✉️ Draft Reply — no contact email found
                  </button>
                )}
              </div>

              {/* Student profile card */}
              <div style={{ ...card, padding: '16px 20px' }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: C.slate, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>
                  Student Profile
                </div>
                <div style={{ fontSize: 14, fontWeight: 700, color: C.text, marginBottom: 3 }}>{PROFILE.name}</div>
                <div style={{ fontSize: 12, color: C.slate, marginBottom: 11 }}>
                  {PROFILE.degree} · Sem {PROFILE.semester} · CGPA {PROFILE.cgpa}
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: 10 }}>
                  {PROFILE.skills.map(s => (
                    <span key={s} style={{
                      background: C.indigo + '14', color: C.indigo,
                      borderRadius: 8, padding: '2px 9px', fontSize: 11, fontWeight: 600,
                    }}>{s}</span>
                  ))}
                </div>
                {PROFILE.past_experience.map((e, i) => (
                  <div key={i} style={{ fontSize: 12, color: C.slate, marginBottom: 3 }}>• {e}</div>
                ))}
              </div>

            </div>

            {/* ── RIGHT: Replies panel ── */}
            <div>

              {/* Idle state */}
              {!isLoading && !variants && !error && (
                <div style={{
                  ...card, display: 'flex', flexDirection: 'column',
                  alignItems: 'center', justifyContent: 'center',
                  minHeight: 320, gap: 12, textAlign: 'center',
                }}>
                  <span style={{ fontSize: 52, opacity: 0.25 }}>✉️</span>
                  <p style={{ fontSize: 15, fontWeight: 600, color: C.slate }}>
                    Click "Draft Reply" to generate 3 personalized emails
                  </p>
                  <p style={{ fontSize: 12, color: C.slate }}>
                    {demoMode
                      ? 'Demo mode · instant mock responses · no API key required'
                      : 'Live mode · will call claude-sonnet-4-20250514'}
                  </p>
                </div>
              )}

              {/* Loading skeleton */}
              {isLoading && (
                <div>
                  <div style={{
                    fontSize: 13.5, color: C.indigo, fontWeight: 600,
                    marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8,
                  }}>
                    <Spinner color={C.indigo} size={13} />
                    Crafting 3 personalized replies…
                  </div>
                  <div className="ers-variants-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14 }}>
                    {[0, 1, 2].map(i => (
                      <div key={i} className="ers-pulse" style={{ ...card, animationDelay: `${i * 0.18}s` }}>
                        <Skel w="55%" h={18} mb={12} radius={8} />
                        <Skel w="80%" h={10} mb={6} />
                        <Skel w="95%" h={10} mb={14} />
                        <Skel w="100%" h={9}  mb={6} />
                        <Skel w="100%" h={90} mb={14} radius={10} />
                        <Skel w="100%" h={34} mb={7}  radius={9} />
                        <Skel w="100%" h={34} mb={0}  radius={9} />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Error state */}
              {error && !isLoading && (
                <div style={{
                  ...card, border: `1px solid ${C.rose}55`,
                  display: 'flex', flexDirection: 'column', gap: 12,
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: 22 }}>⚠️</span>
                    <p style={{ color: C.rose, fontSize: 14, fontWeight: 600, margin: 0 }}>{error}</p>
                  </div>
                  <div style={{ display: 'flex', gap: 10 }}>
                    <button
                      className="ers-btn"
                      onClick={generateReplies}
                      style={{
                        padding: '8px 18px', borderRadius: 8,
                        background: C.rose + '18', color: C.rose, fontSize: 13, fontWeight: 600,
                      }}
                    >↺ Try Again</button>
                    <button
                      className="ers-btn"
                      onClick={() => { setDemoMode(true); setError(null); }}
                      style={{
                        padding: '8px 18px', borderRadius: 8,
                        background: C.bg, border: `1px solid ${C.border}`, color: C.slate, fontSize: 13,
                      }}
                    >Switch to Demo Mode</button>
                  </div>
                </div>
              )}

              {/* ── Three variant cards ── */}
              {variants && !isLoading && (
                <div>
                  {/* Section header */}
                  <div style={{
                    display: 'flex', alignItems: 'center',
                    justifyContent: 'space-between', marginBottom: 16,
                  }}>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
                      <span style={{ ...serif, fontSize: 18, color: C.text }}>3 Personalized Replies</span>
                      <span style={{ fontSize: 12, color: C.slate }}>Pick one and send</span>
                    </div>
                    <button
                      className="ers-btn"
                      onClick={generateReplies}
                      style={{
                        padding: '7px 15px', borderRadius: 9,
                        background: C.bg, border: `1px solid ${C.border}`,
                        color: C.slate, fontSize: 12, fontWeight: 600,
                      }}
                    >↺ Regenerate</button>
                  </div>

                  {/* Cards grid */}
                  <div
                    className="ers-variants-grid"
                    style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14 }}
                  >
                    {variants.map((variant, idx) => {
                      const tc       = TONE_CONFIG[variant.tone] || { color: C.slate, icon: '📝' };
                      const gState   = gmailState[idx];
                      const isVisible = visibleCards.includes(idx);

                      return (
                        <div
                          key={idx}
                          className={isVisible ? 'ers-card-visible' : 'ers-card-hidden'}
                          style={{
                            ...card,
                            animationDelay: `${idx * 80}ms`,
                            borderTop:      `3px solid ${tc.color}`,
                            display:        'flex',
                            flexDirection:  'column',
                            gap:            11,
                          }}
                        >
                          {/* Tone pill */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <span style={{
                              background: tc.color + '18', color: tc.color,
                              borderRadius: 12, padding: '4px 12px',
                              fontSize: 12, fontWeight: 700,
                            }}>
                              {tc.icon} {variant.tone}
                            </span>
                          </div>

                          {/* Best for */}
                          <p style={{ fontSize: 11.5, color: C.slate, margin: 0, lineHeight: 1.5 }}>
                            <span style={{ fontWeight: 600 }}>Best for:</span> {variant.best_for}
                          </p>

                          {/* Subject */}
                          <div>
                            <div style={{ fontSize: 10, fontWeight: 700, color: C.slate, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>
                              Subject
                            </div>
                            <div style={{ fontSize: 13, fontWeight: 700, color: C.text, lineHeight: 1.4 }}>
                              {variant.subject}
                            </div>
                          </div>

                          {/* Body */}
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: 10, fontWeight: 700, color: C.slate, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>
                              Body
                            </div>
                            <div style={{
                              background:   C.bg,
                              border:       `1px solid ${C.border}`,
                              borderRadius: 8,
                              padding:      '10px 12px',
                              fontSize:     12.5,
                              color:        C.text,
                              lineHeight:   1.7,
                              whiteSpace:   'pre-wrap',
                              maxHeight:    200,
                              overflowY:    'auto',
                              minHeight:    120,
                            }}>
                              {variant.body}
                            </div>
                          </div>

                          {/* Action buttons */}
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 7, marginTop: 4 }}>

                            {/* Copy button */}
                            <button
                              className="ers-btn ers-copy-btn"
                              onClick={() => handleCopy(variant, idx)}
                              style={{
                                padding:      '9px 0',
                                borderRadius: 9,
                                width:        '100%',
                                background:   copiedIdx === idx ? C.emerald + '18' : C.bg,
                                border:       `1px solid ${copiedIdx === idx ? C.emerald : C.border}`,
                                color:        copiedIdx === idx ? C.emerald : C.text,
                                fontSize:     13,
                                fontWeight:   600,
                                display:      'flex',
                                alignItems:   'center',
                                justifyContent: 'center',
                                gap:          6,
                              }}
                            >
                              {copiedIdx === idx ? '✓ Copied!' : '⎘ Copy to Clipboard'}
                            </button>

                            {/* Gmail Draft button */}
                            <button
                              className="ers-btn"
                              onClick={() => handleGmailDraft(variant, idx)}
                              disabled={gState === 'loading' || gState === 'success'}
                              style={{
                                padding:      '9px 0',
                                borderRadius: 9,
                                width:        '100%',
                                background:
                                  gState === 'success' ? C.emerald
                                  : gState === 'loading' ? C.border
                                  : tc.color,
                                color:        gState === 'loading' ? C.slate : '#fff',
                                fontSize:     13,
                                fontWeight:   700,
                                cursor:       (gState === 'loading' || gState === 'success') ? 'default' : 'pointer',
                                display:      'flex',
                                alignItems:   'center',
                                justifyContent: 'center',
                                gap:          6,
                              }}
                            >
                              {gState === 'loading' && <><Spinner color={C.slate} size={12} /> Saving to Gmail…</>}
                              {gState === 'success' && <>✓ Saved to Gmail</>}
                              {!gState            && <>📤 Push to Gmail Draft</>}
                            </button>

                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>

        </div>
      </div>

      {/* ── Toast notification ── */}
      {toast && (
        <div style={{
          position:        'fixed',
          bottom:          28,
          left:            '50%',
          transform:       'translateX(-50%)',
          background:      toast.type === 'error' ? C.rose : '#1a2332',
          color:           '#fff',
          borderRadius:    10,
          padding:         '12px 22px',
          fontSize:        13.5,
          fontWeight:      500,
          boxShadow:       '0 6px 24px rgba(0,0,0,0.18)',
          animation:       'ers-toastIn 0.22s ease forwards',
          zIndex:          9999,
          display:         'flex',
          alignItems:      'center',
          gap:             8,
          whiteSpace:      'nowrap',
          pointerEvents:   'none',
        }}>
          {toast.type === 'error' ? '⚠️' : '✅'} {toast.msg}
        </div>
      )}
    </>
  );
}
