import uuid
from datetime import datetime, timezone
from sqlalchemy.orm import Session
from app.models.note import Note
from app.models.quiz import Quiz
from app.models.review import Review
from app.services.rag.retriever import retrieve_chunks
from app.services.tracking.performance_service import update_performance
from app.chains.quiz_chain import generate_quiz


def _majority_topic(chunks) -> uuid.UUID | None:
    """Return the most common non-null topic_id across retrieved chunks."""
    counts: dict[uuid.UUID, int] = {}
    for c in chunks:
        if c.topic_id:
            counts[c.topic_id] = counts.get(c.topic_id, 0) + 1
    return max(counts, key=lambda k: counts[k]) if counts else None


def generate_quiz_for_note(db: Session, note_id: uuid.UUID, user_id: uuid.UUID) -> Quiz:
    note = db.query(Note).filter(Note.id == note_id).first()
    query = f"testable facts and key concepts from: {note.title}" if note else "key facts"

    chunks = retrieve_chunks(db, query, user_id, note_id=note_id, top_k=8, rerank_top=3)
    questions = generate_quiz([c.text for c in chunks]) if chunks else []

    # Attach the dominant topic_id to each question so answers can update Performance
    topic_id = _majority_topic(chunks)
    for q in questions:
        q["topic_id"] = str(topic_id) if topic_id else None

    quiz = Quiz(user_id=user_id, note_id=note_id, questions=questions)
    db.add(quiz)
    db.commit()
    db.refresh(quiz)
    return quiz


def answer_quiz_question(
    db: Session,
    quiz: Quiz,
    question_id: str,
    selected_index: int,
) -> tuple[Review, dict]:
    question = next((q for q in quiz.questions if q.get("id") == question_id), None)
    if question is None:
        return None, {"correct": False, "score": 0.0, "correct_index": -1, "explanation": "Question not found"}

    correct = selected_index == question["correct_index"]
    score = 1.0 if correct else 0.0

    # Parse topic_id stored on the question at generation time
    raw_topic = question.get("topic_id")
    topic_id = uuid.UUID(raw_topic) if raw_topic else None

    # Deterministic exact-match — no LLM judge for MCQ
    review = Review(
        user_id=quiz.user_id,
        item_id=uuid.UUID(question_id),
        item_type="quiz_question",
        topic_id=topic_id,
        score=score,
        judge_reasoning=question.get("explanation", ""),
        latency_ms=0,
        answered_at=datetime.now(timezone.utc),
    )
    db.add(review)
    db.flush()

    # Now topic_id is non-null when a topic was detected → Performance gets updated
    update_performance(db, quiz.user_id, topic_id)
    db.commit()
    db.refresh(review)

    return review, {
        "correct": correct,
        "score": score,
        "correct_index": question["correct_index"],
        "explanation": question.get("explanation", ""),
    }
