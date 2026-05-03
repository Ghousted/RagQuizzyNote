import styles from "./LandingPage.module.css";

const FEATURES = [
  {
    icon: "🃏",
    title: "Smart Flashcards",
    desc: "Paste your notes. Get targeted flashcards that cover every key concept — generated in seconds.",
  },
  {
    icon: "📝",
    title: "Adaptive Quizzes",
    desc: "Multiple-choice quizzes that prioritise the topics you struggle with most.",
  },
  {
    icon: "🔁",
    title: "Spaced Repetition",
    desc: "Cards resurface at exactly the right time using SM-2. Never forget what you've learned.",
  },
  {
    icon: "💡",
    title: "AI Explanations",
    desc: "Don't understand something? Get a clear explanation grounded in your own notes.",
  },
];

export function LandingPage() {
  return (
    <div className={styles.page}>
      {/* Nav */}
      <nav className={styles.nav}>
        <span className={styles.logo}>QuizzyNote</span>
        <div className={styles.navLinks}>
          <a href="/login" className="btn btn-outline">Log in</a>
          <a href="/register" className="btn btn-primary">Get started</a>
        </div>
      </nav>

      {/* Hero */}
      <section className={styles.hero}>
        <div className={styles.badge}>AI-powered learning</div>
        <h1 className={styles.heroTitle}>
          Turn your notes into a<br />
          <span className={styles.accent}>personal learning engine</span>
        </h1>
        <p className={styles.heroSub}>
          QuizzyNote converts any note into flashcards, quizzes, and explanations
          — then adapts to your weaknesses so you learn faster.
        </p>
        <div className={styles.heroCta}>
          <a href="/register" className="btn btn-primary">Start learning free</a>
          <a href="#how-it-works" className="btn btn-outline">See how it works</a>
        </div>
      </section>

      {/* Demo */}
      <section className={styles.demo}>
        <div className="container">
          <div className={styles.demoCard}>
            <div className={styles.demoNote}>
              <div className={styles.demoLabel}>Your note</div>
              <p>
                Photosynthesis converts sunlight into chemical energy stored as glucose.
                It occurs in chloroplasts using chlorophyll. The overall reaction is:
                6CO₂ + 6H₂O + light → C₆H₁₂O₆ + 6O₂.
              </p>
            </div>
            <div className={styles.demoArrow}>→</div>
            <div className={styles.demoFlashcard}>
              <div className={styles.demoLabel}>Generated flashcard</div>
              <p className={styles.cardQ}>Where does photosynthesis occur in plant cells?</p>
              <p className={styles.cardA}>In the chloroplasts, using chlorophyll to absorb light energy.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="how-it-works" className={styles.features}>
        <div className="container">
          <h2 className={styles.sectionTitle}>Everything you need to actually learn</h2>
          <div className={styles.featureGrid}>
            {FEATURES.map((f) => (
              <div key={f.title} className={styles.featureCard}>
                <span className={styles.featureIcon}>{f.icon}</span>
                <h3>{f.title}</h3>
                <p>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className={styles.cta}>
        <div className="container">
          <h2>Start learning smarter today</h2>
          <p>Free to use. No credit card required.</p>
          <a href="/register" className="btn btn-primary">Create your account</a>
        </div>
      </section>

      {/* Footer */}
      <footer className={styles.footer}>
        <div className="container">
          <span className={styles.logo}>QuizzyNote</span>
          <span className={styles.muted}>AI-powered learning engine</span>
        </div>
      </footer>
    </div>
  );
}
