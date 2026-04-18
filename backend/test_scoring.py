"""Quick test of the scoring endpoint."""
import httpx

payload = {
    "opportunities": [{
        "id": "test_001",
        "title": "Google Summer Internship",
        "organization": "Google",
        "opportunity_type": "internship",
        "deadline": "2026-05-01",
        "eligibility_conditions": ["Must be enrolled in BS/BE program", "Minimum CGPA 3.0"],
        "required_documents": ["CV", "Transcript"],
        "stipend_or_amount": "3000 USD",
        "location": "Remote",
        "application_link": "https://google.com/apply",
        "contact_information": "hr@google.com",
        "duration": "3 months",
        "completeness_flags": [],
        "suspicious_flags": []
    }],
    "student_profile": {
        "degree": "BS Computer Science",
        "semester": 6,
        "cgpa": 3.4,
        "skills": ["Python", "Machine Learning", "React"],
        "interests": ["AI", "software engineering"],
        "preferred_opportunity_types": ["internship", "competition"],
        "financial_need": True,
        "location_preference": "Pakistan / Remote",
        "past_experience": ["ICPC 2024"]
    }
}

r = httpx.post("http://127.0.0.1:8000/api/score", json=payload)
result = r.json()
for s in result["scores"]:
    print(f"ID: {s['id']}")
    print(f"  Total Score: {s['total_score']}/100")
    print(f"  Urgency:     {s['score_breakdown']['urgency']}/30  ({s['urgency_label']})")
    print(f"  Profile:     {s['score_breakdown']['profile_match']}/35")
    print(f"  Eligibility: {s['score_breakdown']['eligibility']}/25")
    print(f"  Complete:    {s['score_breakdown']['completeness']}/10")
    print(f"  Hard Block:  {s['eligibility_hard_block']}")
