import { ReactNode, useEffect, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { api, NoteSummary } from "../lib/api";
import { CommandPalette } from "./CommandPalette";
import { SkeletonCard } from "./Skeleton";
import styles from "./AppLayout.module.css";

export function AppLayout({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const [notes, setNotes] = useState<NoteSummary[]>([]);
  const [notesLoading, setNotesLoading] = useState(true);
  const [paletteOpen, setPaletteOpen] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem("access_token")) { navigate("/login"); return; }
    api.notes.list()
      .then(setNotes)
      .catch(() => {/* silent */})
      .finally(() => setNotesLoading(false));
  }, [navigate]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        setPaletteOpen(o => !o);
      }
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  function logout() {
    localStorage.removeItem("access_token");
    navigate("/");
  }

  function createNote() {
    navigate("/notes");
  }

  return (
    <div className={styles.layout}>
      <aside className={styles.sidebar}>
        {/* Brand */}
        <div className={styles.brand}>
          <span className={styles.brandIcon}>✦</span>
          <span className={styles.brandName}>QuizzyNote</span>
        </div>

        {/* Search / Command palette trigger */}
        <button className={styles.searchBtn} onClick={() => setPaletteOpen(true)}>
          <SearchIcon />
          <span>Search...</span>
          <kbd className={styles.kbdHint}>Ctrl K</kbd>
        </button>

        {/* Main nav */}
        <nav className={styles.nav} aria-label="Main navigation">
          <NavLink
            to="/dashboard"
            className={({ isActive }) => `${styles.navLink} ${isActive ? styles.navActive : ""}`}
          >
            <DashboardIcon />
            <span>Dashboard</span>
          </NavLink>
          <NavLink
            to="/notes"
            className={({ isActive }) => `${styles.navLink} ${isActive ? styles.navActive : ""}`}
          >
            <NotesIcon />
            <span>Notes</span>
          </NavLink>
          <NavLink
            to="/study"
            className={({ isActive }) => `${styles.navLink} ${isActive ? styles.navActive : ""}`}
          >
            <StudyIcon />
            <span>Study</span>
          </NavLink>
        </nav>

        {/* Notes section */}
        <div className={styles.notesSectionHeader}>NOTES</div>
        <div className={styles.notesList}>
          {notesLoading ? (
            <div className={styles.notesSkeletons}>
              <SkeletonCard />
              <SkeletonCard />
              <SkeletonCard />
            </div>
          ) : notes.length === 0 ? (
            <p className={styles.notesEmpty}>No notes yet</p>
          ) : (
            notes.map(n => (
              <NavLink
                key={n.id}
                to={`/notes/${n.id}`}
                className={({ isActive }) => `${styles.noteLink} ${isActive ? styles.noteLinkActive : ""}`}
              >
                <span className={styles.noteIcon}>{n.icon ?? "📝"}</span>
                <span className={styles.noteTitle}>{n.title}</span>
              </NavLink>
            ))
          )}
        </div>

        {/* Bottom actions */}
        <div className={styles.sidebarBottom}>
          <button className={`btn btn-ghost btn-sm ${styles.newNoteBtn}`} onClick={createNote}>
            <PlusIcon />
            New note
          </button>
          <button className={`btn btn-ghost btn-sm ${styles.logoutBtn}`} onClick={logout}>
            <LogoutIcon />
            Log out
          </button>
        </div>
      </aside>

      <main className={styles.main}>{children}</main>

      <CommandPalette notes={notes} open={paletteOpen} onClose={() => setPaletteOpen(false)} />
    </div>
  );
}

function SearchIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
      <circle cx="7" cy="7" r="4.5" stroke="currentColor" strokeWidth="1.5" />
      <path d="M10.5 10.5L13 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function DashboardIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
      <rect x="1" y="1" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.4" />
      <rect x="9" y="1" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.4" />
      <rect x="1" y="9" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.4" />
      <rect x="9" y="9" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.4" />
    </svg>
  );
}

function NotesIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
      <path d="M3 2h10a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1z" stroke="currentColor" strokeWidth="1.4" />
      <path d="M5 5h6M5 8h6M5 11h4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

function StudyIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
      <rect x="2" y="4" width="12" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.4" />
      <path d="M2 7h12" stroke="currentColor" strokeWidth="1.4" />
      <path d="M6 2v2M10 2v2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
      <path d="M7 2v10M2 7h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function LogoutIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
      <path d="M6 3H3a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h3M10 11l3-3-3-3M5 8h8" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
