"""Eval harness — run before any prompt, model, or chain change.

Usage (from backend/):
    python -m app.evals.harness

Exit code 0 = pass, 1 = regression vs. baseline.
"""
import json
import sys
from datetime import datetime, timezone
from pathlib import Path

from app.evals.fixtures import FIXTURES, VERSION
from app.chains.flashcard_chain import generate_flashcards
from app.chains.quiz_chain import generate_quiz
from app.chains.judge_chain import judge_answer

RESULTS_DIR = Path(__file__).parent / "results"


def _validate_flashcards(cards: list[dict], criteria: dict) -> tuple[bool, str]:
    if len(cards) < criteria.get("min_count", 1):
        return False, f"only {len(cards)} cards generated"
    for field in criteria.get("schema_required", []):
        if not all(field in c for c in cards):
            return False, f"missing field '{field}'"
    all_text = " ".join(f"{c.get('question','')} {c.get('answer','')}" for c in cards).lower()
    for concept in criteria.get("required_concepts", []):
        if concept.lower() not in all_text:
            return False, f"required concept '{concept}' not found in output"
    return True, "ok"


def _validate_quiz(questions: list[dict], criteria: dict) -> tuple[bool, str]:
    if len(questions) < criteria.get("min_count", 1):
        return False, f"only {len(questions)} questions generated"
    for field in criteria.get("schema_required", []):
        if not all(field in q for q in questions):
            return False, f"missing field '{field}'"
    n = criteria.get("options_count")
    if n and not all(len(q.get("options", [])) == n for q in questions):
        return False, f"not all questions have {n} options"
    return True, "ok"


def run() -> dict:
    results: dict = {
        "version": VERSION,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "cases": [],
        "summary": {},
    }
    passed = 0

    for fixture in FIXTURES:
        case: dict = {"id": fixture["id"], "type": fixture["type"], "passed": False, "detail": ""}

        if fixture["type"] == "flashcards":
            cards = generate_flashcards([fixture["note_content"]])
            ok, msg = _validate_flashcards(cards, fixture["criteria"])
            case["passed"], case["detail"] = ok, msg
            case["sample"] = cards[0] if cards else {}

        elif fixture["type"] == "quiz":
            questions = generate_quiz([fixture["note_content"]])
            ok, msg = _validate_quiz(questions, fixture["criteria"])
            case["passed"], case["detail"] = ok, msg
            case["count"] = len(questions)

        elif fixture["type"] == "judge":
            all_pass = True
            details = []
            for c in fixture["cases"]:
                result = judge_answer(c["question"], c["reference"], c["answer"])
                score = result["score"]
                ok = True
                if "expected_score_min" in c and score < c["expected_score_min"]:
                    ok = False
                if "expected_score_max" in c and score > c["expected_score_max"]:
                    ok = False
                details.append({"score": score, "pass": ok})
                if not ok:
                    all_pass = False
            case["passed"] = all_pass
            case["detail"] = details

        if case["passed"]:
            passed += 1
        results["cases"].append(case)

    total = len(FIXTURES)
    results["summary"] = {
        "passed": passed,
        "total": total,
        "pass_rate": round(passed / total, 2) if total else 0,
    }
    return results


def main() -> None:
    print(f"Running eval harness (fixture version {VERSION})...")
    results = run()

    for case in results["cases"]:
        status = "PASS" if case["passed"] else "FAIL"
        print(f"  [{status}] {case['id']}: {case.get('detail', '')}")

    summary = results["summary"]
    print(f"\n{summary['passed']}/{summary['total']} passed ({summary['pass_rate']:.0%})")

    RESULTS_DIR.mkdir(exist_ok=True)
    baseline = RESULTS_DIR / "baseline.json"

    if baseline.exists():
        with open(baseline) as f:
            prior = json.load(f)
        prior_rate = prior["summary"]["pass_rate"]
        current_rate = summary["pass_rate"]
        if current_rate < prior_rate:
            print(f"\nREGRESSION: pass rate dropped {prior_rate:.0%} → {current_rate:.0%}")
            sys.exit(1)
        print(f"\nNo regression (baseline {prior_rate:.0%} → current {current_rate:.0%})")
        # Update baseline if we improved
        if current_rate > prior_rate:
            with open(baseline, "w") as f:
                json.dump(results, f, indent=2)
            print("Baseline updated.")
    else:
        with open(baseline, "w") as f:
            json.dump(results, f, indent=2)
        print(f"Baseline written to {baseline}")


if __name__ == "__main__":
    main()
