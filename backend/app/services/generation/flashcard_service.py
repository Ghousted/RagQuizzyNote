import uuid
from sqlalchemy.orm import Session
from app.models.note import Note
from app.models.flashcard import Flashcard
from app.services.rag.retriever import retrieve_chunks
from app.services.tracking.performance_service import get_weak_topics
from app.chains.flashcard_chain import generate_flashcards


def generate_flashcards_for_note(
    db: Session, note_id: uuid.UUID, user_id: uuid.UUID
) -> list[Flashcard]:
    note = db.query(Note).filter(Note.id == note_id).first()
    query = f"key concepts and definitions from: {note.title}" if note else "key concepts"

    weak_topic_ids = [p.topic_id for p in get_weak_topics(db, user_id)]
    chunks = retrieve_chunks(db, query, user_id, note_id=note_id, top_k=8, rerank_top=3,
                             weak_topic_ids=weak_topic_ids)
    if not chunks:
        return []

    raw_cards = generate_flashcards([c.text for c in chunks])

    cards: list[Flashcard] = []
    for i, card in enumerate(raw_cards):
        chunk = chunks[i % len(chunks)]
        fc = Flashcard(
            user_id=user_id,
            note_id=note_id,
            chunk_id=chunk.id,
            topic_id=chunk.topic_id,
            question=card["question"],
            answer=card["answer"],
        )
        db.add(fc)
        cards.append(fc)

    db.commit()
    for c in cards:
        db.refresh(c)
    return cards
