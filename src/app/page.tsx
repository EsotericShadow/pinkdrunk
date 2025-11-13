import Link from "next/link";

const heroHighlights = [
  { label: "Tracked pours", value: "250k+" },
  { label: "Sessions adjusted", value: "42% faster" },
  { label: "Hydration saves", value: "18,903" },
];

const featureCards = [
  {
    title: "Auto-math logging",
    body: "Macro lagers, mezcal riffs, hard kombucha—everything is converted to grams, not vibes.",
  },
  {
    title: "Felt-state updates",
    body: "Tap your level, let EWMA do the rest. Thresholds move with your chaos, not old data.",
  },
  {
    title: "Care modifiers",
    body: "Hydration and snacks temporarily bend absorption curves so you see reality, not fear.",
  },
  {
    title: "Projection mode",
    body: "Preview the night before you hit submit—peak time, level, and recovery ETA in one card.",
  },
];

const roadmap = [
  {
    title: "01 · Profile",
    body: "Height, meds, tone tolerance. Cold, clinical inputs so the jokes land later.",
  },
  {
    title: "02 · Session",
    body: "Log pours, log how you feel, let the model nag you to sip water like it’s a hobby.",
  },
  {
    title: "03 · Debrief",
    body: "See what actually happened and what needs to chill before the next lap.",
  },
];

export default function Home() {
  return (
    <main className="flex flex-col gap-16 py-10">
      <section className="grid gap-10 rounded-[var(--radius-lg)] bg-[linear-gradient(140deg,rgba(240,91,231,0.18),rgba(75,242,197,0.12))] p-8 text-left shadow-[var(--shadow-hard)] lg:grid-cols-[1.05fr_0.95fr] lg:gap-14 lg:p-12">
        <div className="space-y-6">
          <span className="tag-pill inline-flex items-center gap-3 text-xs text-muted">
            <span className="h-2 w-2 rounded-full bg-[var(--color-accent)]"></span>
            Skin-in-the-game harm reduction
          </span>
          <h1 className="heading text-[var(--color-primary)]">
            The friend who watches the bar when you don’t.
          </h1>
          <p className="text-lg text-muted">
            PINKDRUNK keeps score so you don’t have to: pours in, feels out, hydration reminders, “maybe sit down” warnings. No judgment—just honest receipts.
          </p>
          <div className="grid gap-4 md:grid-cols-2">
            <HeroCard
              title="Every drink becomes math"
              description="Custom catalog + grams-first modelling keep projections honest even when bartenders freestyle."
            />
            <HeroCard
              title="Report how you actually feel"
              description="One tap on the felt scale nudges your impairment thresholds with EWMA brainpower."
            />
          </div>
          <div className="flex flex-col gap-4 sm:flex-row">
            <Link
              href="/signup"
              className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-secondary)] px-10 py-4 font-display text-lg uppercase tracking-[0.35em] text-[var(--color-background)] shadow-[var(--shadow-hard)] transition hover:scale-[1.02]"
            >
              Start logging
            </Link>
            <Link
              href="/signin"
              className="inline-flex items-center justify-center rounded-full border border-white/20 px-10 py-4 text-sm font-semibold text-muted transition hover:border-white/50 hover:text-foreground"
            >
              Already calibrated? Sign in
            </Link>
          </div>
        </div>
        <div className="glass-panel relative overflow-hidden p-6">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(240,91,231,0.2),transparent)]" />
          <div className="relative space-y-6">
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase tracking-[0.4em] text-muted">Live telemetry</span>
              <span className="rounded-full bg-[var(--color-secondary)]/30 px-3 py-1 text-xs uppercase tracking-[0.2em] text-[var(--color-secondary)]">beta</span>
            </div>
            {heroHighlights.map((metric) => (
              <div key={metric.label} className="border-b border-white/10 pb-4">
                <p className="text-sm text-muted">{metric.label}</p>
                <p className="font-display text-4xl text-[var(--color-foreground)]">{metric.value}</p>
              </div>
            ))}
            <div>
              <p className="text-sm uppercase tracking-[0.4em] text-muted">Tonight’s vibe</p>
              <p className="mt-2 text-2xl font-semibold text-[var(--color-foreground)]">“You’re fine. Also you said that last time.”</p>
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
