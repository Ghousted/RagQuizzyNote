import uuid
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.models.note import Note
from app.models.flashcard import Flashcard
from app.schemas.flashcard import FlashcardOut, AnswerRequest, AnswerResponse
from app.services.generation.flashcard_service import generate_flashcards_for_note
from app.services.evaluation.answer_evaluator import evaluate_answer

router = APIRouter(tags=["ai"])


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
