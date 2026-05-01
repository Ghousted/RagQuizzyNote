import uuid
from sqlalchemy.orm import Session
from app.services.rag.retriever import retrieve_chunks
from app.chains.explanation_chain import generate_explanation


def explain_concept(
    db: Session,
    concept: str,
    user_id: uuid.UUID,
    note_id: uuid.UUID | None = None,
) -> dict:
    chunks = retrieve_chunks(db, concept, user_id, note_id=note_id, top_k=8, rerank_top=3)
    if not chunks:
        return {"explanation": "No relevant content found in your notes.", "key_points": [], "analogy": None}
    return generate_explanation([c.text for c in chunks], concept)
