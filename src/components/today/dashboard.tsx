"use client";

import { useMemo, useState, useTransition } from "react";
import { formatDistanceToNow, parseISO } from "date-fns";

import { Button } from "@/components/ui/button";
import { getDefaultOptionForCategory } from "@/lib/drink-catalog";
import { InfoBanner } from "@/components/ui/info-banner";
import { DrinkFormState, EnhancedDrinkForm } from "./enhanced-drink-form";
import { PinkDrunkScale } from "./pinkdrunk-scale";
import { CalibrationPanel } from "./calibration-panel";

type Drink = {
  id: string;
  category: string;
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
      consumedAt: new Date(drink.consumedAt).toISOString(),
    })),
    careEvents: session.careEvents.map((event) => ({
      ...event,
      createdAt: new Date(event.createdAt).toISOString(),
    })),
    reportedLevel: session.reportedLevel ?? null,
  };
}


const buildDefaultDrinkForm = (): DrinkFormState => {
  const defaultOption = getDefaultOptionForCategory("beer");
  return {
    category: "beer",
    mode: "catalog",
    optionId: defaultOption?.id,
    label: defaultOption?.name ?? "",
    abvPercent: (defaultOption?.abvPercent ?? 5).toString(),
    volumeMl: (defaultOption?.defaultVolumeMl ?? 355).toString(),
    quantity: "1",
  };
};

