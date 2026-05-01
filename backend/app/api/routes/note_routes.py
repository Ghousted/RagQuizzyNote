from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.models.note import Note
from app.schemas.note import NoteCreate, NoteResponse
from app.services.ingestion.note_ingestor import ingest_note

router = APIRouter(prefix="/notes", tags=["notes"])


@router.post("", response_model=NoteResponse, status_code=201)
def create_note(
    body: NoteCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    note = Note(user_id=current_user.id, title=body.title, content=body.content)
    db.add(note)
    db.flush()
    chunks = ingest_note(db, note)
    return NoteResponse(id=note.id, title=note.title, chunk_count=len(chunks))
