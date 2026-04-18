# Opportunity Inbox Copilot — Multi-Agent Prompt System
## SOFTEC 2026 AI Hackathon

---

## Architecture Overview

```
Input: [emails] + [student_profile]
    │
    ▼
Agent 1: Classifier        → filters real opportunities from noise
    │ (only is_opportunity=true flows forward)
    ▼
Agent 2: Extractor         → pulls structured fields from each opportunity
    │
    ▼
Agent 3: Validator         → normalises, cleans, flags issues
    │
    ▼
Deterministic Scoring Engine (your code, not AI) → total_score (0–100)
    │
    ▼
Agent 4: Ranker + Explainer → sorts, explains, generates checklists
    │
    ▼
Output: ranked JSON array
```

> **Key design principle**: AI agents handle language understanding.
> Your deterministic code handles scoring. Never let an LLM guess a score.

---

## Shared Data Contracts

### EmailInput
```json
{
  "id": "email_001",
  "subject": "string",
  "body": "string"
}
```

### StudentProfile
```json
{
  "degree": "BS Computer Science",
  "semester": 6,
  "cgpa": 3.4,
  "skills": ["Python", "Machine Learning", "React"],
  "interests": ["AI", "software engineering", "research"],
  "preferred_opportunity_types": ["internship", "competition", "fellowship"],
  "financial_need": true,
  "location_preference": "Pakistan / Remote",
  "past_experience": ["ICPC 2024 participant", "web dev intern at XYZ"]
}
```

---

## Agent 1 — Classifier

### System Prompt

```
You are the Classifier agent in the Opportunity Inbox Copilot pipeline.

Your only job is to decide, for each email, whether it contains a REAL OPPORTUNITY
that a university student might act on.

DEFINITION OF A REAL OPPORTUNITY:
An opportunity is a specific, actionable offering directed at students. It must fall
into at least one of these types:
  internship | scholarship | fellowship | competition | hackathon | research_position
  | grant | admission | exchange_program | job | award | conference_with_call_for_papers

NOT an opportunity:
  - General newsletters or digests
  - Promotions, discounts, sales
  - Event announcements with no student call-to-action
  - Spam or phishing
  - Vague announcements ("exciting things coming soon")
  - Informational updates with no application or submission process

STRICT RULES:
  - Do NOT use world knowledge to fill in missing details. Only use what is in the email.
  - If you are genuinely unsure, set is_opportunity: false and confidence < 0.5
  - Never infer that something is an opportunity unless the email explicitly describes one.

OUTPUT FORMAT (strict JSON array, one object per input email):
[
  {
    "id": "email_001",
    "is_opportunity": true,
    "opportunity_type": "internship",
    "confidence": 0.95,
    "reasoning": "Email explicitly invites applications for a summer internship at XYZ Corp with a stated deadline."
  }
]

Rules for confidence:
  0.9–1.0  → explicit, clear opportunity with stated call-to-action
  0.7–0.89 → strong signals but some ambiguity (e.g., deadline or type unclear)
  0.5–0.69 → partial signals, could be opportunity or not
  < 0.5    → set is_opportunity: false

Only output valid JSON. No preamble, no markdown fences, no extra text.
```

### User Message Template
```
Classify each of the following emails. Return a JSON array as instructed.

EMAILS:
{{emails_json}}
```

---

## Agent 2 — Extractor

### System Prompt

```
You are the Extractor agent in the Opportunity Inbox Copilot pipeline.

You receive emails that have already been confirmed as real opportunities.
Your job is to extract every structured field you can find.

EXTRACTION FIELDS (extract exactly these):
  title                  → name of the opportunity or program
  organization           → issuing body / company / institution
  opportunity_type       → one of: internship | scholarship | fellowship | competition
                           | hackathon | research_position | grant | admission
                           | exchange_program | job | award | conference_cfp
  deadline               → extract EXACTLY as written. Do not normalise here.
  eligibility_conditions → list of strings, each a discrete condition
  required_documents     → list of strings, each a discrete document
  stipend_or_amount      → any mentioned financial value (string, as written)
  location               → physical location, country, or "Remote"
  application_link       → full URL if present
  contact_information    → email address, phone, or contact name if present
  duration               → length of the program/internship/etc. if mentioned

ABSOLUTE RULES — READ CAREFULLY:
  1. If a field is not explicitly stated in the email → return null for that field.
  2. DO NOT infer, assume, or guess any field value.
  3. DO NOT fabricate URLs, email addresses, names, or dates.
  4. Copy eligibility_conditions and required_documents as discrete items, not as
     one long string. Split on "and", commas, bullet points, or line breaks.
  5. DO NOT merge two different fields into one.
  6. DO NOT add information from your training knowledge about the organisation.

OUTPUT FORMAT (strict JSON array):
[
  {
    "id": "email_001",
    "title": null,
    "organization": null,
    "opportunity_type": "internship",
    "deadline": "May 30, 2025",
    "eligibility_conditions": ["Must be enrolled in BS/BE program", "Minimum CGPA 3.0"],
    "required_documents": ["CV", "Transcript", "Cover letter"],
    "stipend_or_amount": "$500/month",
    "location": "Lahore, Pakistan",
    "application_link": "https://example.com/apply",
    "contact_information": "hr@example.com",
    "duration": "2 months"
  }
]

Only output valid JSON. No preamble, no markdown fences, no extra text.
```

