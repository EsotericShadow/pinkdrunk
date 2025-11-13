"use client";

import { useState } from "react";

const steps = [
  {
    title: "Recents remember you",
    body: "The last dozen pours you logged—across categories—live here for one-tap reuse.",
  },
  {
    title: "Popular is a mix",
    body: "We highlight iconic cocktails, beloved beers, crowd-favorite wines, and ready-to-drinks in one feed.",
  },
  {
    title: "All Search spans everything",
    body: "Search every brand, flavor, and style we track. No active session required.",
  },
  {
    title: "Custom when you need precision",
    body: "Dial in ABV × volume manually for rare pours or experimental blends.",
  },
];

export function DrinkFormTutorial({ onDismiss }: { onDismiss: () => void }) {
  const [index, setIndex] = useState(0);
  const current = steps[index];
  const isLast = index === steps.length - 1;

  return (
    <div className="glass-panel fixed inset-x-4 bottom-4 z-30 space-y-4 border border-white/15 bg-[rgba(5,6,11,0.85)] p-4 text-sm text-muted shadow-[var(--shadow-soft)] md:inset-x-auto md:right-8 md:w-96">
      <div className="flex items-center justify-between">
        <span className="text-xs uppercase tracking-[0.4em] text-muted">Drink form tour</span>
        <button
          type="button"
          className="text-xs uppercase tracking-[0.3em] text-muted hover:text-foreground"
          onClick={() => {
            onDismiss();
          }}
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
              className={`h-2 w-8 rounded-full ${idx <= index ? "bg-[var(--color-primary)]" : "bg-white/10"}`}
            />
          ))}
        </div>
        <button
          type="button"
          className="rounded-full bg-[var(--color-primary)] px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-[var(--color-background)]"
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
  );
}
