"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { formatDistance, parseISO } from "date-fns";

import { Button } from "@/components/ui/button";
import type { DrinkCategory } from "@/lib/drink-catalog";
import { InfoBanner } from "@/components/ui/info-banner";
import { PinkDrunkScale } from "./pinkdrunk-scale";
import { CalibrationPanel } from "./calibration-panel";
import { SessionAssistantChat } from "./session-assistant-chat";

type Drink = {
  id: string;
  category: DrinkCategory;
  label?: string | null;
  abvPercent: number;
  volumeMl: number;
  consumedAt: string;
};

type CareEvent = {
  id: string;
  type: "water" | "snack" | "meal";
  volumeMl?: number | null;
  createdAt: string;
};

export type SessionPayload = {
  id: string;
  startedAt: string;
  targetLevel: number;
  drinks: Drink[];
  careEvents: CareEvent[];
  reportedLevel?: number | null;
  reportedAt?: string | null;
};

export type PredictionPayload = {
  sessionId: string;
  levelEstimate: number;
  bac: number;
  adjustedBac: number;
  drinksToTarget: number;
  recommendedAction: "keep" | "slow" | "stop" | "hydrate" | "abort";
  minutesToTarget: number;
  targetLevel: number;
  targetBac: number;
  thresholds: Array<{ level: number; grams: number; confidence: number }>;
  absorbedAlcoholGrams: number;
};

type Props = {
  initialSession: SessionPayload | null;
  initialPrediction: PredictionPayload | null;
  profileTargetLevel: number;
};

function normalizeSessionPayload(session: SessionPayload): SessionPayload {
  return {
    ...session,
    startedAt: new Date(session.startedAt).toISOString(),
    drinks: session.drinks.map((drink) => ({
      ...drink,
      category: drink.category as DrinkCategory,
      consumedAt: new Date(drink.consumedAt).toISOString(),
    })),
    careEvents: session.careEvents.map((event) => ({
      ...event,
      createdAt: new Date(event.createdAt).toISOString(),
    })),
    reportedLevel: session.reportedLevel ?? null,
    reportedAt: session.reportedAt ? new Date(session.reportedAt).toISOString() : null,
  };
}