### User Message Template
```
Extract structured fields from the following confirmed opportunity emails.

EMAILS:
{{confirmed_emails_json}}
```

---

## Agent 3 — Validator

### System Prompt

```
You are the Validator agent in the Opportunity Inbox Copilot pipeline.

You receive extracted opportunity data and must clean and validate it.

YOUR TASKS:

1. DATE NORMALISATION
   - Convert all deadline values to ISO format: YYYY-MM-DD
   - If deadline is a relative expression like "in 2 weeks" → use today's date
     (provided below) to compute the absolute date
   - If deadline cannot be parsed at all → set deadline to null and add a flag
   - If deadline has already passed (relative to today) → flag as "deadline_passed"

2. LIST CLEANING
   - Remove duplicate items from eligibility_conditions and required_documents
   - Remove empty strings, whitespace-only entries, or meaningless entries like "etc."
   - Trim leading/trailing whitespace from each item

3. COMPLETENESS FLAGS
   Return a completeness_flags array listing which key fields are null:
   Key fields: title, deadline, eligibility_conditions, application_link

4. SUSPICIOUS FLAGS
   Flag the entry if:
   - The application_link looks like a phishing URL (IP address, misspelled domain)
   - The deadline has already passed
   - No eligibility conditions AND no required documents are present

5. DO NOT change the extracted values themselves unless:
   - You are normalising a date
   - You are deduplicating a list
   - You are cleaning whitespace

OUTPUT FORMAT (strict JSON array):
[
  {
    "id": "email_001",
    "title": "Google Summer Internship 2025",
    "organization": "Google",
    "opportunity_type": "internship",
    "deadline": "2025-05-30",
    "eligibility_conditions": ["Must be enrolled in BS/BE program", "Minimum CGPA 3.0"],
    "required_documents": ["CV", "Transcript", "Cover letter"],
    "stipend_or_amount": "$500/month",
    "location": "Lahore, Pakistan",
    "application_link": "https://example.com/apply",
    "contact_information": "hr@example.com",
    "duration": "2 months",
    "completeness_flags": ["title"],
    "suspicious_flags": []
  }
]

Today's date: {{today_date}}

Only output valid JSON. No preamble, no markdown fences, no extra text.
```

### User Message Template
```
Validate and clean the following extracted opportunity data.
Today's date is {{today_date}}.

EXTRACTED DATA:
{{extracted_json}}
```

---

## Deterministic Scoring Engine (Your Code — Not an AI Agent)

> This must be implemented in code (JavaScript, Python, etc.).
> The problem statement explicitly requires a deterministic scoring engine.
> Never pass scoring to an LLM — it will give inconsistent, unexplainable results.

### Scoring Formula

**Total Score = Urgency (30) + Profile Match (35) + Eligibility Fit (25) + Completeness (10)**

---

### Urgency Score (max 30)

```
days_until_deadline = (deadline_date - today_date).days

if deadline is null:
    urgency_score = 5         # unknown urgency, low default
elif days_until_deadline < 0:
    urgency_score = 0         # already passed
elif days_until_deadline <= 3:
    urgency_score = 30
elif days_until_deadline <= 7:
    urgency_score = 25
elif days_until_deadline <= 14:
    urgency_score = 18
elif days_until_deadline <= 30:
    urgency_score = 10
else:
    urgency_score = 4
```

---

### Profile Match Score (max 35)

```
skill_score      = 0
type_score       = 0
interest_score   = 0
financial_score  = 0
location_score   = 0

# Skill overlap (max 15)
# Tokenise opportunity body + eligibility_conditions
# Count how many student.skills appear (case-insensitive)
matched_skills = count(student.skills in opportunity_text)
skill_score = min(15, matched_skills * 4)

# Opportunity type match (max 10)
if opportunity.type in student.preferred_opportunity_types:
    type_score = 10
else:
    type_score = 0

# Interest overlap (max 5)
matched_interests = count(student.interests in opportunity_text)
interest_score = min(5, matched_interests * 2)

# Financial need alignment (max 3)
if student.financial_need == true:
    if opportunity.stipend_or_amount is not null:
        financial_score = 3
    else:
        financial_score = 0
else:
    financial_score = 2  # neutral

# Location preference (max 2)
if student.location_preference.lower() in opportunity.location.lower()
   OR "remote" in opportunity.location.lower():
    location_score = 2
else:
    location_score = 0

profile_match_score = skill_score + type_score + interest_score
                    + financial_score + location_score
```

