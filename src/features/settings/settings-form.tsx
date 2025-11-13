"use client";

import { useEffect, useMemo, useState, useTransition, type ReactNode } from "react";
import type { UnitSystem } from "@prisma/client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { SettingsPayload } from "@/lib/settings";

const DEFAULT_VOLUME_METRIC = 355;

const mlToOz = (ml: number) => ml / 29.5735;
const ozToMl = (oz: number) => oz * 29.5735;

export type SettingsFormProps = {
  initialSettings: SettingsPayload;
};

export function SettingsForm({ initialSettings }: SettingsFormProps) {
  const [form, setForm] = useState<SettingsPayload>(initialSettings);
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    setForm(initialSettings);
  }, [initialSettings]);

  const defaultVolumeDisplay = useMemo(() => {
    const volume = form.defaultVolume ?? DEFAULT_VOLUME_METRIC;
    return form.units === "metric" ? volume : mlToOz(volume);
  }, [form]);

  const volumeLabel = form.units === "metric" ? "Default pour (ml)" : "Default pour (oz)";

  const handleVolumeChange = (value: number) => {
    if (Number.isNaN(value)) {
      setForm((prev) => ({ ...prev, defaultVolume: null }));
      return;
    }
    const mlValue = form.units === "metric" ? value : ozToMl(value);
    setForm((prev) => ({ ...prev, defaultVolume: parseFloat(mlValue.toFixed(1)) }));
  };

  const submit = () => {
    setMessage(null);
    startTransition(async () => {
      const response = await fetch("/api/settings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });

      if (!response.ok) {
        setMessage("Couldn’t save settings. Try again.");
        return;
      }

      setMessage("Saved");
    });
  };

  return (
    <form
      className="space-y-8"
      onSubmit={(event) => {
        event.preventDefault();
        submit();
      }}
    >
      <section className="space-y-4 rounded-[var(--radius-lg)] border border-white/10 bg-white/5 p-6 backdrop-blur">
        <header>
          <h2 className="text-lg font-semibold text-white">Units & defaults</h2>
          <p className="text-sm text-white/60">Pick how PinkDrunk displays pours and ABV suggestions.</p>
        </header>

        <div className="space-y-2">
          <label className="text-xs uppercase tracking-wide text-white/60">Units</label>
          <div className="flex gap-3">
            {(["metric", "imperial"] as UnitSystem[]).map((unit) => (
              <ToggleButton
                key={unit}
                active={form.units === unit}
                onClick={() => setForm((prev) => ({ ...prev, units: unit }))}
                label={unit === "metric" ? "Metric (ml)" : "Imperial (oz)"}
              />
            ))}
          </div>
          <p className="text-xs text-white/50">
            Switching units only affects defaults here. Profile height/weight are converted separately.
          </p>
        </div>

        <div className="space-y-2">
          <label className="text-xs uppercase tracking-wide text-white/60">{volumeLabel}</label>
          <Input
            type="number"
            min={form.units === "metric" ? 30 : 1}
            max={form.units === "metric" ? 2000 : 60}
            step={form.units === "metric" ? 5 : 0.5}
            value={Number(defaultVolumeDisplay.toFixed(1))}
            onChange={(event) => handleVolumeChange(Number(event.target.value))}
          />
          <p className="text-xs text-white/50">
            {form.units === "metric"
              ? `${form.defaultVolume ?? DEFAULT_VOLUME_METRIC} ml ≈ ${mlToOz(form.defaultVolume ?? DEFAULT_VOLUME_METRIC).toFixed(1)} oz`
              : `${(form.defaultVolume ?? DEFAULT_VOLUME_METRIC).toFixed(0)} ml stored under the hood.`}
          </p>
        </div>

        <div className="space-y-2">
          <label className="text-xs uppercase tracking-wide text-white/60">ABV suggestions</label>
          <ToggleGroup>
            <ToggleButton
              active={form.showAbvSuggestions}
              label="Show suggestions"
              onClick={() => setForm((prev) => ({ ...prev, showAbvSuggestions: true }))}
            />
            <ToggleButton
              active={!form.showAbvSuggestions}
              label="Hide suggestions"
              onClick={() => setForm((prev) => ({ ...prev, showAbvSuggestions: false }))}
            />
          </ToggleGroup>
        </div>
      </section>

      <section className="space-y-4 rounded-[var(--radius-lg)] border border-white/10 bg-white/5 p-6 backdrop-blur">
        <header>
          <h2 className="text-lg font-semibold text-white">Notifications</h2>
          <p className="text-sm text-white/60">Control nudges when you approach risky zones.</p>
        </header>

        <ToggleGroup>
          <ToggleButton
            active={form.enableNotifications}
            label="Enable alerts"
            onClick={() =>
              setForm((prev) => ({
                ...prev,
                enableNotifications: true,
                notificationThreshold: prev.notificationThreshold ?? 7,
              }))
            }
          />
          <ToggleButton
            active={!form.enableNotifications}
            label="Mute alerts"
            onClick={() => setForm((prev) => ({ ...prev, enableNotifications: false }))}
          />
        </ToggleGroup>

        <div
          className={`space-y-3 ${form.enableNotifications ? "" : "opacity-40"}`}
        >
          <div className="flex items-center justify-between text-sm text-white/80">
            <span>Warn me when PinkDrunk level hits</span>
            <span className="font-semibold text-white">{form.notificationThreshold ?? 7}</span>
          </div>
          <input
            type="range"
            min={1}
            max={10}
            step={1}
            disabled={!form.enableNotifications}
            value={form.notificationThreshold ?? 7}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, notificationThreshold: Number(event.target.value) }))
            }
            className="w-full accent-[var(--color-primary)]"
          />
        </div>
      </section>

      {message && (
        <p className={`text-sm ${message === "Saved" ? "text-emerald-300" : "text-red-300"}`}>{message}</p>
      )}

      <div className="flex justify-end gap-3">
        <Button type="submit" disabled={isPending} className="min-w-[160px]">
          {isPending ? "Saving..." : "Save settings"}
        </Button>
      </div>
    </form>
  );
}

function ToggleGroup({ children }: { children: ReactNode }) {
  return <div className="flex flex-wrap gap-3">{children}</div>;
}

function ToggleButton({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full px-4 py-2 text-sm transition ${
        active ? "bg-[var(--color-primary)] text-[var(--color-background)]" : "bg-white/10 text-white/70 hover:text-white"
      }`}
    >
      {label}
    </button>
  );
}
