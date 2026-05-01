from fastapi import APIRouter
from sqlalchemy import text

from app.core.config import get_settings
from app.db.session import engine
from app.integrations.hf_embeddings import get_embedder
from app.integrations.llm_provider import get_llm
from app.integrations.pinecone_client import get_pinecone

router = APIRouter(tags=["health"])


@router.get("/healthz")
def healthz():
    s = get_settings()
    checks: dict[str, str] = {
        "postgres": "unknown",
        "pinecone": "unknown",
        "llm": "unknown",
        "embeddings": "unknown",
    }

    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        checks["postgres"] = "ok"
    except Exception as e:
        checks["postgres"] = f"error: {type(e).__name__}: {e}"

    try:
        pc = get_pinecone()
        names = [idx.name for idx in pc.list_indexes()]
        if s.pinecone_index in names:
            checks["pinecone"] = "ok"
        else:
            checks["pinecone"] = (
                f"index '{s.pinecone_index}' not found "
                f"(run: python scripts/create_pinecone_index.py)"
            )
    except Exception as e:
        checks["pinecone"] = f"error: {type(e).__name__}: {e}"

    try:
        llm = get_llm()
        out = llm.chat([{"role": "user", "content": "Reply with just the word: pong"}])
        checks["llm"] = "ok" if "pong" in out.lower() else f"unexpected: {out[:60]!r}"
    except Exception as e:
        checks["llm"] = f"error: {type(e).__name__}: {e}"

    try:
        emb = get_embedder()
        v = emb.embed(["hello"])
        length = len(v[0]) if v else 0
        checks["embeddings"] = (
            "ok" if length == s.hf_embed_dim else f"dim mismatch: got {length}, expected {s.hf_embed_dim}"
        )
    except Exception as e:
        checks["embeddings"] = f"error: {type(e).__name__}: {e}"

    overall = "ok" if all(v == "ok" for v in checks.values()) else "degraded"
    return {"status": overall, "checks": checks}