export function TodayDashboard({ initialSession, initialPrediction, profileTargetLevel }: Props) {
  const [session, setSession] = useState<SessionPayload | null>(
    initialSession ? normalizeSessionPayload(initialSession) : null
  );
  const [prediction, setPrediction] = useState<PredictionPayload | null>(initialPrediction);
  const [errors, setErrors] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const interval = window.setInterval(() => setNow(Date.now()), 30_000);
    return () => window.clearInterval(interval);
  }, []);

  const stepStates = useMemo(() => {
    const hasSession = Boolean(session);
    const hasDrink = Boolean(session && session.drinks.length > 0);
    const hasFeelReport = Boolean(session && session.reportedLevel != null);
    const hasHydration = Boolean(session && session.careEvents.some((event) => event.type === "water"));

    const steps = [
      {
        key: "start",
        label: "Start session",
        description: hasSession ? "Session running." : "Tap Start to begin.",
        done: hasSession,
      },
      {
        key: "drink",
        label: "Chat a drink",
        description: hasDrink ? "Latest pour saved." : "Tell the assistant what you sipped.",
        done: hasDrink,
      },
      {
        key: "feel",
        label: "Share feelings",
        description: hasFeelReport ? "Last check-in saved." : "Explain how you feel in chat when prompted.",
        done: hasFeelReport,
      },
      {
        key: "hydrate",
        label: "Sip water",
        description: hasHydration ? "Hydration logged." : "Mention water or snacks so we log care events.",
        done: hasHydration,
      },
    ];

    let foundCurrent = false;
    return steps.map((step) => {
      if (step.done) {
        return { ...step, status: "done" as const };
      }
      if (!foundCurrent) {
        foundCurrent = true;
        return { ...step, status: "current" as const };
      }
      return { ...step, status: "upcoming" as const };
    });
  }, [session]);

  const statusPanel = useMemo(() => {
    if (!session || !prediction) {
      return {
        title: "No active session",
        subtitle: "Start logging drinks to see your PinkDrunk insights.",
      };
    }

    const delta = prediction.levelEstimate - prediction.targetLevel;
    let tone = "In the zone";
    if (delta >= 2) tone = "Danger zone";
    else if (delta >= 1) tone = "Too hot";
    else if (delta <= -1) tone = "You could keep sipping";

    return {
      title: `Level ${prediction.levelEstimate.toFixed(1)} — ${tone}`,
      subtitle: `Target ${prediction.targetLevel} · Recommendation: ${prediction.recommendedAction.toUpperCase()}`,
    };
  }, [session, prediction]);

  const reportedSummary = useMemo(() => {
    if (!session || session.reportedLevel == null || !session.reportedAt) {
      return null;
    }
    const reportedDate = parseISO(session.reportedAt);
    const drinksAtReport = session.drinks.filter(
      (drink) => parseISO(drink.consumedAt).getTime() <= reportedDate.getTime()
    ).length;
    return {
      drinks: drinksAtReport,
      timestamp: reportedDate,
    };
  }, [session]);

  useEffect(() => {
    if (!session?.id) {
      return;
    }

    let cancelled = false;

    const refreshSession = async () => {
      try {
        const response = await fetch("/api/session/current", { cache: "no-store" });
        if (!response.ok) {
          return;
        }
        const data = (await response.json()) as {
          session: SessionPayload | null;
          prediction: PredictionPayload | null;
        };
        if (cancelled) return;
        if (data.session) {
          setSession(normalizeSessionPayload(data.session));
          setPrediction(data.prediction);
        } else {
          setSession(null);
          setPrediction(null);
        }
      } catch (error) {
        console.warn("Could not refresh session", error);
      }
    };

    refreshSession();
    const interval = window.setInterval(refreshSession, 60_000);
    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, [session?.id]);

  const startSession = () => {
    setErrors(null);
    startTransition(async () => {
      const response = await fetch("/api/session/start", { method: "POST" });
      if (!response.ok) {
        setErrors("Couldn’t start session. Complete onboarding first.");
        return;
      }
      const data = (await response.json()) as { session: SessionPayload; prediction: PredictionPayload };
      setSession(normalizeSessionPayload(data.session));
      setPrediction(data.prediction);
    });
  };

  const endCurrentSession = (reason: "user_end" | "auto_alert" | "timeout" = "user_end") => {
    if (!session) return;
    setErrors(null);
    startTransition(async () => {
      const response = await fetch(`/api/session/${session.id}/end`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason }),
      });

      if (!response.ok) {
        setErrors("Couldn’t end session, please try again.");
        return;
      }

      setSession(null);
      setPrediction(null);
    });
  };

  const handleAssistantUpdate = (next: { session: SessionPayload; prediction: PredictionPayload }) => {
    setSession(normalizeSessionPayload(next.session));
    setPrediction(next.prediction);
  };

  return (
    <div className="space-y-8">
      <section className="glass-panel space-y-4 p-5">
        <div className="flex items-center justify-between">
          <p className="text-xs uppercase tracking-[0.4em] text-muted">Tonight checklist</p>
          <p className="text-xs text-muted">Follow each step in order.</p>
        </div>
        <div className="grid gap-3 md:grid-cols-4">
          {stepStates.map((step) => (
            <div
              key={step.key}
              className={`rounded-[var(--radius-md)] border px-4 py-3 text-sm transition ${
                step.status === "done"
                  ? "border-emerald-400/40 bg-emerald-400/10 text-emerald-100"
                  : step.status === "current"
                    ? "border-white/40 bg-white/10 text-white"
                    : "border-white/10 bg-transparent text-muted"
              }`}
            >
              <p className="text-xs uppercase tracking-[0.3em]">{step.label}</p>
              <p className="mt-1 text-[13px] leading-tight">{step.description}</p>
            </div>
          ))}
        </div>
      </section>
      <header className="flex flex-col gap-4 rounded-[var(--radius-lg)] border border-white/10 bg-white/5 p-8 backdrop-blur md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="font-display text-4xl uppercase tracking-[0.2em] text-white">Tonight</h1>
          <p className="mt-2 text-sm text-white/70">
            Talk to PinkDrunk like a friend: describe pours, show photos, and explain how you feel. We’ll keep the log updated.
          </p>
        </div>
        {!session ? (
          <Button onClick={startSession} disabled={isPending}>
            Start session
          </Button>
        ) : (
          <Button variant="secondary" onClick={() => endCurrentSession()} disabled={isPending}>
            End session
          </Button>
        )}
      </header>

      <InfoBanner
        title="How to use tonight"
        body="Keep these tips in mind while you move through the night."
        items={[
          "Start a session before your first drink so timing stays accurate.",
          "Snap a photo or describe the pour—PinkDrunk will log the drink for you.",
          "Tell the assistant how you feel and when you hydrate or snack.",
          "End the session once you’re done so the recap stays crisp.",
        ]}
      />

      {errors && (
        <p className="rounded-md border border-red-400 bg-red-500/10 px-4 py-3 text-sm text-red-200">{errors}</p>
      )}

      <section className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-4 rounded-[var(--radius-lg)] border border-white/10 bg-white/5 p-6 backdrop-blur">
          <h2 className="text-lg font-semibold text-white">Status</h2>
          <p className="text-xl font-semibold text-[var(--color-primary)]">{statusPanel.title}</p>
          <p className="text-sm text-white/70">{statusPanel.subtitle}</p>
          {prediction && (
            <div className="mt-4 grid grid-cols-2 gap-3 text-sm text-white/80">
              <Metric label="BAC (adj)" value={prediction.adjustedBac.toFixed(3)} />
              <Metric label="Drinks to target" value={prediction.drinksToTarget.toString()} />
              <Metric label="Minutes to descend" value={`${prediction.minutesToTarget}`} />
              <Metric label="Recommendation" value={prediction.recommendedAction.toUpperCase()} />
            </div>
          )}
          {session?.reportedLevel != null && reportedSummary && (
            <p className="text-xs uppercase tracking-wide text-white/60">
              Last reported level {session.reportedLevel.toFixed(1)} after {reportedSummary.drinks} drink
              {reportedSummary.drinks === 1 ? "" : "s"} · {formatDistance(reportedSummary.timestamp, new Date(now), { addSuffix: true })}
            </p>
          )}
        </div>

        <div className="lg:col-span-2 space-y-4 rounded-[var(--radius-lg)] border border-white/10 bg-white/5 p-0 backdrop-blur">
          <SessionAssistantChat
            session={session}
            onSessionUpdate={handleAssistantUpdate}
          />
        </div>
      </section>

      <section>
        <PinkDrunkScale
          currentLevel={prediction?.levelEstimate}
          targetLevel={session?.targetLevel || prediction?.targetLevel || profileTargetLevel || 5}
        />
      </section>

      <section className="rounded-[var(--radius-lg)] border border-white/10 bg-white/5 p-6 backdrop-blur">
        <CalibrationPanel
          thresholds={prediction?.thresholds ?? []}
          targetLevel={session?.targetLevel ?? prediction?.targetLevel ?? profileTargetLevel}
          reportedLevel={session?.reportedLevel ?? null}
        />
      </section>

      <section className="rounded-[var(--radius-lg)] border border-white/10 bg-white/5 p-6 backdrop-blur">
        <h2 className="text-lg font-semibold text-white">Tonight’s log</h2>
        {!session || session.drinks.length === 0 ? (
          <p className="mt-2 text-sm text-white/60">No drinks logged yet.</p>
        ) : (
          <ul className="mt-4 space-y-3">
            {session.drinks.map((drink) => (
              <li
                key={drink.id}
                className="space-y-3 rounded-[var(--radius-sm)] bg-white/5 px-4 py-3 text-sm text-white/80"
              >
                <div>
                  <p className="font-semibold text-white">
                    {drink.label || drink.category}
                  </p>
                  <p className="text-xs text-white/60">
                    {drink.category} · {drink.abvPercent}% · {drink.volumeMl}ml · consumed {formatDistance(parseISO(drink.consumedAt), new Date(now), { addSuffix: true })}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[var(--radius-sm)] bg-white/5 px-3 py-2">
      <p className="text-xs uppercase tracking-wide text-white/60">{label}</p>
      <p className="text-sm font-semibold text-white">{value}</p>
    </div>
  );
}
