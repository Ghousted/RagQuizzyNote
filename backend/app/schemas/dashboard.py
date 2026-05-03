from pydantic import BaseModel


class DashboardStats(BaseModel):
    notes: int
    flashcards: int
    reviews: int
    due_cards: int
    overall_accuracy: float | None


class WeakTopic(BaseModel):
    topic_id: str
    name: str
    accuracy: float
    attempts: int
    last_reviewed_at: str | None


class DueCard(BaseModel):
    id: str
    question: str
    due_at: str
    ease_factor: float
    interval_days: int
