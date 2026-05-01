from pinecone import Pinecone

from app.core.config import get_settings


def get_pinecone() -> Pinecone:
    return Pinecone(api_key=get_settings().pinecone_api_key)


def get_index():
    s = get_settings()
    return get_pinecone().Index(s.pinecone_index)