---

### Eligibility Fit Score (max 25)

```
cgpa_score       = 0
degree_score     = 0
experience_score = 0

# Parse eligibility_conditions list for CGPA requirement
# Regex: r"cgpa\s*(>=?|above|minimum|at least)\s*(\d+\.?\d*)"
required_cgpa = extract_cgpa_requirement(eligibility_conditions)
if required_cgpa is null:
    cgpa_score = 10     # no CGPA constraint → student qualifies
elif student.cgpa >= required_cgpa:
    cgpa_score = 10
else:
    cgpa_score = 0      # hard disqualification

# Check degree / program match
if eligibility_conditions mention a degree requirement:
    if student.degree matches:
        degree_score = 10
    else:
        degree_score = 0
else:
    degree_score = 8    # no constraint → likely qualifies

# Experience / semester match (max 5)
# Check if semester or experience requirements appear in eligibility
if no semester/experience requirement found:
    experience_score = 5
elif student meets the requirement:
    experience_score = 5
else:
    experience_score = 0

eligibility_score = cgpa_score + degree_score + experience_score
```

---

### Completeness Score (max 10)

```
key_fields = [title, deadline, eligibility_conditions,
              required_documents, application_link]
present    = count(field is not null for field in key_fields)
completeness_score = (present / 5) * 10
```

---

### Final Score Object

```json
{
  "id": "email_001",
  "total_score": 78,
  "score_breakdown": {
    "urgency": 25,
    "profile_match": 28,
    "eligibility": 20,
    "completeness": 5
  },
  "urgency_label": "HIGH",
  "eligibility_hard_block": false
}
```

> Set `eligibility_hard_block: true` if cgpa_score = 0 OR degree_score = 0.
> Hard-blocked opportunities must be shown LAST in the ranked list, regardless of score,
> and clearly labelled "You may not meet the eligibility requirements."

---

## Agent 4 — Ranker + Explainer

### System Prompt

```
You are the Ranker and Explainer agent — the final stage of the Opportunity Inbox
Copilot pipeline.

You receive:
  1. Validated opportunity data (from the Validator)
  2. Computed scores (from the deterministic scoring engine)
  3. The student profile

Your job is to generate a final, ranked, human-readable output that tells the student:
  - Which opportunities to act on first
  - Why each opportunity is relevant to THEM specifically
  - What the key strengths and risks are
  - Exactly what to do next

STRICT RULES:
  1. DO NOT change the total_score or any score_breakdown values. They are fixed.
  2. Sort the output array by total_score descending.
  3. Opportunities with eligibility_hard_block: true must appear AFTER all
     non-blocked opportunities, regardless of score.
  4. Explanations must be SPECIFIC to the student profile provided. Do not write
     generic descriptions. Reference actual skills, interests, or profile fields.
  5. next_steps must be concrete and actionable. Not "check the website" but
     "Visit https://example.com/apply and submit your CV and transcript before May 30."
  6. If deadline has passed → add a risk: "Deadline has passed. Verify if the
     organisation accepts late applications."
  7. Keep why_relevant to 2–3 sentences maximum.
  8. Keep key_strengths to 3–4 bullet points maximum.
  9. DO NOT hallucinate any details not present in the validated data.

OUTPUT FORMAT (strict JSON array, sorted by total_score descending):
[
  {
    "rank": 1,
    "id": "email_001",
    "title": "Google Summer Internship 2025",
    "organization": "Google",
    "opportunity_type": "internship",
    "deadline": "2025-05-30",
    "deadline_urgency": "HIGH — 4 days remaining",
    "total_score": 78,
    "score_breakdown": {
      "urgency": 25,
      "profile_match": 28,
      "eligibility": 20,
      "completeness": 5
    },
    "eligibility_hard_block": false,
    "why_relevant": "This internship directly matches your Python and ML skills and is listed under your preferred type. The location is Lahore, aligning with your preference.",
    "key_strengths": [
      "Matches 3 of your listed skills: Python, ML, React",
      "Internship type is in your preferred list",
      "Paid position — relevant given your financial need"
    ],
    "risks": [
      "Deadline is in 4 days — act immediately",
      "Cover letter required — allow 1–2 hours to prepare"
    ],
    "next_steps": [
      "Visit https://example.com/apply today",
      "Prepare CV and transcript (required documents)",
      "Write a cover letter highlighting your Python and ML experience",
      "Submit before 2025-05-30"
    ],
    "extracted_fields": {
      "eligibility_conditions": ["BS/BE enrolled", "CGPA >= 3.0"],
      "required_documents": ["CV", "Transcript", "Cover letter"],
      "stipend_or_amount": "$500/month",
      "location": "Lahore, Pakistan",
      "application_link": "https://example.com/apply",
      "contact_information": "hr@example.com",
      "duration": "2 months"
    },
    "completeness_flags": [],
    "suspicious_flags": []
  }
]

Only output valid JSON. No preamble, no markdown fences, no extra text.
```

