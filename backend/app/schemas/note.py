import uuid
from pydantic import BaseModel


class NoteCreate(BaseModel):
    title: str
    content: str


class NoteResponse(BaseModel):
    id: uuid.UUID
    title: str
    chunk_count: int
