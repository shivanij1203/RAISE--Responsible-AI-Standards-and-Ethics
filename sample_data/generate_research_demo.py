"""Generate a synthetic interview-excerpt CSV for the RAISE research demo.

Models de-identified qualitative data where a few identifiers slipped
through: a handful of excerpts still contain an email address or phone
number that the personal-identifier scan should flag. A few also mention a
made-up first and last name in prose, which a pattern scan can miss. That is
deliberate: it shows why the person still has to review the data.

All names are invented, emails use the reserved .invalid TLD (RFC 2606), and
phones use the reserved 555-01xx range (NANP).

Output: research_sample.csv in the same directory by default.
  python generate_research_demo.py --out ../frontend/public/samples/research_sample.csv
"""
import argparse
import csv
import random
from pathlib import Path

random.seed(7)

QUESTIONS = [
    "How do you use generative AI in your coursework?",
    "When do you decide not to use AI for an assignment?",
    "How do your instructors talk about AI use?",
    "What worries you about AI in your classes?",
]

CLEAN_EXCERPTS = [
    "I mostly use it to explain concepts I missed in lecture, then I check the textbook.",
    "For writing I ask it to point out unclear sentences, but I rewrite them myself.",
    "Some professors say it's fine for brainstorming and not for the final draft.",
    "I worry that I'm getting answers without really learning how to get there.",
    "If the assignment is about my own opinion, I don't see the point of using it.",
    "Group projects get messy because everyone has a different idea of what's allowed.",
    "I used it to make practice quiz questions before the midterm.",
    "Honestly it's faster than office hours when I'm stuck late at night.",
    "Our syllabus has a paragraph about AI but nobody really reads it.",
    "I stopped using it for code after it gave me something that ran but was wrong.",
    "I like that it doesn't judge me for asking basic questions.",
    "My friends compare outputs to see whose prompt worked better.",
    "I'm not sure whether using it for outlines counts as cheating.",
    "In labs we are told to cite it like any other source.",
    "It helps me translate readings when English terms are confusing.",
    "I trust it less for statistics because the numbers are sometimes off.",
]

# Identifiers that slipped through de-identification. Emails and phone
# numbers match the scanner's patterns; names in prose usually do not.
LEAKED_EXCERPTS = [
    "You can follow up with me at jordan.ellis@example.invalid if you need more.",
    "My study group texts at (813) 555-0142 when someone finds a good prompt.",
    "Professor Reyes said to email maya.okafor@example.invalid with questions about AI rules.",
    "My roommate Priya Nandakumar uses it way more than I do.",
    "Call me at (813) 555-0187, I can explain how our lab handles it.",
]


def main(out_path: Path | None = None) -> None:
    out_path = out_path or Path(__file__).parent / "research_sample.csv"
    excerpts = CLEAN_EXCERPTS + LEAKED_EXCERPTS
    random.shuffle(excerpts)

    rows = []
    for i, excerpt in enumerate(excerpts, start=1):
        rows.append({
            "participant_id": f"P{i:03d}",
            "interview_round": random.choice(["Spring 2026", "Fall 2025"]),
            "question": random.choice(QUESTIONS),
            "excerpt": excerpt,
        })

    with out_path.open("w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=list(rows[0].keys()))
        writer.writeheader()
        writer.writerows(rows)

    print(f"Wrote {len(rows)} rows to {out_path} ({len(LEAKED_EXCERPTS)} with leaked identifiers)")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument("--out", type=Path, default=None)
    main(parser.parse_args().out)
