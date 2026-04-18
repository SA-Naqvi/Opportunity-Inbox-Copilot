"""Full pipeline test — runs all 5 stages with sample data."""
import httpx
import json
import time

start = time.time()
print("Running full pipeline with sample data...")
print("=" * 60)

try:
    r = httpx.post(
        "http://127.0.0.1:8000/api/pipeline/sample",
        timeout=180.0,
    )
    elapsed = time.time() - start
    
    if r.status_code != 200:
        print(f"ERROR {r.status_code}: {r.text[:500]}")
    else:
        result = r.json()
        print(f"Pipeline completed in {elapsed:.1f}s")
        print(f"Total emails:    {result['total_emails']}")
        print(f"Rejected:        {result['rejected_count']}")
        print(f"Ranked:          {len(result['ranked'])}")
        print(f"Message:         {result['message']}")
        print()
        
        for opp in result["ranked"]:
            print(f"#{opp['rank']} | {opp['title']}")
            print(f"   Org:      {opp['organization']}")
            print(f"   Type:     {opp['opportunity_type']}")
            print(f"   Deadline: {opp['deadline']}  ({opp['deadline_urgency']})")
            print(f"   Score:    {opp['total_score']}/100")
            sb = opp["score_breakdown"]
            print(f"   Breakdown: U={sb['urgency']} PM={sb['profile_match']} E={sb['eligibility']} C={sb['completeness']}")
            if opp["eligibility_hard_block"]:
                print(f"   *** HARD BLOCKED ***")
            print(f"   Why:      {opp['why_relevant'][:120]}...")
            print(f"   Strengths: {opp['key_strengths'][:3]}")
            print(f"   Risks:     {opp['risks'][:2]}")
            print()
        
        # Save full result
        with open("pipeline_result.json", "w") as f:
            json.dump(result, f, indent=2)
        print(f"Full result saved to pipeline_result.json")
        
except Exception as e:
    print(f"Error: {e}")
