import { NextResponse } from "next/server";
import { z } from "zod";

import { getAuthSession } from "@/lib/auth";
import { deriveBodyMetrics } from "@/lib/body-composition";
import { ensureImpairmentThresholds } from "@/lib/impairment-thresholds";
import { db } from "@/lib/prisma";

const payloadSchema = z.object({
  name: z.string().min(2).max(120),
  geoLocation: z.string().max(120).optional().default(""),
  profileImageUrl: z.union([z.string().url(), z.literal(""), z.null()]).optional().default(null),
  heightCm: z.number().min(80).max(250),
  weightKg: z.number().min(30).max(250),
  cycleDay: z.number().int().min(1).max(40).nullable().optional().default(null),
  age: z.number().int().min(18).max(99),
  genderIdentity: z.enum(["female", "male", "nonbinary", "custom"]),
  genderCustomLabel: z.string().max(80).optional().default(""),
  menstruation: z.boolean(),
  medications: z.boolean(),
  medicationDetails: z.string().max(240).optional().default(""),
  conditions: z.boolean(),
  conditionDetails: z.string().max(240).optional().default(""),
  metabolismScore: z.number().int().min(1).max(10),
  toleranceScore: z.number().int().min(1).max(10),
  targetLevel: z.number().int().min(0).max(10),
});

export async function POST(request: Request) {
  const session = await getAuthSession();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const json = await request.json().catch(() => null);
  const parsed = payloadSchema.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const profile = parsed.data;

  const savedProfile = await upsertProfile(session.user.id, profile);
  const thresholds = await ensureImpairmentThresholds(session.user.id, savedProfile);

  return NextResponse.json({
    profile: savedProfile,
    thresholds: thresholds.map((threshold) => ({
      level: threshold.level,
      grams: threshold.grams,
      confidence: threshold.confidence,
    })),
  });
}

async function upsertProfile(userId: string, payload: z.infer<typeof payloadSchema>) {
  const {
    name,
    geoLocation,
    profileImageUrl,
    heightCm,
    weightKg,
    cycleDay,
    age,
    genderIdentity,
    genderCustomLabel,
    menstruation,
    medications,
    medicationDetails,
    conditions,
    conditionDetails,
    metabolismScore,
    toleranceScore,
    targetLevel,
  } = payload;

  const { bmi, totalBodyWaterL } = deriveBodyMetrics({
    heightCm,
    weightKg,
    age,
    genderIdentity,
  });

  const profileData = {
    name,
    geoLocation,
    profileImageUrl: profileImageUrl || null,
    heightCm,
    weightKg,
    age,
    genderIdentity,
    genderCustomLabel,
    menstruation,
    cycleDay: menstruation ? cycleDay : null,
    medications,
    medicationDetails,
    conditions,
    conditionDetails,
    metabolismScore,
    toleranceScore,
    bmi,
    totalBodyWaterL,
    pinkdrunkTargetUser: targetLevel,
    pinkdrunkTargetConfidence: 0.1,
  };

  const savedProfile = await db.profile.upsert({
    where: { userId },
    update: profileData,
    create: {
      userId,
      ...profileData,
    },
  });

  await db.drinkingSession.updateMany({
    where: { userId, endedAt: null },
    data: { targetLevel },
  });

  return savedProfile;
}
