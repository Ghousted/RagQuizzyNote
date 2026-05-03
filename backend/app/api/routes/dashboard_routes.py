from datetime import datetime, timezone
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.models.note import Note
from app.models.flashcard import Flashcard
from app.models.review import Review
from app.models.topic import Topic
from app.schemas.dashboard import DashboardStats, WeakTopic, DueCard
from app.services.tracking.performance_service import get_weak_topics

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


@router.get("", response_model=DashboardStats)
def get_dashboard(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    uid = current_user.id
    now = datetime.now(timezone.utc)

    notes = db.query(Note).filter(Note.user_id == uid).count()
    flashcards = db.query(Flashcard).filter(Flashcard.user_id == uid).count()
    reviews = db.query(Review).filter(Review.user_id == uid).count()
    due = db.query(Flashcard).filter(Flashcard.user_id == uid, Flashcard.due_at <= now).count()

    recent = [
        r.score for r in
        db.query(Review.score).filter(Review.user_id == uid)
        .order_by(Review.answered_at.desc()).limit(50).all()
    ]
    accuracy = round(sum(recent) / len(recent), 2) if recent else None

    return DashboardStats(notes=notes, flashcards=flashcards, reviews=reviews,
                          due_cards=due, overall_accuracy=accuracy)


@router.get("/weak-topics", response_model=list[WeakTopic])
def weak_topics(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    perfs = get_weak_topics(db, current_user.id)
    result = []
    for p in perfs:
        topic = db.query(Topic).filter(Topic.id == p.topic_id).first()
        result.append(WeakTopic(
            topic_id=str(p.topic_id),
            name=topic.name if topic else "unknown",
            accuracy=round(p.accuracy, 2),
            attempts=p.attempts,
            last_reviewed_at=p.last_reviewed_at.isoformat() if p.last_reviewed_at else None,
        ))
    return result


@router.get("/due-cards", response_model=list[DueCard])
def due_cards(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    cards = (
        db.query(Flashcard)
        .filter(Flashcard.user_id == current_user.id, Flashcard.due_at <= datetime.now(timezone.utc))
        .order_by(Flashcard.due_at.asc())
        .limit(50)
        .all()
    )
    return [
        DueCard(id=str(c.id), question=c.question, due_at=c.due_at.isoformat(),
                ease_factor=c.ease_factor, interval_days=c.interval_days)
        for c in cards
    ]
