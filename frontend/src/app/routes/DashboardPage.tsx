import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { AppLayout } from "../../components/AppLayout";
import { Skeleton, SkeletonText } from "../../components/Skeleton";
import { api, DashboardStats, WeakTopic, Flashcard, NoteSummary } from "../../lib/api";
import styles from "./DashboardPage.module.css";

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

export function DashboardPage() {
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [weakTopics, setWeakTopics] = useState<WeakTopic[]>([]);
  const [dueCards, setDueCards] = useState<Flashcard[]>([]);
  const [recentNotes, setRecentNotes] = useState<NoteSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.dashboard.stats(),
      api.dashboard.weakTopics(),
      api.dashboard.dueCards(),
      api.notes.list(),
    ])
      .then(([s, w, d, notes]) => {
        setStats(s);
        setWeakTopics(w);
        setDueCards(d);
        setRecentNotes(notes.slice(0, 4));
      })
      .catch(e => toast.error(e instanceof Error ? e.message : "Failed to load dashboard"))
      .finally(() => setLoading(false));
  }, []);

  const fmt = (d: string) =>
    new Date(d).toLocaleDateString(undefined, { month: "short", day: "numeric" });

  return (
    <AppLayout>
      <div className={styles.page}>
        {/* Greeting */}
        <div className={styles.greeting}>
          <h1 className={styles.greetingText}>{getGreeting()} 👋</h1>
          <p className={styles.greetingSubtitle}>Here's what's happening with your studies.</p>
        </div>

        {/* Stats row */}
        {loading ? (
          <div className={styles.statsGrid}>
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className={styles.statCard}>
                <Skeleton width="40px" height="28px" borderRadius="4px" />
                <Skeleton width="60px" height="12px" borderRadius="4px" />
              </div>
            ))}
          </div>
        ) : stats ? (
          <div className={styles.statsGrid}>
            <StatCard label="Notes" value={stats.notes} icon="📝" />
            <StatCard label="Flashcards" value={stats.flashcards} icon="🃏" />
            <StatCard label="Reviews" value={stats.reviews} icon="🔄" />
            <StatCard label="Due today" value={stats.due_cards} icon="⏰" highlight={stats.due_cards > 0} />
            <StatCard
              label="Accuracy"
              value={stats.overall_accuracy != null ? `${(stats.overall_accuracy * 100).toFixed(0)}%` : "—"}
              icon="🎯"
            />
          </div>
        ) : null}

        {/* Due cards CTA */}
        {!loading && dueCards.length > 0 && (
          <div className={styles.dueCta}>
            <div className={styles.dueCtaLeft}>
              <span className={styles.dueCtaIcon}>⚡</span>
              <div>
                <p className={styles.dueCtaTitle}>{dueCards.length} card{dueCards.length !== 1 ? "s" : ""} due for review</p>
                <p className={styles.dueCtaSubtitle}>Keep your streak going — review now!</p>
              </div>
            </div>
            <button className="btn btn-primary" onClick={() => navigate("/study")}>
              Start studying →
            </button>
          </div>
        )}

        {/* Weak topics */}
        {!loading && weakTopics.length > 0 && (
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>Needs work</h2>
            <div className={styles.topicList}>
              {weakTopics.map(t => (
                <div key={t.topic_id} className={styles.topicRow}>
                  <span className={styles.topicName}>{t.name}</span>
                  <div className={styles.topicRight}>
                    <div className={styles.accuracyBar}>
                      <div
                        className={styles.accuracyFill}
                        style={{
                          width: `${t.accuracy * 100}%`,
                          background: t.accuracy < 0.4 ? "var(--red)" : "var(--yellow)",
                        }}
                      />
                    </div>
                    <span className={styles.accuracyPct}>{(t.accuracy * 100).toFixed(0)}%</span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Weak topics skeleton */}
        {loading && (
          <section className={styles.section}>
            <Skeleton width="100px" height="16px" borderRadius="4px" />
            <div className={styles.topicList} style={{ marginTop: 12 }}>
              {[1, 2].map(i => (
                <div key={i} className={styles.topicRow}>
                  <Skeleton width="120px" height="14px" />
                  <Skeleton width="80px" height="8px" borderRadius="4px" />
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Recent notes */}
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Recent notes</h2>
            <Link to="/notes" className={styles.seeAll}>See all →</Link>
          </div>

          {loading ? (
            <div className={styles.recentList}>
              {[1, 2, 3].map(i => (
                <div key={i} className={styles.recentRow}>
                  <Skeleton width="20px" height="20px" borderRadius="4px" />
                  <SkeletonText lines={1} />
                </div>
              ))}
            </div>
          ) : recentNotes.length === 0 ? (
            <p className={styles.emptyMsg}>
              No notes yet. <Link to="/notes" className={styles.emptyLink}>Add your first note →</Link>
            </p>
          ) : (
            <div className={styles.recentList}>
              {recentNotes.map(n => (
                <Link key={n.id} to={`/notes/${n.id}`} className={styles.recentRow}>
                  <span className={styles.recentIcon}>{n.icon ?? "📝"}</span>
                  <span className={styles.recentTitle}>{n.title}</span>
                  <span className={styles.recentDate}>{fmt(n.updated_at)}</span>
                </Link>
              ))}
            </div>
          )}
        </section>
      </div>
    </AppLayout>
  );
}

function StatCard({ label, value, icon, highlight = false }: {
  label: string;
  value: string | number;
  icon: string;
  highlight?: boolean;
}) {
  return (
    <div className={`${styles.statCard} ${highlight ? styles.statHighlight : ""}`}>
      <span className={styles.statIcon}>{icon}</span>
      <span className={styles.statValue}>{value}</span>
      <span className={styles.statLabel}>{label}</span>
    </div>
  );
}
