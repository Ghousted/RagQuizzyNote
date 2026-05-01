import uuid
from pydantic import BaseModel


class FlashcardOut(BaseModel):
    id: uuid.UUID
    question: str
    answer: str
    due_at: str


class AnswerRequest(BaseModel):
    answer: str


class AnswerResponse(BaseModel):
    score: float
    reasoning: str
    missed_concepts: list[str]
    new_interval_days: int
