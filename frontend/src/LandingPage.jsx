/**
 * LandingPage.jsx
 *
 * Modular landing page for Opportunity Inbox Copilot.
 * All sections are named exports so they're easy to find and modify.
 *
 * Sections (in order):
 *   LandingStyles  — CSS keyframes, hover classes, responsive rules
 *   LandingNav     — Sticky top navigation
 *   HeroSection    — Headline + CTA + ProductMockup preview
 *   StatsBar       — 4 quick-stats strip
 *   HowItWorks     — 4-step numbered walkthrough
 *   FeaturesGrid   — 6 feature cards
 *   PipelineSection— Visual agent pipeline diagram
 *   TechStack      — Model / tech badges
 *   CTASection     — Final conversion section
 *   LandingFooter  — Simple footer
 *
 * Default export: LandingPage({ onGetStarted })
 */

import React from 'react';

// ─── Design tokens ────────────────────────────────────────────────────────────

const C = {
  bg:      '#faf9f6',
  white:   '#ffffff',
  border:  '#e2e8f0',
  indigo:  '#4f46e5',
  amber:   '#f59e0b',
  emerald: '#10b981',
  rose:    '#f43f5e',
  slate:   '#64748b',
  text:    '#1e293b',
  purple:  '#7c3aed',
  muted:   '#f1f0ec',
};

const serif = { fontFamily: "'Instrument Serif', serif", fontStyle: 'italic' };
const sans  = { fontFamily: "'DM Sans', system-ui, sans-serif" };

// ─── LandingStyles ────────────────────────────────────────────────────────────

export function LandingStyles() {
  return (
    <style>{`
      @import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600;9..40,700;9..40,800&display=swap');

      *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
      html { scroll-behavior: smooth; }
      body { background: ${C.bg}; font-family: 'DM Sans', system-ui, sans-serif; color: ${C.text}; }

      /* ── Gradient text ── */
      .lp-gradient-text {
        background: linear-gradient(135deg, ${C.indigo} 0%, ${C.purple} 100%);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
      }

      /* ── Nav links ── */
      .lp-nav-link {
        font-size: 14px; font-weight: 500; color: ${C.slate};
        text-decoration: none; padding: 4px 0; position: relative;
        transition: color 0.18s;
      }
      .lp-nav-link::after {
        content: ''; position: absolute; bottom: -2px; left: 0;
        width: 0; height: 2px; background: ${C.indigo};
        transition: width 0.2s;
      }
      .lp-nav-link:hover { color: ${C.indigo}; }
      .lp-nav-link:hover::after { width: 100%; }

      /* ── Buttons ── */
      .lp-btn-primary {
        display: inline-flex; align-items: center; gap: 7px;
        padding: 13px 26px; border-radius: 10px; border: none; cursor: pointer;
        background: ${C.indigo}; color: #fff;
        font-size: 15px; font-weight: 700; font-family: 'DM Sans', sans-serif;
        transition: transform 0.15s, box-shadow 0.15s;
        box-shadow: 0 4px 14px ${C.indigo}44;
      }
      .lp-btn-primary:hover {
        transform: translateY(-2px);
        box-shadow: 0 8px 24px ${C.indigo}55;
      }
      .lp-btn-ghost {
        display: inline-flex; align-items: center; gap: 7px;
        padding: 12px 24px; border-radius: 10px; cursor: pointer;
        background: transparent; color: ${C.text};
        border: 1.5px solid ${C.border};
        font-size: 15px; font-weight: 600; font-family: 'DM Sans', sans-serif;
        transition: all 0.15s;
      }
      .lp-btn-ghost:hover {
        border-color: ${C.indigo}; color: ${C.indigo};
        background: ${C.indigo}08;
      }
      .lp-btn-sm {
        display: inline-flex; align-items: center; gap: 5px;
        padding: 8px 18px; border-radius: 8px; border: none; cursor: pointer;
        background: ${C.indigo}; color: #fff;
        font-size: 13px; font-weight: 700; font-family: 'DM Sans', sans-serif;
        transition: all 0.15s;
      }
      .lp-btn-sm:hover { background: #4338ca; }

      /* ── Cards ── */
      .lp-card {
        background: ${C.white}; border: 1px solid ${C.border};
        border-radius: 16px; padding: 28px;
        transition: transform 0.2s, box-shadow 0.2s;
      }
      .lp-card:hover {
        transform: translateY(-4px);
        box-shadow: 0 16px 48px rgba(79,70,229,0.10);
      }

      /* ── Pipeline card ── */
      .lp-pipe-card {
        background: ${C.white}; border: 1px solid ${C.border};
        border-radius: 12px; padding: 16px 14px;
        transition: transform 0.18s, box-shadow 0.18s;
        text-align: center; flex: 1; min-width: 0;
      }
      .lp-pipe-card:hover {
        transform: translateY(-3px);
        box-shadow: 0 8px 28px rgba(0,0,0,0.09);
      }

      /* ── Stat number animation ── */
      .lp-stat-item { text-align: center; }

      /* ── Product mockup float ── */
      .lp-mockup-float {
        animation: lp-float 5s ease-in-out infinite;
      }
      @keyframes lp-float {
        0%, 100% { transform: translateY(0px);   }
        50%       { transform: translateY(-10px); }
      }

      /* ── Fade-in-up animations ── */
      .lp-fade-in {
        animation: lp-fadeInUp 0.65s ease both;
      }
      .lp-fade-in-1 { animation-delay: 0.10s; }
      .lp-fade-in-2 { animation-delay: 0.22s; }
      .lp-fade-in-3 { animation-delay: 0.34s; }
      .lp-fade-in-4 { animation-delay: 0.46s; }
      .lp-fade-in-5 { animation-delay: 0.58s; }
      .lp-fade-in-6 { animation-delay: 0.70s; }
      @keyframes lp-fadeInUp {
        from { opacity: 0; transform: translateY(22px); }
        to   { opacity: 1; transform: translateY(0); }
      }

      /* ── Badge ── */
      .lp-badge {
        display: inline-flex; align-items: center; gap: 5px;
        padding: 5px 13px; border-radius: 20px;
        font-size: 12px; font-weight: 700;
      }

      /* ── Section spacing ── */
      .lp-section {
        padding: 88px 32px;
        max-width: 1200px;
        margin: 0 auto;
      }

      /* ── Section heading ── */
      .lp-section-heading {
        text-align: center; margin-bottom: 56px;
      }
      .lp-section-heading h2 {
        font-size: 36px; font-weight: 800;
        letter-spacing: -0.025em; line-height: 1.15;
        margin-bottom: 12px;
      }
      .lp-section-heading p {
        font-size: 16px; color: ${C.slate}; max-width: 520px; margin: 0 auto;
        line-height: 1.7;
      }

      /* ── Step connector line ── */
      .lp-step-connector {
        flex: 1; height: 1px; background: ${C.border};
        margin: 0 8px; position: relative; top: -40px;
      }

      /* ── Tech chip ── */
      .lp-tech-chip {
        display: inline-flex; align-items: center; gap: 8px;
        padding: 10px 18px; border-radius: 12px;
        background: ${C.white}; border: 1px solid ${C.border};
        font-size: 13px; font-weight: 600; color: ${C.text};
        transition: all 0.15s;
      }
      .lp-tech-chip:hover {
        border-color: ${C.indigo}66; background: ${C.indigo}06;
        color: ${C.indigo};
      }

      /* ── Scrollbar ── */
      ::-webkit-scrollbar { width: 6px; height: 6px; }
      ::-webkit-scrollbar-track { background: transparent; }
      ::-webkit-scrollbar-thumb { background: ${C.border}; border-radius: 3px; }
    `}</style>
  );
}

