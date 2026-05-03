import uuid
from datetime import datetime, timezone
from sqlalchemy.orm import Session
from app.models.performance import Performance
from app.models.review import Review

_ROLLING_WINDOW = 20


def update_performance(db: Session, user_id: uuid.UUID, topic_id: uuid.UUID | None) -> None:
    """Recompute rolling accuracy for (user, topic) from the last 20 reviews and upsert Performance."""
    if topic_id is None:
        return

    scores = [
        r.score
        for r in db.query(Review.score)
        .filter(Review.user_id == user_id, Review.topic_id == topic_id)
        .order_by(Review.answered_at.desc())
        .limit(_ROLLING_WINDOW)
        .all()
    ]
    if not scores:
        return

    accuracy = sum(scores) / len(scores)
    now = datetime.now(timezone.utc)

    perf = db.query(Performance).filter(
        Performance.user_id == user_id, Performance.topic_id == topic_id
    ).first()

    if perf is None:
        db.add(Performance(
            user_id=user_id, topic_id=topic_id,
            accuracy=accuracy, attempts=len(scores), last_reviewed_at=now,
        ))
    else:
        perf.accuracy = accuracy
        perf.attempts = len(scores)
        perf.last_reviewed_at = now

    db.flush()


def get_weak_topics(db: Session, user_id: uuid.UUID, threshold: float = 0.6) -> list[Performance]:
    return (
        db.query(Performance)
        .filter(Performance.user_id == user_id, Performance.accuracy < threshold)
        .order_by(Performance.accuracy.asc())
        .all()
    )
