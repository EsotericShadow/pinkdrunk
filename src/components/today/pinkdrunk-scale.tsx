"use client";

type Props = {
  currentLevel?: number;
  targetLevel?: number;
};

const scaleLevels = [
  { level: 0, emoji: "🧊", label: "DD", description: "Stone cold sober" },
  { level: 1, emoji: "🙂", label: "Sober", description: "Normal baseline" },
  { level: 2, emoji: "😌", label: "Buzzed", description: "Warm-up phase" },
  { level: 3, emoji: "😎", label: "Mini tipsy", description: "Edges getting soft" },
  { level: 4, emoji: "🥳", label: "Tipsy", description: "Peak social" },
  { level: 5, emoji: "🍸", label: "Drunk", description: "Classic drunk" },
  { level: 6, emoji: "💗", label: "PinkDrunk", description: "Your sweet spot" },
  { level: 7, emoji: "🤪", label: "Wasted", description: "Weird decisions" },
  { level: 8, emoji: "🤢", label: "Blackout likely", description: "Memory gap zone" },
  { level: 9, emoji: "🚨", label: "Danger", description: "Body throws flags" },
  { level: 10, emoji: "💀", label: "You're still alive?", description: "Emergency" },
];

export function PinkDrunkScale({ currentLevel, targetLevel = 5 }: Props) {
  return (
    <div className="space-y-4 rounded-[var(--radius-lg)] border border-white/10 bg-white/5 p-6 backdrop-blur">
      <div>
        <h2 className="text-lg font-semibold text-white">PinkDrunk Scale</h2>
        <p className="mt-1 text-sm text-white/60">
          {currentLevel !== undefined
            ? `You're at level ${currentLevel.toFixed(1)}`
            : "Track your level in real-time"}
        </p>
        <p className="mt-2 text-xs text-white/50">
          0 = DD, 6 = PinkDrunk (your sweet spot), 10 = “you’re still alive?”. Use it as a mirror, not a dare.
        </p>
      </div>

      <div className="space-y-2">
        {scaleLevels.map((item) => {
          const isCurrent = currentLevel !== undefined && Math.floor(currentLevel) === item.level;
          const isTarget = targetLevel === item.level;
          const isPast = currentLevel !== undefined && currentLevel > item.level;

          return (
            <div
              key={item.level}
              className={`flex items-center gap-3 rounded-md px-3 py-2 transition-colors ${
                isCurrent
                  ? "bg-[var(--color-primary)]/20 border-2 border-[var(--color-primary)]"
                  : isTarget
                    ? "bg-[var(--color-primary)]/10 border border-[var(--color-primary)]/50"
                    : isPast
                      ? "bg-white/5 opacity-60"
                      : "bg-white/5"
              }`}
            >
              <div className="flex min-w-[3rem] items-center gap-2">
                <span className="text-2xl">{item.emoji}</span>
                <span className="text-sm font-semibold text-white/80">{item.level}</span>
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-white">{item.label}</span>
                  {isCurrent && (
                    <span className="rounded-full bg-[var(--color-primary)] px-2 py-0.5 text-xs font-semibold text-[var(--color-background)]">
                      CURRENT
                    </span>
                  )}
                  {isTarget && !isCurrent && (
                    <span className="rounded-full bg-[var(--color-primary)]/50 px-2 py-0.5 text-xs font-semibold text-white">
                      TARGET
                    </span>
                  )}
                </div>
                <p className="text-xs text-white/60">{item.description}</p>
              </div>
            </div>
          );
        })}
      </div>

      {currentLevel !== undefined && (
        <div className="mt-4 rounded-md bg-white/5 p-3 text-center">
          <p className="text-sm text-white/80">
            <span className="font-semibold text-[var(--color-primary)]">
              {currentLevel < targetLevel
                ? `${(targetLevel - currentLevel).toFixed(1)} levels to go`
                : currentLevel > targetLevel
                  ? `${(currentLevel - targetLevel).toFixed(1)} levels over`
                  : "You're at your target!"}
            </span>
          </p>
        </div>
      )}
    </div>
  );
}
