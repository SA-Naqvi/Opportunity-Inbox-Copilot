import React, { useState, useMemo, useEffect } from 'react';
import {
  PieChart, Pie, Cell, Label,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, LabelList,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  AreaChart, Area, ReferenceLine,
  Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import EmailReplySuggester from './EmailReplySuggester';
import CalendarBlocker from './CalendarBlocker';
import SisterOpportunityFinder from './SisterOpportunityFinder';
import LandingPage from './LandingPage';
import OnboardingForm from './OnboardingForm';
import GmailImport from './GmailImport';

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

const inputStyle = {
  width: '100%', border: `1px solid ${C.border}`, borderRadius: 8,
  padding: '8px 12px', fontSize: 13, fontFamily: "'DM Sans', sans-serif",
  color: C.text, background: C.card, outline: 'none', transition: 'border-color 0.15s',
};

const labelStyle = {
  display: 'block', fontSize: 11, fontWeight: 700, color: C.slate,
  textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 5,
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

const addDays = (n) => {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d.toISOString().split('T')[0];
};

const getDaysLeft = (deadline) => {
  if (!deadline) return null;
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const dl    = new Date(deadline + 'T00:00:00');
  return Math.ceil((dl - today) / 86400000);
};

const urgencyColor = (d) => {
  if (d === null || d === undefined || d < 0) return C.slate;
  if (d <= 3) return C.rose;
  if (d <= 7) return C.amber;
  return C.emerald;
};

const fmtDate = (iso) => {
  if (!iso) return '—';
  const p = iso.split('-');
  if (p.length !== 3) return iso;
  const months = ['', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${months[+p[1]]} ${+p[2]}`;
};

const TYPE_LABEL = {
  internship:        'Internship',
  scholarship:       'Scholarship',
  fellowship:        'Fellowship',
  competition:       'Competition',
  hackathon:         'Hackathon',
  research_position: 'Research',
};

const TYPE_COLOR = {
  internship:        C.indigo,
  scholarship:       C.emerald,
  fellowship:        C.amber,
  competition:       C.rose,
  hackathon:         C.purple,
  research_position: C.slate,
};

const ALL_OPP_TYPES = [
  'internship', 'scholarship', 'fellowship',
  'competition', 'hackathon', 'research_position',
];

const getEligStatus = (opp) => {
  if (opp.eligibility_hard_block) return 'blocked';
  if ((opp.completeness_flags?.length || 0) + (opp.suspicious_flags?.length || 0) > 0) return 'check';
  return 'met';
};

// ─── Default data ─────────────────────────────────────────────────────────────

const DEFAULT_PROFILE = {
  degree:                    'BS Computer Science',
  semester:                  6,
  cgpa:                      3.4,
  skills:                    ['Python', 'Machine Learning', 'React', 'TensorFlow', 'SQL'],
  interests:                 ['AI', 'software engineering', 'research'],
  preferred_opportunity_types: ['internship', 'competition', 'fellowship'],
  financial_need:            true,
  location_preference:       'Pakistan / Remote',
  past_experience:           ['ICPC 2024 participant', 'web dev intern at TechCorp', 'ML research assistant'],
};

const SAMPLE_EMAILS_PRESET = [
  {
    subject: 'Google Summer of Code 2026 — Applications Now Open',
    body: `Dear Students,

Google Summer of Code (GSoC) 2026 is now accepting applications! This global program offers stipends to university students for contributing to open-source software projects over the summer.

Eligibility:
- Must be enrolled in a university (BS or above)
- Minimum CGPA of 2.5
- Proficiency in at least one programming language

Stipend: $3,000 for medium projects, $6,000 for large
Duration: 12 weeks (June–August 2026)
Deadline: April 30, 2026
Location: Remote

Apply here: https://summerofcode.withgoogle.com/
Contact: gsoc-support@google.com
Required documents: Resume/CV, project proposal

Best regards,
Google Open Source Team`,
  },
  {
    subject: 'HEC Need-Based Scholarship 2026 — Applications Open',
    body: `Dear Student,

The Higher Education Commission (HEC) Pakistan is accepting applications for its Need-Based Scholarship Program 2026. The scholarship covers tuition fees and provides a monthly stipend of PKR 50,000.

Eligibility:
- Currently enrolled in a BS program at a recognized Pakistani university
- CGPA 3.0 or above
- Demonstrated financial need

Deadline: May 10, 2026
Location: Pakistan (any HEC-recognized university)

Apply at: https://hec.gov.pk/scholarships
Required documents: CNIC copy, income certificate, transcript, enrollment letter
Contact: scholarships@hec.gov.pk`,
  },
  {
    subject: 'SOFTEC 2026 — National Software Competition Registration Open',
    body: `Dear Tech Enthusiasts,

SOFTEC 2026, Pakistan's largest software competition hosted by FAST-NUCES, is now open for team registrations.

Categories: AI/ML, Web Development, Mobile Apps, Competitive Programming
Prize Pool: PKR 500,000+
Date: May 20–21, 2026
Location: FAST-NUCES, Lahore
Registration Deadline: May 5, 2026

Team size: 2–4 members
Eligibility: Any Pakistani university student

Register: https://softec.org.pk
Contact: softec@nu.edu.pk`,
  },
  {
    subject: 'Fulbright Scholarship 2026-2027 — Pakistan Applications Open',
    body: `The United States Educational Foundation in Pakistan (USEFP) invites applications for the Fulbright Scholarship 2026-27.

This fully-funded scholarship covers tuition, living expenses, airfare, and health insurance for Master's or PhD study in the USA.

Eligibility:
- Pakistani citizen
- Bachelor's degree with minimum CGPA 3.0
- 2+ years work/research experience preferred
- TOEFL/IELTS required

Deadline: June 1, 2026
Location: United States

Apply at: https://www.usefp.org/fulbright
Required: Transcripts, CV, 3 recommendation letters, Statement of Purpose, TOEFL/IELTS scores
Contact: info@usefp.org`,
  },
  {
    subject: 'Aga Khan Foundation International Fellowship — Apply Now',
    body: `Dear Applicant,

The Aga Khan Foundation (AKF) is accepting applications for its International Fellowship program for outstanding Pakistani students.

Eligibility:
- Pakistani citizen
- Minimum CGPA 3.2
- BS degree in Computer Science, Engineering, or related field
- Demonstrated financial need

Stipend: PKR 80,000/month
Duration: 6 months
Deadline: April 25, 2026
Location: Karachi / Remote

Apply at: https://www.akfed.org/fellowship
Required: CV, Statement of Purpose, two references
Contact: fellowship@akfed.org`,
  },
  {
    subject: 'Weekly Campus Newsletter — April 2026',
    body: `Hello from the CS Department!

Here's what's happening on campus this week:
- Library extended hours for finals (8AM–12AM)
- New AI lab computers installed in Lab 3
- Sports day recap: CS dept wins cricket tournament!
- Cafeteria menu updated
- Reminder: Faculty meeting on Friday at 2PM

Upcoming: Guest lecture by Google engineer on April 22, Project exhibition on May 15.

Best,
CS Department Admin`,
  },
  {
    subject: 'MEGA SALE — 50% Off All Online Coding Courses This Weekend!',
    body: `🎉 FLASH SALE! This weekend only!

Get 50% OFF all premium coding courses at TechLearn Academy!
✓ Complete Python Bootcamp
✓ Full-Stack Web Development
✓ Machine Learning A-Z

Use code: STUDENT50 at checkout

Offer expires: Sunday April 20, 2026
Shop now: https://techlearn.academy/sale
Unsubscribe: https://techlearn.academy/unsub`,
  },
];

// ─── Shared small components ──────────────────────────────────────────────────

const Badge = ({ children, color }) => (
  <span style={{
    background: color + '18', color, borderRadius: 12,
    padding: '3px 10px', fontSize: 11, fontWeight: 600,
    whiteSpace: 'nowrap', display: 'inline-block',
  }}>{children}</span>
);

const SectionTitle = ({ children, sub }) => (
  <div style={{ marginBottom: sub ? 4 : 16 }}>
    <h3 style={{ ...serif, fontSize: 17, color: C.text, margin: 0 }}>{children}</h3>
    {sub && <p style={{ fontSize: 12, color: C.slate, margin: '4px 0 12px' }}>{sub}</p>}
  </div>
);

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: C.card, border: `1px solid ${C.border}`, borderRadius: 10,
      padding: '10px 14px', boxShadow: '0 4px 12px rgba(0,0,0,0.08)', fontSize: 12,
    }}>
      {label !== undefined && <div style={{ fontWeight: 600, color: C.text, marginBottom: 6 }}>{label}</div>}
      {payload.map((p, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: p.color || p.fill, flexShrink: 0 }} />
          <span style={{ color: C.slate }}>{p.name}:</span>
          <span style={{ fontWeight: 600, color: C.text }}>{p.value}</span>
        </div>
      ))}
    </div>
  );
};

