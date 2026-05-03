import { useState, useRef, useEffect } from "react";
import styles from "./EmojiPicker.module.css";

const STUDY_EMOJIS = [
  "📝", "📚", "📖", "📄", "🎓", "💡", "🧠", "🔬",
  "🧪", "🌍", "📊", "📈", "💻", "🎯", "🏆", "⭐",
  "🔖", "📌", "💎", "🧩", "🚀", "🌟", "🔥", "💪",
  "🎨", "🎵", "🏃", "🌿", "⚡", "🔑", "💼", "🎭",
];

interface EmojiPickerProps {
  value: string | null;
  onChange: (emoji: string | null) => void;
}

export function EmojiPicker({ value, onChange }: EmojiPickerProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleKey);
    };
  }, [open]);

  function pick(emoji: string) {
    onChange(emoji);
    setOpen(false);
  }

  return (
    <div className={styles.container} ref={containerRef}>
      <button
        type="button"
        className={styles.trigger}
        onClick={() => setOpen(o => !o)}
        title="Change icon"
        aria-label="Change note icon"
      >
        <span className={styles.emoji}>{value ?? "📝"}</span>
      </button>

      {open && (
        <div className={styles.popover} role="dialog" aria-label="Emoji picker">
          <div className={styles.grid}>
            {STUDY_EMOJIS.map(e => (
              <button
                key={e}
                type="button"
                className={`${styles.emojiBtn} ${value === e ? styles.selected : ""}`}
                onClick={() => pick(e)}
                title={e}
                aria-label={e}
              >
                {e}
              </button>
            ))}
          </div>
          {value && (
            <div className={styles.footer}>
              <button
                type="button"
                className={`btn btn-ghost btn-sm ${styles.removeBtn}`}
                onClick={() => { onChange(null); setOpen(false); }}
              >
                Remove icon
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
