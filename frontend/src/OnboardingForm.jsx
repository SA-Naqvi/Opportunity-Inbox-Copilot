/**
 * OnboardingForm.jsx
 *
 * Glassmorphic 3D multi-step onboarding form.
 * Sections (in order):
 *   FormStyles    — all CSS: orbs, grid, particles, rings, transitions, inputs
 *   Background3D  — animated 3D scene (orbs, grid, rings, particles)
 *   ProgressBar   — step indicator with connecting lines
 *   TagInput      — reusable tag-chips input with suggestions
 *   Step1Welcome  — name
 *   Step2Academic — degree / semester / cgpa
 *   Step3Skills   — skills + interests tags
 *   Step4Prefs    — opportunity types / financial need / location
 *   Step5Exp      — past experience list
 *   Step6Connect  — gmail + google calendar
 *   Step7Review   — summary + launch
 *   OnboardingForm (default export)
 *
 * Props:
 *   onComplete({ name, profile, gmailAddress, calendarName }) → void
 */

import React, { useState, useRef } from 'react';

// ─── Glassmorphic tokens ──────────────────────────────────────────────────────

const G = {
  text:         '#ffffff',
  textMuted:    'rgba(255,255,255,0.65)',
  textFaint:    'rgba(255,255,255,0.35)',
  indigo:       '#4f46e5',
  purple:       '#7c3aed',
  cyan:         '#06b6d4',
  emerald:      '#10b981',
  rose:         '#f43f5e',
  amber:        '#f59e0b',
  glass:        'rgba(255,255,255,0.07)',
  glassBorder:  'rgba(255,255,255,0.13)',
  inputBg:      'rgba(255,255,255,0.09)',
  inputBorder:  'rgba(255,255,255,0.18)',
};

const glassCard = {
  background:           'rgba(255,255,255,0.07)',
  backdropFilter:       'blur(28px)',
  WebkitBackdropFilter: 'blur(28px)',
  border:               '1px solid rgba(255,255,255,0.13)',
  borderRadius:         24,
  boxShadow:            '0 12px 48px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.1)',
  padding:              '36px 40px',
};

const glassInput = {
  background:           'rgba(255,255,255,0.09)',
  border:               '1px solid rgba(255,255,255,0.18)',
  borderRadius:         12,
  color:                '#fff',
  padding:              '13px 16px',
  fontSize:             14,
  fontFamily:           "'DM Sans', sans-serif",
  outline:              'none',
  width:                '100%',
  transition:           'border-color 0.2s, background 0.2s',
};

// ─── Constant data ────────────────────────────────────────────────────────────

const STEP_META = [
  { label: 'Welcome',     emoji: '👋' },
  { label: 'Academic',    emoji: '📚' },
  { label: 'Skills',      emoji: '⚡' },
  { label: 'Preferences', emoji: '🎯' },
  { label: 'Experience',  emoji: '🏆' },
  { label: 'Connect',     emoji: '🔗' },
  { label: 'Launch',      emoji: '🚀' },
];

const SKILL_SUGGESTIONS = [
  'Python', 'JavaScript', 'TypeScript', 'React', 'Vue.js', 'Node.js',
  'Django', 'FastAPI', 'Flask', 'TensorFlow', 'PyTorch', 'Machine Learning',
  'Deep Learning', 'Data Science', 'SQL', 'PostgreSQL', 'MongoDB', 'Docker',
  'Kubernetes', 'AWS', 'C++', 'Java', 'Flutter', 'Git', 'Linux', 'GraphQL',
];

const INTEREST_SUGGESTIONS = [
  'Artificial Intelligence', 'Machine Learning', 'Web Development', 'Mobile Apps',
  'Cloud Computing', 'Cybersecurity', 'Blockchain', 'Open Source', 'Research',
  'Data Science', 'DevOps', 'UI/UX Design', 'Robotics', 'Entrepreneurship',
  'Computer Vision', 'NLP', 'Competitive Programming',
];

const OPP_TYPES = [
  { id: 'internship',        icon: '💼', label: 'Internship',  color: '#4f46e5' },
  { id: 'scholarship',       icon: '🎓', label: 'Scholarship', color: '#10b981' },
  { id: 'fellowship',        icon: '🔬', label: 'Fellowship',  color: '#f59e0b' },
  { id: 'competition',       icon: '🏆', label: 'Competition', color: '#f43f5e' },
  { id: 'hackathon',         icon: '⚡', label: 'Hackathon',   color: '#7c3aed' },
  { id: 'research_position', icon: '🧪', label: 'Research',    color: '#06b6d4' },
];

const DEFAULT_FORM = {
  name:                        '',
  degree:                      'BS Computer Science',
  university:                  '',
  semester:                    6,
  cgpa:                        3.4,
  skills:                      ['Python', 'Machine Learning', 'React'],
  interests:                   ['AI', 'Software Engineering'],
  preferred_opportunity_types: ['internship', 'fellowship'],
  financial_need:              false,
  location_preference:         'Pakistan / Remote',
  past_experience:             ['ICPC 2024 participant'],
  gmail_address:               '',
  gmail_app_password:          '',
  calendar_name:               'primary',
};

// ─── FormStyles ───────────────────────────────────────────────────────────────

