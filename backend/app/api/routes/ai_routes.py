import uuid
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.models.note import Note
from app.models.flashcard import Flashcard
from app.models.quiz import Quiz
from app.schemas.flashcard import FlashcardOut, AnswerRequest, AnswerResponse
from app.schemas.quiz import QuizOut, QuizAnswerRequest, QuizAnswerResponse
from app.schemas.explanation import ExplainRequest, ExplainResponse
from app.services.generation.flashcard_service import generate_flashcards_for_note
from app.services.generation.quiz_service import generate_quiz_for_note, answer_quiz_question
from app.services.generation.explanation_service import explain_concept
from app.services.evaluation.answer_evaluator import evaluate_answer

router = APIRouter(tags=["ai"])


# ── Flashcards ────────────────────────────────────────────────────────────────

@router.post("/notes/{note_id}/flashcards", response_model=list[FlashcardOut], status_code=201)
def create_flashcards(
    note_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    note = db.query(Note).filter(Note.id == note_id, Note.user_id == current_user.id).first()
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")
    cards = generate_flashcards_for_note(db, note.id, current_user.id)
    return [FlashcardOut(id=c.id, question=c.question, answer=c.answer, due_at=c.due_at.isoformat()) for c in cards]


@router.post("/flashcards/{flashcard_id}/answer", response_model=AnswerResponse)
def answer_flashcard(
    flashcard_id: uuid.UUID,
    body: AnswerRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    card = db.query(Flashcard).filter(
        Flashcard.id == flashcard_id, Flashcard.user_id == current_user.id
    ).first()
    if not card:
        raise HTTPException(status_code=404, detail="Flashcard not found")
    _, result = evaluate_answer(db, card, body.answer)
    return AnswerResponse(
        score=result["score"],
        reasoning=result["reasoning"],
        missed_concepts=result["missed_concepts"],
        new_interval_days=card.interval_days,
    )


# ── Quiz ──────────────────────────────────────────────────────────────────────

@router.post("/notes/{note_id}/quiz", response_model=QuizOut, status_code=201)
def create_quiz(
    note_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    note = db.query(Note).filter(Note.id == note_id, Note.user_id == current_user.id).first()
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")
    quiz = generate_quiz_for_note(db, note.id, current_user.id)
    return QuizOut(id=quiz.id, note_id=quiz.note_id, question_count=len(quiz.questions), questions=quiz.questions)


@router.post("/quizzes/{quiz_id}/answer", response_model=QuizAnswerResponse)
def answer_quiz(
    quiz_id: uuid.UUID,
    body: QuizAnswerRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    quiz = db.query(Quiz).filter(Quiz.id == quiz_id, Quiz.user_id == current_user.id).first()
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz not found")
    _, result = answer_quiz_question(db, quiz, body.question_id, body.selected_index)
    return QuizAnswerResponse(**result)


# ── Explanation ───────────────────────────────────────────────────────────────

@router.post("/explain", response_model=ExplainResponse)
def explain(
    body: ExplainRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = explain_concept(db, body.concept, current_user.id, note_id=body.note_id)
    return ExplainResponse(**result)
