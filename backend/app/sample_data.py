"""
Sample data for testing the pipeline.

Includes a mix of:
  - Real opportunities (internship, scholarship, hackathon, fellowship, research)
  - Noise emails (newsletter, promo, spam)
"""

from .models import EmailInput, StudentProfile


DEFAULT_STUDENT_PROFILE = StudentProfile(
    degree="BS Computer Science",
    semester=6,
    cgpa=3.4,
    skills=["Python", "Machine Learning", "React", "TensorFlow", "SQL"],
    interests=["AI", "software engineering", "research", "web development"],
    preferred_opportunity_types=["internship", "competition", "fellowship"],
    financial_need=True,
    location_preference="Pakistan / Remote",
    past_experience=["ICPC 2024 participant", "web dev intern at TechCorp", "ML research assistant"],
)


SAMPLE_EMAILS: list[EmailInput] = [
    # ── REAL OPPORTUNITIES ──────────────────────────────────────────────

    EmailInput(
        id="email_001",
        subject="Google Summer of Code 2026 — Applications Now Open!",
        body=(
            "Dear Students,\n\n"
            "Google Summer of Code (GSoC) 2026 is now accepting applications! "
            "This is a global program that offers stipends to university students "
            "for contributing to open-source projects over the summer.\n\n"
            "Eligibility:\n"
            "- Must be enrolled in a university (BS or above)\n"
            "- Minimum CGPA of 2.5\n"
            "- Proficiency in at least one programming language\n\n"
            "Stipend: $3,000 for medium-size projects, $6,000 for large\n"
            "Duration: 12 weeks (June – August 2026)\n"
            "Deadline: April 30, 2026\n"
            "Location: Remote\n\n"
            "Apply here: https://summerofcode.withgoogle.com/\n"
            "Contact: gsoc-support@google.com\n\n"
            "Required documents: Resume/CV, project proposal\n\n"
            "Best regards,\nGoogle Open Source Team"
        ),
    ),
    EmailInput(
        id="email_002",
        subject="LUMS NatSci Research Fellowship — Summer 2026",
        body=(
            "The Lahore University of Management Sciences (LUMS) is pleased to announce "
            "the National Science Research Fellowship for Summer 2026.\n\n"
            "This fellowship is open to BS students in their 5th semester or above, "
            "enrolled in Computer Science, Physics, or Mathematics programs.\n\n"
            "Requirements:\n"
            "- CGPA >= 3.2\n"
            "- BS Computer Science, Physics, or Mathematics\n"
            "- At least one prior research experience\n\n"
            "Stipend: PKR 80,000/month\n"
            "Duration: 3 months\n"
            "Deadline: May 15, 2026\n"
            "Location: Lahore, Pakistan\n\n"
            "Apply at: https://lums.edu.pk/research-fellowship\n"
            "Required Documents: CV, Transcript, Research Statement, One recommendation letter\n"
            "Contact: fellowship@lums.edu.pk"
        ),
    ),
    EmailInput(
        id="email_003",
        subject="HackMIT 2026 — Registration Open",
        body=(
            "HackMIT 2026 is here! Join 1,000+ hackers from around the world "
            "for 36 hours of building, learning, and fun.\n\n"
            "Date: September 14-15, 2026\n"
            "Location: MIT Campus, Cambridge, MA (Travel reimbursements available)\n\n"
            "Who can apply: Any university student worldwide\n"
            "Registration deadline: June 30, 2026\n\n"
            "Prizes: $10,000+ in prizes across multiple tracks including AI/ML, "
            "Web3, and Social Impact.\n\n"
            "Register: https://hackmit.org/register\n"
            "Contact: team@hackmit.org\n\n"
            "Required: Just bring your laptop and creativity!"
        ),
    ),
    EmailInput(
        id="email_004",
        subject="Microsoft Explore Internship — Pakistan 2026",
        body=(
            "Microsoft is hiring Explore Interns for Summer 2026 in Islamabad!\n\n"
            "The Explore Internship is designed for first and second-year "
            "university students. You'll rotate through software engineering "
            "and program management roles.\n\n"
            "Requirements:\n"
            "- Currently in 1st or 2nd year of BS degree\n"
            "- Pursuing Computer Science or related field\n"
            "- Strong problem-solving skills\n\n"
            "Stipend: Competitive (details upon offer)\n"
            "Duration: 12 weeks\n"
            "Deadline: in 3 weeks\n"
            "Location: Islamabad, Pakistan\n\n"
            "Apply: https://careers.microsoft.com/explore-pakistan\n"
            "Required documents: CV, Cover letter\n"
            "Contact: unirecruiting@microsoft.com"
        ),
    ),
    EmailInput(
        id="email_005",
        subject="Fulbright Scholarship 2026-2027 — Pakistan",
        body=(
            "The United States Educational Foundation in Pakistan (USEFP) invites "
            "applications for the Fulbright Scholarship 2026-2027.\n\n"
            "This scholarship covers tuition, living expenses, airfare, and health "
            "insurance for Master's or PhD study in the United States.\n\n"
            "Eligibility:\n"
            "- Pakistani citizen\n"
            "- Bachelor's degree completed with minimum CGPA 3.0\n"
            "- At least 2 years of work/research experience preferred\n"
            "- Strong English proficiency (TOEFL/IELTS required)\n\n"
            "Deadline: May 25, 2026\n"
            "Location: United States\n\n"
            "Apply at: https://www.usefp.org/fulbright\n"
            "Required Documents: Transcripts, CV, 3 recommendation letters, "
            "Statement of Purpose, TOEFL/IELTS scores\n"
            "Contact: info@usefp.org"
        ),
    ),

    # ── NOISE EMAILS (should be rejected) ────────────────────────────────

    EmailInput(
        id="email_006",
        subject="Weekly Campus Digest — April 2026",
        body=(
            "Here's what happened on campus this week:\n\n"
            "- The library extended hours for finals season\n"
            "- New menu items at the cafeteria\n"
            "- Sports day recap: CS department won the cricket tournament!\n"
            "- Reminder: Summer break starts June 1\n\n"
            "Stay tuned for next week's digest!"
        ),
    ),
    EmailInput(
        id="email_007",
        subject="50% OFF on Premium Coding Courses — Limited Time!",
        body=(
            "🎉 MEGA SALE! Get 50% off all premium coding courses at LearnCode Academy!\n\n"
            "Master Python, JavaScript, React, and more with our expert-led courses.\n"
            "Use code STUDENT50 at checkout.\n\n"
            "This offer expires April 25, 2026.\n"
            "Visit: https://learncode.academy/sale\n\n"
            "Unsubscribe: https://learncode.academy/unsub"
        ),
    ),
    EmailInput(
        id="email_008",
        subject="Exciting Things Coming Soon to CompSci Department!",
        body=(
            "Dear Students,\n\n"
            "We have some exciting announcements coming your way soon. "
            "Stay tuned for more details about upcoming department initiatives "
            "and events.\n\n"
            "The CS Department faculty is working hard to bring you amazing "
            "opportunities for growth and learning.\n\n"
            "More details will be shared next month.\n\n"
            "Regards,\nCS Department Admin"
        ),
    ),
]