function FormStyles() {
  return (
    <style>{`
      @import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600;9..40,700;9..40,800&display=swap');

      /* ── Orb floats ── */
      @keyframes of-float1 {
        0%,100% { transform: translate3d(0,0,0) scale(1); }
        30%  { transform: translate3d(80px,-60px,120px) scale(1.1); }
        65%  { transform: translate3d(-40px,80px,60px)  scale(0.95); }
      }
      @keyframes of-float2 {
        0%,100% { transform: translate3d(0,0,0); }
        40%  { transform: translate3d(-100px,40px,-80px); }
        70%  { transform: translate3d(60px,-60px,90px); }
      }
      @keyframes of-float3 {
        0%,100% { transform: translate3d(0,0,0); }
        50%  { transform: translate3d(50px,70px,-60px) scale(1.15); }
      }
      @keyframes of-float4 {
        0%,100% { transform: translate3d(0,0,0); }
        33%  { transform: translate3d(-60px,-40px,40px); }
        66%  { transform: translate3d(40px,60px,-30px); }
      }
      @keyframes of-float5 {
        0%,100% { transform: translate3d(0,0,0) scale(1); }
        50%  { transform: translate3d(70px,-50px,80px) scale(1.08); }
      }

      /* ── Perspective grid ── */
      @keyframes of-grid-move {
        from { background-position: 0 0; }
        to   { background-position: 0 60px; }
      }

      /* ── Ring spin ── */
      @keyframes of-ring-spin {
        from { transform: translate(-50%,-50%) rotateX(72deg) rotateZ(0deg); }
        to   { transform: translate(-50%,-50%) rotateX(72deg) rotateZ(360deg); }
      }
      @keyframes of-ring-spin2 {
        from { transform: translate(-50%,-50%) rotateX(72deg) rotateZ(0deg) scale(0.6); }
        to   { transform: translate(-50%,-50%) rotateX(72deg) rotateZ(-360deg) scale(0.6); }
      }

      /* ── Particle twinkle ── */
      @keyframes of-twinkle-0 { 0%,100%{opacity:.15;transform:scale(1)}  50%{opacity:1;transform:scale(2.5)} }
      @keyframes of-twinkle-1 { 0%,100%{opacity:.1; transform:scale(1)}  50%{opacity:.8;transform:scale(2)}   }
      @keyframes of-twinkle-2 { 0%,100%{opacity:.2; transform:scale(1)}  50%{opacity:1;transform:scale(3)}    }
      @keyframes of-twinkle-3 { 0%,100%{opacity:.05;transform:scale(1)}  50%{opacity:.7;transform:scale(1.8)} }
      @keyframes of-twinkle-4 { 0%,100%{opacity:.15;transform:scale(1)}  50%{opacity:.9;transform:scale(2.2)} }

      /* ── Step transitions ── */
      @keyframes of-enter-fwd {
        from { opacity:0; transform:translateX(48px) scale(0.97); }
        to   { opacity:1; transform:translateX(0)    scale(1);    }
      }
      @keyframes of-enter-bwd {
        from { opacity:0; transform:translateX(-48px) scale(0.97); }
        to   { opacity:1; transform:translateX(0)     scale(1);    }
      }

      /* ── Shake (validation) ── */
      @keyframes of-shake {
        0%,100%{transform:translateX(0)}
        20%{transform:translateX(-8px)}
        40%{transform:translateX(8px)}
        60%{transform:translateX(-5px)}
        80%{transform:translateX(5px)}
      }
      .of-shake { animation: of-shake 0.45s ease; }

      /* ── Glass input focus ── */
      .of-glass-input:focus {
        border-color: rgba(79,70,229,0.7) !important;
        background: rgba(79,70,229,0.12) !important;
        box-shadow: 0 0 0 3px rgba(79,70,229,0.2);
      }
      .of-glass-input::placeholder { color: rgba(255,255,255,0.3); }
      .of-glass-select option { background: #1a0a3c; color: white; }

      /* ── Primary button ── */
      .of-btn-primary {
        background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
        border: none; border-radius: 14px; color: white;
        padding: 14px 28px; font-size: 15px; font-weight: 700;
        font-family:'DM Sans',sans-serif; cursor: pointer; width: 100%;
        box-shadow: 0 4px 24px rgba(79,70,229,0.5);
        transition: transform 0.15s, box-shadow 0.15s;
        display: flex; align-items: center; justify-content: center; gap: 8px;
      }
      .of-btn-primary:hover {
        transform: translateY(-2px);
        box-shadow: 0 8px 32px rgba(79,70,229,0.65);
      }
      .of-btn-primary:disabled {
        background: rgba(255,255,255,0.1); color: rgba(255,255,255,0.35);
        cursor: not-allowed; box-shadow: none; transform: none;
      }

      /* ── Ghost button ── */
      .of-btn-ghost {
        background: rgba(255,255,255,0.07);
        border: 1px solid rgba(255,255,255,0.14); border-radius: 14px;
        color: rgba(255,255,255,0.65); padding: 14px 22px;
        font-size: 14px; font-weight: 600; font-family:'DM Sans',sans-serif;
        cursor: pointer; transition: all 0.15s;
      }
      .of-btn-ghost:hover {
        background: rgba(255,255,255,0.12);
        border-color: rgba(255,255,255,0.28); color: white;
      }

      /* ── Tag chip ── */
      .of-tag {
        display:inline-flex; align-items:center; gap:5px;
        background: rgba(79,70,229,0.22); border: 1px solid rgba(79,70,229,0.45);
        color: white; border-radius: 8px; padding: 4px 10px; font-size: 12.5px;
        font-weight: 600; font-family:'DM Sans',sans-serif;
        animation: of-enter-fwd 0.25s ease;
      }
      .of-tag-remove {
        background:none;border:none;cursor:pointer;color:rgba(255,255,255,0.5);
        font-size:14px;padding:0;line-height:1; transition:color 0.15s;
      }
      .of-tag-remove:hover { color:white; }

      /* ── Suggestion pill ── */
      .of-suggest {
        display:inline-flex; align-items:center;
        background: rgba(255,255,255,0.07); border: 1px solid rgba(255,255,255,0.12);
        color: rgba(255,255,255,0.7); border-radius: 8px;
        padding: 3px 10px; font-size: 12px;
        font-family:'DM Sans',sans-serif; cursor:pointer; transition:all 0.15s;
      }
      .of-suggest:hover {
        background:rgba(79,70,229,0.25); border-color:rgba(79,70,229,0.5);
        color:white;
      }

      /* ── Opportunity type card ── */
      .of-type-card {
        border-radius: 14px; padding: 14px 10px; text-align: center; cursor: pointer;
        transition: all 0.2s; border: 1.5px solid rgba(255,255,255,0.1);
        background: rgba(255,255,255,0.05);
        display: flex; flex-direction: column; align-items: center; gap: 7px;
      }
      .of-type-card:hover { transform: translateY(-3px); border-color: rgba(255,255,255,0.3); }

      /* ── Experience item ── */
      .of-exp-item {
        display:flex; align-items:center; gap:10px; justify-content:space-between;
        background:rgba(255,255,255,0.07); border:1px solid rgba(255,255,255,0.12);
        border-radius:10px; padding:9px 14px;
        animation: of-enter-fwd 0.25s ease;
      }

      /* ── Semester dot ── */
      .of-sem-dot {
        width:36px; height:36px; border-radius:50%; border:2px solid rgba(255,255,255,0.2);
        display:flex; align-items:center; justify-content:center;
        font-size:13px; font-weight:700; color:rgba(255,255,255,0.5);
        cursor:pointer; transition:all 0.18s; background:rgba(255,255,255,0.05);
        font-family:'DM Sans',sans-serif;
      }
      .of-sem-dot:hover { border-color:rgba(79,70,229,0.7); color:white; }

      /* ── Range slider ── */
      .of-range { accent-color:#4f46e5; cursor:pointer; }

      /* ── Integration card ── */
      .of-int-card {
        background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.11);
        border-radius:16px; padding:18px 20px;
      }

      /* ── Summary row ── */
      .of-sum-row {
        display:flex; gap:8px; flex-wrap:wrap; align-items:center; padding:10px 0;
        border-bottom:1px solid rgba(255,255,255,0.08);
      }
      .of-sum-row:last-child { border-bottom:none; }
    `}</style>
  );
}

