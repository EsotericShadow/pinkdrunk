import { NextRequest, NextResponse } from "next/server";

import { getAuthSession } from "@/lib/auth";
import { ensureImpairmentThresholds, toThresholdSnapshots } from "@/lib/impairment-thresholds";
import { getRequiredProfile } from "@/lib/profile";
import { computeSessionPrediction } from "@/lib/session-calculator";
import { getSessionById, recordPrediction, updateDrink } from "@/lib/session-repository";
import { drinkPayloadSchema } from "@/lib/validation/drink-payload";

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ sessionId: string; drinkId: string }> }
) {
  const { sessionId, drinkId } = await context.params;
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

  const targetDrink = sessionRecord.drinks.find((drink) => drink.id === drinkId);
  if (!targetDrink) {
    return NextResponse.json({ error: "Drink not found" }, { status: 404 });
  }

  const payload: Parameters<typeof updateDrink>[1] = {
    category: parsed.data.category,
    label: parsed.data.label ?? null,
    abvPercent: parsed.data.abvPercent,
    volumeMl: parsed.data.volumeMl,
    ingestionMins: parsed.data.ingestionMins,
  };

  if (parsed.data.brandId !== undefined) payload.brandId = parsed.data.brandId;
  if (parsed.data.presetId !== undefined) payload.presetId = parsed.data.presetId;
  if (parsed.data.mixedDrinkId !== undefined) payload.mixedDrinkId = parsed.data.mixedDrinkId;
  if (parsed.data.consumedAt) payload.consumedAt = parsed.data.consumedAt;

  await updateDrink(drinkId, payload);

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
