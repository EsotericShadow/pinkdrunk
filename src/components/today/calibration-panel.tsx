import type { PredictionPayload } from "@/components/today/dashboard";

const STANDARD_DRINK_GRAMS = 14;

type CalibrationPanelProps = {
  thresholds: PredictionPayload["thresholds"];
  targetLevel: number;
  reportedLevel: number | null;
};

export function CalibrationPanel({ thresholds, targetLevel, reportedLevel }: CalibrationPanelProps) {
  if (!thresholds || thresholds.length === 0) {
    return (
      <div>
        <h2 className="text-lg font-semibold text-white">Calibration</h2>
        <p className="mt-1 text-sm text-white/60">Log how you feel to teach PinkDrunk your personal thresholds.</p>
      </div>
    );
  }

  const levelsToShow = Array.from(new Set([targetLevel - 1, targetLevel, targetLevel + 1]))
    .filter((level) => level >= 1 && level <= 10)
    .map((level) => thresholds.find((entry) => entry.level === level))
    .filter(Boolean) as PredictionPayload["thresholds"];

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-white">Calibration</h2>
        <p className="mt-1 text-sm text-white/70">
          Model confidence about your target. More felt-level reports tighten these bands.
        </p>
        {reportedLevel != null && (
          <p className="text-xs uppercase tracking-wide text-[var(--color-primary)]">
            Last reported level {reportedLevel.toFixed(1)}
          </p>
        )}
      </div>
      <div className="grid gap-3 md:grid-cols-3">
        {levelsToShow.map((entry) => (
          <div key={entry.level} className="rounded-[var(--radius-md)] border border-white/15 bg-white/5 p-3">
            <p className="text-xs uppercase tracking-wide text-white/60">Level {entry.level}</p>
            <p className="text-lg font-semibold text-white">
              {formatDrinks(entry.grams)} drinks
            </p>
            <p className="text-xs text-white/60">{confidenceLabel(entry.confidence)}</p>
         </div>
       ))}
     </div>
   </div>
 );
}

function formatDrinks(grams: number) {
  if (!Number.isFinite(grams) || grams <= 0) {
    return "—";
  }
  return (grams / STANDARD_DRINK_GRAMS).toFixed(1);
}

function formatConfidence(value: number) {
  if (!Number.isFinite(value)) {
    return "0%";
  }
  return `${Math.round(value * 100)}%`;
}

function confidenceLabel(value: number) {
  if (!Number.isFinite(value)) {
    return "Confidence 0%";
  }
  const percent = Math.round(value * 100);
  if (percent >= 75) {
    return `Confidence ${percent}% (dialed)`;
  }
  if (percent >= 40) {
    return `Confidence ${percent}% (learning)`;
  }
  return `Confidence ${percent}% (needs reports)`;
}