// ─── Background3D ─────────────────────────────────────────────────────────────

function Background3D() {
  const PARTICLES = Array.from({ length: 28 }, (_, i) => ({
    left:  `${(i * 19 + 3) % 97}%`,
    top:   `${(i * 31 + 7) % 94}%`,
    cls:   `of-twinkle-${i % 5}`,
    delay: `${(i * 0.37).toFixed(2)}s`,
    size:  i % 4 === 0 ? 3 : i % 3 === 0 ? 2 : 1.5,
  }));

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 0, overflow: 'hidden',
      background: 'radial-gradient(ellipse 120% 100% at 30% 40%, #120530 0%, #060614 45%, #071028 100%)',
    }}>
      {/* ── Orbs ── */}
      {[
        { cls: 'of-float1', s: 580, color: '#4f46e5', t: '-180px', l: '-120px', op: 0.55, dur: '14s' },
        { cls: 'of-float2', s: 420, color: '#7c3aed', b: '-120px', r:  '8%',   op: 0.5,  dur: '18s' },
        { cls: 'of-float3', s: 300, color: '#06b6d4', t:  '25%',   r: '-60px', op: 0.4,  dur: '12s' },
        { cls: 'of-float4', s: 260, color: '#8b5cf6', t:  '38%',   l:  '4%',   op: 0.38, dur: '16s' },
        { cls: 'of-float5', s: 380, color: '#0ea5e9', b:  '12%',   l:  '22%',  op: 0.3,  dur: '20s' },
      ].map((o, i) => (
        <div key={i} style={{
          position: 'absolute', borderRadius: '50%',
          width: o.s, height: o.s,
          background: `radial-gradient(circle at center, ${o.color}cc, ${o.color}00 70%)`,
          filter: 'blur(64px)', opacity: o.op,
          top: o.t, bottom: o.b, left: o.l, right: o.r,
          animation: `${o.cls} ${o.dur} ease-in-out infinite`,
          willChange: 'transform',
        }} />
      ))}

      {/* ── Perspective grid (moving floor) ── */}
      <div style={{
        position: 'absolute', bottom: 0, left: '-60%', right: '-60%', height: '55vh',
        backgroundImage:
          'linear-gradient(rgba(79,70,229,0.1) 1px, transparent 1px),' +
          'linear-gradient(90deg, rgba(79,70,229,0.1) 1px, transparent 1px)',
        backgroundSize: '60px 60px',
        transform: 'perspective(700px) rotateX(52deg)',
        transformOrigin: 'bottom center',
        animation: 'of-grid-move 3.5s linear infinite',
        maskImage:         'linear-gradient(to top, black 0%, transparent 100%)',
        WebkitMaskImage:   'linear-gradient(to top, black 0%, transparent 100%)',
      }} />

      {/* ── Floating rings ── */}
      {[
        { s: 680, dur: '32s', dir: 'normal'  },
        { s: 420, dur: '22s', dir: 'reverse' },
        { s: 220, dur: '18s', dir: 'normal'  },
      ].map((r, i) => (
        <div key={i} style={{
          position: 'absolute', borderRadius: '50%',
          width: r.s, height: r.s,
          border: '1px solid rgba(255,255,255,0.04)',
          top: '50%', left: '50%',
          animation: `of-ring-spin${i === 1 ? '2' : ''} ${r.dur} linear infinite`,
          animationDirection: r.dir,
        }} />
      ))}

      {/* ── Particles ── */}
      {PARTICLES.map((p, i) => (
        <div key={i} style={{
          position: 'absolute', borderRadius: '50%',
          width: p.size, height: p.size,
          background: 'rgba(255,255,255,0.7)',
          left: p.left, top: p.top,
          animation: `${p.cls} ${3 + (i % 3)}s ease-in-out infinite`,
          animationDelay: p.delay,
        }} />
      ))}

      {/* ── Vignette overlay ── */}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'radial-gradient(ellipse 70% 70% at 50% 50%, transparent 40%, rgba(0,0,0,0.6) 100%)',
        pointerEvents: 'none',
      }} />
    </div>
  );
}

// ─── ProgressBar ─────────────────────────────────────────────────────────────

function ProgressBar({ current, total }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'flex-start', gap: 0,
      marginBottom: 28, width: '100%',
    }}>
      {STEP_META.slice(0, total).map((s, i) => (
        <React.Fragment key={i}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5, zIndex: 1 }}>
            {/* Circle */}
            <div style={{
              width:  30, height: 30, borderRadius: '50%',
              background: i < current
                ? 'linear-gradient(135deg,#10b981,#059669)'
                : i === current
                ? 'linear-gradient(135deg,#4f46e5,#7c3aed)'
                : 'rgba(255,255,255,0.1)',
              border: i <= current ? 'none' : '1.5px solid rgba(255,255,255,0.18)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: i < current ? 12 : 11, fontWeight: 700, color: 'white',
              transition: 'all 0.35s',
              boxShadow: i === current ? '0 0 16px rgba(79,70,229,0.6)' : 'none',
            }}>
              {i < current ? '✓' : i + 1}
            </div>
            {/* Label */}
            <span style={{
              fontSize: 9.5, fontWeight: i === current ? 700 : 400,
              color: i === current ? '#fff' : i < current ? 'rgba(255,255,255,0.5)' : 'rgba(255,255,255,0.25)',
              whiteSpace: 'nowrap', transition: 'all 0.3s',
              fontFamily: "'DM Sans', sans-serif",
            }}>
              {s.label}
            </span>
          </div>
          {/* Connector line */}
          {i < total - 1 && (
            <div style={{
              flex: 1, height: 2, marginTop: 14, marginBottom: 20,
              background: i < current
                ? 'linear-gradient(90deg,#10b981,#10b981)'
                : 'rgba(255,255,255,0.1)',
              transition: 'background 0.4s',
              borderRadius: 1,
            }} />
          )}
        </React.Fragment>
      ))}
    </div>
  );
}