const BtnPrimary = ({ onClick, disabled, children, fullWidth }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    style={{
      width: fullWidth ? '100%' : 'auto',
      padding: '9px 18px', borderRadius: 9, border: 'none',
      cursor: disabled ? 'not-allowed' : 'pointer',
      background: disabled ? C.border : C.indigo,
      color: disabled ? C.slate : '#fff',
      fontSize: 13.5, fontWeight: 700, fontFamily: "'DM Sans', sans-serif",
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 7,
      transition: 'all 0.15s',
    }}
  >{children}</button>
);

const BtnGhost = ({ onClick, children }) => (
  <button
    onClick={onClick}
    style={{
      padding: '6px 13px', borderRadius: 8,
      border: `1px solid ${C.border}`, background: 'none', cursor: 'pointer',
      color: C.slate, fontSize: 12, fontFamily: "'DM Sans', sans-serif",
      transition: 'all 0.15s',
    }}
  >{children}</button>
);

// ─── Pipeline stages meta ─────────────────────────────────────────────────────

const PIPELINE_STAGES = [
  { n: 1, label: 'Classifying emails',    model: 'gemini-2.5-flash-lite',    desc: 'Filtering opportunities from noise' },
  { n: 2, label: 'Extracting fields',     model: 'gemini-2.5-flash',         desc: 'Deadline, eligibility, links, stipend' },
  { n: 3, label: 'Validating data',       model: 'gemini-2.5-flash-lite',    desc: 'Normalizing dates, deduplication, flags' },
  { n: 4, label: 'Scoring',              model: 'deterministic + embeddings', desc: 'Urgency · Profile Match · Eligibility · Completeness' },
  { n: 5, label: 'Ranking & explaining',  model: 'gemini-2.5-pro',           desc: 'Personalized insights, next steps, risks' },
];

// ─── App ──────────────────────────────────────────────────────────────────────

