import uuid
from sqlalchemy.orm import Session
from app.models.note import Note
from app.models.chunk import Chunk
from app.models.topic import Topic
from app.integrations.hf_embeddings import get_embedder
from app.integrations.pinecone_client import get_index
from app.chains.topic_chain import extract_topics

_CHUNK_WORDS = 400  # ~500 tokens


def _split_text(text: str) -> list[str]:
    words = text.split()
    return [
        " ".join(words[i : i + _CHUNK_WORDS])
        for i in range(0, len(words), _CHUNK_WORDS)
        if words[i : i + _CHUNK_WORDS]
    ]


def _get_or_create_topic(db: Session, user_id: uuid.UUID, name: str) -> Topic:
    topic = db.query(Topic).filter(Topic.user_id == user_id, Topic.name == name).first()
    if not topic:
        topic = Topic(user_id=user_id, name=name)
        db.add(topic)
        db.flush()
    return topic


def ingest_note(db: Session, note: Note) -> list[Chunk]:
    raw_chunks = _split_text(note.content)
    if not raw_chunks:
        return []

    # 1. Batch-extract topics (1 LLM call regardless of chunk count)
    topic_names = extract_topics(raw_chunks)

    # 2. Resolve topic names → Topic rows (deduped per user)
    topic_ids: list[uuid.UUID | None] = []
    for name in topic_names:
        if name:
            topic = _get_or_create_topic(db, note.user_id, name)
            topic_ids.append(topic.id)
        else:
            topic_ids.append(None)

    # 3. Embed all chunks in one batch
    embeddings = get_embedder().embed(raw_chunks)

    # 4. Build Chunk rows and flush once to get DB-assigned IDs
    chunks: list[Chunk] = []
    for i, (text, topic_id) in enumerate(zip(raw_chunks, topic_ids)):
        chunk = Chunk(note_id=note.id, user_id=note.user_id, topic_id=topic_id, text=text, ordinal=i)
        db.add(chunk)
        chunks.append(chunk)

    db.flush()  # one round-trip to Postgres for all IDs

    # 5. Upsert to Pinecone — metadata only (no raw text stored there)
    get_index().upsert(vectors=[
        {
            "id": str(chunk.id),
            "values": embedding,
            "metadata": {
                "user_id": str(note.user_id),
                "note_id": str(note.id),
                "topic_id": str(chunk.topic_id) if chunk.topic_id else "",
            },
        }
        for chunk, embedding in zip(chunks, embeddings)
    ])

    db.commit()
    return chunks