export function TodayDashboard({ initialSession, initialPrediction, profileTargetLevel }: Props) {
  const [session, setSession] = useState<SessionPayload | null>(
    initialSession ? normalizeSessionPayload(initialSession) : null
  );
  const [prediction, setPrediction] = useState<PredictionPayload | null>(initialPrediction);
  const [drinkForm, setDrinkForm] = useState<DrinkFormState>(() => buildDefaultDrinkForm());
  const [errors, setErrors] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [feltLevelInput, setFeltLevelInput] = useState(() =>
    (initialPrediction?.levelEstimate ?? profileTargetLevel).toFixed(1)
  );

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

  const submitDrink = (
    payload: { category: DrinkFormState["category"]; label?: string; abvPercent: number; volumeMl: number },
    onSuccess?: () => void
  ) => {
    if (!session) return;
    setErrors(null);
    startTransition(async () => {
      const response = await fetch(`/api/session/${session.id}/drinks`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        setErrors("Could not log entry. Check your inputs.");
        return;
      }

      const data = (await response.json()) as { session: SessionPayload; prediction: PredictionPayload };
      setSession(normalizeSessionPayload(data.session));
      setPrediction(data.prediction);
      onSuccess?.();
    });
  };

  const submitCareEvent = (payload: { type: CareEvent["type"]; volumeMl?: number | null }) => {
    if (!session) return;
    setErrors(null);
    startTransition(async () => {
      const response = await fetch(`/api/session/${session.id}/care-events`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        setErrors("Could not log care event. Try again.");
        return;
      }

      const data = (await response.json()) as { session: SessionPayload; prediction: PredictionPayload };
      setSession(normalizeSessionPayload(data.session));
      setPrediction(data.prediction);
    });
  };

  const submitLevelReport = () => {
    if (!session) return;
    const parsedLevel = Number(feltLevelInput);
    if (!Number.isFinite(parsedLevel)) {
      setErrors("Enter how you actually feel first.");
      return;
    }
    setErrors(null);
    startTransition(async () => {
      const response = await fetch(`/api/session/${session.id}/report`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ level: parsedLevel }),
      });

      if (!response.ok) {
        setErrors("Could not record your level. Try again.");
        return;
      }

      const data = (await response.json()) as { session: SessionPayload; prediction: PredictionPayload };
      setSession(normalizeSessionPayload(data.session));
      setPrediction(data.prediction);
    });
  };

  const logDrink = () => {
    const abvPercent = Number(drinkForm.abvPercent);
    const baseVolume = Number(drinkForm.volumeMl);
    const quantity = Math.max(Number(drinkForm.quantity) || 1, 0.25);
    const volumeMl = baseVolume * quantity;

    if (!Number.isFinite(abvPercent) || abvPercent <= 0 || !Number.isFinite(volumeMl) || volumeMl <= 0) {
      setErrors("Enter a valid ABV and volume before logging.");
      return;
    }

    submitDrink(
      {
        category: drinkForm.category,
        label: drinkForm.label === "" ? undefined : drinkForm.label,
        abvPercent,
        volumeMl,
      },
      () => setDrinkForm(buildDefaultDrinkForm())
    );
  };

  const logWater = (volumeMl: number) => {
    submitCareEvent({ type: "water", volumeMl });
  };

  const logFood = (type: "snack" | "meal") => {
    submitCareEvent({ type, volumeMl: type === "snack" ? 80 : 200 });
  };

  const lastCareEvent = (type: CareEvent["type"] | "food") => {
    if (!session) return null;
    let matching: CareEvent[] = [];
    if (type === "food") {
      matching = session.careEvents.filter((event) => event.type === "meal" || event.type === "snack");
    } else {
      matching = session.careEvents.filter((event) => event.type === type);
    }
    matching.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    return matching.at(-1) ?? null;
  };

  const lastWater = lastCareEvent("water");
  const lastFood = lastCareEvent("food");

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

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-4 rounded-[var(--radius-lg)] border border-white/10 bg-white/5 p-8 backdrop-blur md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="font-display text-4xl uppercase tracking-[0.2em] text-white">Tonight</h1>
          <p className="mt-2 text-sm text-white/70">
            Log the chaos in real time so future-you has receipts. Hydrate if we yell. Ignore us if you love regret.
          </p>
        </div>
        {!session ? (
          <Button onClick={startSession} disabled={isPending}>
            Start a session
          </Button>
        ) : (
          <Button variant="secondary" onClick={() => endCurrentSession()} disabled={isPending}>
            End session
          </Button>
        )}
      </header>

      <InfoBanner
        title="How PinkDrunk mirrors your night"
        body="Log drinks with volume + ABV, tell us how you feel, and we’ll keep the prediction honest."
        items={[
          "Start a session before your first pour so timestamps stay accurate.",
          "Use the drink form’s presets or enter the ABV if it’s a custom mix.",
          "Tap the hydration/food buttons when you sip water or eat—it changes the model.",
          "End the session with your self-rated level so the system learns your curve.",
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
        </div>

        <div className="lg:col-span-2 space-y-4 rounded-[var(--radius-lg)] border border-white/10 bg-white/5 p-6 backdrop-blur">
          <h2 className="text-lg font-semibold text-white">Log a drink</h2>
          <EnhancedDrinkForm drinkForm={drinkForm} isPending={isPending} onChange={setDrinkForm} onSubmit={logDrink} disabled={!session} />
        </div>
      </section>

      <section className="rounded-[var(--radius-lg)] border border-white/10 bg-white/5 p-6 backdrop-blur">
        <h2 className="text-lg font-semibold text-white">Care actions</h2>
        <p className="mt-1 text-sm text-white/70">
          Hydrate and refuel to keep your metabolism on your side. These entries gently pull predictions down instead of letting the curve run away.
        </p>
        <div className="mt-4 grid gap-3 md:grid-cols-4">
          <Button variant="secondary" disabled={!session || isPending} onClick={() => logWater(240)}>
            + 8 oz water
          </Button>
          <Button variant="secondary" disabled={!session || isPending} onClick={() => logWater(480)}>
            + 16 oz water
          </Button>
          <Button
            variant="secondary"
            className="border-white/20 bg-transparent text-white hover:border-white"
            disabled={!session || isPending}
            onClick={() => logFood("snack")}
          >
            Logged a snack
          </Button>
          <Button
            variant="secondary"
            className="border-white/20 bg-transparent text-white hover:border-white"
            disabled={!session || isPending}
            onClick={() => logFood("meal")}
          >
            Ate a meal
          </Button>
        </div>
        <div className="mt-4 flex flex-wrap gap-4 text-xs uppercase tracking-wide text-white/60">
          <span>
            Last water: {lastWater ? formatDistanceToNow(parseISO(lastWater.createdAt), { addSuffix: true }) : "not yet"}
          </span>
          <span>
            Last food: {lastFood ? formatDistanceToNow(parseISO(lastFood.createdAt), { addSuffix: true }) : "not yet"}
          </span>
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

      <section className="space-y-4 rounded-[var(--radius-lg)] border border-white/10 bg-white/5 p-6 backdrop-blur">
        <div>
          <h2 className="text-lg font-semibold text-white">Call your level</h2>
          <p className="mt-1 text-sm text-white/70">
            Tell us how you actually feel (0–10). We’ll use it to calibrate your personal thresholds.
          </p>
        </div>
        <div className="flex flex-col gap-3">
          <input
            type="range"
            min={0}
            max={10}
            step={0.1}
            value={feltLevelInput}
            onChange={(event) => setFeltLevelInput(event.target.value)}
            className="accent-[var(--color-primary)]"
            disabled={!session || isPending}
          />
          <div className="flex flex-wrap items-center gap-3">
            <input
              type="number"
              min={0}
              max={10}
              step={0.1}
              value={feltLevelInput}
              onChange={(event) => setFeltLevelInput(event.target.value)}
              disabled={!session || isPending}
              className="w-24 rounded-md border border-white/20 bg-transparent px-3 py-2 text-sm text-white focus:border-[var(--color-primary)] focus:outline-none"
            />
            <Button onClick={submitLevelReport} disabled={!session || isPending}>
              Save felt level
            </Button>
            {session?.reportedLevel != null && (
              <p className="text-xs uppercase tracking-wide text-white/60">
                Last reported: level {session.reportedLevel.toFixed(1)}
              </p>
            )}
          </div>
        </div>
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
                className="flex items-center justify-between rounded-[var(--radius-sm)] bg-white/5 px-4 py-3 text-sm text-white/80"
              >
                <div>
                  <p className="font-semibold text-white">
                    {drink.label || drink.category}
                  </p>
                  <p className="text-xs text-white/60">
                    {drink.abvPercent}% · {drink.volumeMl}ml · consumed {formatDistanceToNow(parseISO(drink.consumedAt), { addSuffix: true })}
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
