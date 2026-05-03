import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { AppLayout } from "../../components/AppLayout";
import { FlashcardPlayer } from "../../components/FlashcardPlayer";
import { Skeleton } from "../../components/Skeleton";
import { EmptyState } from "../../components/EmptyState";
import { api, Flashcard } from "../../lib/api";
import styles from "./StudyPage.module.css";

export function StudyPage() {
  const [dueCards, setDueCards] = useState<Flashcard[]>([]);
  const [loading, setLoading] = useState(true);
  const [started, setStarted] = useState(false);
  const [sessionScores, setSessionScores] = useState<number[]>([]);
  const [sessionDone, setSessionDone] = useState(false);
  const [reviewed, setReviewed] = useState(0);

  useEffect(() => {
    api.ai.getDueFlashcards()
      .then(setDueCards)
      .catch(e => toast.error(e instanceof Error ? e.message : "Failed to load due cards"))
      .finally(() => setLoading(false));
  }, []);

  function handleDone(reviewedCount: number, scores: number[]) {
    setSessionScores(scores);
    setReviewed(reviewedCount);
    setSessionDone(true);
    setStarted(false);
    // Refresh due cards after session
    api.ai.getDueFlashcards()
      .then(setDueCards)
      .catch(() => {/* silent */});
  }

  function startOver() {
    setSessionDone(false);
    setSessionScores([]);
    setReviewed(0);
  }

  const avgScore = sessionScores.length > 0
    ? sessionScores.reduce((a, b) => a + b, 0) / sessionScores.length
    : 0;
  const avgPct = Math.round(avgScore * 100);

  return (
    <AppLayout>
      <div className={styles.page}>
        <div className={styles.pageHeader}>
          <h1 className={styles.heading}>Study</h1>
        </div>

        {/* Loading */}
        {loading && (
          <div className={styles.lobbyCard}>
            <Skeleton width="48px" height="48px" borderRadius="50%" />
            <Skeleton width="180px" height="24px" borderRadius="6px" />
            <Skeleton width="280px" height="14px" borderRadius="4px" />
            <Skeleton width="120px" height="36px" borderRadius="6px" />
          </div>
        )}

        {/* Session done summary */}
        {!loading && sessionDone && (
          <div className={styles.summary}>
            <div className={styles.summaryIcon}>🎉</div>
            <h2 className={styles.summaryTitle}>Session complete!</h2>
            <p className={styles.summarySubtitle}>You reviewed {reviewed} card{reviewed !== 1 ? "s" : ""}.</p>
            {sessionScores.length > 0 && (
              <div className={`${styles.summaryScore} ${avgPct >= 80 ? styles.green : avgPct >= 40 ? styles.yellow : styles.red}`}>
                {avgPct}%
                <span className={styles.summaryScoreLabel}>average score</span>
              </div>
            )}
            <div className={styles.summaryActions}>
              <button className="btn btn-outline" onClick={startOver}>Back to lobby</button>
              {dueCards.length > 0 && (
                <button className="btn btn-primary" onClick={() => { setStarted(true); setSessionDone(false); }}>
                  Study {dueCards.length} more card{dueCards.length !== 1 ? "s" : ""}
                </button>
              )}
            </div>
          </div>
        )}

        {/* Lobby */}
        {!loading && !started && !sessionDone && (
          <>
            {dueCards.length === 0 ? (
              <EmptyState
                icon="🎉"
                title="All caught up!"
                message="No cards are due right now. Great work keeping up with your reviews! Check back later or add more notes."
              />
            ) : (
              <div className={styles.lobbyCard}>
                <div className={styles.lobbyIcon}>🃏</div>
                <h2 className={styles.lobbyTitle}>{dueCards.length} card{dueCards.length !== 1 ? "s" : ""} due for review</h2>
                <p className={styles.lobbySubtitle}>
                  Answer each question, then type your response for AI feedback and spaced-repetition scheduling.
                </p>
                <div className={styles.lobbyStats}>
                  <span className={styles.lobbyStat}>
                    <span className={styles.lobbyStatValue}>{dueCards.length}</span>
                    <span className={styles.lobbyStatLabel}>Cards due</span>
                  </span>
                </div>
                <button className="btn btn-primary btn-lg" onClick={() => setStarted(true)}>
                  Start session →
                </button>
              </div>
            )}
          </>
        )}

        {/* Active study session */}
        {started && (
          <div className={styles.session}>
            <button className="btn btn-outline btn-sm" onClick={() => setStarted(false)}>
              ← Exit session
            </button>
            <FlashcardPlayer cards={dueCards} onDone={handleDone} />
          </div>
        )}
      </div>
    </AppLayout>
  );
}
