import { NextResponse } from "next/server";

import { getAuthSession } from "@/lib/auth";
import { ensureImpairmentThresholds, toThresholdSnapshots } from "@/lib/impairment-thresholds";
import { getRequiredProfile } from "@/lib/profile";
import { computeSessionPrediction } from "@/lib/session-calculator";
import { createSession, getActiveSession } from "@/lib/session-repository";

export async function POST() {
  const session = await getAuthSession();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const profile = await getRequiredProfile(session.user.id);
  const thresholds = await ensureImpairmentThresholds(session.user.id, profile);
  const thresholdSnapshots = toThresholdSnapshots(thresholds);

  const active = await getActiveSession(session.user.id);

  const sessionRecord =
    active ?? (await createSession(session.user.id, profile.pinkdrunkTargetUser));

  const drinks = active?.drinks ?? [];
  const careEvents = active?.careEvents ?? [];

  const prediction = computeSessionPrediction({
    session: sessionRecord,
    drinks,
    careEvents,
    profile,
    thresholds: thresholdSnapshots,
  });

  return NextResponse.json({
    session: {
      id: sessionRecord.id,
      startedAt: sessionRecord.startedAt,
      targetLevel: sessionRecord.targetLevel,
      reportedLevel: sessionRecord.reportedLevel,
      drinks,
      careEvents,
    },
    prediction,
  });
}
