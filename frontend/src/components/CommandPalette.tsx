import { useState, useEffect, useRef, KeyboardEvent } from "react";
import { useNavigate } from "react-router-dom";
import ReactDOM from "react-dom";
import { NoteSummary } from "../lib/api";
import styles from "./CommandPalette.module.css";

interface CommandPaletteProps {
  notes: NoteSummary[];
  open: boolean;
  onClose: () => void;
}

export function CommandPalette({ notes, open, onClose }: CommandPaletteProps) {
  const [query, setQuery] = useState("");
  const [cursor, setCursor] = useState(0);
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);

  const filtered = notes
    .filter(n => n.title.toLowerCase().includes(query.toLowerCase()))
    .slice(0, 8);

  useEffect(() => {
    if (open) {
      setQuery("");
      setCursor(0);
      setTimeout(() => inputRef.current?.focus(), 10);
    }
  }, [open]);

  useEffect(() => {
    setCursor(0);
  }, [query]);

  function handleKey(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setCursor(c => Math.min(c + 1, filtered.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setCursor(c => Math.max(c - 1, 0));
    } else if (e.key === "Enter") {
      const note = filtered[cursor];
      if (note) {
        navigate(`/notes/${note.id}`);
        onClose();
      }
    } else if (e.key === "Escape") {
      onClose();
    }
  }

  function handleBackdropClick(e: React.MouseEvent) {
    if (e.target === e.currentTarget) onClose();
  }

  if (!open) return null;

  return ReactDOM.createPortal(
    <div className={styles.backdrop} onClick={handleBackdropClick}>
      <div className={styles.panel} role="dialog" aria-label="Command palette" aria-modal="true">
        <div className={styles.inputRow}>
          <SearchIcon />
          <input
            ref={inputRef}
            className={styles.input}
            type="text"
            placeholder="Search notes..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={handleKey}
            aria-label="Search notes"
            autoComplete="off"
            spellCheck={false}
          />
          {query && (
            <button className={`btn btn-ghost btn-icon ${styles.clearBtn}`} onClick={() => setQuery("")} aria-label="Clear search">
              <ClearIcon />
            </button>
          )}
        </div>

        <div className={styles.results} role="listbox">
          {filtered.length === 0 && (
            <div className={styles.empty}>
              {query ? `No notes matching "${query}"` : "No notes yet"}
            </div>
          )}
          {filtered.map((note, i) => (
            <button
              key={note.id}
              className={`${styles.result} ${i === cursor ? styles.active : ""}`}
              role="option"
              aria-selected={i === cursor}
              onClick={() => { navigate(`/notes/${note.id}`); onClose(); }}
              onMouseEnter={() => setCursor(i)}
            >
              <span className={styles.resultIcon}>{note.icon ?? "📝"}</span>
              <span className={styles.resultTitle}>{note.title}</span>
            </button>
          ))}
        </div>

        <div className={styles.footer}>
          <span><kbd>↑↓</kbd> navigate</span>
          <span><kbd>↵</kbd> open</span>
          <span><kbd>Esc</kbd> close</span>
        </div>
      </div>
    </div>,
    document.body,
  );
}

function SearchIcon() {
  return (
    <svg className={styles.searchIcon} width="16" height="16" viewBox="0 0 16 16" fill="none">
      <circle cx="7" cy="7" r="4.5" stroke="currentColor" strokeWidth="1.4" />
      <path d="M10.5 10.5L13 13" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

function ClearIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
      <path d="M9 3L3 9M3 3l6 6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}