// ─── TagInput ─────────────────────────────────────────────────────────────────

function TagInput({ label, tags, onAdd, onRemove, suggestions, placeholder }) {
  const [input, setInput] = useState('');
  const shown = suggestions
    .filter(s => !tags.includes(s) && s.toLowerCase().includes(input.toLowerCase()))
    .slice(0, 8);

  const add = (val) => {
    const v = (val || input).trim();
    if (v && !tags.includes(v)) onAdd(v);
    setInput('');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {label && (
        <label style={{ fontSize: 11, fontWeight: 700, color: G.textFaint, textTransform: 'uppercase', letterSpacing: '0.07em' }}>
          {label}
        </label>
      )}

      {/* Tags display */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, minHeight: 28 }}>
        {tags.map(t => (
          <span key={t} className="of-tag">
            {t}
            <button className="of-tag-remove" onClick={() => onRemove(t)}>×</button>
          </span>
        ))}
      </div>

      {/* Input row */}
      <div style={{ display: 'flex', gap: 8 }}>
        <input
          className="of-glass-input"
          style={glassInput}
          placeholder={placeholder || 'Type and press Enter…'}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); add(); } }}
        />
        <button
          onClick={() => add()}
          style={{
            flexShrink: 0, width: 40, height: 40, borderRadius: 10, border: 'none',
            background: 'rgba(79,70,229,0.4)', color: 'white', fontSize: 20,
            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'background 0.15s',
          }}
        >+</button>
      </div>

      {/* Suggestions */}
      {shown.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
          {shown.map(s => (
            <button key={s} className="of-suggest" onClick={() => add(s)}>{s}</button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Step 1 — Welcome ─────────────────────────────────────────────────────────

function Step1Welcome({ data, update }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 28, alignItems: 'center', textAlign: 'center' }}>
      {/* Hero icon */}
      <div style={{
        width: 80, height: 80, borderRadius: '50%',
        background: 'linear-gradient(135deg, rgba(79,70,229,0.4), rgba(124,58,237,0.4))',
        border: '1px solid rgba(255,255,255,0.15)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 36,
        boxShadow: '0 0 40px rgba(79,70,229,0.4)',
      }}>🎓</div>

      <div>
        <h1 style={{ fontFamily: "'Instrument Serif', serif", fontStyle: 'italic', fontSize: 32, color: '#fff', marginBottom: 10, lineHeight: 1.2 }}>
          Welcome to Opportunity<br />Inbox Copilot
        </h1>
        <p style={{ fontSize: 14.5, color: G.textMuted, lineHeight: 1.7, maxWidth: 360 }}>
          We'll build your personal opportunity profile in under 2 minutes — then the AI finds, ranks, and explains every opportunity that fits you.
        </p>
      </div>

      <div style={{ width: '100%', textAlign: 'left' }}>
        <label style={{ fontSize: 11, fontWeight: 700, color: G.textFaint, textTransform: 'uppercase', letterSpacing: '0.07em', display: 'block', marginBottom: 8 }}>
          What should we call you?
        </label>
        <input
          autoFocus
          className="of-glass-input"
          style={{ ...glassInput, fontSize: 18, padding: '15px 18px', borderRadius: 14 }}
          placeholder="Your full name…"
          value={data.name}
          onChange={e => update('name', e.target.value)}
          onKeyDown={e => e.key === 'Enter' && e.target.blur()}
        />
      </div>

      {data.name.trim() && (
        <p style={{ fontSize: 13, color: G.textMuted, animation: 'of-enter-fwd 0.3s ease' }}>
          Great to meet you, <strong style={{ color: '#fff' }}>{data.name.trim().split(' ')[0]}</strong>! Let's set up your profile.
        </p>
      )}
    </div>
  );
}

// ─── Step 2 — Academic ────────────────────────────────────────────────────────

function Step2Academic({ data, update }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
      <div style={{ textAlign: 'center', marginBottom: 4 }}>
        <h2 style={{ fontFamily: "'Instrument Serif',serif", fontStyle: 'italic', fontSize: 24, color: '#fff', marginBottom: 6 }}>
          Academic Profile
        </h2>
        <p style={{ fontSize: 13, color: G.textMuted }}>Your degree and academic standing shape which opportunities you qualify for.</p>
      </div>

      {/* Degree */}
      <div>
        <label style={{ fontSize: 11, fontWeight: 700, color: G.textFaint, textTransform: 'uppercase', letterSpacing: '0.07em', display: 'block', marginBottom: 8 }}>
          Degree / Program
        </label>
        <input
          className="of-glass-input"
          style={glassInput}
          placeholder="e.g. BS Computer Science"
          value={data.degree}
          onChange={e => update('degree', e.target.value)}
        />
      </div>

      {/* University (optional) */}
      <div>
        <label style={{ fontSize: 11, fontWeight: 700, color: G.textFaint, textTransform: 'uppercase', letterSpacing: '0.07em', display: 'block', marginBottom: 8 }}>
          University <span style={{ fontWeight: 400, color: G.textFaint, letterSpacing: 0, textTransform: 'none' }}>(optional)</span>
        </label>
        <input
          className="of-glass-input"
          style={glassInput}
          placeholder="e.g. FAST-NUCES, Lahore"
          value={data.university}
          onChange={e => update('university', e.target.value)}
        />
      </div>

      {/* Semester selector */}
      <div>
        <label style={{ fontSize: 11, fontWeight: 700, color: G.textFaint, textTransform: 'uppercase', letterSpacing: '0.07em', display: 'block', marginBottom: 10 }}>
          Current Semester
        </label>
        <div style={{ display: 'flex', gap: 8 }}>
          {[1,2,3,4,5,6,7,8].map(s => (
            <button
              key={s}
              className="of-sem-dot"
              onClick={() => update('semester', s)}
              style={{
                background: data.semester === s
                  ? 'linear-gradient(135deg,#4f46e5,#7c3aed)'
                  : 'rgba(255,255,255,0.06)',
                border: data.semester === s
                  ? 'none'
                  : '1.5px solid rgba(255,255,255,0.15)',
                color: data.semester === s ? '#fff' : 'rgba(255,255,255,0.4)',
                boxShadow: data.semester === s ? '0 0 14px rgba(79,70,229,0.5)' : 'none',
              }}
            >{s}</button>
          ))}
        </div>
      </div>

      {/* CGPA slider */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
          <label style={{ fontSize: 11, fontWeight: 700, color: G.textFaint, textTransform: 'uppercase', letterSpacing: '0.07em' }}>
            CGPA
          </label>
          <span style={{
            fontSize: 22, fontWeight: 800, color: '#fff',
            fontFamily: "'DM Sans', sans-serif",
            background: data.cgpa >= 3.5
              ? 'linear-gradient(90deg,#10b981,#34d399)'
              : data.cgpa >= 3.0
              ? 'linear-gradient(90deg,#4f46e5,#7c3aed)'
              : 'linear-gradient(90deg,#f59e0b,#f43f5e)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          }}>
            {data.cgpa.toFixed(1)}
          </span>
        </div>
        <input
          type="range" min={0} max={4.0} step={0.1}
          value={data.cgpa}
          onChange={e => update('cgpa', +e.target.value)}
          className="of-range"
          style={{ width: '100%', height: 6 }}
        />
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: G.textFaint, marginTop: 5 }}>
          <span>0.0</span><span>1.0</span><span>2.0</span><span>3.0</span><span>4.0</span>
        </div>
      </div>
    </div>
  );
}

// ─── Step 3 — Skills ──────────────────────────────────────────────────────────

function Step3Skills({ data, update }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div style={{ textAlign: 'center', marginBottom: 2 }}>
        <h2 style={{ fontFamily: "'Instrument Serif',serif", fontStyle: 'italic', fontSize: 24, color: '#fff', marginBottom: 6 }}>
          Skills &amp; Interests
        </h2>
        <p style={{ fontSize: 13, color: G.textMuted }}>
          Used for semantic matching — your skills are embedded and compared to each opportunity's requirements.
        </p>
      </div>

      <TagInput
        label="Technical Skills"
        tags={data.skills}
        onAdd={v  => update('skills', [...data.skills, v])}
        onRemove={v => update('skills', data.skills.filter(s => s !== v))}
        suggestions={SKILL_SUGGESTIONS}
        placeholder="Add a skill…"
      />

      <div style={{ height: 1, background: 'rgba(255,255,255,0.07)' }} />

      <TagInput
        label="Interests"
        tags={data.interests}
        onAdd={v  => update('interests', [...data.interests, v])}
        onRemove={v => update('interests', data.interests.filter(s => s !== v))}
        suggestions={INTEREST_SUGGESTIONS}
        placeholder="Add an interest…"
      />
    </div>
  );
}

