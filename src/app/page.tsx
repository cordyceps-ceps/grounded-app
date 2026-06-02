const BREASTFEEDING_SOURCES = [
  {
    title: "The Nursing Mother's Companion",
    author: "Kathleen Huggins",
  },
  {
    title: "The Womanly Art of Breastfeeding",
    author: "La Leche League International",
  },
  {
    title: "Breastfeeding Made Simple",
    author: "Nancy Mohrbacher",
  },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="px-6 pt-14 pb-10 text-center">
        <h1 className="font-heading text-4xl text-primary mb-3 tracking-tight">
          Grounded
        </h1>
        <p className="text-secondary text-base font-body max-w-xs mx-auto leading-relaxed">
          Answers from books you trust
        </p>
      </header>

      {/* Main content */}
      <main className="px-5 pb-16 max-w-lg mx-auto">

        {/* Welcome message */}
        <div className="mb-8 text-center">
          <p className="text-muted text-sm leading-relaxed">
            What would you like to know today?
          </p>
        </div>

        {/* Topic cards */}
        <section>
          <h2 className="font-heading text-lg text-foreground mb-4 px-1">
            Your topics
          </h2>

          {/* Breastfeeding topic card */}
          <div className="bg-card border border-card-border rounded-2xl overflow-hidden">

            {/* Card header */}
            <div className="px-5 pt-5 pb-4 border-b border-card-border">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="font-heading text-xl text-foreground mb-1">
                    Breastfeeding Guide
                  </h3>
                  <p className="text-secondary text-sm leading-relaxed">
                    Evidence-based answers from trusted experts
                  </p>
                </div>
                <span className="shrink-0 mt-1 text-xs font-body font-medium text-accent bg-accent/10 px-2.5 py-1 rounded-full">
                  3 books
                </span>
              </div>
            </div>

            {/* Sources */}
            <div className="px-5 py-4">
              <p className="text-xs font-body font-medium text-muted uppercase tracking-wider mb-3">
                Sources
              </p>
              <ul className="space-y-2.5">
                {BREASTFEEDING_SOURCES.map((source) => (
                  <li key={source.title} className="flex items-start gap-3">
                    {/* Book spine accent */}
                    <div className="shrink-0 mt-0.5 w-1 h-9 rounded-full bg-primary/25" />
                    <div>
                      <p className="text-sm text-foreground leading-snug">
                        <em>{source.title}</em>
                      </p>
                      <p className="text-xs text-muted mt-0.5">{source.author}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            {/* CTA */}
            <div className="px-5 pb-5">
              <button
                className="w-full py-3 px-4 rounded-xl bg-primary text-white font-body font-medium text-sm
                           hover:bg-primary-hover active:scale-[0.98] transition-all duration-150
                           focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-card"
              >
                Ask a question
              </button>
            </div>
          </div>
        </section>

        {/* Disclaimer */}
        <p className="mt-10 text-center text-xs text-muted leading-relaxed px-4">
          Grounded draws from expert books but is not a replacement for medical advice.
        </p>
      </main>
    </div>
  );
}
