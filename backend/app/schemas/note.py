import uuid
from datetime import datetime
from pydantic import BaseModel


class NoteCreate(BaseModel):
    title: str
    content: str
    icon: str | None = None


class NoteUpdate(BaseModel):
    title: str
    content: str
    icon: str | None = None


class NoteResponse(BaseModel):
    id: uuid.UUID
    title: str
    chunk_count: int
    icon: str | None = None


class NoteSummary(BaseModel):
    id: uuid.UUID
    title: str
    icon: str | None = None
    created_at: datetime
    updated_at: datetime


class NoteDetail(BaseModel):
    id: uuid.UUID
    title: str
    content: str
    chunk_count: int
    icon: str | None = None
    created_at: datetime
    updated_at: datetime
