import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { getAuthSession } from "@/lib/auth";
import { ensureImpairmentThresholds, toThresholdSnapshots } from "@/lib/impairment-thresholds";
import { getRequiredProfile } from "@/lib/profile";
import { computeSessionPrediction } from "@/lib/session-calculator";
import { appendCareEvent, getSessionById } from "@/lib/session-repository";

const payloadSchema = z.object({
  type: z.enum(["water", "snack", "meal"]),
  volumeMl: z.number().min(0).max(2000).optional().nullable(),
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
  if (!sessionRecord || sessionRecord.endedAt) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  await appendCareEvent(sessionRecord.id, parsed.data);

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
