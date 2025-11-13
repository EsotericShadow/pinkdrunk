import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { getAuthSession } from "@/lib/auth";
import { ensureImpairmentThresholds, toThresholdSnapshots, updateThresholdsWithObservation } from "@/lib/impairment-thresholds";
import { getRequiredProfile } from "@/lib/profile";
import { computeSessionPrediction } from "@/lib/session-calculator";
import { getSessionById, recordReportedLevel } from "@/lib/session-repository";

const payloadSchema = z.object({
  level: z.number().min(0).max(10),
});

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ sessionId: string }> }
) {
  const { sessionId } = await context.params;
  const session = await getAuthSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const json = await request.json().catch(() => null);
  const parsed = payloadSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const sessionRecord = await getSessionById(sessionId, session.user.id);
  if (!sessionRecord) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  const profile = await getRequiredProfile(session.user.id);
  let thresholds = await ensureImpairmentThresholds(session.user.id, profile);
  const thresholdSnapshots = toThresholdSnapshots(thresholds);

  const prediction = computeSessionPrediction({
    session: sessionRecord,
    drinks: sessionRecord.drinks,
    careEvents: sessionRecord.careEvents,
    profile,
    thresholds: thresholdSnapshots,
  });

  await recordReportedLevel(sessionRecord.id, parsed.data.level);

  thresholds = await updateThresholdsWithObservation({
    thresholds,
    observationLevel: parsed.data.level,
    observationGrams: prediction.absorbedAlcoholGrams,
  });

  const snapshots = toThresholdSnapshots(thresholds);
  const refreshed = await getSessionById(sessionRecord.id, session.user.id);
  if (!refreshed) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  const refreshedPrediction = computeSessionPrediction({
    session: refreshed,
    drinks: refreshed.drinks,
    careEvents: refreshed.careEvents,
    profile,
    thresholds: snapshots,
  });

  return NextResponse.json({
    session: {
      id: refreshed.id,
      startedAt: refreshed.startedAt,
      targetLevel: refreshed.targetLevel,
      reportedLevel: refreshed.reportedLevel,
      drinks: refreshed.drinks,
      careEvents: refreshed.careEvents,
    },
    prediction: refreshedPrediction,
  });
}