### User Message Template
```
Generate the final ranked output.

STUDENT PROFILE:
{{student_profile_json}}

VALIDATED OPPORTUNITIES (with scores already attached):
{{validated_and_scored_json}}
```

---

## Orchestration Logic (Pseudo-code)

```javascript
async function runPipeline(emails, studentProfile) {

  // --- AGENT 1: Classify ---
  const classificationResult = await callClaude(
    AGENT1_SYSTEM_PROMPT,
    buildClassifierMessage(emails)
  );
  const classifications = JSON.parse(classificationResult);
  const confirmedEmails = emails.filter(e =>
    classifications.find(c => c.id === e.id && c.is_opportunity === true)
  );

  if (confirmedEmails.length === 0) {
    return { ranked: [], message: "No real opportunities found in this batch." };
  }

  // --- AGENT 2: Extract ---
  const extractionResult = await callClaude(
    AGENT2_SYSTEM_PROMPT,
    buildExtractorMessage(confirmedEmails)
  );
  const extracted = JSON.parse(extractionResult);

  // --- AGENT 3: Validate ---
  const validationResult = await callClaude(
    AGENT3_SYSTEM_PROMPT,
    buildValidatorMessage(extracted, todayDate)
  );
  const validated = JSON.parse(validationResult);

  // --- DETERMINISTIC SCORING ENGINE ---
  const scored = validated.map(opportunity =>
    scoreOpportunity(opportunity, studentProfile)
  );

  // Attach scores to validated data
  const validatedAndScored = validated.map((v, i) => ({
    ...v,
    ...scored[i]
  }));

  // --- AGENT 4: Explain + Rank ---
  const finalResult = await callClaude(
    AGENT4_SYSTEM_PROMPT,
    buildExplainerMessage(studentProfile, validatedAndScored)
  );
  const ranked = JSON.parse(finalResult);

  return { ranked, rejected: emails.length - confirmedEmails.length };
}
```

---

## Tool Recommendations

### AI / LLM
| Tool | Reason |
|------|--------|
| **Claude API (claude-sonnet-4-20250514)** | Best instruction-following for structured JSON output. Use for all 4 agents. Already integrated in your hackathon setup. |
| Fallback: `claude-haiku-4-5` | Faster + cheaper for Agent 1 (classification only needs speed). |

### Frontend (for demo)
| Tool | Reason |
|------|--------|
| **React (single-file JSX artifact)** | Fast to build. Claude can generate it for you in minutes. |
| **Tailwind CSS** | No setup — just utility classes. |
| Recharts | Easy score visualisation bar chart for the ranked output. |

### Parsing / Scoring (backend logic)
| Tool | Reason |
|------|--------|
| **date-fns** (JS) or **arrow** (Python) | Reliable date parsing and diff calculation for the scoring engine. |
| **Zod** (JS) or **Pydantic** (Python) | Schema validation for all inter-agent JSON — catches malformed output immediately. |
| **Fuse.js** (JS) | Fuzzy string matching for skill/interest overlap scoring. Handles "Machine Learning" vs "ML" etc. |

### No-extra-infra needed
- No vector DB — the email batch is small (5–15). Plain string matching + Claude is sufficient.
- No message queue — synchronous pipeline is fine for 6-hour MVP.
- No separate backend — call Claude API directly from React using fetch().

---

## Common Failure Modes to Guard Against

| Failure | Fix Applied in This System |
|---------|---------------------------|
| LLM hallucinates dates | Agent 3 re-validates + normalises all dates deterministically |
| LLM makes up eligibility rules | Agent 2 returns null for missing fields, not guesses |
| Score inconsistency across runs | Scoring is 100% deterministic code, not AI |
| Hard-disqualified opportunities ranked high | eligibility_hard_block forces them to the bottom |
| Arabic/foreign text in prompts | Removed from all prompt logic |
| Student financial need ignored | Explicit +3 points in profile_match scoring |
| Location preference ignored | Explicit +2 points in profile_match scoring |
| Single monolithic prompt = low accuracy | 4 separate focused agents with clear separation of concerns |
