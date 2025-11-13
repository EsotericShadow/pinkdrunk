import { NextResponse } from "next/server";

import { getAuthSession } from "@/lib/auth";
import { ensureImpairmentThresholds, toThresholdSnapshots } from "@/lib/impairment-thresholds";
import { getRequiredProfile } from "@/lib/profile";
import { computeSessionPrediction } from "@/lib/session-calculator";
import { getActiveSession } from "@/lib/session-repository";

export async function GET() {
  const session = await getAuthSession();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const active = await getActiveSession(session.user.id);

  if (!active) {
    return NextResponse.json({ session: null });
  }

  const profile = await getRequiredProfile(session.user.id);
  const thresholds = await ensureImpairmentThresholds(session.user.id, profile);
  const thresholdSnapshots = toThresholdSnapshots(thresholds);

  const prediction = computeSessionPrediction({
    session: active,
    drinks: active.drinks,
    careEvents: active.careEvents,
    profile,
    thresholds: thresholdSnapshots,
  });

  return NextResponse.json({
    session: {
      id: active.id,
      startedAt: active.startedAt,
      targetLevel: active.targetLevel,
      reportedLevel: active.reportedLevel,
      drinks: active.drinks,
      careEvents: active.careEvents,
    },
    prediction,
  });
}
