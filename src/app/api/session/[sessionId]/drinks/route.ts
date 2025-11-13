import { NextRequest, NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth";
import { ensureImpairmentThresholds, toThresholdSnapshots } from "@/lib/impairment-thresholds";
import { getRequiredProfile } from "@/lib/profile";
import { computeSessionPrediction } from "@/lib/session-calculator";
import {
  appendDrink,
  getSessionById,
  recordPrediction,
} from "@/lib/session-repository";
import { drinkPayloadSchema } from "@/lib/validation/drink-payload";

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
  const parsed = drinkPayloadSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const sessionRecord = await getSessionById(sessionId, session.user.id);
  if (!sessionRecord || sessionRecord.endedAt) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  await appendDrink(sessionRecord.id, {
    category: parsed.data.category,
    label: parsed.data.label,
    abvPercent: parsed.data.abvPercent,
    volumeMl: parsed.data.volumeMl,
    brandId: parsed.data.brandId,
    presetId: parsed.data.presetId,
    mixedDrinkId: parsed.data.mixedDrinkId,
    consumedAt: parsed.data.consumedAt,
    ingestionMins: parsed.data.ingestionMins,
  });

  const refreshed = await getSessionById(sessionRecord.id, session.user.id);
  if (!refreshed) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  const profile = await getRequiredProfile(session.user.id);
  const thresholds = await ensureImpairmentThresholds(session.user.id, profile);
  const thresholdSnapshots = toThresholdSnapshots(thresholds);
  const prediction = computeSessionPrediction({
    session: refreshed,
    drinks: refreshed.drinks,
    careEvents: refreshed.careEvents,
    profile,
    thresholds: thresholdSnapshots,
  });

  await recordPrediction(refreshed.id, prediction);

  return NextResponse.json({
    session: {
      id: refreshed.id,
      startedAt: refreshed.startedAt,
      targetLevel: refreshed.targetLevel,
      reportedLevel: refreshed.reportedLevel,
      reportedAt: refreshed.reportedAt,
      drinks: refreshed.drinks,
      careEvents: refreshed.careEvents,
    },
    prediction,
  });
}
