import Link from "next/link";

const heroHighlights = [
  { label: "1. Start", body: "Open a session before your first pour." },
  { label: "2. Log drink", body: "Pick a preset card or add a quick custom pour." },
  { label: "3. Stay on track", body: "We remind you to check in, hydrate, or slow down." },
];

const featureCards = [
  {
    title: "Clear guidance",
    body: "We translate the numbers into prompts like “Wait 20 minutes” or “Grab some water.”",
  },
  {
    title: "Quick drink cards",
    body: "Beer, wine, cocktail, shot—each card shows the default pour so you rarely type.",
  },
  {
    title: "Easy feel check-ins",
    body: "Emoji faces pop up periodically. Tap how you feel and we update the projection.",
  },
  {
    title: "Care reminders",
    body: "Hydration and snack buttons log support actions and gently soften the curve.",
  },
];

const roadmap = [
  {
    title: "01 · Quick setup",
    body: "Enter the basics now and update deeper profile details later.",
  },
  {
    title: "02 · Guided session",
    body: "Follow the checklist: start, log, feel, hydrate.",
  },
  {
    title: "03 · Next-day summary",
    body: "Wake up to a recap so you know what worked.",
  },
];

export default function Home() {
  return (
    <main className="flex flex-col gap-16 py-10">
      <section className="grid gap-10 rounded-[var(--radius-lg)] bg-[linear-gradient(140deg,rgba(240,91,231,0.18),rgba(75,242,197,0.12))] p-8 text-left shadow-[var(--shadow-hard)] lg:grid-cols-[1.05fr_0.95fr] lg:gap-14 lg:p-12">
        <div className="space-y-6">
          <span className="tag-pill inline-flex items-center gap-3 text-xs text-muted">
            <span className="h-2 w-2 rounded-full bg-[var(--color-accent)]"></span>
            Guided nights, zero guesswork
          </span>
          <h1 className="heading text-[var(--color-primary)]">
            We keep your night on track.
          </h1>
          <p className="text-lg text-muted">
            Pinkdrunk walks you through the evening: start a session, tap the drink you had, and we nudge you when it’s time to slow down or hydrate. Simple buttons, clear reminders.
          </p>
          <div className="grid gap-4 md:grid-cols-2">
            <HeroCard
              title="You tap, we handle math"
              description="Default pours + auto conversions mean no ounce guessing or ABV searching."
            />
            <HeroCard
              title="Feel check in plain words"
              description="Emoji faces and giant buttons instead of tiny sliders or confusing scales."
            />
          </div>
          <div className="flex flex-col gap-3 text-center sm:flex-row sm:items-center sm:pl-6 sm:text-left">
            <div className="sm:text-left">
              <Link
                href="/signup"
                className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-secondary)] px-8 py-3 font-display text-xs uppercase tracking-[0.18em] text-[var(--color-background)] shadow-[var(--shadow-hard)] transition hover:scale-[1.02] whitespace-nowrap"
              >
                Start session
              </Link>
              <p className="mt-1 text-xs uppercase tracking-[0.3em] text-muted">setup takes ~30s</p>
            </div>
            <div className="sm:ml-[4.6rem] sm:text-left">
              <Link
                href="/signin"
                className="inline-flex items-center justify-center rounded-full border border-white/20 px-9 py-3.5 text-sm font-semibold uppercase tracking-[0.18em] text-muted transition hover:border-white/50 hover:text-foreground"
              >
                Sign in
              </Link>
              <p className="mt-1 text-xs uppercase tracking-[0.3em] text-muted">already have an account</p>
            </div>
          </div>
        </div>
        <div className="glass-panel relative overflow-hidden p-6">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(240,91,231,0.2),transparent)]" />
          <div className="relative space-y-6">
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase tracking-[0.4em] text-muted">How it works</span>
              <span className="rounded-full bg-[var(--color-secondary)]/30 px-3 py-1 text-xs uppercase tracking-[0.2em] text-[var(--color-secondary)]">simple steps</span>
            </div>
            {heroHighlights.map((step) => (
              <div key={step.label} className="border-b border-white/10 pb-4">
                <p className="text-sm font-semibold text-[var(--color-foreground)]">{step.label}</p>
                <p className="mt-1 text-sm text-muted">{step.body}</p>
              </div>
            ))}
            <div>
              <p className="text-sm uppercase tracking-[0.4em] text-muted">Promise</p>
              <p className="mt-2 text-2xl font-semibold text-[var(--color-foreground)]">“No thinking required. Just tap when you sip.”</p>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-6 md:grid-cols-2">
        {featureCards.map((card) => (
          <FeatureCard key={card.title} title={card.title} body={card.body} />
        ))}
      </section>

      <section className="glass-panel grid gap-8 p-8 md:grid-cols-3">
        {roadmap.map((step) => (
          <div key={step.title} className="space-y-3">
            <p className="text-xs uppercase tracking-[0.4em] text-muted">{step.title}</p>
            <p className="text-base text-[var(--color-foreground)]">{step.body}</p>
          </div>
        ))}
      </section>
    </main>
  );
}

function HeroCard({ title, description }: { title: string; description: string }) {
  return (
    <div className="rounded-[var(--radius-md)] border border-white/10 bg-white/5 p-4 text-sm text-muted backdrop-blur">
      <p className="text-sm font-semibold text-foreground">{title}</p>
      <p className="text-sm text-muted mt-1">{description}</p>
    </div>
  );
}

function FeatureCard({ title, body }: { title: string; body: string }) {
  return (
    <div className="glass-panel h-full p-6">
      <p className="text-xs uppercase tracking-[0.4em] text-muted">Capability</p>
      <h3 className="mt-2 text-xl font-semibold text-[var(--color-foreground)]">{title}</h3>
      <p className="mt-3 text-sm text-muted">{body}</p>
    </div>
  );
}