// ─── ProductMockup ────────────────────────────────────────────────────────────
// CSS-only miniature dashboard preview shown in the hero

export function ProductMockup() {
  const rows = [
    { rank: 1, title: 'SOFTEC 2026 Competition',   score: 92, status: C.emerald, type: C.rose    },
    { rank: 2, title: 'Google Summer of Code',      score: 88, status: C.emerald, type: C.indigo  },
    { rank: 3, title: 'HEC Need-Based Scholarship', score: 81, status: C.amber,   type: C.emerald },
    { rank: 4, title: 'Fulbright Scholarship',      score: 74, status: C.emerald, type: C.amber   },
    { rank: 5, title: 'Aga Khan Fellowship',        score: 68, status: C.emerald, type: C.amber   },
  ];

  const kpis = [
    { label: 'Scanned',   value: '7',   color: C.text    },
    { label: 'Found',     value: '5',   color: C.emerald },
    { label: 'Expiring',  value: '2',   color: C.rose    },
    { label: 'Avg Score', value: '74',  color: C.indigo  },
  ];

  return (
    <div className="lp-mockup-float" style={{
      background: C.bg, borderRadius: 18,
      border: `1px solid ${C.border}`,
      boxShadow: '0 28px 90px rgba(79,70,229,0.18), 0 8px 28px rgba(0,0,0,0.07)',
      overflow: 'hidden', width: '100%', maxWidth: 500,
    }}>
      {/* Browser chrome */}
      <div style={{
        background: '#f1f5f9', padding: '9px 14px',
        borderBottom: `1px solid ${C.border}`,
        display: 'flex', alignItems: 'center', gap: 7,
      }}>
        {['#f87171', '#fbbf24', '#34d399'].map(c => (
          <div key={c} style={{ width: 10, height: 10, borderRadius: '50%', background: c }} />
        ))}
        <div style={{
          flex: 1, background: C.white, borderRadius: 5, height: 20, marginLeft: 8,
          display: 'flex', alignItems: 'center', paddingLeft: 10,
          fontSize: 10, color: C.slate,
        }}>
          localhost:5173 — Opportunity Inbox Copilot
        </div>
      </div>

      {/* App header */}
      <div style={{
        background: C.white, borderBottom: `1px solid ${C.border}`,
        padding: '7px 12px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <span style={{ fontSize: 11, fontWeight: 700, color: C.text }}>🎓 Opportunity Inbox Copilot</span>
        <div style={{ display: 'flex', gap: 5 }}>
          <span style={{ background: C.indigo, color: '#fff', borderRadius: 5, padding: '3px 7px', fontSize: 9, fontWeight: 600 }}>📊 Dashboard</span>
          <span style={{ color: C.slate, borderRadius: 5, padding: '3px 7px', fontSize: 9 }}>✉️ Reply</span>
        </div>
      </div>

      {/* Content */}
      <div style={{ padding: 10, display: 'flex', flexDirection: 'column', gap: 8 }}>

        {/* Mini KPI row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 5 }}>
          {kpis.map(k => (
            <div key={k.label} style={{
              background: C.white, border: `1px solid ${C.border}`,
              borderRadius: 7, padding: '6px 8px',
            }}>
              <div style={{ fontSize: 8, color: C.slate, marginBottom: 2 }}>{k.label}</div>
              <div style={{ fontSize: 17, fontWeight: 800, color: k.color, lineHeight: 1 }}>{k.value}</div>
            </div>
          ))}
        </div>

        {/* Mini ranked table */}
        <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 8, overflow: 'hidden' }}>
          <div style={{
            padding: '5px 9px', borderBottom: `1px solid ${C.border}`,
            display: 'grid', gridTemplateColumns: '20px 1fr 46px 8px',
            gap: 4, fontSize: 7, fontWeight: 700, color: C.slate, textTransform: 'uppercase',
          }}>
            <span>#</span><span>Opportunity</span><span>Score</span><span />
          </div>
          {rows.map((row, i) => (
            <div key={i} style={{
              padding: '5px 9px',
              borderBottom: i < rows.length - 1 ? `1px solid ${C.border}` : 'none',
              display: 'grid', gridTemplateColumns: '20px 1fr 46px 8px',
              gap: 4, alignItems: 'center',
              background: i % 2 === 0 ? C.white : C.bg,
            }}>
              <span style={{ fontSize: 8, fontWeight: 700, color: C.slate }}>#{row.rank}</span>
              <span style={{ fontSize: 8.5, color: C.text, overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
                {row.title}
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                <span style={{ fontSize: 8.5, fontWeight: 700, color: C.text }}>{row.score}</span>
                <div style={{ flex: 1, background: C.border, borderRadius: 2, height: 3 }}>
                  <div style={{ width: `${row.score}%`, height: '100%', borderRadius: 2, background: row.score >= 85 ? C.emerald : C.amber }} />
                </div>
              </div>
              <div style={{ width: 7, height: 7, borderRadius: '50%', background: row.status }} />
            </div>
          ))}
        </div>

        {/* Mini charts row */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
          {/* Stacked bar */}
          <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 8, padding: '8px 9px' }}>
            <div style={{ fontSize: 7, fontWeight: 700, color: C.slate, textTransform: 'uppercase', marginBottom: 5 }}>Score Breakdown</div>
            {[
              { label: 'SOFTEC', u: 30, p: 32, e: 22, c: 8 },
              { label: 'GSoC',   u: 22, p: 30, e: 25, c: 11 },
              { label: 'HEC',    u: 18, p: 28, e: 25, c: 10 },
            ].map((r, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 4 }}>
                <span style={{ fontSize: 7, color: C.slate, width: 30, flexShrink: 0 }}>{r.label}</span>
                <div style={{ flex: 1, display: 'flex', height: 6, borderRadius: 3, overflow: 'hidden' }}>
                  <div style={{ width: `${r.u}%`, background: C.rose    }} />
                  <div style={{ width: `${r.p}%`, background: C.indigo  }} />
                  <div style={{ width: `${r.e}%`, background: C.emerald }} />
                  <div style={{ width: `${r.c}%`, background: C.amber   }} />
                </div>
              </div>
            ))}
          </div>

          {/* Donut (CSS conic-gradient) */}
          <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 8, padding: '8px 9px' }}>
            <div style={{ fontSize: 7, fontWeight: 700, color: C.slate, textTransform: 'uppercase', marginBottom: 5 }}>Type Mix</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
              <div style={{
                width: 46, height: 46, borderRadius: '50%', flexShrink: 0,
                background: `conic-gradient(${C.rose} 0 72deg, ${C.indigo} 72deg 144deg, ${C.emerald} 144deg 216deg, ${C.amber} 216deg 288deg, ${C.purple} 288deg 360deg)`,
                position: 'relative',
              }}>
                <div style={{
                  position: 'absolute', inset: 9, borderRadius: '50%', background: C.white,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 10, fontWeight: 800, color: C.text,
                }}>5</div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                {[
                  { label: 'Competition', color: C.rose    },
                  { label: 'Internship',  color: C.indigo  },
                  { label: 'Scholarship', color: C.emerald },
                ].map(t => (
                  <div key={t.label} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <div style={{ width: 6, height: 6, borderRadius: '50%', background: t.color, flexShrink: 0 }} />
                    <span style={{ fontSize: 7.5, color: C.slate }}>{t.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Classified inbox strip */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {[
            { label: 'SOFTEC 2026 — Registration Open',       is_opp: true  },
            { label: 'Google Summer of Code Applications',     is_opp: true  },
            { label: 'Weekly Campus Newsletter — April 2026',  is_opp: false },
            { label: 'MEGA SALE — 50% Off Coding Courses',     is_opp: false },
          ].map((e, i) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '4px 8px', borderRadius: 6,
              background: e.is_opp ? '#f0fdf4' : '#fef2f2',
              border: `1px solid ${e.is_opp ? '#bbf7d0' : '#fecaca'}`,
            }}>
              <span style={{ fontSize: 8, flexShrink: 0 }}>{e.is_opp ? '✅' : '🗑️'}</span>
              <span style={{ fontSize: 8, color: C.text, overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis', flex: 1 }}>
                {e.label}
              </span>
              <span style={{ fontSize: 7.5, fontWeight: 700, color: e.is_opp ? C.emerald : C.rose, flexShrink: 0 }}>
                {e.is_opp ? '97%' : '3%'}
              </span>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}

// ─── LandingNav ───────────────────────────────────────────────────────────────

export function LandingNav({ onGetStarted }) {
  return (
    <nav style={{
      position: 'sticky', top: 0, zIndex: 200,
      background: 'rgba(250,249,246,0.88)',
      backdropFilter: 'blur(12px)',
      borderBottom: `1px solid ${C.border}`,
    }}>
      <div style={{
        maxWidth: 1200, margin: '0 auto', padding: '0 32px',
        height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
          <span style={{ fontSize: 22 }}>🎓</span>
          <span style={{ ...serif, fontSize: 18, color: C.text }}>
            Opportunity Inbox Copilot
          </span>
        </div>

        {/* Nav links */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 32 }}>
          {[
            { label: 'How it works', href: '#how-it-works' },
            { label: 'Features',     href: '#features'     },
            { label: 'Pipeline',     href: '#pipeline'     },
            { label: 'Tech',         href: '#tech'         },
          ].map(l => (
            <a key={l.label} href={l.href} className="lp-nav-link">{l.label}</a>
          ))}
        </div>

        {/* CTA */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{
            background: C.indigo + '14', color: C.indigo, borderRadius: 20,
            padding: '4px 12px', fontSize: 11, fontWeight: 700,
          }}>
            SOFTEC 2026
          </span>
          <button className="lp-btn-sm" onClick={onGetStarted}>
            Launch App →
          </button>
        </div>
      </div>
    </nav>
  );
}

// ─── HeroSection ─────────────────────────────────────────────────────────────

export function HeroSection({ onGetStarted }) {
  return (
    <section style={{
      background: C.white,
      borderBottom: `1px solid ${C.border}`,
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Subtle background glow */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        background: `
          radial-gradient(ellipse 900px 600px at 80% 50%, ${C.indigo}0a 0%, transparent 65%),
          radial-gradient(ellipse 500px 400px at 20% 80%, ${C.purple}07 0%, transparent 60%)
        `,
      }} />

      <div style={{
        maxWidth: 1200, margin: '0 auto', padding: '80px 32px 88px',
        display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 56, alignItems: 'center',
        position: 'relative',
      }}>
        {/* ── Left: text ── */}
        <div>
          {/* Pill badge */}
          <div className="lp-fade-in lp-fade-in-1" style={{ marginBottom: 22 }}>
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: 7,
              background: C.indigo + '12', color: C.indigo,
              borderRadius: 20, padding: '6px 14px',
              fontSize: 12, fontWeight: 700, border: `1px solid ${C.indigo}25`,
            }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: C.emerald, animation: 'lp-fadeInUp 1s 0.5s ease both', display: 'inline-block' }} />
              SOFTEC 2026 Hackathon · Multi-Agent AI Pipeline
            </span>
          </div>

          {/* Headline */}
          <h1 className="lp-fade-in lp-fade-in-2" style={{
            fontSize: 54, fontWeight: 800, lineHeight: 1.1,
            letterSpacing: '-0.03em', marginBottom: 22, color: C.text,
          }}>
            <span className="lp-gradient-text">Stop Missing</span>
            <br />
            the Opportunities
            <br />
            That <em style={{ ...serif, fontStyle: 'italic', fontWeight: 400 }}>Matter</em>
          </h1>

          {/* Sub */}
          <p className="lp-fade-in lp-fade-in-3" style={{
            fontSize: 17, color: C.slate, lineHeight: 1.75, marginBottom: 32,
            maxWidth: 480,
          }}>
            Paste your student emails and our 4-agent AI pipeline instantly classifies,
            extracts, scores, and ranks every real opportunity — telling you exactly
            what to apply to first and why.
          </p>

          {/* CTA buttons */}
          <div className="lp-fade-in lp-fade-in-4" style={{ display: 'flex', gap: 14, marginBottom: 28, flexWrap: 'wrap' }}>
            <button className="lp-btn-primary" onClick={onGetStarted}>
              Start Analyzing Free →
            </button>
            <a href="#how-it-works" className="lp-btn-ghost">
              See How It Works ↓
            </a>
          </div>

          {/* Trust badges */}
          <div className="lp-fade-in lp-fade-in-5" style={{
            display: 'flex', gap: 18, flexWrap: 'wrap', alignItems: 'center',
          }}>
            {[
              '✓ No signup required',
              '✓ Results in under 60s',
              '✓ 100-point scoring',
            ].map(t => (
              <span key={t} style={{ fontSize: 13, color: C.slate, display: 'flex', alignItems: 'center', gap: 4 }}>
                <span style={{ color: C.emerald, fontWeight: 700 }}>{t.split(' ')[0]}</span>
                <span>{t.slice(2)}</span>
              </span>
            ))}
          </div>
        </div>

        {/* ── Right: product mockup ── */}
        <div className="lp-fade-in lp-fade-in-4" style={{
          display: 'flex', justifyContent: 'flex-end', alignItems: 'center',
        }}>
          <ProductMockup />
        </div>
      </div>
    </section>
  );
}

// ─── StatsBar ─────────────────────────────────────────────────────────────────

export function StatsBar() {
  const stats = [
    { value: '5',    label: 'Specialized AI Agents',     icon: '🤖' },
    { value: '<60s', label: 'End-to-end pipeline time',  icon: '⚡' },
    { value: '100',  label: 'Point scoring scale',       icon: '📊' },
    { value: '4',    label: 'Scoring dimensions',        icon: '🎯' },
  ];

  return (
    <div style={{
      background: C.indigo,
      padding: '40px 32px',
    }}>
      <div style={{
        maxWidth: 1200, margin: '0 auto',
        display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 20,
      }}>
        {stats.map((s, i) => (
          <div key={i} className="lp-stat-item">
            <div style={{ fontSize: 26, marginBottom: 6 }}>{s.icon}</div>
            <div style={{ fontSize: 36, fontWeight: 800, color: '#fff', lineHeight: 1, marginBottom: 6 }}>
              {s.value}
            </div>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.72)', lineHeight: 1.45 }}>
              {s.label}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── HowItWorks ──────────────────────────────────────────────────────────────

export function HowItWorks() {
  const steps = [
    {
      n: '01',
      icon: '📧',
      title: 'Paste Your Emails',
      desc: 'Add 5–15 emails from your student inbox — internship offers, scholarship notices, competition invites, and yes, the promotions too.',
      color: C.indigo,
    },
    {
      n: '02',
      icon: '🤖',
      title: 'AI Classifies & Extracts',
      desc: 'Four Gemini agents classify each email, extract deadlines, eligibility conditions, stipends, and application links automatically.',
      color: C.purple,
    },
    {
      n: '03',
      icon: '⚙️',
      title: 'Deterministic Scoring',
      desc: 'A deterministic engine (no hallucination!) scores every opportunity on Urgency, Profile Match, Eligibility Fit, and Completeness.',
      color: C.emerald,
    },
    {
      n: '04',
      icon: '🏆',
      title: 'Ranked Results & Insights',
      desc: 'Get your personal ranked dashboard: charts, score breakdowns, next-step action plans, and draft email replies — all in one view.',
      color: C.amber,
    },
  ];

  return (
    <div id="how-it-works" style={{ background: C.bg }}>
      <div className="lp-section">
        <div className="lp-section-heading">
          <h2>
            From Inbox Chaos to{' '}
            <span className="lp-gradient-text">Clarity in 4 Steps</span>
          </h2>
          <p>No setup, no configuration. Just paste emails and hit run.</p>
        </div>

        {/* Steps grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 20 }}>
          {steps.map((step, i) => (
            <div key={i} className="lp-card lp-fade-in" style={{ animationDelay: `${i * 0.12}s` }}>
              {/* Number + icon */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
                <span style={{
                  fontSize: 13, fontWeight: 800, color: step.color + 'aa',
                  letterSpacing: '0.04em',
                }}>
                  {step.n}
                </span>
                <div style={{
                  width: 46, height: 46, borderRadius: 14,
                  background: step.color + '15',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 22,
                }}>
                  {step.icon}
                </div>
              </div>

              {/* Progress dot row */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 16 }}>
                {steps.map((_, j) => (
                  <div key={j} style={{
                    height: 3, borderRadius: 2,
                    flex: j === i ? 3 : 1,
                    background: j === i ? step.color : C.border,
                    transition: 'flex 0.3s',
                  }} />
                ))}
              </div>

              <h3 style={{ fontSize: 17, fontWeight: 700, color: C.text, marginBottom: 10 }}>
                {step.title}
              </h3>
              <p style={{ fontSize: 13.5, color: C.slate, lineHeight: 1.7 }}>
                {step.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── FeaturesGrid ─────────────────────────────────────────────────────────────

export function FeaturesGrid() {
  const features = [
    {
      icon: '🧠',
      color: C.indigo,
      title: 'Multi-Agent Pipeline',
      desc: 'Classifier → Extractor → Validator → Scorer → Ranker. Each agent is sized to its task: flash-lite for classification, pro for ranking.',
    },
    {
      icon: '📐',
      color: C.emerald,
      title: 'Deterministic Scoring',
      desc: 'No hallucinated scores. Urgency (30 pts) + Profile Match (35 pts) + Eligibility Fit (25 pts) + Completeness (10 pts) = 100 total.',
    },
    {
      icon: '🔥',
      color: C.rose,
      title: 'Deadline Urgency Engine',
      desc: 'Color-coded urgency: rose for ≤3 days, amber for ≤7 days, emerald otherwise. Never miss another "applications close tonight" email.',
    },
    {
      icon: '🎯',
      color: C.purple,
      title: 'Semantic Profile Matching',
      desc: 'Embedding-based cosine similarity between your skills/interests and the opportunity requirements — beyond keyword matching.',
    },
    {
      icon: '🛡️',
      color: C.amber,
      title: 'Hard Eligibility Blocks',
      desc: 'If you don\'t meet a hard requirement (CGPA cutoff, citizenship, degree type), the opportunity is blocked before wasting your time.',
    },
    {
      icon: '✉️',
      color: C.indigo,
      title: 'AI Reply Drafts',
      desc: 'Three tone variants per opportunity (Formal, Warm, Concise) generated by Claude — personalized with your actual name, CGPA, and skills.',
    },
  ];

  return (
    <div id="features" style={{ background: C.white, borderTop: `1px solid ${C.border}` }}>
      <div className="lp-section">
        <div className="lp-section-heading">
          <h2>
            Everything You Need to{' '}
            <span className="lp-gradient-text">Act Fast</span>
          </h2>
          <p>
            Built for the chaotic student inbox — from finding the needle to drafting the reply.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
          {features.map((f, i) => (
            <div key={i} className="lp-card" style={{ animationDelay: `${i * 0.08}s` }}>
              {/* Icon */}
              <div style={{
                width: 52, height: 52, borderRadius: 14,
                background: f.color + '12',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 24, marginBottom: 18,
              }}>
                {f.icon}
              </div>

              {/* Accent line */}
              <div style={{
                width: 32, height: 3, borderRadius: 2,
                background: f.color, marginBottom: 14,
              }} />

              <h3 style={{ fontSize: 16, fontWeight: 700, color: C.text, marginBottom: 9 }}>
                {f.title}
              </h3>
              <p style={{ fontSize: 13.5, color: C.slate, lineHeight: 1.7 }}>
                {f.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── PipelineSection ──────────────────────────────────────────────────────────

export function PipelineSection() {
  const stages = [
    {
      n: 1, icon: '🔍', title: 'Classifier',
      model: 'Flash-Lite', color: C.indigo,
      desc: 'Is this a real opportunity?',
    },
    {
      n: 2, icon: '📋', title: 'Extractor',
      model: 'Flash', color: C.purple,
      desc: 'Pull title, deadline, links, stipend',
    },
    {
      n: 3, icon: '✅', title: 'Validator',
      model: 'Flash-Lite', color: C.emerald,
      desc: 'Normalize, deduplicate, flag gaps',
    },
    {
      n: 4, icon: '⚖️', title: 'Scorer',
      model: 'Deterministic', color: C.amber,
      desc: '100-point formula + embeddings',
    },
    {
      n: 5, icon: '🏅', title: 'Ranker',
      model: 'Pro', color: C.rose,
      desc: 'Personalized insights & next steps',
    },
  ];

  return (
    <div id="pipeline" style={{ background: C.bg, borderTop: `1px solid ${C.border}` }}>
      <div className="lp-section">
        <div className="lp-section-heading">
          <h2>
            The <span className="lp-gradient-text">4-Agent Pipeline</span>
          </h2>
          <p>Each agent is purpose-built and right-sized for its task — no oversized models where speed matters more.</p>
        </div>

        {/* Pipeline flow */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 0 }}>

          {/* Input */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, minWidth: 72 }}>
            <div style={{
              width: 56, height: 56, borderRadius: '50%',
              background: C.text + '10', border: `2px solid ${C.border}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22,
            }}>📧</div>
            <span style={{ fontSize: 11, fontWeight: 600, color: C.slate, textAlign: 'center' }}>Raw<br/>Emails</span>
          </div>

          {/* Arrow */}
          <div style={{ flex: 'none', width: 20, display: 'flex', alignItems: 'center', paddingTop: 16 }}>
            <div style={{ width: '100%', height: 2, background: C.border, position: 'relative' }}>
              <div style={{ position: 'absolute', right: -4, top: -4, width: 0, height: 0, borderTop: '5px solid transparent', borderBottom: '5px solid transparent', borderLeft: `8px solid ${C.border}` }} />
            </div>
          </div>

          {/* Stages */}
          {stages.map((s, i) => (
            <React.Fragment key={i}>
              <div className="lp-pipe-card" style={{ border: `2px solid ${s.color}30` }}>
                {/* Model badge */}
                <div style={{
                  display: 'inline-flex', alignItems: 'center',
                  background: s.color + '14', color: s.color,
                  borderRadius: 6, padding: '2px 7px',
                  fontSize: 9, fontWeight: 700, marginBottom: 10,
                }}>
                  {s.model}
                </div>

                {/* Icon + Number */}
                <div style={{
                  width: 42, height: 42, borderRadius: 12, margin: '0 auto 10px',
                  background: s.color + '14',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20,
                }}>
                  {s.icon}
                </div>

                <div style={{ fontSize: 13, fontWeight: 700, color: C.text, marginBottom: 5 }}>
                  {s.title}
                </div>
                <div style={{ fontSize: 11, color: C.slate, lineHeight: 1.5 }}>
                  {s.desc}
                </div>

                {/* Bottom color bar */}
                <div style={{ height: 3, borderRadius: 2, background: s.color, marginTop: 12 }} />
              </div>

              {/* Arrow connector */}
              {i < stages.length - 1 && (
                <div style={{ flex: 'none', width: 16, display: 'flex', alignItems: 'center', paddingTop: 16 }}>
                  <div style={{ width: '100%', height: 2, background: C.border, position: 'relative' }}>
                    <div style={{ position: 'absolute', right: -4, top: -4, width: 0, height: 0, borderTop: '5px solid transparent', borderBottom: '5px solid transparent', borderLeft: `8px solid ${C.border}` }} />
                  </div>
                </div>
              )}
            </React.Fragment>
          ))}

          {/* Final arrow */}
          <div style={{ flex: 'none', width: 20, display: 'flex', alignItems: 'center', paddingTop: 16 }}>
            <div style={{ width: '100%', height: 2, background: C.border, position: 'relative' }}>
              <div style={{ position: 'absolute', right: -4, top: -4, width: 0, height: 0, borderTop: '5px solid transparent', borderBottom: '5px solid transparent', borderLeft: `8px solid ${C.border}` }} />
            </div>
          </div>

          {/* Output */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, minWidth: 72 }}>
            <div style={{
              width: 56, height: 56, borderRadius: '50%',
              background: C.emerald + '14', border: `2px solid ${C.emerald}44`,
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22,
            }}>📊</div>
            <span style={{ fontSize: 11, fontWeight: 600, color: C.emerald, textAlign: 'center' }}>Ranked<br/>Results</span>
          </div>
        </div>

        {/* Formula card */}
        <div style={{
          marginTop: 36, background: C.white, border: `1px solid ${C.border}`,
          borderRadius: 16, padding: '22px 28px',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0, flexWrap: 'wrap',
        }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: C.slate, marginRight: 10 }}>Scoring formula:</span>
          {[
            { label: 'Urgency',       pts: '30', color: C.rose    },
            { label: 'Profile Match', pts: '35', color: C.indigo  },
            { label: 'Eligibility',   pts: '25', color: C.emerald },
            { label: 'Completeness',  pts: '10', color: C.amber   },
          ].map((item, i) => (
            <React.Fragment key={i}>
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: 5,
                background: item.color + '12', color: item.color,
                borderRadius: 8, padding: '5px 12px',
                fontSize: 13, fontWeight: 700, margin: '4px 3px',
              }}>
                {item.label} <span style={{ opacity: 0.7 }}>({item.pts} pts)</span>
              </span>
              {i < 3 && <span style={{ fontSize: 16, color: C.border, margin: '0 2px' }}>+</span>}
            </React.Fragment>
          ))}
          <span style={{ fontSize: 16, color: C.border, margin: '0 6px' }}>=</span>
          <span style={{ fontSize: 16, fontWeight: 800, color: C.text }}>100 pts</span>
        </div>
      </div>
    </div>
  );
}

// ─── TechStack ────────────────────────────────────────────────────────────────

export function TechStack() {
  const chips = [
    { icon: '✨', label: 'Google Gemini 2.5',       sub: 'Flash / Pro / Lite'   },
    { icon: '🧬', label: 'Gemini Embeddings',        sub: 'gemini-embedding-001' },
    { icon: '🤖', label: 'Anthropic Claude',          sub: 'claude-sonnet-4'      },
    { icon: '⚡', label: 'FastAPI + Uvicorn',          sub: 'Python 3.12'          },
    { icon: '🔷', label: 'Pydantic v2',               sub: 'Data contracts'       },
    { icon: '⚛️', label: 'React 18 + Vite 5',         sub: 'Frontend'             },
    { icon: '📈', label: 'Recharts 2',                sub: 'All visualizations'   },
    { icon: '🎨', label: 'CSS-in-JS',                 sub: 'No framework needed'  },
  ];

  return (
    <div id="tech" style={{ background: C.white, borderTop: `1px solid ${C.border}` }}>
      <div className="lp-section">
        <div className="lp-section-heading">
          <h2>Built with <span className="lp-gradient-text">Best-in-Class</span> Tools</h2>
          <p>Right-sized models at every layer — from flash-lite for classification to pro for personalized ranking.</p>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, justifyContent: 'center' }}>
          {chips.map((c, i) => (
            <div key={i} className="lp-tech-chip">
              <span style={{ fontSize: 18 }}>{c.icon}</span>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, lineHeight: 1.2 }}>{c.label}</div>
                <div style={{ fontSize: 10, color: C.slate }}>{c.sub}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── CTASection ───────────────────────────────────────────────────────────────

export function CTASection({ onGetStarted }) {
  return (
    <div style={{ background: C.bg, borderTop: `1px solid ${C.border}` }}>
      <div style={{
        maxWidth: 720, margin: '0 auto', padding: '100px 32px',
        textAlign: 'center',
      }}>
        {/* Glow orb */}
        <div style={{
          width: 80, height: 80, borderRadius: '50%',
          background: `radial-gradient(circle, ${C.indigo}30, ${C.purple}10, transparent 70%)`,
          margin: '0 auto 24px',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 36,
        }}>
          🚀
        </div>

        <h2 style={{
          fontSize: 42, fontWeight: 800, letterSpacing: '-0.03em',
          lineHeight: 1.15, marginBottom: 16, color: C.text,
        }}>
          Ready to find your next
          <br />
          <span className="lp-gradient-text">big opportunity?</span>
        </h2>

        <p style={{ fontSize: 17, color: C.slate, lineHeight: 1.7, marginBottom: 36, maxWidth: 480, margin: '0 auto 36px' }}>
          Paste your emails. Let the AI do the work. Know what to apply to in under a minute.
        </p>

        <button className="lp-btn-primary" onClick={onGetStarted} style={{ fontSize: 17, padding: '15px 36px' }}>
          Launch App — It&apos;s Free →
        </button>

        {/* Reassurance row */}
        <div style={{
          marginTop: 24, display: 'flex', gap: 24, justifyContent: 'center', flexWrap: 'wrap',
        }}>
          {['No account', 'No data stored', 'Runs locally', 'Open source'].map(t => (
            <span key={t} style={{ fontSize: 13, color: C.slate, display: 'flex', alignItems: 'center', gap: 5 }}>
              <span style={{ color: C.emerald }}>✓</span> {t}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── LandingFooter ────────────────────────────────────────────────────────────

export function LandingFooter() {
  const col = (title, items) => (
    <div>
      <div style={{ fontSize: 11, fontWeight: 700, color: C.text, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 14 }}>
        {title}
      </div>
      {items.map(item => (
        <div key={item} style={{ fontSize: 13, color: C.slate, marginBottom: 8 }}>{item}</div>
      ))}
    </div>
  );

  return (
    <footer style={{
      background: C.text,
      borderTop: `1px solid ${C.border}`,
    }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '48px 32px 32px' }}>
        {/* Top row */}
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: 40, marginBottom: 40 }}>
          {/* Brand */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
              <span style={{ fontSize: 22 }}>🎓</span>
              <span style={{ ...serif, fontSize: 17, color: '#fff' }}>Opportunity Inbox Copilot</span>
            </div>
            <p style={{ fontSize: 13.5, color: 'rgba(255,255,255,0.55)', lineHeight: 1.7, maxWidth: 300 }}>
              AI-powered email triage for university students. Built for SOFTEC 2026 using a multi-agent Gemini pipeline.
            </p>
          </div>

          {/* Columns */}
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 14 }}>Pipeline</div>
            {['Classifier Agent', 'Extractor Agent', 'Validator Agent', 'Scoring Engine', 'Ranker Agent'].map(item => (
              <div key={item} style={{ fontSize: 13, color: 'rgba(255,255,255,0.55)', marginBottom: 8 }}>{item}</div>
            ))}
          </div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 14 }}>Tech Stack</div>
            {['Google Gemini 2.5', 'Anthropic Claude', 'FastAPI + Python', 'React + Vite', 'Recharts'].map(item => (
              <div key={item} style={{ fontSize: 13, color: 'rgba(255,255,255,0.55)', marginBottom: 8 }}>{item}</div>
            ))}
          </div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 14 }}>Scoring</div>
            {['Urgency (30 pts)', 'Profile Match (35 pts)', 'Eligibility (25 pts)', 'Completeness (10 pts)', '= 100 Total'].map(item => (
              <div key={item} style={{ fontSize: 13, color: 'rgba(255,255,255,0.55)', marginBottom: 8 }}>{item}</div>
            ))}
          </div>
        </div>

        {/* Divider */}
        <div style={{ height: 1, background: 'rgba(255,255,255,0.1)', marginBottom: 24 }} />

        {/* Bottom row */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>
            © 2026 Opportunity Inbox Copilot · Built for SOFTEC 2026 Hackathon
          </span>
          <div style={{ display: 'flex', gap: 16 }}>
            {[
              { bg: C.indigo + 'cc', label: 'Gemini 2.5' },
              { bg: C.purple + 'cc', label: 'Claude Sonnet 4' },
              { bg: C.emerald + 'cc', label: 'FastAPI' },
            ].map(b => (
              <span key={b.label} style={{
                fontSize: 10, fontWeight: 700,
                background: b.bg, color: '#fff',
                borderRadius: 6, padding: '3px 8px',
              }}>
                {b.label}
              </span>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}

// ─── LandingPage (default export) ────────────────────────────────────────────

export default function LandingPage({ onGetStarted }) {
  return (
    <>
      <LandingStyles />
      <LandingNav     onGetStarted={onGetStarted} />
      <HeroSection    onGetStarted={onGetStarted} />
      <StatsBar />
      <HowItWorks />
      <FeaturesGrid />
      <PipelineSection />
      <TechStack />
      <CTASection     onGetStarted={onGetStarted} />
      <LandingFooter />
    </>
  );
}
