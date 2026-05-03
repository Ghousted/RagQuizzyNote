import { useState } from "react";
import toast from "react-hot-toast";
import { api, Quiz, QuizQuestion, QuizAnswerResult } from "../lib/api";
import styles from "./QuizPlayer.module.css";

type Props = { quiz: Quiz; onDone?: (score: number, total: number) => void };

const OPTION_LABELS = ["A", "B", "C", "D", "E", "F"];

export function QuizPlayer({ quiz, onDone }: Props) {
  const [index, setIndex] = useState(0);
  const [result, setResult] = useState<QuizAnswerResult | null>(null);
  const [selected, setSelected] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [totalScore, setTotalScore] = useState(0);
  const [done, setDone] = useState(false);

  if (!quiz.questions.length) return <p className={styles.empty}>No questions in this quiz.</p>;

  const q = quiz.questions[index] as QuizQuestion;
  const progressPct = (index / quiz.questions.length) * 100;

  async function select(i: number) {
    if (result || loading) return;
    setSelected(i);
    setLoading(true);
    try {
      const r = await api.ai.answerQuiz(quiz.id, q.id, i);
      setResult(r);
      if (r.correct) setTotalScore(s => s + 1);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to submit answer");
    } finally {
      setLoading(false);
    }
  }

  function next() {
    if (index + 1 >= quiz.questions.length) {
      const finalScore = totalScore + (result?.correct ? 1 : 0);
      setDone(true);
      onDone?.(finalScore, quiz.questions.length);
      return;
    }
    setIndex(i => i + 1);
    setResult(null);
    setSelected(null);
  }

  function restart() {
    setIndex(0);
    setDone(false);
    setResult(null);
    setSelected(null);
    setTotalScore(0);
  }

  if (done) {
    const finalScore = totalScore;
    const pct = Math.round((finalScore / quiz.questions.length) * 100);
    const scoreClass = pct >= 80 ? styles.scoreGreen : pct >= 50 ? styles.scoreYellow : styles.scoreRed;

    return (
      <div className={styles.done}>
        <div className={styles.doneEmoji}>{pct >= 80 ? "🏆" : pct >= 50 ? "👍" : "📚"}</div>
        <div className={`${styles.finalScore} ${scoreClass}`}>
          {pct}%
        </div>
        <p className={styles.doneTitle}>{finalScore} / {quiz.questions.length} correct</p>
        <p className={styles.doneMsg}>
          {pct >= 80 ? "Excellent work! You've mastered this material." : pct >= 50 ? "Good effort — keep reviewing to improve." : "Review the material and try again."}
        </p>
        <button className="btn btn-primary btn-lg" onClick={restart}>Retake quiz</button>
      </div>
    );
  }

  return (
    <div className={styles.player}>
      {/* Header / Progress */}
      <div className={styles.header}>
        <div className={styles.questionBadge}>Q{index + 1}</div>
        <div className={styles.progressTrack}>
          <div className={styles.progressFill} style={{ width: `${progressPct}%` }} />
        </div>
        <span className={styles.counter}>{index + 1} / {quiz.questions.length}</span>
      </div>

      {/* Card */}
      <div className={styles.card}>
        <p className={styles.question}>{q.question}</p>

        <div className={styles.options}>
          {q.options.map((opt, i) => {
            let cls = styles.option;
            if (result && i === q.correct_index) cls += ` ${styles.optionCorrect}`;
            else if (result && i === selected && !result.correct) cls += ` ${styles.optionWrong}`;
            else if (selected === i && !result) cls += ` ${styles.optionSelected}`;
            return (
              <button
                key={i}
                className={cls}
                onClick={() => select(i)}
                disabled={!!result || loading}
              >
                <span className={styles.optLabel}>{OPTION_LABELS[i]}</span>
                <span className={styles.optText}>{opt.replace(/^[A-D]\.\s*/, "")}</span>
                {result && i === q.correct_index && <CheckIcon />}
                {result && i === selected && !result.correct && <CrossIcon />}
              </button>
            );
          })}
        </div>

        {result && (
          <div className={`${styles.feedback} ${result.correct ? styles.feedbackCorrect : styles.feedbackWrong}`}>
            <div className={styles.feedbackLabel}>
              {result.correct ? "✓ Correct!" : "✗ Incorrect"}
            </div>
            {result.explanation && <p className={styles.explanation}>{result.explanation}</p>}
            <button className="btn btn-primary btn-sm" onClick={next}>
              {index + 1 >= quiz.questions.length ? "See results" : "Next question →"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function CheckIcon() {
  return (
    <svg className={styles.resultIcon} width="14" height="14" viewBox="0 0 14 14" fill="none">
      <path d="M2.5 7L5.5 10L11.5 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function CrossIcon() {
  return (
    <svg className={styles.resultIcon} width="14" height="14" viewBox="0 0 14 14" fill="none">
      <path d="M3 3l8 8M11 3l-8 8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}
