/**
 * SisterOpportunityFinder.jsx
 * "Discovered for You" — finds opportunities the student was NEVER emailed about.
 *
 * Self-contained component, no required props.
 *
 * Sections (in order):
 *   Styles · Icons · Helpers · Sample Data · API Builders
 *   LoadingView · DiscoveredCard · SisterOpportunityFinder (default)
 */

import React, { useState, useEffect, useRef } from 'react';

// ─── Design tokens ────────────────────────────────────────────────────────────

const C = {
  bg:         '#f8f7f4',
  discoverbg: '#f0f4ff',       // indigo-tinted section bg
  card:       '#ffffff',
  border:     '#e2e8f0',
  indigoBorder: '#c7d2fe',     // indigo border for discovered section
  indigo:     '#4f46e5',
  indigoLight:'#eef2ff',
  emerald:    '#10b981',
  rose:       '#f43f5e',
  amber:      '#f59e0b',
  slate:      '#64748b',
  text:       '#1e293b',
  purple:     '#7c3aed',
};

const serif = { fontFamily: "'Instrument Serif', serif", fontStyle: 'italic' };
const sans  = { fontFamily: "'DM Sans', system-ui, sans-serif" };

const cardStyle = {
  background:   C.card,
  border:       `1px solid ${C.border}`,
  borderRadius: 16,
  boxShadow:    '0 1px 3px rgba(0,0,0,0.06)',
  padding:      '22px 24px',
  position:     'relative',
};

const TYPE_COLOR = {
  internship:        C.indigo,
  scholarship:       C.emerald,
  fellowship:        C.amber,
  competition:       C.rose,
  hackathon:         C.purple,
  research_position: C.slate,
};
const TYPE_LABEL = {
  internship:        'Internship',
  scholarship:       'Scholarship',
  fellowship:        'Fellowship',
  competition:       'Competition',
  hackathon:         'Hackathon',
  research_position: 'Research',
};

// ─── Styles ───────────────────────────────────────────────────────────────────

function SofStyles() {
  return (
    <style>{`
      @keyframes sof-spin {
        to { transform: rotate(360deg); }
      }
      @keyframes sof-pulse-dot {
        0%, 100% { opacity: 1; transform: scale(1);    box-shadow: 0 0 0 0 ${C.indigo}55; }
        50%       { opacity: 0.8; transform: scale(1.15); box-shadow: 0 0 0 6px ${C.indigo}00; }
      }
      @keyframes sof-fadeInUp {
        from { opacity: 0; transform: translateY(12px); }
        to   { opacity: 1; transform: translateY(0);    }
      }
      @keyframes sof-progress {
        0%   { width: 0%;  }
        10%  { width: 12%; }
        30%  { width: 35%; }
        55%  { width: 58%; }
        75%  { width: 74%; }
        90%  { width: 85%; }
        100% { width: 90%; }
      }
      @keyframes sof-msg-in {
        from { opacity: 0; transform: translateY(6px); }
        to   { opacity: 1; transform: translateY(0); }
      }
      @keyframes sof-card-collapse {
        0%   { opacity: 1; max-height: 600px; margin-bottom: 16px; }
        40%  { opacity: 0; }
        100% { opacity: 0; max-height: 0;   margin-bottom: 0; padding: 0; overflow: hidden; }
      }
      @keyframes sof-badge-pop {
        0%   { transform: scale(0.7); opacity: 0; }
        70%  { transform: scale(1.1); }
        100% { transform: scale(1);   opacity: 1; }
      }
      @keyframes sof-added-overlay {
        from { opacity: 0; }
        to   { opacity: 1; }
      }

      .sof-btn-primary {
        display: inline-flex; align-items: center; gap: 7px;
        padding: 11px 22px; border-radius: 10px; border: none; cursor: pointer;
        background: ${C.indigo}; color: #fff;
        font-size: 14px; font-weight: 700; font-family: 'DM Sans', sans-serif;
        transition: transform 0.15s, box-shadow 0.15s;
        box-shadow: 0 3px 12px ${C.indigo}44;
      }
      .sof-btn-primary:hover {
        transform: translateY(-2px);
        box-shadow: 0 6px 20px ${C.indigo}55;
      }
      .sof-btn-view {
        display: inline-flex; align-items: center; gap: 6px;
        padding: 8px 16px; border-radius: 8px; border: none; cursor: pointer;
        background: ${C.indigo}; color: #fff;
        font-size: 12.5px; font-weight: 700; font-family: 'DM Sans', sans-serif;
        transition: all 0.15s;
        text-decoration: none;
      }
      .sof-btn-view:hover { background: #4338ca; }
      .sof-btn-add {
        display: inline-flex; align-items: center; gap: 6px;
        padding: 8px 16px; border-radius: 8px; cursor: pointer;
        background: transparent; color: ${C.indigo};
        border: 1.5px solid ${C.indigo}55;
        font-size: 12.5px; font-weight: 700; font-family: 'DM Sans', sans-serif;
        transition: all 0.15s;
      }
      .sof-btn-add:hover { background: ${C.indigoLight}; border-color: ${C.indigo}; }
      .sof-btn-retry {
        display: inline-flex; align-items: center; gap: 6px;
        padding: 9px 18px; border-radius: 9px; border: none; cursor: pointer;
        background: ${C.indigo}14; color: ${C.indigo};
        border: 1.5px solid ${C.indigo}44;
        font-size: 13px; font-weight: 700; font-family: 'DM Sans', sans-serif;
        transition: all 0.15s;
      }
      .sof-btn-retry:hover { background: ${C.indigo}22; }
      .sof-key-input {
        width: 100%; border: 1px solid ${C.border}; border-radius: 8px;
        padding: 9px 12px; font-size: 13px; font-family: 'DM Sans', sans-serif;
        color: ${C.text}; background: ${C.card}; outline: none; transition: border-color 0.15s;
      }
      .sof-key-input:focus { border-color: ${C.indigo}; box-shadow: 0 0 0 3px ${C.indigo}12; }
      .sof-toggle-btn {
        background: none; border: 1px solid ${C.indigoBorder}; border-radius: 7px;
        padding: 5px 12px; font-size: 12px; color: ${C.indigo}; cursor: pointer;
        font-family: 'DM Sans', sans-serif; transition: all 0.15s;
      }
      .sof-toggle-btn:hover { background: ${C.indigoLight}; }
    `}</style>
  );
}

