"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { formatDistance, parseISO } from "date-fns";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DrinkCategory, getDefaultOptionForCategory } from "@/lib/drink-catalog";
import { InfoBanner } from "@/components/ui/info-banner";
import { DrinkFormState, EnhancedDrinkForm } from "./enhanced-drink-form";
import { PinkDrunkScale } from "./pinkdrunk-scale";
import { CalibrationPanel } from "./calibration-panel";

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

type EditDrinkFormState = {
  label: string;
  abvPercent: string;
  volumeMl: string;
  category: DrinkFormState["category"];
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

const buildEmptyEditForm = (): EditDrinkFormState => ({
  label: "",
  abvPercent: "",
  volumeMl: "",
  category: "beer",
});

const drinkCategories: DrinkFormState["category"][] = ["beer", "wine", "cocktail", "shot", "other"];

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
  const [editingDrinkId, setEditingDrinkId] = useState<string | null>(null);
  const [editDrinkForm, setEditDrinkForm] = useState<EditDrinkFormState>(() => buildEmptyEditForm());
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
        label: "Log a drink",
        description: hasDrink ? "Latest pour saved." : "Tap a drink card right after you sip.",
        done: hasDrink,
      },
      {
        key: "feel",
        label: "Check feelings",
        description: hasFeelReport
          ? "Last check-in saved."
          : "When the emoji appears, tap the face that matches how you feel.",
        done: hasFeelReport,
      },
      {
        key: "hydrate",
        label: "Sip water",
        description: hasHydration ? "Hydration logged." : "Use a water button after every couple of drinks.",
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
    const trimmedLabel = drinkForm.label?.trim() ?? "";
    const fallbackLabel =
      trimmedLabel.length > 0
        ? trimmedLabel
        : drinkForm.mode === "custom"
          ? `Custom ${drinkForm.category}`
          : getDefaultOptionForCategory(drinkForm.category)?.name ?? drinkForm.category;

    if (!Number.isFinite(abvPercent) || abvPercent <= 0 || !Number.isFinite(volumeMl) || volumeMl <= 0) {
      setErrors("Enter a valid ABV and volume before logging.");
      return;
    }

    submitDrink(
      {
        category: drinkForm.category,
        label: fallbackLabel,
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

  const startEditingDrink = (drink: Drink) => {
    setErrors(null);
    setEditingDrinkId(drink.id);
    setEditDrinkForm({
      label: drink.label ?? "",
      abvPercent: drink.abvPercent.toString(),
      volumeMl: drink.volumeMl.toString(),
      category: drink.category,
    });
  };

  const cancelEditingDrink = () => {
    setEditingDrinkId(null);
    setEditDrinkForm(buildEmptyEditForm());
  };

  const handleEditDrinkFieldChange = <K extends keyof EditDrinkFormState>(
    field: K,
    value: EditDrinkFormState[K]
  ) => {
    setEditDrinkForm((previous) => ({ ...previous, [field]: value }));
  };

  const saveEditedDrink = () => {
    if (!session || !editingDrinkId) return;

    const trimmedLabel = editDrinkForm.label.trim();
    const abvPercent = Number(editDrinkForm.abvPercent);
    const volumeMl = Number(editDrinkForm.volumeMl);

    if (!trimmedLabel) {
      setErrors("Give the drink a short label first.");
      return;
    }

    if (!Number.isFinite(abvPercent) || abvPercent <= 0 || !Number.isFinite(volumeMl) || volumeMl <= 0) {
      setErrors("Enter valid ABV and volume numbers before saving.");
      return;
    }

    setErrors(null);
    startTransition(async () => {
      const response = await fetch(`/api/session/${session.id}/drinks/${editingDrinkId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          category: editDrinkForm.category,
          label: trimmedLabel,
          abvPercent,
          volumeMl,
        }),
      });

      if (!response.ok) {
        setErrors("Could not update drink. Try again.");
        return;
      }

      const data = (await response.json()) as { session: SessionPayload; prediction: PredictionPayload };
      setSession(normalizeSessionPayload(data.session));
      setPrediction(data.prediction);
      cancelEditingDrink();
    });
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

  useEffect(() => {
    if (!session?.id || editingDrinkId) {
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
  }, [session?.id, editingDrinkId]);

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
            Track each drink and how you feel so tomorrow’s you knows exactly what happened.
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
        body="Keep these four steps in mind while you move through the night."
        items={[
          "Start a session before your first drink so timing stays accurate.",
          "Pick a drink card or add quick custom details right after you finish a pour.",
          "When the emoji prompt appears, report how you feel.",
          "Use the water or snack buttons and end the session with a final level.",
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
          Log water or food so the projection reflects what your body is doing right now.
        </p>
        <div className="mt-4 grid gap-3 md:grid-cols-4">
          <Button variant="secondary" disabled={!session || isPending} onClick={() => logWater(240)}>
            Water 8oz
          </Button>
          <Button variant="secondary" disabled={!session || isPending} onClick={() => logWater(480)}>
            Water 16oz
          </Button>
          <Button
            variant="secondary"
            className="border-white/20 bg-transparent text-white hover:border-white"
            disabled={!session || isPending}
            onClick={() => logFood("snack")}
          >
            Log snack
          </Button>
          <Button
            variant="secondary"
            className="border-white/20 bg-transparent text-white hover:border-white"
            disabled={!session || isPending}
            onClick={() => logFood("meal")}
          >
            Log meal
          </Button>
        </div>
        <div className="mt-4 flex flex-wrap gap-4 text-xs uppercase tracking-wide text-white/60">
          <span>
            Last water: {lastWater ? formatDistance(parseISO(lastWater.createdAt), new Date(now), { addSuffix: true }) : "not yet"}
          </span>
          <span>
            Last food: {lastFood ? formatDistance(parseISO(lastFood.createdAt), new Date(now), { addSuffix: true }) : "not yet"}
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
              Save level
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
                className="space-y-3 rounded-[var(--radius-sm)] bg-white/5 px-4 py-3 text-sm text-white/80"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="font-semibold text-white">
                      {drink.label || drink.category}
                    </p>
                    <p className="text-xs text-white/60">
                      {drink.category} · {drink.abvPercent}% · {drink.volumeMl}ml · consumed {" "}
                      {formatDistance(parseISO(drink.consumedAt), new Date(now), { addSuffix: true })}
                    </p>
                  </div>
                  {editingDrinkId !== drink.id && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="self-start sm:self-auto"
                      onClick={() => startEditingDrink(drink)}
                      disabled={isPending}
                    >
                      Edit
                    </Button>
                  )}
                </div>
                {editingDrinkId === drink.id && (
                  <form
                    className="space-y-3 rounded-[var(--radius-sm)] border border-white/10 bg-black/30 p-3"
                    onSubmit={(event) => {
                      event.preventDefault();
                      saveEditedDrink();
                    }}
                  >
                    <div className="grid gap-3 md:grid-cols-4">
                      <div className="md:col-span-2">
                        <label className="text-xs uppercase tracking-wide text-white/60">Label</label>
                        <Input
                          value={editDrinkForm.label}
                          onChange={(event) => handleEditDrinkFieldChange("label", event.target.value)}
                          disabled={isPending}
                        />
                      </div>
                      <div>
                        <label className="text-xs uppercase tracking-wide text-white/60">Category</label>
                        <select
                          value={editDrinkForm.category}
                          onChange={(event) =>
                            handleEditDrinkFieldChange("category", event.target.value as DrinkFormState["category"])
                          }
                          disabled={isPending}
                          className="w-full rounded-md border border-white/20 bg-transparent px-3 py-2 text-sm capitalize text-white focus:border-[var(--color-primary)] focus:outline-none"
                        >
                          {drinkCategories.map((category) => (
                            <option key={category} value={category} className="bg-[#0f0f0f] text-white">
                              {category}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="text-xs uppercase tracking-wide text-white/60">ABV %</label>
                        <Input
                          type="number"
                          min="0.1"
                          max="96"
                          step="0.1"
                          value={editDrinkForm.abvPercent}
                          onChange={(event) => handleEditDrinkFieldChange("abvPercent", event.target.value)}
                          disabled={isPending}
                        />
                      </div>
                      <div>
                        <label className="text-xs uppercase tracking-wide text-white/60">Volume (ml)</label>
                        <Input
                          type="number"
                          min="10"
                          max="2000"
                          step="10"
                          value={editDrinkForm.volumeMl}
                          onChange={(event) => handleEditDrinkFieldChange("volumeMl", event.target.value)}
                          disabled={isPending}
                        />
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button type="button" variant="secondary" onClick={cancelEditingDrink} disabled={isPending}>
                        Cancel
                      </Button>
                      <Button type="submit" disabled={isPending}>
                        Save changes
                      </Button>
                    </div>
                  </form>
                )}
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
