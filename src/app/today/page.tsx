import { redirect } from "next/navigation";

import { getAuthSession } from "@/lib/auth";
import { ensureImpairmentThresholds, toThresholdSnapshots } from "@/lib/impairment-thresholds";
import { getRequiredProfile } from "@/lib/profile";
import { computeSessionPrediction } from "@/lib/session-calculator";
import { getActiveSession } from "@/lib/session-repository";
import { TodayDashboard } from "@/components/today/dashboard";

export default async function TodayPage() {
  const session = await getAuthSession();

  if (!session?.user?.id) {
    redirect("/signin");
  }

  let profile;
  try {
    profile = await getRequiredProfile(session.user.id);
  } catch {
    redirect("/onboarding");
  }

  const active = await getActiveSession(session.user.id);
  const thresholds = await ensureImpairmentThresholds(session.user.id, profile);
  const thresholdSnapshots = toThresholdSnapshots(thresholds);

  const prediction = active
    ? computeSessionPrediction({
        session: active,
        drinks: active.drinks,
        careEvents: active.careEvents,
        profile,
        thresholds: thresholdSnapshots,
      })
    : null;

  return (
    <main className="mx-auto w-full max-w-6xl py-6 lg:py-8">
      <TodayDashboard
        initialSession={active ? {
          id: active.id,
          startedAt: active.startedAt.toISOString(),
          targetLevel: active.targetLevel,
          reportedLevel: active.reportedLevel ?? null,
          reportedAt: active.reportedAt ? active.reportedAt.toISOString() : null,
          drinks: active.drinks.map((drink) => ({
            ...drink,
            consumedAt: drink.consumedAt.toISOString(),
          })),
          careEvents: active.careEvents.map((event) => ({
            ...event,
            createdAt: event.createdAt.toISOString(),
          })),
        } : null}
        initialPrediction={prediction}
        profileTargetLevel={profile.pinkdrunkTargetUser}
      />
    </main>
  );
}
