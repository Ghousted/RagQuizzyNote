import io
import uuid
from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.models.note import Note
from app.models.chunk import Chunk
from app.schemas.note import NoteCreate, NoteUpdate, NoteResponse, NoteSummary, NoteDetail
from app.services.ingestion.note_ingestor import ingest_note
from app.core.rate_limit import ai_limiter

router = APIRouter(prefix="/notes", tags=["notes"])


@router.get("", response_model=list[NoteSummary])
def list_notes(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    notes = (
        db.query(Note)
        .filter(Note.user_id == current_user.id)
        .order_by(Note.created_at.desc())
        .all()
    )
    return [
        NoteSummary(
            id=n.id,
            title=n.title,
            icon=n.icon,
            created_at=n.created_at,
            updated_at=n.updated_at,
        )
        for n in notes
    ]


@router.post("", response_model=NoteResponse, status_code=201)
def create_note(
    body: NoteCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    ai_limiter.check(str(current_user.id))
    note = Note(user_id=current_user.id, title=body.title, content=body.content, icon=body.icon)
    db.add(note)
    db.flush()
    chunks = ingest_note(db, note)
    return NoteResponse(id=note.id, title=note.title, chunk_count=len(chunks), icon=note.icon)


@router.post("/upload-pdf", response_model=NoteResponse, status_code=201)
def upload_pdf(
    file: UploadFile = File(...),
    title: str = Form(default=""),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    ai_limiter.check(str(current_user.id))
    if not file.filename or not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="File must be a PDF (.pdf)")

    try:
        from pypdf import PdfReader
        reader = PdfReader(io.BytesIO(file.file.read()))
        text = "\n\n".join(page.extract_text() or "" for page in reader.pages).strip()
    except Exception as e:
        raise HTTPException(status_code=422, detail=f"Could not parse PDF: {e}")

    if not text:
        raise HTTPException(status_code=422, detail="No text could be extracted from this PDF")

    note_title = title.strip() or file.filename.replace(".pdf", "").replace("_", " ").replace("-", " ").title()
    note = Note(user_id=current_user.id, title=note_title, content=text, icon="📄")
    db.add(note)
    db.flush()
    chunks = ingest_note(db, note)
    return NoteResponse(id=note.id, title=note.title, chunk_count=len(chunks), icon=note.icon)


@router.get("/{note_id}", response_model=NoteDetail)
def get_note(
    note_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    note = db.query(Note).filter(Note.id == note_id, Note.user_id == current_user.id).first()
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")
    chunk_count = db.query(Chunk).filter(Chunk.note_id == note.id).count()
    return NoteDetail(
        id=note.id,
        title=note.title,
        content=note.content,
        chunk_count=chunk_count,
        icon=note.icon,
        created_at=note.created_at,
        updated_at=note.updated_at,
    )


@router.put("/{note_id}", response_model=NoteDetail)
def update_note(
    note_id: uuid.UUID,
    body: NoteUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    note = db.query(Note).filter(Note.id == note_id, Note.user_id == current_user.id).first()
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")
    note.title = body.title
    note.content = body.content
    if body.icon is not None or "icon" in body.model_fields_set:
        note.icon = body.icon
    db.commit()
    db.refresh(note)
    chunk_count = db.query(Chunk).filter(Chunk.note_id == note.id).count()
    return NoteDetail(
        id=note.id,
        title=note.title,
        content=note.content,
        chunk_count=chunk_count,
        icon=note.icon,
        created_at=note.created_at,
        updated_at=note.updated_at,
    )


@router.delete("/{note_id}", status_code=204)
def delete_note(
    note_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    note = db.query(Note).filter(Note.id == note_id, Note.user_id == current_user.id).first()
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")
    db.delete(note)
    db.commit()
