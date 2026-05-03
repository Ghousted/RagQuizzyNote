import { useState, useEffect, useRef, ChangeEvent } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { AppLayout } from "../../components/AppLayout";
import { Modal } from "../../components/Modal";
import { SkeletonCard } from "../../components/Skeleton";
import { EmptyState } from "../../components/EmptyState";
import { api, NoteSummary } from "../../lib/api";
import styles from "./NotesPage.module.css";

export function NotesPage() {
  const navigate = useNavigate();
  const [notes, setNotes] = useState<NoteSummary[]>([]);
  const [loading, setLoading] = useState(true);

  // Create note modal
  const [createOpen, setCreateOpen] = useState(false);
  const [createTitle, setCreateTitle] = useState("");
  const [createContent, setCreateContent] = useState("");
  const [creating, setCreating] = useState(false);

  // PDF upload modal
  const [pdfOpen, setPdfOpen] = useState(false);
  const [pdfTitle, setPdfTitle] = useState("");
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    api.notes.list()
      .then(setNotes)
      .catch(e => toast.error(e instanceof Error ? e.message : "Failed to load notes"))
      .finally(() => setLoading(false));
  }, []);

  function openCreate() {
    setCreateTitle("");
    setCreateContent("");
    setCreateOpen(true);
  }

  function openPdf() {
    setPdfTitle("");
    setPdfFile(null);
    setDragOver(false);
    setPdfOpen(true);
  }

  async function createNote() {
    if (!createTitle.trim() || !createContent.trim()) return;
    setCreating(true);
    try {
      const note = await api.notes.create(createTitle.trim(), createContent.trim());
      toast.success("Note created!");
      setCreateOpen(false);
      navigate(`/notes/${note.id}`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to create note");
    } finally {
      setCreating(false);
    }
  }

  async function uploadPdf() {
    if (!pdfFile) return;
    setUploading(true);
    try {
      const note = await api.notes.uploadPdf(pdfFile, pdfTitle || undefined);
      toast.success("PDF uploaded and processed!");
      setPdfOpen(false);
      navigate(`/notes/${note.id}`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to upload PDF");
    } finally {
      setUploading(false);
    }
  }

  function handleFile(e: ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (f) {
      setPdfFile(f);
      if (!pdfTitle) setPdfTitle(f.name.replace(".pdf", "").replace(/[_-]/g, " "));
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files[0];
    if (f?.name.endsWith(".pdf")) {
      setPdfFile(f);
      if (!pdfTitle) setPdfTitle(f.name.replace(".pdf", "").replace(/[_-]/g, " "));
    } else {
      toast.error("Please drop a PDF file");
    }
  }

  const fmt = (d: string) =>
    new Date(d).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });

  return (
    <AppLayout>
      <div className={styles.page}>
        <div className={styles.pageHeader}>
          <div>
            <h1 className={styles.heading}>My Notes</h1>
            <p className={styles.subheading}>{notes.length} note{notes.length !== 1 ? "s" : ""}</p>
          </div>
          <div className={styles.headerActions}>
            <button className="btn btn-outline" onClick={openPdf}>
              <UploadIcon /> Upload PDF
            </button>
            <button className="btn btn-primary" onClick={openCreate}>
              <PlusIcon /> New note
            </button>
          </div>
        </div>

        {/* Notes list */}
        {loading ? (
          <div className={styles.skeletons}>
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </div>
        ) : notes.length === 0 ? (
          <EmptyState
            icon="📝"
            title="No notes yet"
            message="Create a note or upload a PDF to get started with AI-powered flashcards and quizzes."
            action={
              <button className="btn btn-primary" onClick={openCreate}>
                Create your first note
              </button>
            }
          />
        ) : (
          <div className={styles.list}>
            {notes.map(n => (
              <button
                key={n.id}
                className={styles.noteRow}
                onClick={() => navigate(`/notes/${n.id}`)}
              >
                <span className={styles.noteIcon}>{n.icon ?? "📝"}</span>
                <span className={styles.noteTitle}>{n.title}</span>
                <span className={styles.noteDate}>Updated {fmt(n.updated_at)}</span>
                <span className={styles.noteArrow}>→</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Create note modal */}
      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="New note" size="md">
        <div className={styles.form}>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="note-title">Title</label>
            <input
              id="note-title"
              className="input"
              placeholder="Give your note a title"
              value={createTitle}
              onChange={e => setCreateTitle(e.target.value)}
              autoFocus
            />
          </div>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="note-content">Content</label>
            <textarea
              id="note-content"
              className="textarea"
              placeholder="Paste your notes here…"
              value={createContent}
              onChange={e => setCreateContent(e.target.value)}
              rows={10}
            />
          </div>
          <p className={styles.hint}>
            Content will be chunked, embedded, and indexed for AI features. Takes ~5 seconds.
          </p>
          <div className={styles.modalActions}>
            <button className="btn btn-outline" onClick={() => setCreateOpen(false)}>Cancel</button>
            <button
              className="btn btn-primary"
              onClick={createNote}
              disabled={creating || !createTitle.trim() || !createContent.trim()}
            >
              {creating ? "Saving…" : "Save & process"}
            </button>
          </div>
        </div>
      </Modal>

      {/* PDF upload modal */}
      <Modal open={pdfOpen} onClose={() => setPdfOpen(false)} title="Upload PDF" size="md">
        <div className={styles.form}>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="pdf-title">Title (optional)</label>
            <input
              id="pdf-title"
              className="input"
              placeholder="Defaults to filename"
              value={pdfTitle}
              onChange={e => setPdfTitle(e.target.value)}
            />
          </div>
          <div
            className={`${styles.dropzone} ${dragOver ? styles.dropzoneOver : ""} ${pdfFile ? styles.dropzoneActive : ""}`}
            onClick={() => fileRef.current?.click()}
            onDragOver={e => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            role="button"
            tabIndex={0}
            aria-label="Drop PDF here or click to browse"
          >
            {pdfFile ? (
              <div className={styles.fileInfo}>
                <span className={styles.fileIcon}>📄</span>
                <div>
                  <p className={styles.fileName}>{pdfFile.name}</p>
                  <p className={styles.fileSize}>{(pdfFile.size / 1024).toFixed(1)} KB</p>
                </div>
              </div>
            ) : (
              <div className={styles.dropzoneContent}>
                <span className={styles.dropIcon}>⬆</span>
                <p className={styles.dropText}>Drop a PDF here, or click to browse</p>
                <p className={styles.dropHint}>Text will be extracted automatically</p>
              </div>
            )}
            <input ref={fileRef} type="file" accept=".pdf" style={{ display: "none" }} onChange={handleFile} />
          </div>
          <div className={styles.modalActions}>
            <button className="btn btn-outline" onClick={() => setPdfOpen(false)}>Cancel</button>
            <button
              className="btn btn-primary"
              onClick={uploadPdf}
              disabled={uploading || !pdfFile}
            >
              {uploading ? "Processing…" : "Upload & process"}
            </button>
          </div>
        </div>
      </Modal>
    </AppLayout>
  );
}

function PlusIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
      <path d="M7 2v10M2 7h10" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

function UploadIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
      <path d="M7 9V2M4 5L7 2l3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M2 10v2h10v-2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}
