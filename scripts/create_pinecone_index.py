"""Create the Pinecone index for QuizzyNote.

Idempotent — safe to re-run. Run from the project root:
    python scripts/create_pinecone_index.py
"""
import sys
from pathlib import Path

# Make `app` importable when running this script directly from project root.
sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "backend"))

from pinecone import Pinecone, ServerlessSpec  # noqa: E402

from app.core.config import get_settings  # noqa: E402


def main() -> None:
    s = get_settings()
    if not s.pinecone_api_key:
        raise SystemExit("PINECONE_API_KEY is not set in .env")

    pc = Pinecone(api_key=s.pinecone_api_key)
    existing = [idx.name for idx in pc.list_indexes()]

    if s.pinecone_index in existing:
        print(f"Index '{s.pinecone_index}' already exists. Nothing to do.")
        return

    print(
        f"Creating index '{s.pinecone_index}' "
        f"(dim={s.hf_embed_dim}, metric=cosine, {s.pinecone_cloud}/{s.pinecone_region})..."
    )
    pc.create_index(
        name=s.pinecone_index,
        dimension=s.hf_embed_dim,
        metric="cosine",
        spec=ServerlessSpec(cloud=s.pinecone_cloud, region=s.pinecone_region),
    )
    print("Done.")


if __name__ == "__main__":
    main()
