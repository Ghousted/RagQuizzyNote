import uuid
from pydantic import BaseModel


class QuizOut(BaseModel):
    id: uuid.UUID
    note_id: uuid.UUID
    question_count: int
    questions: list[dict]


class QuizAnswerRequest(BaseModel):
    question_id: str
    selected_index: int


class QuizAnswerResponse(BaseModel):
    correct: bool
    score: float
    correct_index: int
    explanation: str
