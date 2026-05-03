import { useState } from "react";
import toast from "react-hot-toast";
import { api, Flashcard, AnswerResult } from "../lib/api";
import styles from "./FlashcardPlayer.module.css";

type Props = { cards: Flashcard[]; onDone?: (reviewed: number, scores: number[]) => void };

export function FlashcardPlayer({ cards, onDone }: Props) {
  const [index, setIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [answer, setAnswer] = useState("");
  const [result, setResult] = useState<AnswerResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [scores, setScores] = useState<number[]>([]);

  if (!cards.length) return <p className={styles.empty}>No flashcards to study.</p>;

  const card = cards[index];
  const progressPct = ((index + (result ? 1 : 0)) / cards.length) * 100;

  async function submit() {
    if (!answer.trim()) return;
    setLoading(true);
    try {
      const r = await api.ai.answerFlashcard(card.id, answer);
      setResult(r);
      setScores(s => [...s, r.score]);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to check answer");
    } finally {
      setLoading(false);
    }
  }

  function next() {
    if (index + 1 >= cards.length) {
      setDone(true);
      onDone?.(cards.length, [...scores, result?.score ?? 0]);
      return;
    }
    setIndex(i => i + 1);
    setRevealed(false);
    setAnswer("");
    setResult(null);
  }

  function restart() {
    setIndex(0);
    setDone(false);
    setResult(null);
    setRevealed(false);
    setAnswer("");
    setScores([]);
  }

  if (done) {
    const avg = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
    const pct = Math.round(avg * 100);
    const scoreClass = pct >= 80 ? styles.scoreGreen : pct >= 40 ? styles.scoreYellow : styles.scoreRed;

    return (
      <div className={styles.done}>
        <div className={styles.doneEmoji}>🎉</div>
        <h3 className={styles.doneTitle}>Session complete!</h3>
        <p className={styles.doneSubtitle}>You reviewed all {cards.length} cards.</p>
        {scores.length > 0 && (
          <div className={`${styles.avgScore} ${scoreClass}`}>
            {pct}%
            <span className={styles.avgLabel}>average score</span>
          </div>
        )}
        <button className="btn btn-primary btn-lg" onClick={restart}>Restart session</button>
      </div>
    );
  }

  const scoreColor = result
    ? result.score >= 0.8
      ? "var(--green)"
      : result.score >= 0.4
        ? "var(--yellow)"
        : "var(--red)"
    : "";

  const scoreClass = result
    ? result.score >= 0.8
      ? styles.scoreGreen
      : result.score >= 0.4
        ? styles.scoreYellow
        : styles.scoreRed
    : "";

  return (
    <div className={styles.player}>
      {/* Progress */}
      <div className={styles.progressHeader}>
        <div className={styles.progressTrack}>
          <div className={styles.progressFill} style={{ width: `${progressPct}%` }} />
        </div>
        <span className={styles.counter}>{index + 1} / {cards.length}</span>
      </div>

      {/* Card */}
      <div className={styles.card}>
        <p className={styles.question}>{card.question}</p>

        {!revealed && (
          <button className="btn btn-outline" onClick={() => setRevealed(true)}>
            Reveal answer
          </button>
        )}

        {revealed && (
          <div className={styles.answerSection}>
            <div className={styles.referenceAnswer}>
              <span className={styles.refLabel}>Reference answer</span>
              <p className={styles.refText}>{card.answer}</p>
            </div>

            {!result && (
              <div className={styles.inputSection}>
                <textarea
                  className="textarea"
                  placeholder="Type your answer to get AI feedback…"
                  value={answer}
                  onChange={e => setAnswer(e.target.value)}
                  rows={3}
                />
                <div className={styles.actions}>
                  <button className="btn btn-primary" onClick={submit} disabled={loading || !answer.trim()}>
                    {loading ? "Checking…" : "Check answer"}
                  </button>
                  <button className="btn btn-outline" onClick={next}>Skip</button>
                </div>
              </div>
            )}

            {result && (
              <div className={styles.result}>
                <div className={`${styles.scorePct} ${scoreClass}`} style={{ color: scoreColor }}>
                  {(result.score * 100).toFixed(0)}%
                </div>
                <p className={styles.reasoning}>{result.reasoning}</p>
                {result.missed_concepts.length > 0 && (
                  <p className={styles.missed}>
                    <strong>Missed: </strong>{result.missed_concepts.join(", ")}
                  </p>
                )}
                <p className={styles.interval}>
                  Next review in {result.new_interval_days} day{result.new_interval_days !== 1 ? "s" : ""}
                </p>
                <button className="btn btn-primary" onClick={next}>
                  {index + 1 >= cards.length ? "Finish" : "Next card →"}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