// ─── Step 4 — Preferences ────────────────────────────────────────────────────

function Step4Prefs({ data, update }) {
  const toggle = (id) => {
    const cur = data.preferred_opportunity_types;
    update('preferred_opportunity_types',
      cur.includes(id) ? cur.filter(t => t !== id) : [...cur, id]
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
      <div style={{ textAlign: 'center', marginBottom: 2 }}>
        <h2 style={{ fontFamily: "'Instrument Serif',serif", fontStyle: 'italic', fontSize: 24, color: '#fff', marginBottom: 6 }}>
          Your Preferences
        </h2>
        <p style={{ fontSize: 13, color: G.textMuted }}>
          Tell us what you're looking for — this boosts matching scores for preferred types.
        </p>
      </div>

      {/* Opportunity type cards */}
      <div>
        <label style={{ fontSize: 11, fontWeight: 700, color: G.textFaint, textTransform: 'uppercase', letterSpacing: '0.07em', display: 'block', marginBottom: 12 }}>
          Preferred Opportunity Types
        </label>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
          {OPP_TYPES.map(t => {
            const selected = data.preferred_opportunity_types.includes(t.id);
            return (
              <button
                key={t.id}
                className="of-type-card"
                onClick={() => toggle(t.id)}
                style={{
                  background:  selected ? `${t.color}22` : 'rgba(255,255,255,0.05)',
                  borderColor: selected ? `${t.color}66` : 'rgba(255,255,255,0.1)',
                  boxShadow:   selected ? `0 0 20px ${t.color}33` : 'none',
                  transform:   selected ? 'translateY(-3px) scale(1.02)' : 'none',
                }}
              >
                <span style={{ fontSize: 24 }}>{t.icon}</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: selected ? '#fff' : 'rgba(255,255,255,0.55)', fontFamily: "'DM Sans',sans-serif" }}>
                  {t.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Financial need + location */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {/* Financial need toggle */}
        <label style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: 12, padding: '14px 18px', cursor: 'pointer', userSelect: 'none',
        }}>
          <div>
            <div style={{ fontSize: 13.5, fontWeight: 600, color: '#fff', fontFamily: "'DM Sans',sans-serif" }}>
              💰 Financial Need
            </div>
            <div style={{ fontSize: 11.5, color: G.textMuted, marginTop: 2 }}>
              Prioritizes stipend-bearing opportunities and boosts scholarship scores
            </div>
          </div>
          {/* Toggle switch */}
          <div
            onClick={() => update('financial_need', !data.financial_need)}
            style={{
              width: 46, height: 26, borderRadius: 13, cursor: 'pointer', flexShrink: 0,
              background: data.financial_need
                ? 'linear-gradient(90deg,#4f46e5,#7c3aed)'
                : 'rgba(255,255,255,0.15)',
              position: 'relative', transition: 'background 0.25s',
              boxShadow: data.financial_need ? '0 0 12px rgba(79,70,229,0.5)' : 'none',
            }}
          >
            <div style={{
              position: 'absolute', width: 20, height: 20, borderRadius: '50%', background: '#fff',
              top: 3, left: data.financial_need ? 23 : 3, transition: 'left 0.25s',
              boxShadow: '0 1px 4px rgba(0,0,0,0.3)',
            }} />
          </div>
        </label>

        {/* Location */}
        <div>
          <label style={{ fontSize: 11, fontWeight: 700, color: G.textFaint, textTransform: 'uppercase', letterSpacing: '0.07em', display: 'block', marginBottom: 8 }}>
            📍 Location Preference
          </label>
          <input
            className="of-glass-input"
            style={glassInput}
            placeholder="e.g. Pakistan / Remote"
            value={data.location_preference}
            onChange={e => update('location_preference', e.target.value)}
          />
        </div>
      </div>
    </div>
  );
}

// ─── Step 5 — Experience ──────────────────────────────────────────────────────

function Step5Exp({ data, update }) {
  const [input, setInput] = useState('');

  const add = () => {
    const v = input.trim();
    if (v && !data.past_experience.includes(v)) {
      update('past_experience', [...data.past_experience, v]);
    }
    setInput('');
  };

  const remove = (item) => update('past_experience', data.past_experience.filter(e => e !== item));

  const EXAMPLES = [
    'ICPC 2024 participant',
    'Web dev intern — XYZ Corp',
    'Final year ML project',
    'Google DSC Lead',
    'Open source contributor',
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
      <div style={{ textAlign: 'center', marginBottom: 2 }}>
        <h2 style={{ fontFamily: "'Instrument Serif',serif", fontStyle: 'italic', fontSize: 24, color: '#fff', marginBottom: 6 }}>
          Past Experience
        </h2>
        <p style={{ fontSize: 13, color: G.textMuted }}>
          Internships, competitions, projects, research. Used to personalize the ranker's explanations.
        </p>
      </div>

      {/* Experience list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
        {data.past_experience.length === 0 && (
          <div style={{ fontSize: 13, color: G.textFaint, textAlign: 'center', padding: '12px 0' }}>
            No experience added yet — add at least one below.
          </div>
        )}
        {data.past_experience.map((item, i) => (
          <div key={i} className="of-exp-item">
            <span style={{ fontSize: 13, color: '#fff', fontFamily: "'DM Sans',sans-serif" }}>
              <span style={{ color: G.textFaint, marginRight: 8 }}>•</span>{item}
            </span>
            <button
              onClick={() => remove(item)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: G.textFaint, fontSize: 16, flexShrink: 0 }}
            >×</button>
          </div>
        ))}
      </div>

      {/* Add input */}
      <div style={{ display: 'flex', gap: 8 }}>
        <input
          className="of-glass-input"
          style={glassInput}
          placeholder="Describe an experience…"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); add(); } }}
        />
        <button
          onClick={add}
          style={{
            flexShrink: 0, width: 44, height: 44, borderRadius: 10, border: 'none',
            background: 'rgba(79,70,229,0.4)', color: 'white', fontSize: 20,
            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >+</button>
      </div>

      {/* Quick-add examples */}
      <div>
        <div style={{ fontSize: 10.5, color: G.textFaint, marginBottom: 7, fontFamily: "'DM Sans',sans-serif", textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          Quick add
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
          {EXAMPLES.filter(e => !data.past_experience.includes(e)).map(e => (
            <button key={e} className="of-suggest" onClick={() => {
              update('past_experience', [...data.past_experience, e]);
            }}>{e}</button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Step 6 — Connect ─────────────────────────────────────────────────────────

function Step6Connect({ data, update }) {
  const [showPass, setShowPass] = React.useState(false);

  const bothSet   = data.gmail_address && data.gmail_app_password;
  const emailOnly = data.gmail_address && !data.gmail_app_password;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
      <div style={{ textAlign: 'center', marginBottom: 2 }}>
        <h2 style={{ fontFamily: "'Instrument Serif',serif", fontStyle: 'italic', fontSize: 24, color: '#fff', marginBottom: 6 }}>
          Connect Your Tools
        </h2>
        <p style={{ fontSize: 13, color: G.textMuted }}>
          Set up Gmail auto-import and Google Calendar scheduling here — no re-entering later.
        </p>
      </div>

      {/* Gmail card */}
      <div className="of-int-card">
        {/* Card header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
          <div style={{
            width: 38, height: 38, borderRadius: 10,
            background: 'linear-gradient(135deg,#ea4335,#fbbc05)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18,
          }}>📧</div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#fff', fontFamily: "'DM Sans',sans-serif" }}>Gmail</div>
            <div style={{ fontSize: 11.5, color: G.textMuted }}>Auto-import emails + push reply drafts</div>
          </div>
          {/* Status badge */}
          {bothSet && (
            <span style={{
              marginLeft: 'auto', fontSize: 10.5, fontWeight: 700, color: G.emerald,
              background: 'rgba(16,185,129,0.15)', borderRadius: 6, padding: '2px 8px',
              border: '1px solid rgba(16,185,129,0.3)', fontFamily: "'DM Sans',sans-serif",
            }}>✓ Ready</span>
          )}
          {emailOnly && (
            <span style={{
              marginLeft: 'auto', fontSize: 10.5, fontWeight: 700, color: G.amber,
              background: 'rgba(245,158,11,0.15)', borderRadius: 6, padding: '2px 8px',
              border: '1px solid rgba(245,158,11,0.3)', fontFamily: "'DM Sans',sans-serif",
            }}>⚠ Need App Password</span>
          )}
        </div>

        {/* Gmail address */}
        <div style={{ marginBottom: 12 }}>
          <label style={{ fontSize: 11, fontWeight: 700, color: G.textFaint, textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 7 }}>
            Gmail Address
          </label>
          <input
            type="email"
            className="of-glass-input"
            style={glassInput}
            placeholder="your.email@gmail.com"
            value={data.gmail_address}
            onChange={e => update('gmail_address', e.target.value)}
          />
        </div>

        {/* App Password */}
        <div style={{ marginBottom: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 7 }}>
            <label style={{ fontSize: 11, fontWeight: 700, color: G.textFaint, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              App Password
            </label>
            <a
              href="https://myaccount.google.com/apppasswords"
              target="_blank"
              rel="noreferrer"
              style={{ fontSize: 11, color: 'rgba(79,70,229,0.8)', textDecoration: 'none' }}
            >
              Get one ↗
            </a>
          </div>
          <div style={{ position: 'relative' }}>
            <input
              type={showPass ? 'text' : 'password'}
              className="of-glass-input"
              style={{
                ...glassInput,
                fontFamily: showPass ? "'DM Sans',sans-serif" : 'monospace',
                letterSpacing: showPass ? 0 : '0.2em',
                paddingRight: 44,
              }}
              placeholder="16-character code (not your password)"
              value={data.gmail_app_password}
              onChange={e => update('gmail_app_password', e.target.value)}
            />
            <button
              onClick={() => setShowPass(s => !s)}
              style={{
                position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                background: 'none', border: 'none', cursor: 'pointer',
                fontSize: 14, color: G.textFaint,
              }}
              title={showPass ? 'Hide' : 'Show'}
            >{showPass ? '🙈' : '👁'}</button>
          </div>
        </div>

        {/* How-to callout */}
        <div style={{
          background: 'rgba(79,70,229,0.1)', border: '1px solid rgba(79,70,229,0.25)',
          borderRadius: 10, padding: '10px 13px', fontSize: 11.5,
          color: G.textMuted, lineHeight: 1.65,
        }}>
          <strong style={{ color: '#fff' }}>How to get an App Password:</strong>
          <br />
          Google Account → Security → 2-Step Verification → <strong style={{ color: '#c4b5fd' }}>App Passwords</strong> → Select "Mail" → Copy the 16-character code.
          <br />
          <span style={{ color: G.textFaint }}>This is not your Google password — it's a one-time access code.</span>
        </div>

        {/* Features badges */}
        <div style={{ display: 'flex', gap: 6, marginTop: 12, flexWrap: 'wrap' }}>
          {['Auto-import emails', 'Reply Suggester', 'One-click draft'].map(f => (
            <span key={f} style={{
              fontSize: 10.5,
              background: bothSet ? 'rgba(16,185,129,0.15)' : 'rgba(79,70,229,0.12)',
              color:      bothSet ? G.emerald : 'rgba(167,139,250,0.9)',
              border:     `1px solid ${bothSet ? 'rgba(16,185,129,0.3)' : 'rgba(79,70,229,0.25)'}`,
              borderRadius: 6, padding: '2px 8px',
              fontFamily: "'DM Sans',sans-serif",
            }}>{bothSet ? '✓' : '○'} {f}</span>
          ))}
        </div>
      </div>

      {/* Google Calendar card */}
      <div className="of-int-card">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
          <div style={{
            width: 38, height: 38, borderRadius: 10,
            background: 'linear-gradient(135deg,#4285f4,#34a853)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18,
          }}>📅</div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#fff', fontFamily: "'DM Sans',sans-serif" }}>Google Calendar</div>
            <div style={{ fontSize: 11.5, color: G.textMuted }}>Auto-creates prep, review &amp; deadline events</div>
          </div>
        </div>

        <div>
          <label style={{ fontSize: 11, fontWeight: 700, color: G.textFaint, textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 7 }}>
            Calendar ID
          </label>
          <select
            className="of-glass-input of-glass-select"
            style={{ ...glassInput, appearance: 'none', cursor: 'pointer' }}
            value={data.calendar_name}
            onChange={e => update('calendar_name', e.target.value)}
          >
            <option value="primary">Primary Calendar</option>
            <option value="academics">Academics</option>
            <option value="opportunities">Opportunities</option>
            <option value="custom">Custom…</option>
          </select>
        </div>

        {/* 3 events created */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 5, marginTop: 12 }}>
          {[
            { icon: '📋', label: 'Prep session',   sub: '2 days before deadline · 6–8 PM' },
            { icon: '✅', label: 'Final review',   sub: '1 day before deadline · 7–8 PM'  },
            { icon: '🔥', label: 'Deadline event', sub: 'Day of deadline · All day'         },
          ].map(e => (
            <div key={e.label} style={{ display: 'flex', alignItems: 'center', gap: 9, fontSize: 12 }}>
              <span style={{ fontSize: 14 }}>{e.icon}</span>
              <span style={{ color: '#fff', fontWeight: 600, fontFamily: "'DM Sans',sans-serif" }}>{e.label}</span>
              <span style={{ color: G.textFaint, fontSize: 11 }}>{e.sub}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Step 7 — Review & Launch ─────────────────────────────────────────────────

function Step7Review({ data }) {
  const skillsText  = data.skills.slice(0, 4).join(' · ') + (data.skills.length > 4 ? ` +${data.skills.length - 4}` : '');
  const interestsTx = data.interests.slice(0, 3).join(' · ') + (data.interests.length > 3 ? ` +${data.interests.length - 3}` : '');

  const Row = ({ icon, label, value }) => (
    <div className="of-sum-row">
      <span style={{ fontSize: 16 }}>{icon}</span>
      <span style={{ fontSize: 12, color: G.textFaint, fontWeight: 600, fontFamily: "'DM Sans',sans-serif", minWidth: 90 }}>{label}</span>
      <span style={{ fontSize: 13, color: '#fff', fontFamily: "'DM Sans',sans-serif", flex: 1 }}>{value}</span>
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
      <div style={{ textAlign: 'center', marginBottom: 4 }}>
        {/* Animated checkmark */}
        <div style={{
          width: 64, height: 64, borderRadius: '50%', margin: '0 auto 16px',
          background: 'linear-gradient(135deg,rgba(16,185,129,0.3),rgba(16,185,129,0.1))',
          border: '2px solid rgba(16,185,129,0.5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28,
          boxShadow: '0 0 32px rgba(16,185,129,0.3)',
        }}>✓</div>
        <h2 style={{ fontFamily: "'Instrument Serif',serif", fontStyle: 'italic', fontSize: 24, color: '#fff', marginBottom: 6 }}>
          You're all set, {data.name.split(' ')[0] || 'there'}!
        </h2>
        <p style={{ fontSize: 13, color: G.textMuted }}>
          Review your profile, then add your emails to start the AI pipeline.
        </p>
      </div>

      {/* Summary card */}
      <div style={{
        background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: 16, padding: '16px 18px',
      }}>
        <Row icon="👤" label="Name"       value={data.name || '—'} />
        <Row icon="📚" label="Degree"     value={`${data.degree}${data.university ? ` · ${data.university}` : ''}`} />
        <Row icon="📌" label="Academic"   value={`Semester ${data.semester} · CGPA ${data.cgpa.toFixed(1)}`} />
        <Row icon="⚡" label="Skills"     value={skillsText  || '—'} />
        <Row icon="💡" label="Interests"  value={interestsTx || '—'} />
        <Row icon="📍" label="Location"   value={data.location_preference || '—'} />
        <Row icon="💰" label="Need-based" value={data.financial_need ? '✓ Yes — stipend opportunities prioritized' : 'Not marked'} />
        <Row icon="🔗" label="Gmail"      value={
          data.gmail_address
            ? <span>{data.gmail_address} {data.gmail_app_password ? <span style={{ color: G.emerald }}>· ✓ App Password set</span> : <span style={{ color: G.amber }}>· ⚠ No App Password</span>}</span>
            : <span style={{ color: G.textFaint }}>Not connected (optional)</span>
        } />
        <Row icon="📅" label="Calendar"   value={data.calendar_name} />
      </div>

      <p style={{ fontSize: 12, color: G.textFaint, textAlign: 'center', lineHeight: 1.7 }}>
        Next: paste your emails and run the pipeline. Your profile is saved for this session.
      </p>
    </div>
  );
}

// ─── OnboardingForm (default export) ─────────────────────────────────────────

export default function OnboardingForm({ onComplete }) {
  const [data,       setData]       = useState(DEFAULT_FORM);
  const [step,       setStep]       = useState(0);
  const [direction,  setDirection]  = useState(1);
  const [shaking,    setShaking]    = useState(false);
  const [error,      setError]      = useState('');
  const btnRef = useRef(null);

  const update = (field, value) => setData(d => ({ ...d, [field]: value }));

  const STEPS = [
    Step1Welcome,
    Step2Academic,
    Step3Skills,
    Step4Prefs,
    Step5Exp,
    Step6Connect,
    Step7Review,
  ];

  const canProceed = () => {
    if (step === 0) return data.name.trim().length >= 2;
    if (step === 1) return data.degree.trim().length > 0 && data.cgpa >= 0 && data.cgpa <= 4;
    return true;
  };

  const proceedError = () => {
    if (step === 0) return 'Please enter your name to continue.';
    if (step === 1) return 'Please enter your degree.';
    return '';
  };

  const next = () => {
    if (!canProceed()) {
      setError(proceedError());
      setShaking(true);
      setTimeout(() => setShaking(false), 500);
      return;
    }
    setError('');
    if (step < STEPS.length - 1) {
      setDirection(1);
      setStep(s => s + 1);
    } else {
      // Complete
      onComplete({
        name:            data.name,
        gmailAddress:    data.gmail_address,
        gmailAppPassword: data.gmail_app_password,
        calendarName:    data.calendar_name,
        profile: {
          degree:                      data.degree,
          semester:                    data.semester,
          cgpa:                        data.cgpa,
          skills:                      data.skills,
          interests:                   data.interests,
          preferred_opportunity_types: data.preferred_opportunity_types,
          financial_need:              data.financial_need,
          location_preference:         data.location_preference,
          past_experience:             data.past_experience,
        },
      });
    }
  };

  const back = () => {
    if (step > 0) {
      setDirection(-1);
      setStep(s => s - 1);
      setError('');
    }
  };

  const StepComp = STEPS[step];

  return (
    <>
      <FormStyles />
      <Background3D />

      {/* Centered layout */}
      <div style={{
        position: 'relative', zIndex: 1,
        minHeight: '100vh', display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        padding: '24px 16px',
        fontFamily: "'DM Sans', system-ui, sans-serif",
      }}>
        <div style={{ width: '100%', maxWidth: 520 }}>

          {/* Progress */}
          <ProgressBar current={step} total={STEPS.length} />

          {/* Step card */}
          <div
            key={step}
            style={{
              ...glassCard,
              animation: `${direction >= 0 ? 'of-enter-fwd' : 'of-enter-bwd'} 0.38s cubic-bezier(0.22,1,0.36,1) both`,
            }}
          >
            {/* Step label */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 24 }}>
              <span style={{ fontSize: 18 }}>{STEP_META[step].emoji}</span>
              <span style={{
                fontSize: 11, fontWeight: 700, color: G.textFaint,
                textTransform: 'uppercase', letterSpacing: '0.1em',
              }}>
                Step {step + 1} of {STEPS.length}
              </span>
              <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.07)' }} />
            </div>

            {/* Step content */}
            <StepComp data={data} update={update} />

            {/* Error message */}
            {error && (
              <div style={{
                fontSize: 12.5, color: G.rose,
                background: 'rgba(244,63,94,0.12)', border: '1px solid rgba(244,63,94,0.3)',
                borderRadius: 10, padding: '8px 14px', marginTop: 16,
                animation: 'of-enter-fwd 0.2s ease',
              }}>
                ⚠ {error}
              </div>
            )}

            {/* Navigation */}
            <div style={{
              display: 'flex', gap: 10, marginTop: 28,
              flexDirection: step === STEPS.length - 1 ? 'column' : 'row',
            }}>
              {step > 0 && (
                <button className="of-btn-ghost" onClick={back} style={{ flex: step < STEPS.length - 1 ? '0 0 100px' : 1 }}>
                  ← Back
                </button>
              )}
              <div
                ref={btnRef}
                className={shaking ? 'of-shake' : ''}
                style={{ flex: 1 }}
              >
                <button className="of-btn-primary" onClick={next}>
                  {step === STEPS.length - 1
                    ? '🚀 Add Emails & Launch Pipeline'
                    : step === STEPS.length - 2
                    ? 'Review Profile →'
                    : 'Continue →'}
                </button>
              </div>
            </div>

            {/* Skip link (steps 3-6) */}
            {step >= 2 && step <= 5 && (
              <div style={{ textAlign: 'center', marginTop: 12 }}>
                <button
                  onClick={next}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 12.5, color: G.textFaint, fontFamily: "'DM Sans',sans-serif" }}
                >
                  Skip this step →
                </button>
              </div>
            )}
          </div>

          {/* Bottom hint */}
          <p style={{ textAlign: 'center', fontSize: 11.5, color: 'rgba(255,255,255,0.25)', marginTop: 16 }}>
            Your data stays in this browser session and is never stored on a server.
          </p>
        </div>
      </div>
    </>
  );
}
