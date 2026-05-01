import uuid
from pydantic import BaseModel


class ExplainRequest(BaseModel):
    concept: str
    note_id: uuid.UUID | None = None


class ExplainResponse(BaseModel):
    explanation: str
    key_points: list[str]
    analogy: str | None
