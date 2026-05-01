import uuid
from sqlalchemy.orm import Session
from app.models.chunk import Chunk
from app.integrations.hf_embeddings import get_embedder
from app.integrations.pinecone_client import get_index


def retrieve_chunks(
    db: Session,
    query: str,
    user_id: uuid.UUID,
    note_id: uuid.UUID | None = None,
    top_k: int = 8,
    rerank_top: int = 3,
) -> list[Chunk]:
    """Embed query → query Pinecone (filtered by user_id) → hydrate from Postgres."""
    query_vec = get_embedder().embed([query])[0]

    pinecone_filter: dict = {"user_id": str(user_id)}
    if note_id:
        pinecone_filter["note_id"] = str(note_id)

    results = get_index().query(
        vector=query_vec,
        top_k=top_k,
        filter=pinecone_filter,
        include_metadata=False,
    )

    if not results.matches:
        return []

    chunk_ids = [uuid.UUID(m.id) for m in results.matches]
    score_map = {uuid.UUID(m.id): m.score for m in results.matches}

    # Postgres is the source of truth for chunk text — never store raw text in Pinecone
    chunks = db.query(Chunk).filter(Chunk.id.in_(chunk_ids)).all()
    chunks.sort(key=lambda c: score_map.get(c.id, 0.0), reverse=True)
    return chunks[:rerank_top]
