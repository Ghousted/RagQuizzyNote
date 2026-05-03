import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { AppLayout } from "../../components/AppLayout";
import { FlashcardPlayer } from "../../components/FlashcardPlayer";
import { QuizPlayer } from "../../components/QuizPlayer";
import { EmojiPicker } from "../../components/EmojiPicker";
import { Modal } from "../../components/Modal";
import { Skeleton, SkeletonText } from "../../components/Skeleton";
import { EmptyState } from "../../components/EmptyState";
import { api, NoteDetail, Flashcard, Quiz, ExplainResult } from "../../lib/api";
import styles from "./NoteDetailPage.module.css";

type Tab = "content" | "flashcards" | "quiz" | "explain";
type SaveState = "idle" | "saving" | "saved";

export function NoteDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>("content");
  const [note, setNote] = useState<NoteDetail | null>(null);
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [loading, setLoading] = useState(true);

  // Editable fields
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");
  const [editIcon, setEditIcon] = useState<string | null>(null);
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  // Flashcard tab
  const [generatingCards, setGeneratingCards] = useState(false);
  const [studyMode, setStudyMode] = useState(false);
  const [flippedCards, setFlippedCards] = useState<Set<string>>(new Set());

  // Quiz tab
  const [generatingQuiz, setGeneratingQuiz] = useState(false);
  const [takingQuiz, setTakingQuiz] = useState(false);

  // Explain tab
  const [concept, setConcept] = useState("");
  const [explaining, setExplaining] = useState(false);
  const [explanation, setExplanation] = useState<ExplainResult | null>(null);

  // Delete modal
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Debounce ref
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isDirtyRef = useRef(false);

  useEffect(() => {
    if (!id) return;
    Promise.all([
      api.notes.get(id),
      api.ai.getFlashcards(id),
      api.ai.getQuiz(id),
    ]).then(([n, cards, q]) => {
      setNote(n);
      setEditTitle(n.title);
      setEditContent(n.content);
      setEditIcon(n.icon ?? null);
      setFlashcards(cards);
      setQuiz(q);
    }).catch(e => {
      toast.error(e instanceof Error ? e.message : "Failed to load note");
    }).finally(() => setLoading(false));
  }, [id]);

  const saveNote = useCallback(async (title: string, content: string, icon: string | null) => {
    if (!id) return;
    setSaveState("saving");
    try {
      const updated = await api.notes.update(id, title, content, icon);
      setNote(updated);
      setSaveState("saved");
      setLastSaved(new Date());
      isDirtyRef.current = false;
    } catch (e) {
      setSaveState("idle");
      toast.error(e instanceof Error ? e.message : "Failed to save");
    }
  }, [id]);

  function scheduleAutoSave(title: string, content: string, icon: string | null) {
    isDirtyRef.current = true;
    setSaveState("saving");
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      saveNote(title, content, icon);
    }, 1000);
  }

  function handleTitleChange(val: string) {
    setEditTitle(val);
    scheduleAutoSave(val, editContent, editIcon);
  }

  function handleContentChange(val: string) {
    setEditContent(val);
    scheduleAutoSave(editTitle, val, editIcon);
  }

  function handleIconChange(icon: string | null) {
    setEditIcon(icon);
    scheduleAutoSave(editTitle, editContent, icon);
  }

  async function generateFlashcards() {
    if (!id) return;
    setGeneratingCards(true);
    try {
      const cards = await api.ai.generateFlashcards(id);
      setFlashcards(cards);
      toast.success(`Generated ${cards.length} flashcards!`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to generate flashcards");
    } finally {
      setGeneratingCards(false);
    }
  }

  async function generateQuiz() {
    if (!id) return;
    setGeneratingQuiz(true);
    try {
      const q = await api.ai.generateQuiz(id);
      setQuiz(q);
      setTakingQuiz(true);
      toast.success("Quiz generated!");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to generate quiz");
    } finally {
      setGeneratingQuiz(false);
    }
  }

  async function getExplanation() {
    if (!concept.trim() || !id) return;
    setExplaining(true);
    setExplanation(null);
    try {
      const r = await api.ai.explain(concept, id);
      setExplanation(r);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to get explanation");
    } finally {
      setExplaining(false);
    }
  }

  async function confirmDelete() {
    if (!id) return;
    setDeleting(true);
    try {
      await api.notes.delete(id);
      toast.success("Note deleted");
      navigate("/notes");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to delete");
    } finally {
      setDeleting(false);
      setDeleteOpen(false);
    }
  }

  function toggleFlip(cardId: string) {
    setFlippedCards(prev => {
      const next = new Set(prev);
      if (next.has(cardId)) next.delete(cardId);
      else next.add(cardId);
      return next;
    });
  }

  const TABS: { key: Tab; label: string }[] = [
    { key: "content", label: "Content" },
    { key: "flashcards", label: flashcards.length ? `Flashcards (${flashcards.length})` : "Flashcards" },
    { key: "quiz", label: "Quiz" },
    { key: "explain", label: "Explain" },
  ];

  if (loading) {
    return (
      <AppLayout>
        <div className={styles.loadingPage}>
          <Skeleton width="48px" height="48px" borderRadius="8px" />
          <Skeleton width="60%" height="36px" borderRadius="6px" />
          <Skeleton width="30%" height="14px" borderRadius="4px" />
          <div style={{ marginTop: "16px" }}>
            <SkeletonText lines={5} />
          </div>
        </div>
      </AppLayout>
    );
  }

  if (!note) {
    return (
      <AppLayout>
        <EmptyState
          icon="🔍"
          title="Note not found"
          message="This note may have been deleted or doesn't exist."
          action={<Link to="/notes" className="btn btn-primary">Back to Notes</Link>}
        />
      </AppLayout>
    );
  }

  function SaveIndicator() {
    if (saveState === "saving") {
      return <span className={styles.savingIndicator}>Saving…</span>;
    }
    if (saveState === "saved" && lastSaved) {
      return (
        <span className={styles.savedIndicator}>
          Saved {lastSaved.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
        </span>
      );
    }
    return null;
  }

  return (
    <AppLayout>
      <div className={styles.page}>
        {/* Breadcrumb */}
        <nav className={styles.breadcrumb} aria-label="Breadcrumb">
          <Link to="/notes" className={styles.breadcrumbLink}>Notes</Link>
          <span className={styles.breadcrumbSep}>/</span>
          <span className={styles.breadcrumbCurrent}>{note.title || "Untitled"}</span>
        </nav>

        {/* Title area */}
        <div className={styles.titleArea}>
          <EmojiPicker value={editIcon} onChange={handleIconChange} />
          <div className={styles.titleRow}>
            <input
              className={styles.titleInput}
              value={editTitle}
              onChange={e => handleTitleChange(e.target.value)}
              placeholder="Untitled"
              aria-label="Note title"
            />
            <div className={styles.titleMeta}>
              <SaveIndicator />
              <span className={styles.metaText}>
                {note.chunk_count} chunk{note.chunk_count !== 1 ? "s" : ""} · Updated {new Date(note.updated_at).toLocaleDateString()}
              </span>
              <button
                className="btn btn-danger btn-sm"
                onClick={() => setDeleteOpen(true)}
              >
                Delete
              </button>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className={styles.tabs} role="tablist">
          {TABS.map(t => (
            <button
              key={t.key}
              role="tab"
              aria-selected={tab === t.key}
              className={`${styles.tab} ${tab === t.key ? styles.tabActive : ""}`}
              onClick={() => setTab(t.key)}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* ── Content tab ── */}
        {tab === "content" && (
          <div className={styles.contentTab} role="tabpanel">
            <AutoResizeTextarea
              value={editContent}
              onChange={handleContentChange}
              placeholder="Start writing your notes here…"
            />
          </div>
        )}

        {/* ── Flashcards tab ── */}
        {tab === "flashcards" && (
          <div className={styles.tabPanel} role="tabpanel">
            {!studyMode ? (
              <>
                <div className={styles.tabActions}>
                  <button className="btn btn-primary" onClick={generateFlashcards} disabled={generatingCards}>
                    {generatingCards ? "Generating…" : flashcards.length ? "Regenerate" : "Generate flashcards"}
                  </button>
                  {flashcards.length > 0 && (
                    <button className="btn btn-outline" onClick={() => setStudyMode(true)}>
                      Study all →
                    </button>
                  )}
                </div>

                {flashcards.length === 0 && !generatingCards ? (
                  <EmptyState
                    icon="🃏"
                    title="No flashcards yet"
                    message="Generate flashcards from your note content to start studying with spaced repetition."
                  />
                ) : (
                  <div className={styles.cardGrid}>
                    {flashcards.map((c, i) => (
                      <button
                        key={c.id}
                        className={`${styles.flashCard} ${flippedCards.has(c.id) ? styles.flipped : ""}`}
                        onClick={() => toggleFlip(c.id)}
                        aria-label={flippedCards.has(c.id) ? "Click to see question" : "Click to reveal answer"}
                      >
                        <div className={styles.flashCardInner}>
                          <div className={styles.flashCardFront}>
                            <span className={styles.cardNum}>{i + 1}</span>
                            <p className={styles.cardQ}>{c.question}</p>
                            <span className={styles.cardHint}>Click to reveal</span>
                          </div>
                          <div className={styles.flashCardBack}>
                            <span className={styles.cardNum}>{i + 1}</span>
                            <p className={styles.cardA}>{c.answer}</p>
                            <span className={styles.cardHint}>Click to flip</span>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <>
                <button className="btn btn-outline btn-sm" onClick={() => setStudyMode(false)}>
                  ← Back to cards
                </button>
                <div className={styles.playerWrapper}>
                  <FlashcardPlayer cards={flashcards} onDone={() => setStudyMode(false)} />
                </div>
              </>
            )}
          </div>
        )}

        {/* ── Quiz tab ── */}
        {tab === "quiz" && (
          <div className={styles.tabPanel} role="tabpanel">
            {!takingQuiz ? (
              <>
                <div className={styles.tabActions}>
                  <button className="btn btn-primary" onClick={generateQuiz} disabled={generatingQuiz}>
                    {generatingQuiz ? "Generating…" : quiz ? "Generate new quiz" : "Generate quiz"}
                  </button>
                  {quiz && (
                    <button className="btn btn-outline" onClick={() => setTakingQuiz(true)}>
                      Retake last quiz
                    </button>
                  )}
                </div>
                {!quiz && !generatingQuiz && (
                  <EmptyState
                    icon="❓"
                    title="No quiz yet"
                    message="Generate a multiple-choice quiz from this note's content."
                  />
                )}
                {quiz && !takingQuiz && (
                  <div className={styles.quizReady}>
                    <span className={styles.quizBadge}>{quiz.question_count} questions ready</span>
                    <p className={styles.quizHint}>Click "Retake last quiz" to start.</p>
                  </div>
                )}
              </>
            ) : (
              <>
                <button className="btn btn-outline btn-sm" onClick={() => setTakingQuiz(false)}>
                  ← Back
                </button>
                <div className={styles.playerWrapper}>
                  <QuizPlayer quiz={quiz!} onDone={() => setTakingQuiz(false)} />
                </div>
              </>
            )}
          </div>
        )}

        {/* ── Explain tab ── */}
        {tab === "explain" && (
          <div className={styles.tabPanel} role="tabpanel">
            <p className={styles.explainHint}>Ask for an explanation of any concept from this note.</p>
            <div className={styles.explainRow}>
              <input
                className={`input ${styles.conceptInput}`}
                placeholder="e.g. How does DNA replication work?"
                value={concept}
                onChange={e => setConcept(e.target.value)}
                onKeyDown={e => e.key === "Enter" && getExplanation()}
              />
              <button
                className="btn btn-primary"
                onClick={getExplanation}
                disabled={explaining || !concept.trim()}
              >
                {explaining ? "Thinking…" : "Explain"}
              </button>
            </div>

            {explanation && (
              <div className={styles.explanationBox}>
                <p className={styles.explanationText}>{explanation.explanation}</p>
                {explanation.key_points.length > 0 && (
                  <div className={styles.keyPoints}>
                    <p className={styles.keyPointsLabel}>Key points</p>
                    <ul className={styles.keyPointsList}>
                      {explanation.key_points.map((p, i) => <li key={i}>{p}</li>)}
                    </ul>
                  </div>
                )}
                {explanation.analogy && (
                  <div className={styles.analogy}>
                    <p className={styles.analogyLabel}>Analogy</p>
                    <p>{explanation.analogy}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Delete confirmation modal */}
      <Modal open={deleteOpen} onClose={() => setDeleteOpen(false)} title="Delete note" size="sm">
        <div className={styles.deleteModal}>
          <p className={styles.deleteWarning}>
            Are you sure you want to delete <strong>"{note.title}"</strong>?
            This will also delete all flashcards and quizzes for this note. This cannot be undone.
          </p>
          <div className={styles.deleteActions}>
            <button className="btn btn-outline" onClick={() => setDeleteOpen(false)}>Cancel</button>
            <button className="btn btn-danger" onClick={confirmDelete} disabled={deleting}>
              {deleting ? "Deleting…" : "Delete note"}
            </button>
          </div>
        </div>
      </Modal>
    </AppLayout>
  );
}

function AutoResizeTextarea({ value, onChange, placeholder }: {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
}) {
  const ref = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }, [value]);

  return (
    <textarea
      ref={ref}
      className={styles.contentArea}
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      rows={1}
    />
  );
}
