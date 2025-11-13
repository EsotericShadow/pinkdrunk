"use client";

import { useState } from "react";

const steps = [
  {
    title: "Recents remember you",
    body: "Your recent pours are stored here so you can re-log them with one tap.",
  },
  {
    title: "Popular is a mix",
    body: "A mixed list of popular cocktails, beers, wines, and RTDs ready for quick selection.",
  },
  {
    title: "All Search spans everything",
    body: "Search the full catalog by brand, flavor, or style anytime.",
  },
  {
    title: "Use custom for exact pours",
    body: "Enter ABV and volume manually when the presets don’t match what you had.",
  },
];

export function DrinkFormTutorial({ onDismiss }: { onDismiss: () => void }) {
  const [index, setIndex] = useState(0);
  const current = steps[index];
  const isLast = index === steps.length - 1;

  return (
    <div className="fixed inset-0 z-30 flex items-end justify-center px-4 pb-6 md:items-center md:pb-0" role="dialog" aria-modal="true">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        aria-hidden="true"
        onClick={onDismiss}
      />
      <div className="glass-panel relative w-full max-w-md space-y-4 border border-white/20 bg-[rgba(8,9,15,0.95)] p-5 text-sm text-muted shadow-[var(--shadow-hard)]">
        <div className="flex items-center justify-between">
          <span className="text-xs uppercase tracking-[0.4em] text-muted">Drink form tour</span>
          <button
            type="button"
            className="text-xs uppercase tracking-[0.3em] text-muted hover:text-foreground"
            onClick={onDismiss}
          >
            Skip
          </button>
        </div>
        <div>
          <p className="font-display text-lg text-foreground">{current.title}</p>
          <p className="mt-1 text-sm text-muted">{current.body}</p>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex gap-2">
            {steps.map((_, idx) => (
              <span
                key={idx}
                className={`h-1.5 w-8 rounded-full ${idx <= index ? "bg-[var(--color-primary)]" : "bg-white/15"}`}
              />
            ))}
          </div>
          <button
            type="button"
            className="rounded-full bg-[var(--color-primary)] px-5 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-[var(--color-background)]"
            onClick={() => {
              if (isLast) {
                onDismiss();
              } else {
                setIndex((prev) => prev + 1);
              }
            }}
          >
            {isLast ? "Done" : "Next"}
          </button>
        </div>
      </div>
    </div>
  );
}