export default function App() {

  // ── Step state ──────────────────────────────────────────────────────────────
  const [step, setStep] = useState('landing'); // 'landing' | 'setup' | 'onboard' | 'processing' | 'dashboard'

  // ── Onboarding: email input ─────────────────────────────────────────────────
  const [emails,       setEmails]       = useState([]);
  const [newEmail,     setNewEmail]     = useState({ subject: '', body: '' });
  const [emailError,   setEmailError]   = useState('');

  // ── Onboarding: student profile ─────────────────────────────────────────────
  const [studentName,    setStudentName]    = useState('');
  const [profile,        setProfile]        = useState(DEFAULT_PROFILE);
  const [skillsText,     setSkillsText]     = useState(DEFAULT_PROFILE.skills.join(', '));
  const [interestsText,  setInterestsText]  = useState(DEFAULT_PROFILE.interests.join(', '));
  const [expText,        setExpText]        = useState(DEFAULT_PROFILE.past_experience.join('\n'));
  const [gmailAddress,     setGmailAddress]     = useState('');
  const [gmailAppPassword, setGmailAppPassword] = useState('');
  const [calendarName,     setCalendarName]     = useState('primary');
  const [profileSetupDone, setProfileSetupDone] = useState(false);

  // ── Pipeline result ─────────────────────────────────────────────────────────
  const [result,     setResult]     = useState(null);
  const [apiError,   setApiError]   = useState(null);
  const [procStage,  setProcStage]  = useState(0);

  // ── Dashboard UI ────────────────────────────────────────────────────────────
  const [activeTab,      setActiveTab]      = useState('dashboard');
  const [selectedRow,    setSelectedRow]    = useState(null);
  const [inboxExpanded,  setInboxExpanded]  = useState(true);

  // ── Processing animation ────────────────────────────────────────────────────
  useEffect(() => {
    if (step !== 'processing') { setProcStage(0); return; }
    const delays = [0, 8000, 17000, 27000, 34000];
    const timers = delays.map((d, i) => setTimeout(() => setProcStage(i), d));
    return () => timers.forEach(clearTimeout);
  }, [step]);

  // ── Email handlers ──────────────────────────────────────────────────────────
  const addEmail = () => {
    if (!newEmail.subject.trim()) { setEmailError('Subject is required.'); return; }
    if (!newEmail.body.trim())    { setEmailError('Body is required.');    return; }
    setEmails(prev => [
      ...prev,
      { id: `email_${String(prev.length + 1).padStart(3, '0')}`, ...newEmail },
    ]);
    setNewEmail({ subject: '', body: '' });
    setEmailError('');
  };

  const removeEmail = (id) => {
    setEmails(prev => {
      const next = prev.filter(e => e.id !== id);
      return next.map((e, i) => ({ ...e, id: `email_${String(i + 1).padStart(3, '0')}` }));
    });
  };

  // Batch-add emails imported from Gmail (subject + body objects)
  const addEmailsBatch = (list) => {
    setEmails(prev => {
      const newEmails = list.map((e, i) => ({
        id:      `email_${String(prev.length + i + 1).padStart(3, '0')}`,
        subject: e.subject || '(no subject)',
        body:    e.body    || '',
      }));
      return [...prev, ...newEmails];
    });
  };

  const loadSamples = () => {
    setEmails(SAMPLE_EMAILS_PRESET.map((e, i) => ({
      id: `email_${String(i + 1).padStart(3, '0')}`, ...e,
    })));
  };

  // ── Profile handlers ────────────────────────────────────────────────────────
  const updSkills = (t) => {
    setSkillsText(t);
    setProfile(p => ({ ...p, skills: t.split(',').map(s => s.trim()).filter(Boolean) }));
  };
  const updInterests = (t) => {
    setInterestsText(t);
    setProfile(p => ({ ...p, interests: t.split(',').map(s => s.trim()).filter(Boolean) }));
  };
  const updExp = (t) => {
    setExpText(t);
    setProfile(p => ({ ...p, past_experience: t.split('\n').filter(Boolean) }));
  };
  const toggleType = (type) => {
    setProfile(p => ({
      ...p,
      preferred_opportunity_types: p.preferred_opportunity_types.includes(type)
        ? p.preferred_opportunity_types.filter(t => t !== type)
        : [...p.preferred_opportunity_types, type],
    }));
  };

  // ── Run pipeline ────────────────────────────────────────────────────────────
  const runPipeline = async () => {
    setStep('processing');
    setApiError(null);
    setResult(null);
    setSelectedRow(null);
    try {
      const res = await fetch('http://localhost:8000/api/pipeline', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ emails, student_profile: profile }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.detail || `HTTP ${res.status}`);
      }
      const data = await res.json();
      setResult(data);
      setActiveTab('dashboard');
      setStep('dashboard');
    } catch (err) {
      setApiError(err.message || 'Pipeline failed — is the backend running?');
      setStep('onboard');
    }
  };

  const resetToOnboard = () => {
    setStep('landing');
    setResult(null);
    setSelectedRow(null);
  };

  // ── Setup complete (OnboardingForm → onboard) ────────────────────────────────
  const handleSetupComplete = ({ name, profile: p, gmailAddress: g, gmailAppPassword: pw, calendarName: c }) => {
    setStudentName(name);
    setProfile(p);
    setSkillsText(p.skills.join(', '));
    setInterestsText(p.interests.join(', '));
    setExpText(p.past_experience.join('\n'));
    setGmailAddress(g);
    setGmailAppPassword(pw || '');
    setCalendarName(c);
    setProfileSetupDone(true);
    setStep('onboard');
  };

  // ── Derived data from result ────────────────────────────────────────────────
  const opps = useMemo(() => result?.ranked || [], [result]);

  const classifiedEmails = useMemo(() =>
    result?.pipeline_stages?.classification || [], [result]);

  const inboxItems = useMemo(() =>
    emails.map(e => {
      const cls = classifiedEmails.find(c => c.id === e.id);
      return {
        ...e,
        is_opp:     cls?.is_opportunity ?? false,
        type:       cls?.opportunity_type ?? null,
        confidence: cls?.confidence ?? 0,
      };
    }),
  [emails, classifiedEmails]);

  const kpis = useMemo(() => ({
    scanned:  emails.length,
    found:    opps.length,
    expiring: opps.filter(o => { const d = getDaysLeft(o.deadline); return d !== null && d >= 0 && d <= 7; }).length,
    avgScore: opps.length
      ? Math.round(opps.reduce((s, o) => s + o.total_score, 0) / opps.length)
      : 0,
  }), [emails, opps]);

  const donutData = useMemo(() => {
    const counts = {};
    opps.forEach(o => { counts[o.opportunity_type] = (counts[o.opportunity_type] || 0) + 1; });
    return Object.entries(counts).map(([type, count]) => ({
      name:  TYPE_LABEL[type] || type,
      value: count,
      color: TYPE_COLOR[type] || C.slate,
    }));
  }, [opps]);

  const barData = useMemo(() =>
    [...opps]
      .sort((a, b) => b.total_score - a.total_score)
      .slice(0, 6)
      .map(o => {
        const d = getDaysLeft(o.deadline);
        const title = o.title || 'Untitled';
        return {
          name:  title.length > 26 ? title.slice(0, 26) + '…' : title,
          score: o.total_score,
          color: urgencyColor(d),
        };
      }),
  [opps]);

  const radarData = useMemo(() => {
    if (!opps.length) return [];
    const sb = opps[0].score_breakdown || {};
    return [
      { subject: 'Urgency',       value: Math.round((sb.urgency       || 0) / 30 * 100) },
      { subject: 'Profile Match', value: Math.round((sb.profile_match || 0) / 35 * 100) },
      { subject: 'Eligibility',   value: Math.round((sb.eligibility   || 0) / 25 * 100) },
      { subject: 'Completeness',  value: Math.round((sb.completeness  || 0) / 10 * 100) },
      { subject: 'Relevance',     value: opps[0].total_score || 0 },
    ];
  }, [opps]);

  const timelineData = useMemo(() =>
    Array.from({ length: 56 }, (_, i) => ({
      day:   i,
      count: opps.filter(o => o.deadline && o.deadline <= addDays(i)).length,
    })),
  [opps]);

  const stackedData = useMemo(() =>
    opps.map(o => {
      const sb    = o.score_breakdown || {};
      const title = o.title || 'Untitled';
      return {
        name:         title.length > 16 ? title.slice(0, 16) + '…' : title,
        urgency:      sb.urgency       || 0,
        profile:      sb.profile_match || 0,
        eligibility:  sb.eligibility   || 0,
        completeness: sb.completeness  || 0,
      };
    }),
  [opps]);

  const selectedOpp = selectedRow ? opps.find(o => o.id === selectedRow) : null;

  // ─── RENDER: Onboarding ───────────────────────────────────────────────────

  const renderOnboarding = () => (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '32px 32px' }}>

      {/* Hero */}
      <div style={{ textAlign: 'center', marginBottom: 28 }}>
        <h1 style={{ ...serif, fontSize: 30, color: C.text, marginBottom: 6 }}>
          🎓 Opportunity Inbox Copilot
        </h1>
        <p style={{ fontSize: 14, color: C.slate }}>
          Paste your student emails — the AI pipeline classifies, extracts, scores, and ranks the real opportunities for you.
        </p>
      </div>

      {/* Profile summary bar (shown after OnboardingForm setup) */}
      {profileSetupDone && (
        <div style={{
          ...card, marginBottom: 20,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          flexWrap: 'wrap', gap: 12,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 40, height: 40, borderRadius: '50%',
              background: C.indigo + '18', color: C.indigo,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 18, flexShrink: 0,
            }}>👤</div>
            <div>
              <div style={{ fontWeight: 700, color: C.text, fontSize: 14 }}>{studentName}</div>
              <div style={{ fontSize: 12, color: C.slate }}>
                {profile.degree} · Semester {profile.semester} · CGPA {profile.cgpa.toFixed(1)}
                {gmailAddress && <span style={{ color: C.emerald, marginLeft: 8 }}>✓ Gmail</span>}
                {calendarName && <span style={{ color: C.indigo, marginLeft: 6 }}>✓ Calendar</span>}
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
              {profile.skills.slice(0, 3).map(s => (
                <span key={s} style={{
                  fontSize: 11, background: C.indigo + '14', color: C.indigo,
                  borderRadius: 6, padding: '2px 8px', border: `1px solid ${C.indigo}33`,
                  fontWeight: 600, fontFamily: "'DM Sans', sans-serif",
                }}>{s}</span>
              ))}
              {profile.skills.length > 3 && (
                <span style={{ fontSize: 11, color: C.slate, padding: '2px 4px' }}>
                  +{profile.skills.length - 3} more
                </span>
              )}
            </div>
            <button
              onClick={() => setStep('setup')}
              style={{
                padding: '5px 12px', borderRadius: 8, fontSize: 12, fontWeight: 600,
                border: `1px solid ${C.border}`, background: C.bg, color: C.slate,
                cursor: 'pointer', fontFamily: "'DM Sans', sans-serif",
                transition: 'all 0.15s',
              }}
            >✏ Edit Profile</button>
          </div>
        </div>
      )}

      {/* How it works */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 24 }}>
        {[
          { n: '1', label: 'Add emails',        desc: 'Paste 5–15 emails from your inbox' },
          { n: '2', label: 'Confirm profile',   desc: 'Your degree, skills, preferences' },
          { n: '3', label: 'Run the pipeline',  desc: '4-agent AI + deterministic scoring' },
          { n: '4', label: 'View results',      desc: 'Charts, scores, and action plans' },
        ].map(s => (
          <div key={s.n} style={{ ...card, flex: 1, textAlign: 'center', padding: '14px 12px' }}>
            <div style={{
              width: 28, height: 28, borderRadius: '50%',
              background: C.indigo + '18', color: C.indigo,
              fontSize: 13, fontWeight: 700,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 8px',
            }}>{s.n}</div>
            <div style={{ fontSize: 12.5, fontWeight: 600, color: C.text, marginBottom: 2 }}>{s.label}</div>
            <div style={{ fontSize: 11, color: C.slate }}>{s.desc}</div>
          </div>
        ))}
      </div>

      {/* Main layout — full width if profile already set, 2-col otherwise */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: profileSetupDone ? '1fr' : '1fr 360px',
        gap: 20, marginBottom: 20,
      }}>

        {/* ── Left: Email inbox ── */}
        <div style={card}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <h3 style={{ ...serif, fontSize: 17, color: C.text }}>Email Inbox</h3>
              {emails.length > 0 && <Badge color={C.indigo}>{emails.length} email{emails.length !== 1 ? 's' : ''}</Badge>}
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
              {/* Auto-import from Gmail */}
              <GmailImport
                gmailAddress={gmailAddress}
                gmailAppPassword={gmailAppPassword}
                onImport={(list) => {
                  addEmailsBatch(list);
                }}
              />
              {emails.length > 0 && (
                <BtnGhost onClick={() => setEmails([])}>Clear all</BtnGhost>
              )}
              <button
                onClick={loadSamples}
                style={{
                  padding: '6px 13px', borderRadius: 8,
                  border: `1px solid ${C.indigo}33`,
                  background: C.indigo + '14', color: C.indigo,
                  fontSize: 12, fontWeight: 600,
                  fontFamily: "'DM Sans', sans-serif", cursor: 'pointer',
                }}
              >
                📋 Load sample emails
              </button>
            </div>
          </div>

          {/* Add email form */}
          <div style={{
            background: C.bg, border: `1px solid ${C.border}`,
            borderRadius: 12, padding: '16px', marginBottom: 14,
          }}>
            <div style={{ fontSize: 12.5, fontWeight: 600, color: C.text, marginBottom: 12 }}>
              ✏️ Add Email
            </div>
            <div style={{ marginBottom: 10 }}>
              <label style={labelStyle}>Subject</label>
              <input
                type="text"
                placeholder="e.g. Google Summer of Code 2026 — Apply Now"
                value={newEmail.subject}
                onChange={e => setNewEmail(n => ({ ...n, subject: e.target.value }))}
                onKeyDown={e => e.key === 'Enter' && document.getElementById('email-body-input')?.focus()}
                style={inputStyle}
              />
            </div>
            <div style={{ marginBottom: 10 }}>
              <label style={labelStyle}>Body</label>
              <textarea
                id="email-body-input"
                placeholder="Paste the full email body here…"
                value={newEmail.body}
                onChange={e => setNewEmail(n => ({ ...n, body: e.target.value }))}
                rows={5}
                style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.65 }}
              />
            </div>
            {emailError && (
              <p style={{ fontSize: 12, color: C.rose, marginBottom: 8 }}>{emailError}</p>
            )}
            <BtnPrimary onClick={addEmail}>+ Add Email</BtnPrimary>
          </div>

          {/* Email list */}
          {emails.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '28px 0', color: C.slate }}>
              <span style={{ fontSize: 36, display: 'block', marginBottom: 8, opacity: 0.3 }}>📭</span>
              <p style={{ fontSize: 13 }}>No emails added yet.</p>
              <p style={{ fontSize: 12 }}>Add emails above or click "Load sample emails".</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
              {emails.map((e, i) => (
                <div key={e.id} style={{
                  display: 'flex', alignItems: 'flex-start', gap: 10,
                  background: C.bg, border: `1px solid ${C.border}`,
                  borderRadius: 10, padding: '10px 12px',
                }}>
                  <span style={{
                    fontSize: 11, fontWeight: 700, color: C.slate,
                    minWidth: 34, marginTop: 2, flexShrink: 0,
                  }}>
                    #{String(i + 1).padStart(2, '0')}
                  </span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      fontSize: 13, fontWeight: 600, color: C.text, marginBottom: 2,
                      overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis',
                    }}>
                      {e.subject}
                    </div>
                    <div style={{
                      fontSize: 11, color: C.slate,
                      overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis',
                    }}>
                      {e.body.replace(/\n/g, ' ').slice(0, 90)}…
                    </div>
                  </div>
                  <button
                    onClick={() => removeEmail(e.id)}
                    title="Remove"
                    style={{
                      background: 'none', border: 'none', cursor: 'pointer',
                      color: C.slate, fontSize: 16, padding: '0 2px',
                      lineHeight: 1, flexShrink: 0,
                    }}
                  >✕</button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── Right: Student Profile Form (shown only when setup not yet done) ── */}
        {!profileSetupDone && (
        <div style={{ ...card, display: 'flex', flexDirection: 'column', gap: 13 }}>
          <h3 style={{ ...serif, fontSize: 17, color: C.text, margin: 0 }}>Student Profile</h3>

          {/* Name (display only) */}
          <div>
            <label style={labelStyle}>Your Name <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0, color: C.slate }}>(display only)</span></label>
            <input
              type="text"
              value={studentName}
              onChange={e => setStudentName(e.target.value)}
              placeholder="Ali Hassan"
              style={inputStyle}
            />
          </div>

          {/* Degree + Semester */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div>
              <label style={labelStyle}>Degree</label>
              <input
                type="text"
                value={profile.degree}
                onChange={e => setProfile(p => ({ ...p, degree: e.target.value }))}
                style={inputStyle}
              />
            </div>
            <div>
              <label style={labelStyle}>Semester</label>
              <select
                value={profile.semester}
                onChange={e => setProfile(p => ({ ...p, semester: +e.target.value }))}
                style={{ ...inputStyle, appearance: 'none', cursor: 'pointer' }}
              >
                {[1, 2, 3, 4, 5, 6, 7, 8].map(s => (
                  <option key={s} value={s}>Semester {s}</option>
                ))}
              </select>
            </div>
          </div>

          {/* CGPA + Location */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div>
              <label style={labelStyle}>CGPA</label>
              <input
                type="number"
                min="0" max="4.0" step="0.1"
                value={profile.cgpa}
                onChange={e => setProfile(p => ({ ...p, cgpa: +e.target.value }))}
                style={inputStyle}
              />
            </div>
            <div>
              <label style={labelStyle}>Location</label>
              <input
                type="text"
                value={profile.location_preference}
                onChange={e => setProfile(p => ({ ...p, location_preference: e.target.value }))}
                placeholder="Pakistan / Remote"
                style={inputStyle}
              />
            </div>
          </div>

          {/* Skills */}
          <div>
            <label style={labelStyle}>Skills <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0, color: C.slate }}>(comma-separated)</span></label>
            <input
              type="text"
              value={skillsText}
              onChange={e => updSkills(e.target.value)}
              placeholder="Python, React, Machine Learning"
              style={inputStyle}
            />
          </div>

          {/* Interests */}
          <div>
            <label style={labelStyle}>Interests <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0, color: C.slate }}>(comma-separated)</span></label>
            <input
              type="text"
              value={interestsText}
              onChange={e => updInterests(e.target.value)}
              placeholder="AI, software engineering, research"
              style={inputStyle}
            />
          </div>

          {/* Preferred opportunity types */}
          <div>
            <label style={labelStyle}>Preferred Types</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {ALL_OPP_TYPES.map(type => {
                const checked = profile.preferred_opportunity_types.includes(type);
                const clr     = TYPE_COLOR[type] || C.slate;
                return (
                  <button
                    key={type}
                    onClick={() => toggleType(type)}
                    style={{
                      padding: '4px 11px', borderRadius: 10, cursor: 'pointer',
                      fontSize: 11.5, fontWeight: 600, fontFamily: "'DM Sans', sans-serif",
                      background: checked ? clr + '18' : C.bg,
                      color:      checked ? clr        : C.slate,
                      border:     checked ? `1px solid ${clr}44` : `1px solid ${C.border}`,
                      transition: 'all 0.12s',
                    }}
                  >
                    {TYPE_LABEL[type]}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Financial need */}
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', userSelect: 'none' }}>
            <input
              type="checkbox"
              checked={profile.financial_need}
              onChange={e => setProfile(p => ({ ...p, financial_need: e.target.checked }))}
              style={{ accentColor: C.indigo, width: 15, height: 15, flexShrink: 0 }}
            />
            <span style={{ fontSize: 13, color: C.text }}>
              Financial Need <span style={{ fontSize: 11, color: C.slate }}>(boosts stipend scoring)</span>
            </span>
          </label>

          {/* Past experience */}
          <div>
            <label style={labelStyle}>Past Experience <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0, color: C.slate }}>(one per line)</span></label>
            <textarea
              value={expText}
              onChange={e => updExp(e.target.value)}
              placeholder={'ICPC 2024 participant\nWeb dev intern at XYZ'}
              rows={3}
              style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.65 }}
            />
          </div>
        </div>
        )}
      </div>

      {/* API error */}
      {apiError && (
        <div style={{
          ...card, marginBottom: 16,
          border: `1px solid ${C.rose}55`, background: C.rose + '06',
          display: 'flex', alignItems: 'flex-start', gap: 12,
        }}>
          <span style={{ fontSize: 20, flexShrink: 0 }}>⚠️</span>
          <div>
            <div style={{ fontWeight: 600, color: C.rose, fontSize: 13, marginBottom: 3 }}>Pipeline Error</div>
            <div style={{ fontSize: 13, color: C.text }}>{apiError}</div>
            <div style={{ fontSize: 11, color: C.slate, marginTop: 4 }}>
              Make sure the backend is running:{' '}
              <code style={{ background: C.bg, borderRadius: 4, padding: '1px 5px', fontSize: 11 }}>
                uvicorn app.main:app --reload
              </code>{' '}
              in the <code style={{ background: C.bg, borderRadius: 4, padding: '1px 5px', fontSize: 11 }}>backend/</code> folder.
            </div>
          </div>
        </div>
      )}

      {/* Run button */}
      <button
        onClick={emails.length > 0 ? runPipeline : undefined}
        disabled={emails.length === 0}
        style={{
          width: '100%', padding: '15px 0', borderRadius: 12, border: 'none',
          cursor: emails.length === 0 ? 'not-allowed' : 'pointer',
          background: emails.length === 0 ? C.border : C.indigo,
          color: emails.length === 0 ? C.slate : '#fff',
          fontSize: 15, fontWeight: 700, fontFamily: "'DM Sans', sans-serif",
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          transition: 'all 0.15s',
        }}
      >
        {emails.length === 0
          ? '🚀 Run Pipeline — add at least 1 email to continue'
          : `🚀 Run Pipeline — analyze ${emails.length} email${emails.length !== 1 ? 's' : ''}`
        }
      </button>
    </div>
  );

  // ─── RENDER: Processing ───────────────────────────────────────────────────

  const renderProcessing = () => (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', minHeight: '82vh', gap: 22, padding: 32,
    }}>
      {/* Spinner */}
      <div style={{
        width: 58, height: 58, borderRadius: '50%',
        border: `4px solid ${C.indigo}22`,
        borderTop: `4px solid ${C.indigo}`,
        animation: 'ps-spin 0.85s linear infinite',
      }} />

      <div style={{ textAlign: 'center' }}>
        <h2 style={{ ...serif, fontSize: 22, color: C.text, marginBottom: 5 }}>
          Analyzing {emails.length} email{emails.length !== 1 ? 's' : ''}…
        </h2>
        <p style={{ fontSize: 13, color: C.slate }}>
          4-agent AI pipeline · takes 20–60 seconds
        </p>
      </div>

      {/* Stage progress */}
      <div style={{ ...card, width: 500, display: 'flex', flexDirection: 'column', gap: 12 }}>
        {PIPELINE_STAGES.map((s, i) => {
          const done   = i < procStage;
          const active = i === procStage;
          return (
            <div key={s.n} style={{
              display: 'flex', alignItems: 'center', gap: 12,
              opacity: done ? 1 : active ? 1 : 0.35,
              transition: 'opacity 0.4s',
            }}>
              {/* Icon */}
              <div style={{
                width: 30, height: 30, borderRadius: '50%', flexShrink: 0,
                background: done ? C.emerald + '18' : active ? C.indigo + '18' : C.border,
                color: done ? C.emerald : active ? C.indigo : C.slate,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: done ? 13 : 12, fontWeight: 700,
                transition: 'all 0.3s',
              }}>
                {done ? '✓' : s.n}
              </div>

              {/* Text */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: done ? C.slate : active ? C.text : C.slate }}>
                  {s.label}
                </div>
                <div style={{ fontSize: 11, color: C.slate }}>{s.desc}</div>
              </div>

              {/* Model */}
              <div style={{
                fontSize: 10, color: active ? C.indigo : C.slate,
                fontWeight: active ? 600 : 400, flexShrink: 0, textAlign: 'right',
              }}>
                {s.model}
              </div>

              {/* Active pulse dot */}
              {active && (
                <div style={{
                  width: 8, height: 8, borderRadius: '50%',
                  background: C.indigo, flexShrink: 0,
                  animation: 'ps-pulse 1.1s ease-in-out infinite',
                }} />
              )}
            </div>
          );
        })}
      </div>

      <p style={{ fontSize: 12, color: C.slate }}>
        ☕ Grab a coffee — the pipeline is doing the heavy lifting
      </p>
    </div>
  );

  // ─── RENDER: Dashboard ────────────────────────────────────────────────────

  const renderDashboard = () => (
    <div style={{ maxWidth: 1400, margin: '0 auto', padding: '28px 32px', display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* Action bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <BtnGhost onClick={resetToOnboard}>← New Analysis</BtnGhost>
        <span style={{ fontSize: 12, color: C.slate }}>{result?.message}</span>
      </div>

      {/* Empty state */}
      {opps.length === 0 ? (
        <div style={{ ...card, textAlign: 'center', padding: '52px 24px' }}>
          <span style={{ fontSize: 48, display: 'block', marginBottom: 12, opacity: 0.3 }}>🔍</span>
          <h3 style={{ ...serif, fontSize: 18, color: C.text, marginBottom: 8 }}>No opportunities found</h3>
          <p style={{ fontSize: 14, color: C.slate, marginBottom: 20 }}>
            The pipeline didn't detect any real opportunities in {emails.length} emails. Try adding more diverse emails.
          </p>
          <BtnPrimary onClick={resetToOnboard}>← Try Different Emails</BtnPrimary>
        </div>
      ) : (
        <>
          {/* ── Inbox ── */}
          <div style={card}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: inboxExpanded ? 16 : 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <h2 style={{ ...serif, fontSize: 17, color: C.text }}>Processed Inbox</h2>
                <Badge color={C.emerald}>{inboxItems.filter(e => e.is_opp).length} opportunities</Badge>
                <Badge color={C.rose}>{inboxItems.filter(e => !e.is_opp).length} rejected</Badge>
              </div>
              <BtnGhost onClick={() => setInboxExpanded(x => !x)}>
                {inboxExpanded ? '▲ Collapse' : '▼ Expand'}
              </BtnGhost>
            </div>
            {inboxExpanded && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {inboxItems.map(email => (
                  <div key={email.id} style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    padding: '9px 14px', borderRadius: 10,
                    background: email.is_opp ? '#f0fdf4' : '#fef2f2',
                    border: `1px solid ${email.is_opp ? '#bbf7d0' : '#fecaca'}`,
                  }}>
                    <span style={{ fontSize: 15, flexShrink: 0 }}>{email.is_opp ? '✅' : '🗑️'}</span>
                    <span style={{
                      flex: 1, fontSize: 13, fontWeight: email.is_opp ? 500 : 400,
                      color: email.is_opp ? C.text : C.slate,
                    }}>{email.subject}</span>
                    {email.is_opp && email.type && (
                      <Badge color={TYPE_COLOR[email.type] || C.slate}>
                        {TYPE_LABEL[email.type] || email.type}
                      </Badge>
                    )}
                    {!email.is_opp && <Badge color={C.rose}>Noise</Badge>}
                    <span style={{
                      fontSize: 11, fontWeight: 600, minWidth: 34, textAlign: 'right',
                      color: email.is_opp ? C.emerald : C.rose,
                    }}>
                      {Math.round(email.confidence * 100)}%
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ── KPI Row ── */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
            {[
              { label: 'Emails Scanned',      value: kpis.scanned,   color: C.text,    icon: '📬', sub: 'total in batch' },
              { label: 'Opportunities Found',  value: kpis.found,    color: C.emerald,  icon: '🎯', sub: `${Math.round(kpis.found / kpis.scanned * 100)}% hit rate` },
              { label: 'Expiring ≤ 7 Days',   value: kpis.expiring,  color: C.rose,    icon: '⚠️', sub: 'act immediately' },
              { label: 'Avg Match Score',      value: kpis.avgScore,  color: C.indigo,  icon: '⭐', sub: 'out of 100' },
            ].map(({ label, value, color, icon, sub }) => (
              <div key={label} style={{ ...card, padding: '22px 24px' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ fontSize: 12, color: C.slate, marginBottom: 10, fontWeight: 500 }}>{label}</div>
                    <div style={{ fontSize: 44, fontWeight: 700, color, lineHeight: 1 }}>{value}</div>
                    <div style={{ fontSize: 11, color: C.slate, marginTop: 8 }}>{sub}</div>
                  </div>
                  <span style={{ fontSize: 26, opacity: 0.7 }}>{icon}</span>
                </div>
              </div>
            ))}
          </div>

          {/* ── Chart Row 1: Donut + HBar ── */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div style={card}>
              <SectionTitle>Opportunity Type Breakdown</SectionTitle>
              <ResponsiveContainer width="100%" height={270}>
                <PieChart>
                  <Pie data={donutData} cx="50%" cy="45%" innerRadius={72} outerRadius={112} paddingAngle={3} dataKey="value">
                    {donutData.map((entry, i) => <Cell key={i} fill={entry.color} stroke="none" />)}
                    <Label
                      content={({ viewBox }) => {
                        const { cx, cy } = viewBox;
                        return (
                          <g>
                            <text x={cx} y={cy - 6} textAnchor="middle" style={{ fontSize: 30, fontWeight: 700, fill: C.text }}>{opps.length}</text>
                            <text x={cx} y={cy + 16} textAnchor="middle" style={{ fontSize: 11, fill: C.slate }}>total</text>
                          </g>
                        );
                      }}
                      position="center"
                    />
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                  <Legend iconType="circle" iconSize={8}
                    formatter={(value, entry) => <span style={{ fontSize: 12, color: C.text }}>{value} ({entry.payload.value})</span>}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div style={card}>
              <SectionTitle sub="Bar color = deadline urgency">Top 6 Opportunities by Score</SectionTitle>
              <ResponsiveContainer width="100%" height={270}>
                <BarChart data={barData} layout="vertical" margin={{ left: 8, right: 44, top: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke={C.border} />
                  <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 10, fill: C.slate }} />
                  <YAxis type="category" dataKey="name" width={170} tick={{ fontSize: 11, fill: C.text }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="score" radius={[0, 6, 6, 0]}>
                    {barData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                    <LabelList dataKey="score" position="right" style={{ fontSize: 12, fontWeight: 700, fill: C.text }} />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* ── Chart Row 2: Radar + Area ── */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div style={card}>
              <SectionTitle sub={`${opps[0]?.title || 'Top opportunity'} — normalized %`}>
                Score Profile — Top Opportunity
              </SectionTitle>
              <ResponsiveContainer width="100%" height={260}>
                <RadarChart data={radarData} cx="50%" cy="50%" outerRadius={90}>
                  <PolarGrid stroke={C.border} />
                  <PolarAngleAxis dataKey="subject" tick={{ fontSize: 11, fill: C.text }} />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 9, fill: C.slate }} tickCount={4} />
                  <Radar name="Score %" dataKey="value" stroke={C.indigo} fill={C.indigo} fillOpacity={0.2} strokeWidth={2} dot={{ r: 3, fill: C.indigo }} />
                  <Tooltip content={<CustomTooltip />} formatter={v => [`${v}%`, 'Score']} />
                </RadarChart>
              </ResponsiveContainer>
            </div>

            <div style={card}>
              <SectionTitle sub="Cumulative opportunities due on or before each day">
                Deadline Timeline — Next 55 Days
              </SectionTitle>
              <ResponsiveContainer width="100%" height={260}>
                <AreaChart data={timelineData} margin={{ top: 10, right: 10, left: -16, bottom: 0 }}>
                  <defs>
                    <linearGradient id="indigoFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor={C.indigo} stopOpacity={0.15} />
                      <stop offset="95%" stopColor={C.indigo} stopOpacity={0.01} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
                  <XAxis
                    dataKey="day" type="number" domain={[0, 55]}
                    ticks={[0, 7, 14, 21, 28, 35, 42, 49]}
                    tickFormatter={v => v === 0 ? 'Today' : `+${v}d`}
                    tick={{ fontSize: 10, fill: C.slate }}
                  />
                  <YAxis tick={{ fontSize: 10, fill: C.slate }} allowDecimals={false} domain={[0, opps.length + 1]} />
                  <Tooltip
                    content={<CustomTooltip />}
                    labelFormatter={v => v === 0 ? 'Today' : `Day +${v}`}
                    formatter={v => [v, 'Due by this day']}
                  />
                  <ReferenceLine
                    x={0} stroke={C.rose} strokeDasharray="4 2"
                    label={{ value: 'Today', fill: C.rose, fontSize: 10, position: 'insideTopRight' }}
                  />
                  <Area
                    type="stepAfter" dataKey="count" name="Cumulative"
                    stroke={C.indigo} strokeWidth={2.5} fill="url(#indigoFill)"
                    dot={false} activeDot={{ r: 4, fill: C.indigo }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* ── Chart Row 3: Stacked Bar ── */}
          <div style={card}>
            <SectionTitle sub="Each bar = one opportunity, stacked by scoring dimension">
              Score Composition per Opportunity
            </SectionTitle>
            <ResponsiveContainer width="100%" height={230}>
              <BarChart data={stackedData} margin={{ top: 0, right: 20, left: -10, bottom: 55 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={C.border} vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 10.5, fill: C.text, angle: -32, textAnchor: 'end' }} interval={0} />
                <YAxis tick={{ fontSize: 10, fill: C.slate }} domain={[0, 100]} />
                <Tooltip content={<CustomTooltip />} />
                <Legend verticalAlign="top" height={32} iconType="circle" iconSize={8}
                  formatter={v => <span style={{ fontSize: 12, color: C.text }}>{v}</span>}
                />
                <Bar dataKey="urgency"      name="Urgency"       stackId="s" fill={C.rose}    />
                <Bar dataKey="profile"      name="Profile Match" stackId="s" fill={C.indigo}  />
                <Bar dataKey="eligibility"  name="Eligibility"   stackId="s" fill={C.emerald} />
                <Bar dataKey="completeness" name="Completeness"  stackId="s" fill={C.amber}   radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* ── Ranked Table ── */}
          <div style={card}>
            <SectionTitle>Ranked Opportunity List</SectionTitle>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ borderBottom: `2px solid ${C.border}` }}>
                    {['Rank', 'Title & Stipend', 'Organisation', 'Type', 'Deadline', 'Days Left', 'Score', 'Status'].map(h => (
                      <th key={h} style={{
                        padding: '8px 12px', textAlign: 'left',
                        color: C.slate, fontWeight: 600, fontSize: 11,
                        textTransform: 'uppercase', letterSpacing: '0.04em',
                      }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {opps.map((opp, i) => {
                    const dl         = getDaysLeft(opp.deadline);
                    const isSelected = selectedRow === opp.id;
                    const rowBg      = isSelected ? `${C.indigo}08` : i % 2 === 0 ? C.card : C.bg;
                    const status     = getEligStatus(opp);
                    const stipend    = opp.extracted_fields?.stipend_or_amount;
                    return (
                      <tr
                        key={opp.id}
                        onClick={() => setSelectedRow(isSelected ? null : opp.id)}
                        style={{ cursor: 'pointer', borderLeft: `3px solid ${isSelected ? C.indigo : 'transparent'}` }}
                      >
                        <td style={{ padding: '11px 12px', fontWeight: 700, color: C.slate, background: rowBg }}>#{i + 1}</td>
                        <td style={{ padding: '11px 12px', background: rowBg }}>
                          <div style={{ fontWeight: 600, color: C.text }}>{opp.title || '—'}</div>
                          <div style={{ fontSize: 11, color: stipend ? C.emerald : C.slate, marginTop: 3 }}>
                            {stipend ? `💰 ${stipend}` : 'No stipend listed'}
                          </div>
                        </td>
                        <td style={{ padding: '11px 12px', color: C.slate, background: rowBg }}>{opp.organization || '—'}</td>
                        <td style={{ padding: '11px 12px', background: rowBg }}>
                          {opp.opportunity_type && (
                            <Badge color={TYPE_COLOR[opp.opportunity_type] || C.slate}>
                              {TYPE_LABEL[opp.opportunity_type] || opp.opportunity_type}
                            </Badge>
                          )}
                        </td>
                        <td style={{ padding: '11px 12px', color: C.text, background: rowBg, whiteSpace: 'nowrap' }}>
                          {fmtDate(opp.deadline)}
                        </td>
                        <td style={{ padding: '11px 12px', background: rowBg }}>
                          <span style={{ fontWeight: 700, fontSize: 13, color: dl === null ? C.slate : urgencyColor(dl) }}>
                            {dl === null ? '—' : dl < 0 ? 'Expired' : `${dl}d`}
                          </span>
                        </td>
                        <td style={{ padding: '11px 12px', background: rowBg }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span style={{ fontWeight: 700, color: C.text, minWidth: 24 }}>{opp.total_score}</span>
                            <div style={{ background: C.border, borderRadius: 4, height: 5, width: 60 }}>
                              <div style={{
                                width: `${opp.total_score}%`, height: '100%', borderRadius: 4,
                                background: opp.total_score >= 75 ? C.emerald : opp.total_score >= 60 ? C.amber : C.rose,
                              }} />
                            </div>
                          </div>
                        </td>
                        <td style={{ padding: '11px 12px', background: rowBg }}>
                          {status === 'met'     && <Badge color={C.emerald}>✓ Eligible</Badge>}
                          {status === 'check'   && <Badge color={C.amber}>⚠ Check Reqs</Badge>}
                          {status === 'blocked' && <Badge color={C.rose}>✗ Blocked</Badge>}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Row detail panel */}
            {selectedOpp && (
              <div style={{
                marginTop: 16, padding: '18px 20px',
                background: `${C.indigo}06`, borderRadius: 12,
                border: `1px solid ${C.indigo}22`,
                display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20,
              }}>
                <div>
                  <div style={{ fontWeight: 700, color: C.indigo, marginBottom: 6, fontSize: 15 }}>
                    {selectedOpp.title}
                  </div>
                  <p style={{ fontSize: 13, color: C.text, lineHeight: 1.65, marginBottom: 12 }}>
                    {selectedOpp.why_relevant}
                  </p>
                  <div style={{ marginBottom: 10 }}>
                    <div style={{ fontSize: 11, fontWeight: 600, color: C.slate, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>Key Strengths</div>
                    {(selectedOpp.key_strengths || []).map((s, i) => (
                      <div key={i} style={{ fontSize: 12, color: C.emerald, marginBottom: 3 }}>✓ {s}</div>
                    ))}
                  </div>
                  {(selectedOpp.risks || []).length > 0 && (
                    <div>
                      <div style={{ fontSize: 11, fontWeight: 600, color: C.slate, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>Risks</div>
                      {selectedOpp.risks.map((r, i) => (
                        <div key={i} style={{ fontSize: 12, color: C.amber, marginBottom: 3 }}>⚠ {r}</div>
                      ))}
                    </div>
                  )}
                </div>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 600, color: C.slate, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>Next Steps</div>
                  {(selectedOpp.next_steps || []).map((s, i) => (
                    <div key={i} style={{ fontSize: 12, color: C.text, marginBottom: 4, paddingLeft: 16, position: 'relative' }}>
                      <span style={{ position: 'absolute', left: 0, color: C.indigo, fontWeight: 600 }}>{i + 1}.</span>
                      {s}
                    </div>
                  ))}
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 12 }}>
                    {(selectedOpp.extracted_fields?.eligibility_conditions || []).slice(0, 3).map((c, i) => (
                      <span key={i} style={{ fontSize: 11, background: C.border, color: C.text, borderRadius: 8, padding: '3px 8px' }}>{c}</span>
                    ))}
                  </div>
                  {selectedOpp.extracted_fields?.application_link && (
                    <a
                      href={selectedOpp.extracted_fields.application_link}
                      target="_blank"
                      rel="noreferrer"
                      style={{
                        display: 'inline-flex', alignItems: 'center', gap: 5,
                        marginTop: 14, fontSize: 13, fontWeight: 600,
                        color: C.card, background: C.indigo, borderRadius: 8,
                        padding: '7px 16px', textDecoration: 'none',
                      }}
                    >
                      Apply Now →
                    </a>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div style={{ textAlign: 'center', padding: '8px 0 20px', fontSize: 12, color: C.slate }}>
            SOFTEC 2026 · Opportunity Inbox Copilot · Multi-agent AI pipeline · gemini-2.5-flash + deterministic scoring
          </div>
        </>
      )}
    </div>
  );

  // ─── Main return ──────────────────────────────────────────────────────────

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600;9..40,700&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #f8f7f4; font-family: 'DM Sans', system-ui, sans-serif; color: #1e293b; }
        a { color: #4f46e5; }
        tr { transition: background 0.12s; }
        tr:hover td { background: #f0f0ff !important; }
        input:focus, textarea:focus, select:focus { border-color: #4f46e5 !important; box-shadow: 0 0 0 3px #4f46e512; }
        @keyframes ps-spin  { to { transform: rotate(360deg); } }
        @keyframes ps-pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.25; } }
      `}</style>

      {/* ── Sticky header — hidden on landing (landing has its own nav) ── */}
      {step !== 'landing' && step !== 'setup' && (
      <header style={{
        background: C.card, borderBottom: `1px solid ${C.border}`,
        padding: '0 32px', height: 60,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        position: 'sticky', top: 0, zIndex: 100,
      }}>
        {/* Left: app name */}
        <div
          style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: step === 'dashboard' ? 'pointer' : 'default' }}
          onClick={step === 'dashboard' ? resetToOnboard : undefined}
          title={step === 'dashboard' ? 'Back to onboarding' : undefined}
        >
          <span style={{ fontSize: 20 }}>🎓</span>
          <h1 style={{ ...serif, fontSize: 20, color: C.text }}>Opportunity Inbox Copilot</h1>
        </div>

        {/* Right: tabs + student info — only on dashboard */}
        {step === 'dashboard' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            {/* Tab nav */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              {[
                { id: 'dashboard', label: '📊 Dashboard' },
                { id: 'reply',     label: '✉️ Reply Suggester' },
                { id: 'calendar',  label: '📅 Calendar' },
                { id: 'discover',  label: '✨ Discover' },
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  style={{
                    padding: '6px 14px', borderRadius: 8, border: 'none', cursor: 'pointer',
                    fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 600,
                    background: activeTab === tab.id ? C.indigo : 'transparent',
                    color:      activeTab === tab.id ? '#fff'    : C.slate,
                    transition: 'all 0.15s',
                  }}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Student info */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 13, color: C.slate }}>
                {studentName || profile.degree} · Sem {profile.semester}
              </span>
              <Badge color={C.indigo}>CGPA {profile.cgpa}</Badge>
              <Badge color={profile.financial_need ? C.emerald : C.slate}>
                {profile.financial_need ? '💰 Need-Based' : 'Standard'}
              </Badge>
            </div>
          </div>
        )}

        {/* Processing header - minimal */}
        {step === 'processing' && (
          <span style={{ fontSize: 13, color: C.slate }}>Pipeline running…</span>
        )}
      </header>
      )}

      {/* ── Page content ── */}
      {step === 'landing'   && <LandingPage onGetStarted={() => setStep('setup')} />}
      {step === 'setup'     && <OnboardingForm onComplete={handleSetupComplete} />}
      {step === 'onboard'    && renderOnboarding()}
      {step === 'processing' && renderProcessing()}
      {step === 'dashboard' && activeTab === 'reply'      && <EmailReplySuggester />}
      {step === 'dashboard' && activeTab === 'calendar'   && <CalendarBlocker />}
      {step === 'dashboard' && activeTab === 'discover'   && <SisterOpportunityFinder />}
      {step === 'dashboard' && activeTab === 'dashboard'  && renderDashboard()}
    </>
  );
}
