import { redirect } from "next/navigation";
import { format } from "date-fns";

import { getAuthSession } from "@/lib/auth";
import { listRecentSessions } from "@/lib/session-repository";
import type { RecommendedAction } from "@prisma/client";

export default async function HistoryPage() {
  const session = await getAuthSession();
  if (!session?.user?.id) {
    redirect("/signin");
  }

  const sessions = await listRecentSessions(session.user.id, 10);

  return (
    <main className="mx-auto w-full max-w-6xl py-6 lg:py-8">
      <Header />
      {sessions.length === 0 ? <EmptyState /> : <HistoryList sessions={sessions} />}
    </main>
  );
}

function Header() {
  return (
    <header className="mb-8">
      <h1 className="text-3xl font-semibold text-white">History</h1>
      <p className="mt-2 text-sm text-white/70">Recaps of your recent sessions. Use them to tune future targets.</p>
    </header>
  );
}

function EmptyState() {
  return <p className="text-sm text-white/60">No sessions yet. Start one tonight and the recap will appear here.</p>;
}

function HistoryList({
  sessions,
}: {
  sessions: Array<{
    id: string;
    startedAt: Date;
    endedReason: "user_end" | "auto_alert" | "timeout" | null;
    targetLevel: number;
    reportedLevel: number | null;
    drinks: Array<{ id: string }>;
    predictions: Array<{
      levelEstimate: number;
      recommendedAction: RecommendedAction;
    }>;
  }>;
}) {
  return (
    <ul className="space-y-4">
      {sessions.map((item) => (
        <li
          key={item.id}
          className="rounded-[var(--radius-lg)] border border-white/10 bg-white/5 px-5 py-4 backdrop-blur"
        >
          <HistoryRow item={item} />
        </li>
      ))}
    </ul>
  );
}

function HistoryRow({
  item,
}: {
  item: {
    id: string;
    startedAt: Date;
    endedReason: "user_end" | "auto_alert" | "timeout" | null;
    targetLevel: number;
    reportedLevel: number | null;
    drinks: Array<{ id: string }>;
    predictions: Array<{
      levelEstimate: number;
      recommendedAction: RecommendedAction;
    }>;
  };
}) {
  const drinkCount = item.drinks.length;
  const latestPrediction = item.predictions[0];

  return (
    <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
      <div>
        <p className="text-lg font-semibold text-white">
          {format(item.startedAt, "MMM d, yyyy · h:mm a")} — {drinkCount} drink{drinkCount === 1 ? "" : "s"}
        </p>
        <p className="text-sm text-white/60">Target {item.targetLevel} · Ended {item.endedReason ?? "unknown"}</p>
      </div>
      {latestPrediction && (
        <div className="text-sm text-white/70">
          Peak level {latestPrediction.levelEstimate.toFixed(1)} ({latestPrediction.recommendedAction})
          {item.reportedLevel != null && (
            <span className="ml-3 text-white/60">Felt {item.reportedLevel.toFixed(1)}</span>
          )}
        </div>
      )}
    </div>
  );
}
