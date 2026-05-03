import time
from datetime import datetime, timedelta, timezone
from sqlalchemy.orm import Session
from app.models.flashcard import Flashcard
from app.models.review import Review
from app.chains.judge_chain import judge_answer
from app.services.tracking.performance_service import update_performance


def _sm2(ease_factor: float, interval_days: int, score: float) -> tuple[float, int]:
    q = round(score * 5)
    if q < 3:
        interval_days = 1
        ease_factor = max(1.3, ease_factor - 0.2)
    else:
        if interval_days == 0:
            interval_days = 1
        elif interval_days == 1:
            interval_days = 6
        else:
            interval_days = round(interval_days * ease_factor)
        ease_factor = max(1.3, ease_factor + 0.1 - (5 - q) * (0.08 + (5 - q) * 0.02))
    return ease_factor, interval_days


def evaluate_answer(db: Session, flashcard: Flashcard, student_answer: str) -> tuple[Review, dict]:
    t0 = time.monotonic()
    result = judge_answer(flashcard.question, flashcard.answer, student_answer)
    latency_ms = int((time.monotonic() - t0) * 1000)

    review = Review(
        user_id=flashcard.user_id,
        item_id=flashcard.id,
        item_type="flashcard",
        topic_id=flashcard.topic_id,
        score=result["score"],
        judge_reasoning=result["reasoning"],
        latency_ms=latency_ms,
        answered_at=datetime.now(timezone.utc),
    )
    db.add(review)

    new_ease, new_interval = _sm2(flashcard.ease_factor, flashcard.interval_days, result["score"])
    flashcard.ease_factor = new_ease
    flashcard.interval_days = new_interval
    flashcard.due_at = datetime.now(timezone.utc) + timedelta(days=new_interval)
    db.flush()

    update_performance(db, flashcard.user_id, flashcard.topic_id)
    db.commit()
    db.refresh(review)
    return review, result