// ─── Icons ────────────────────────────────────────────────────────────────────

const SparkleIcon = ({ size = 18, color = C.indigo }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M12 2L13.5 8.5L20 10L13.5 11.5L12 18L10.5 11.5L4 10L10.5 8.5L12 2Z"
      fill={color} opacity="0.9" />
    <path d="M19 2L19.8 5.2L23 6L19.8 6.8L19 10L18.2 6.8L15 6L18.2 5.2L19 2Z"
      fill={color} opacity="0.5" />
    <path d="M5 16L5.6 18.4L8 19L5.6 19.6L5 22L4.4 19.6L2 19L4.4 18.4L5 16Z"
      fill={color} opacity="0.5" />
  </svg>
);

const ExternalIcon = ({ size = 12, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" />
    <polyline points="15 3 21 3 21 9" />
    <line x1="10" y1="14" x2="21" y2="3" />
  </svg>
);

const PlusIcon = ({ size = 13, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
    aria-hidden="true"
  >
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5"  y1="12" x2="19" y2="12" />
  </svg>
);

const SearchIcon = ({ size = 16, color = C.indigo }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
    aria-hidden="true"
  >
    <circle cx="11" cy="11" r="8" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
);

// ─── Helpers ──────────────────────────────────────────────────────────────────

const getDaysLeft = (iso) => {
  if (!iso) return null;
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const dl    = new Date(iso + 'T00:00:00');
  return Math.ceil((dl - today) / 86400000);
};

const fmtDate = (iso) => {
  if (!iso) return null;
  const d = new Date(iso + 'T00:00:00');
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

const urgencyColor = (d) => {
  if (d === null || d === undefined || d < 0) return C.slate;
  if (d <= 3) return C.rose;
  if (d <= 7) return C.amber;
  return C.emerald;
};

// ─── Scoring ─────────────────────────────────────────────────────────────────

const computeScore = (opp, profile) => {
  let score = 60;
  if (profile.cgpa >= 3.0) score += 10;
  if (profile.preferred_opportunity_types.includes(opp.opportunity_type)) score += 15;
  if (opp.stipend_or_amount && profile.financial_need) score += 8;
  const searchText = (
    (opp.description || '') + ' ' + (opp.eligibility_summary || '')
  ).toLowerCase();
  if (searchText.includes('pakistan') || searchText.includes('remote')) score += 7;
  return Math.min(95, score);
};

// ─── Sample data ──────────────────────────────────────────────────────────────

const PROFILE = {
  name:                        'Ali Hassan',
  degree:                      'BS Computer Science',
  semester:                    6,
  cgpa:                        3.4,
  skills:                      ['Python', 'Machine Learning', 'React', 'Django'],
  interests:                   ['AI', 'software engineering', 'research'],
  preferred_opportunity_types: ['internship', 'fellowship', 'competition'],
  financial_need:              true,
};

const ALREADY_TRACKED = [
  'Google Summer Internship',
  'HEC Need-Based Scholarship',
  'SOFTEC AI Hackathon',
];

const DEMO_OPPORTUNITIES = [
  {
    id:                   'disc_001',
    title:                'Microsoft Learn Student Ambassadors',
    organization:         'Microsoft',
    opportunity_type:     'fellowship',
    deadline:             null,
    description:          'The MLSA program empowers university students with technical resources, Azure cloud credits, and a global peer network. Ambassadors run workshops and represent Microsoft on campus.',
    eligibility_summary:  'Open to university students worldwide with a passion for technology and community building. No prior Microsoft experience required.',
    stipend_or_amount:    'Azure credits ($150/mo) + certification vouchers + exclusive swag',
    application_link:     'https://studentambassadors.microsoft.com/',
    why_this_student:     'Your React and Django skills make you an ideal technical ambassador — MLSA Pakistan chapter is actively expanding and needs ML-capable leads.',
    source:               'Microsoft Student Programs',
  },
  {
    id:                   'disc_002',
    title:                'Google Developer Student Club Lead',
    organization:         'Google',
    opportunity_type:     'fellowship',
    deadline:             null,
    description:          'GDSC Lead is a 12-month community-building role where you organize developer events, mentor peers, and connect your campus to Google\'s global ecosystem.',
    eligibility_summary:  'University students in good standing with programming experience and interest in peer mentorship. Open internationally.',
    stipend_or_amount:    'Google Workspace credits + exclusive mentorship + merch',
    application_link:     'https://gdsc.community.dev/become-a-lead/',
    why_this_student:     'Your full-stack background (React + Django) and ML expertise let you mentor peers across both AI and web — Google actively seeks Pakistan-based leads for Lahore university clusters.',
    source:               'Google Developer Student Clubs',
  },
  {
    id:                   'disc_003',
    title:                'MLH Fellowship — Open Source Track',
    organization:         'Major League Hacking',
    opportunity_type:     'internship',
    deadline:             null,
    description:          'A 12-week remote fellowship where selected students contribute to real open-source projects alongside a global cohort, supported by dedicated mentors from top tech companies.',
    eligibility_summary:  'Open to students worldwide (remote). Requires basic programming experience and willingness to collaborate in open source.',
    stipend_or_amount:    '$5,000 USD stipend (12 weeks)',
    application_link:     'https://fellowship.mlh.io/',
    why_this_student:     'Your Python and ML skills are directly applicable to open-source AI/ML projects. The $5,000 remote stipend meets your financial need criteria, and Pakistan is fully eligible.',
    source:               'Major League Hacking Fellowship Page',
  },
];

// ─── API builders ─────────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `You are a research agent that finds real, currently open opportunities for university students. You must search the web and return only opportunities that are verifiably real and currently accepting applications. Return ONLY a JSON object with no markdown fences:
{
  "opportunities": [
    {
      "title": "",
      "organization": "",
      "opportunity_type": "",
      "deadline": "YYYY-MM-DD or null if not found",
      "description": "2 sentence max description",
      "eligibility_summary": "1 sentence",
      "stipend_or_amount": "string or null",
      "application_link": "real URL",
      "why_this_student": "specific reason referencing their skills/profile",
      "source": "where you found this"
    }
  ]
}
Return exactly 3 opportunities. Only include ones with a real application link you found via search. Do not fabricate URLs.`;

const buildUserMessage = (profile, tracked) =>
  `Find 3 real, currently open opportunities for this student. Search specifically for opportunities they are NOT already tracking.

STUDENT PROFILE:
Degree: ${profile.degree}
Semester: ${profile.semester}
CGPA: ${profile.cgpa}
Skills: ${profile.skills.join(', ')}
Interests: ${profile.interests.join(', ')}
Location: Pakistan
Financial need: ${profile.financial_need}
Preferred types: ${profile.preferred_opportunity_types.join(', ')}

ALREADY TRACKING (do not suggest these):
${tracked.join(', ')}

Search for opportunities in these categories first: ${profile.preferred_opportunity_types.join(', ')}.
Prioritize opportunities open to Pakistani students or remote applicants.`;

const parseOpportunities = (data) => {
  const textBlocks = (data.content || []).filter(b => b.type === 'text');
  if (!textBlocks.length) throw new Error('No text content in response');
  const raw = textBlocks[textBlocks.length - 1].text || '';
  // Strip markdown fences if model adds them
  const cleaned = raw
    .replace(/```json\s*/g, '')
    .replace(/```\s*/g, '')
    .trim();
  // Find the JSON object
  const start = cleaned.indexOf('{');
  const end   = cleaned.lastIndexOf('}');
  if (start === -1 || end === -1) throw new Error('No JSON found');
  const parsed = JSON.parse(cleaned.slice(start, end + 1));
  if (!Array.isArray(parsed.opportunities)) throw new Error('Bad shape');
  return parsed.opportunities.map((o, i) => ({ ...o, id: `disc_${String(i + 1).padStart(3, '0')}` }));
};

// ─── Loading messages ─────────────────────────────────────────────────────────

const LOADING_MSGS = [
  'Analyzing your top opportunity types…',
  'Searching for internships matching your skills…',
  'Scanning scholarship and fellowship databases…',
  'Cross-checking eligibility conditions…',
  'Scoring discovered opportunities…',
];

// ─── LoadingView ──────────────────────────────────────────────────────────────

function LoadingView({ msgIndex, complete }) {
  return (
    <div style={{
      ...cardStyle,
      border: `1px dashed ${C.indigoBorder}`,
      background: C.indigoLight,
      display: 'flex', flexDirection: 'column', gap: 20,
      alignItems: 'center', padding: '36px 32px',
    }}>
      {/* Spinning search icon */}
      <div style={{ position: 'relative', width: 52, height: 52 }}>
        <div style={{
          position: 'absolute', inset: 0,
          border: `3px solid ${C.indigo}22`,
          borderTop: `3px solid ${C.indigo}`,
          borderRadius: '50%',
          animation: 'sof-spin 0.9s linear infinite',
        }} />
        <div style={{
          position: 'absolute', inset: 10,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <SparkleIcon size={16} color={C.indigo} />
        </div>
      </div>

      {/* Cycling message */}
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: C.text, marginBottom: 4 }}>
          AI Web Discovery Running
        </div>
        <div
          key={msgIndex}
          style={{
            fontSize: 13, color: C.indigo,
            animation: 'sof-msg-in 0.35s ease both',
            minHeight: 20,
          }}
        >
          {LOADING_MSGS[msgIndex % LOADING_MSGS.length]}
        </div>
      </div>

      {/* Progress bar */}
      <div style={{ width: '100%', maxWidth: 400 }}>
        <div style={{
          background: C.indigoBorder + '55',
          borderRadius: 6, height: 6, overflow: 'hidden',
        }}>
          <div style={{
            height: '100%',
            borderRadius: 6,
            background: `linear-gradient(90deg, ${C.indigo}, ${C.purple})`,
            width: complete ? '100%' : undefined,
            animation: complete ? 'none' : 'sof-progress 12s ease-in-out forwards',
            transition: complete ? 'width 0.3s' : 'none',
          }} />
        </div>
        <div style={{
          display: 'flex', justifyContent: 'space-between',
          marginTop: 6, fontSize: 10, color: C.slate,
        }}>
          <span>Searching the web…</span>
          <span>~8–15 seconds</span>
        </div>
      </div>

      {/* Stage pills */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
        {['Claude web_search', 'Eligibility check', 'Profile matching', 'Score engine'].map((s, i) => (
          <span key={s} style={{
            background: i < (msgIndex % LOADING_MSGS.length) + 1 ? C.indigo + '14' : C.border + '88',
            color: i < (msgIndex % LOADING_MSGS.length) + 1 ? C.indigo : C.slate,
            borderRadius: 8, padding: '3px 10px', fontSize: 11, fontWeight: 600,
            border: `1px solid ${i < (msgIndex % LOADING_MSGS.length) + 1 ? C.indigo + '33' : C.border}`,
            transition: 'all 0.4s',
          }}>
            {i < (msgIndex % LOADING_MSGS.length) ? '✓ ' : ''}{s}
          </span>
        ))}
      </div>
    </div>
  );
}

// ─── DiscoveredCard ───────────────────────────────────────────────────────────

function DiscoveredCard({ opp, onAdd, isAdding, isCollapsing }) {
  const daysLeft   = getDaysLeft(opp.deadline);
  const typeColor  = TYPE_COLOR[opp.opportunity_type] || C.slate;
  const typeLabel  = TYPE_LABEL[opp.opportunity_type]  || opp.opportunity_type;
  const scoreColor = opp.score >= 85 ? C.emerald : opp.score >= 70 ? C.amber : C.rose;

  return (
    <div style={{
      ...cardStyle,
      border: `1px solid ${C.indigoBorder}`,
      boxShadow: `0 2px 8px ${C.indigo}0c`,
      animation: isCollapsing
        ? 'sof-card-collapse 0.8s ease forwards'
        : 'sof-fadeInUp 0.45s ease both',
      overflow: isCollapsing ? 'hidden' : 'visible',
      position: 'relative',
    }}>
      {/* "DISCOVERED" pill — top right */}
      <div style={{
        position: 'absolute', top: 16, right: 16,
        display: 'flex', alignItems: 'center', gap: 5,
        background: C.indigo, color: '#fff',
        borderRadius: 8, padding: '3px 10px',
        fontSize: 10, fontWeight: 800, letterSpacing: '0.06em',
        animation: 'sof-badge-pop 0.4s ease both',
        textTransform: 'uppercase',
      }}>
        <SparkleIcon size={9} color="#fff" />
        Discovered
      </div>

      {/* "Added" overlay */}
      {isAdding && (
        <div style={{
          position: 'absolute', inset: 0, borderRadius: 16,
          background: `${C.emerald}e6`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          animation: 'sof-added-overlay 0.25s ease both',
          zIndex: 10,
        }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 32, marginBottom: 6 }}>✓</div>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#fff' }}>Added to your list</div>
          </div>
        </div>
      )}

      {/* Main content */}
      <div style={{ paddingRight: 90 }}>
        {/* Type badge */}
        <div style={{ marginBottom: 10 }}>
          <span style={{
            background: typeColor + '15', color: typeColor,
            borderRadius: 10, padding: '3px 9px',
            fontSize: 11, fontWeight: 700,
          }}>
            {typeLabel}
          </span>
        </div>

        {/* Title + org */}
        <h3 style={{ fontSize: 18, fontWeight: 700, color: C.text, marginBottom: 3, lineHeight: 1.25 }}>
          {opp.title}
        </h3>
        <p style={{ fontSize: 13, color: C.slate, marginBottom: 12 }}>
          {opp.organization}
        </p>

        {/* Why this student — the key differentiator */}
        <div style={{
          background: C.indigoLight, borderRadius: 10,
          border: `1px solid ${C.indigoBorder}`,
          padding: '10px 14px', marginBottom: 14,
        }}>
          <div style={{ fontSize: 10, fontWeight: 800, color: C.indigo, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 5 }}>
            💡 Why you, specifically
          </div>
          <p style={{ ...serif, fontSize: 14, color: C.indigo, lineHeight: 1.65, margin: 0 }}>
            {opp.why_this_student}
          </p>
        </div>

        {/* Description (truncated) */}
        <p style={{ fontSize: 13, color: C.slate, lineHeight: 1.65, marginBottom: 14 }}>
          {opp.description}
        </p>

        {/* Meta row: stipend + deadline + score */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 16,
          flexWrap: 'wrap', marginBottom: 14,
        }}>
          {/* Stipend */}
          {opp.stipend_or_amount && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <span style={{ fontSize: 13 }}>💰</span>
              <span style={{ fontSize: 13, fontWeight: 600, color: C.emerald }}>
                {opp.stipend_or_amount}
              </span>
            </div>
          )}

          {/* Deadline */}
          {opp.deadline ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <span style={{ fontSize: 13 }}>📅</span>
              <span style={{ fontSize: 13, color: C.text }}>
                {fmtDate(opp.deadline)}
              </span>
              {daysLeft !== null && (
                <span style={{
                  fontWeight: 700, fontSize: 12,
                  color: urgencyColor(daysLeft),
                  background: urgencyColor(daysLeft) + '14',
                  borderRadius: 6, padding: '1px 6px',
                }}>
                  {daysLeft < 0 ? 'Expired' : daysLeft === 0 ? 'Today!' : `${daysLeft}d`}
                </span>
              )}
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <span style={{ fontSize: 13 }}>📅</span>
              <span style={{ fontSize: 13, color: C.slate }}>Rolling / no deadline</span>
            </div>
          )}

          {/* Score bar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginLeft: 'auto' }}>
            <span style={{ fontSize: 11, fontWeight: 600, color: C.slate }}>Match</span>
            <span style={{ fontSize: 18, fontWeight: 800, color: C.text }}>{opp.score}</span>
            <div style={{ background: C.border, borderRadius: 4, height: 5, width: 56 }}>
              <div style={{
                width: `${opp.score}%`, height: '100%', borderRadius: 4,
                background: scoreColor,
              }} />
            </div>
          </div>
        </div>

        {/* Eligibility summary */}
        <div style={{
          background: C.bg, borderRadius: 8, padding: '8px 12px',
          border: `1px solid ${C.border}`, marginBottom: 14,
          fontSize: 12.5, color: C.slate, lineHeight: 1.6,
        }}>
          <span style={{ fontWeight: 700, color: C.text }}>Eligibility: </span>
          {opp.eligibility_summary}
        </div>

        {/* Source citation */}
        <div style={{
          fontSize: 10.5, color: C.slate, marginBottom: 14,
          display: 'flex', alignItems: 'center', gap: 4,
        }}>
          <span style={{ opacity: 0.5 }}>🔍</span>
          <span>Found via:</span>
          <span style={{ fontStyle: 'italic' }}>{opp.source}</span>
        </div>

        {/* Action buttons */}
        <div style={{
          display: 'flex', gap: 10, alignItems: 'center',
          paddingTop: 14, borderTop: `1px solid ${C.border}`,
        }}>
          <a
            href={opp.application_link}
            target="_blank"
            rel="noreferrer"
            className="sof-btn-view"
          >
            View Opportunity
            <ExternalIcon color="#fff" />
          </a>
          <button
            className="sof-btn-add"
            onClick={() => onAdd(opp.id)}
          >
            <PlusIcon color={C.indigo} />
            Add to My List
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── SisterOpportunityFinder (default export) ─────────────────────────────────

export default function SisterOpportunityFinder() {
  const [status,       setStatus]       = useState('idle');  // idle | loading | success | error
  const [opportunities, setOpportunities] = useState([]);
  const [addingId,     setAddingId]     = useState(null);    // currently being "added"
  const [collapsingIds, setCollapsingIds] = useState(new Set());
  const [msgIndex,     setMsgIndex]     = useState(0);
  const [apiKey,       setApiKey]       = useState('');
  const [showConfig,   setShowConfig]   = useState(false);
  const msgTimer = useRef(null);

  const demoMode = !apiKey.trim();

  // Cycle loading messages
  useEffect(() => {
    if (status !== 'loading') { setMsgIndex(0); return; }
    msgTimer.current = setInterval(() => {
      setMsgIndex(i => i + 1);
    }, 2500);
    return () => clearInterval(msgTimer.current);
  }, [status]);

  // Run discovery
  const runDiscovery = async () => {
    setStatus('loading');
    setOpportunities([]);
    setMsgIndex(0);
    setAddingId(null);
    setCollapsingIds(new Set());

    try {
      if (demoMode) {
        // Demo mode: simulate discovery latency
        await new Promise(r => setTimeout(r, 3800));
        const scored = DEMO_OPPORTUNITIES.map(o => ({
          ...o, score: computeScore(o, PROFILE),
        }));
        setOpportunities(scored);
        setStatus('success');
      } else {
        // Live mode: call Anthropic with web_search tool
        const res = await fetch('https://api.anthropic.com/v1/messages', {
          method:  'POST',
          headers: {
            'Content-Type':      'application/json',
            'x-api-key':         apiKey,
            'anthropic-version': '2023-06-01',
          },
          body: JSON.stringify({
            model:      'claude-sonnet-4-20250514',
            max_tokens: 2000,
            tools:      [{ type: 'web_search_20250305', name: 'web_search' }],
            system:     SYSTEM_PROMPT,
            messages:   [{ role: 'user', content: buildUserMessage(PROFILE, ALREADY_TRACKED) }],
          }),
        });

        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.error?.message || `HTTP ${res.status}`);
        }

        const data   = await res.json();
        const opps   = parseOpportunities(data);
        const scored = opps.map(o => ({ ...o, score: computeScore(o, PROFILE) }));
        setOpportunities(scored);
        setStatus('success');
      }
    } catch (err) {
      console.error('[SisterOpportunityFinder]', err);
      setStatus('error');
    }
  };

  // "Add to My List" — animate out then collapse
  const handleAdd = (id) => {
    if (addingId || collapsingIds.has(id)) return;
    setAddingId(id);
    setTimeout(() => {
      setCollapsingIds(prev => new Set([...prev, id]));
      setAddingId(null);
    }, 1000);
  };

  const visibleOpps = opportunities.filter(o => !collapsingIds.has(o.id));
  const allAdded    = status === 'success' && opportunities.length > 0 && visibleOpps.length === 0;

  return (
    <div style={{ background: C.discoverbg, minHeight: '100vh' }}>
      <SofStyles />

      <div style={{ maxWidth: 820, margin: '0 auto', padding: '32px 32px' }}>

        {/* ── Section header ── */}
        <div style={{
          borderTop: `2px dashed ${C.indigoBorder}`,
          paddingTop: 28, marginBottom: 24,
        }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                <SparkleIcon size={26} color={C.indigo} />
                <h2 style={{ ...serif, fontSize: 28, color: C.text }}>
                  Discovered for You
                </h2>
              </div>
              <p style={{ fontSize: 14.5, color: C.slate, lineHeight: 1.7, maxWidth: 540 }}>
                Opportunities you were <strong style={{ color: C.text }}>never emailed about</strong> — found by
                scanning the web against your profile and ranking them against the same scoring engine.
              </p>
            </div>

            {/* AI discovery label + config toggle */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8, flexShrink: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                {/* Pulsing dot */}
                <div style={{
                  width: 9, height: 9, borderRadius: '50%',
                  background: C.indigo,
                  animation: 'sof-pulse-dot 2.2s ease-in-out infinite',
                }} />
                <span style={{ fontSize: 12, fontWeight: 700, color: C.indigo }}>
                  AI-powered discovery
                </span>
              </div>
              <button className="sof-toggle-btn" onClick={() => setShowConfig(x => !x)}>
                {showConfig ? '✕ Close' : '⚙ Config'}
              </button>
            </div>
          </div>

          {/* Profile summary bar */}
          <div style={{
            display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 14,
          }}>
            {[
              { label: PROFILE.name,          color: C.indigo  },
              { label: PROFILE.degree,        color: C.slate   },
              { label: `CGPA ${PROFILE.cgpa}`, color: C.indigo  },
              { label: `Sem ${PROFILE.semester}`, color: C.slate },
              ...PROFILE.skills.slice(0, 3).map(s => ({ label: s, color: C.purple })),
              { label: PROFILE.financial_need ? '💰 Need-Based' : 'Standard', color: C.emerald },
            ].map((b, i) => (
              <span key={i} style={{
                background: b.color + '12', color: b.color,
                borderRadius: 8, padding: '3px 10px',
                fontSize: 11.5, fontWeight: 600,
                border: `1px solid ${b.color}22`,
              }}>
                {b.label}
              </span>
            ))}
          </div>
        </div>

        {/* ── Config panel ── */}
        {showConfig && (
          <div style={{
            ...cardStyle,
            border: `1px solid ${C.indigoBorder}`,
            background: C.card,
            marginBottom: 20,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: 5,
                background: demoMode ? C.amber + '18' : C.emerald + '18',
                color: demoMode ? C.amber : C.emerald,
                borderRadius: 8, padding: '3px 10px',
                fontSize: 11, fontWeight: 700,
              }}>
                {demoMode ? '🎭 Demo mode' : '🔴 Live mode — web_search tool active'}
              </span>
            </div>

            <label style={{
              display: 'block', fontSize: 11, fontWeight: 700, color: C.slate,
              textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6,
            }}>
              Anthropic API Key
              <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0, color: C.slate, marginLeft: 4 }}>
                (leave empty for demo mode with sample results)
              </span>
            </label>
            <input
              type="password"
              className="sof-key-input"
              placeholder="sk-ant-api03-..."
              value={apiKey}
              onChange={e => setApiKey(e.target.value)}
              spellCheck={false}
              autoComplete="off"
            />
            <p style={{ fontSize: 11, color: C.slate, marginTop: 7, lineHeight: 1.65 }}>
              In live mode, Claude calls the <code style={{ background: C.bg, padding: '1px 4px', borderRadius: 3 }}>web_search_20250305</code> tool to find real, currently open opportunities. API key is never stored.
            </p>
          </div>
        )}

        {/* ── Idle state: CTA ── */}
        {status === 'idle' && (
          <div style={{
            ...cardStyle,
            border: `1px dashed ${C.indigoBorder}`,
            background: C.card,
            textAlign: 'center',
            padding: '48px 32px',
          }}>
            {/* Icon */}
            <div style={{
              width: 64, height: 64, borderRadius: '50%',
              background: C.indigoLight,
              border: `2px solid ${C.indigoBorder}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 20px',
            }}>
              <SparkleIcon size={28} color={C.indigo} />
            </div>

            <h3 style={{ fontSize: 20, fontWeight: 700, color: C.text, marginBottom: 8 }}>
              Ready to find hidden opportunities?
            </h3>
            <p style={{ fontSize: 14, color: C.slate, lineHeight: 1.7, maxWidth: 440, margin: '0 auto 24px' }}>
              {demoMode
                ? 'Demo mode will show 3 curated example discoveries for the sample profile. Add your API key in Config for live web search.'
                : 'Claude will search the web for real opportunities you qualify for — filtered against your tracked list and scored against your profile.'}
            </p>

            {/* Already tracking */}
            <div style={{ marginBottom: 24 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: C.slate, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>
                Excluding already-tracked
              </div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', justifyContent: 'center' }}>
                {ALREADY_TRACKED.map(t => (
                  <span key={t} style={{
                    background: C.border + '88', color: C.slate,
                    borderRadius: 8, padding: '3px 10px', fontSize: 11.5,
                    textDecoration: 'line-through',
                  }}>
                    {t}
                  </span>
                ))}
              </div>
            </div>

            <button className="sof-btn-primary" onClick={runDiscovery}>
              <SearchIcon size={15} color="#fff" />
              {demoMode ? 'Show Demo Discoveries' : 'Discover Opportunities'}
            </button>
          </div>
        )}

        {/* ── Loading state ── */}
        {status === 'loading' && (
          <LoadingView msgIndex={msgIndex} complete={false} />
        )}

        {/* ── Error state ── */}
        {status === 'error' && (
          <div style={{
            ...cardStyle,
            border: `1px solid ${C.rose}44`,
            background: C.rose + '06',
            textAlign: 'center',
            padding: '40px 32px',
          }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>⚠️</div>
            <h3 style={{ fontSize: 17, fontWeight: 700, color: C.text, marginBottom: 8 }}>
              Discovery search came back empty
            </h3>
            <p style={{ fontSize: 13.5, color: C.slate, marginBottom: 20 }}>
              The web search returned no results or the response couldn't be parsed.
              This can happen if the API key is invalid or the model couldn't find
              matching opportunities. Try again in a moment.
            </p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
              <button className="sof-btn-retry" onClick={runDiscovery}>
                ↺ Try Again
              </button>
              <button
                className="sof-btn-retry"
                onClick={() => setStatus('idle')}
                style={{ background: 'transparent', color: C.slate, borderColor: C.border }}
              >
                ← Go Back
              </button>
            </div>
          </div>
        )}

        {/* ── Success state: opportunity cards ── */}
        {status === 'success' && (
          <>
            {/* Results header */}
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              marginBottom: 16,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{
                  background: C.emerald + '15', color: C.emerald,
                  borderRadius: 10, padding: '3px 10px',
                  fontSize: 12, fontWeight: 700,
                }}>
                  ✓ {opportunities.length} opportunities discovered
                </span>
                <span style={{ fontSize: 12, color: C.slate }}>
                  {demoMode ? 'Demo mode' : 'via Claude web_search'}
                </span>
              </div>
              <button
                className="sof-toggle-btn"
                onClick={runDiscovery}
                style={{ fontSize: 11 }}
              >
                ↺ Re-scan
              </button>
            </div>

            {/* Cards */}
            {allAdded ? (
              <div style={{
                ...cardStyle,
                textAlign: 'center', padding: '48px 32px',
                border: `1px solid ${C.emerald}44`,
                background: C.emerald + '06',
              }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>🎉</div>
                <h3 style={{ fontSize: 18, fontWeight: 700, color: C.text, marginBottom: 8 }}>
                  All discoveries added to your list!
                </h3>
                <p style={{ fontSize: 13.5, color: C.slate, marginBottom: 20 }}>
                  Check your main Dashboard to see them ranked alongside your original opportunities.
                </p>
                <button className="sof-btn-retry" onClick={runDiscovery}>
                  <SearchIcon size={13} color={C.indigo} /> Find More Opportunities
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {opportunities.map((opp, i) => (
                  <div
                    key={opp.id}
                    style={{ animationDelay: `${i * 100}ms` }}
                  >
                    <DiscoveredCard
                      opp={opp}
                      onAdd={handleAdd}
                      isAdding={addingId === opp.id}
                      isCollapsing={collapsingIds.has(opp.id)}
                    />
                  </div>
                ))}
              </div>
            )}

            {/* Footer */}
            <p style={{ textAlign: 'center', fontSize: 12, color: C.slate, paddingTop: 20, paddingBottom: 8 }}>
              Opportunities are discovered via Claude&apos;s web_search tool and scored using the same engine as your inbox.
              Always verify deadlines and eligibility directly with the organization.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
