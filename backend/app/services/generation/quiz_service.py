import uuid
from datetime import datetime, timezone
from sqlalchemy.orm import Session
from app.models.note import Note
from app.models.quiz import Quiz
from app.models.review import Review
from app.services.rag.retriever import retrieve_chunks
from app.chains.quiz_chain import generate_quiz


def generate_quiz_for_note(db: Session, note_id: uuid.UUID, user_id: uuid.UUID) -> Quiz:
    note = db.query(Note).filter(Note.id == note_id).first()
    query = f"testable facts and key concepts from: {note.title}" if note else "key facts"

    chunks = retrieve_chunks(db, query, user_id, note_id=note_id, top_k=8, rerank_top=3)
    questions = generate_quiz([c.text for c in chunks]) if chunks else []

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

    # Deterministic exact-match — no LLM judge for MCQ
    review = Review(
        user_id=quiz.user_id,
        item_id=uuid.UUID(question_id),
        item_type="quiz_question",
        topic_id=None,
        score=score,
        judge_reasoning=question.get("explanation", ""),
        latency_ms=0,
        answered_at=datetime.now(timezone.utc),
    )
    db.add(review)
    db.commit()
    db.refresh(review)

    return review, {
        "correct": correct,
        "score": score,
        "correct_index": question["correct_index"],
        "explanation": question.get("explanation", ""),
    }
