import type { ImpairmentThreshold, Profile } from "@prisma/client";

import { deriveRFactor } from "@/lib/body-composition";
import { db } from "@/lib/prisma";
import { pinkDrunkLevelToBac } from "@/lib/widmark";

const LEVELS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10] as const;
const DEFAULT_CONFIDENCE = 0.25;

export type ThresholdSnapshot = Pick<ImpairmentThreshold, "level" | "grams" | "confidence">;

export async function listImpairmentThresholds(userId: string): Promise<ImpairmentThreshold[]> {
  return db.impairmentThreshold.findMany({
    where: { userId },
    orderBy: { level: "asc" },
  });
}

export async function ensureImpairmentThresholds(userId: string, profile: Profile) {
  const existing = await listImpairmentThresholds(userId);
  if (existing.length >= LEVELS.length) {
    return existing;
  }

  const defaults = buildThresholdsFromProfile(profile);
  const missingLevels = new Set(LEVELS);
  for (const record of existing) {
    missingLevels.delete(record.level as (typeof LEVELS)[number]);
  }

  const toCreate = defaults.filter((entry) => missingLevels.has(entry.level as (typeof LEVELS)[number]));

  if (toCreate.length > 0) {
    await db.impairmentThreshold.createMany({
      data: toCreate.map((entry) => ({
        userId,
        level: entry.level,
        grams: entry.grams,
        confidence: entry.confidence,
      })),
    });
  }

  return listImpairmentThresholds(userId);
}

export function buildThresholdsFromProfile(profile: Profile): ThresholdSnapshot[] {
  const r = deriveRFactor(profile.weightKg, profile.genderIdentity, profile.totalBodyWaterL);
  const weightGrams = profile.weightKg * 1000;

  return LEVELS.map((level) => {
    const targetBac = pinkDrunkLevelToBac(level, profile.toleranceScore);
    const grams = Math.max(0, (targetBac / 100) * r * weightGrams);
    return {
      level,
      grams,
      confidence: DEFAULT_CONFIDENCE,
    } satisfies ThresholdSnapshot;
  });
}

export function toThresholdSnapshots(records: ImpairmentThreshold[]): ThresholdSnapshot[] {
  return records
    .slice()
    .sort((a, b) => a.level - b.level)
    .map((record) => ({
      level: record.level,
      grams: record.grams,
      confidence: record.confidence,
    }));
}

const EWMA_ALPHA = 0.25;
const MIN_GRAM_GAP = 5;

export async function updateThresholdsWithObservation(params: {
  userId: string;
  thresholds: ImpairmentThreshold[];
  observationLevel: number;
  observationGrams: number;
}) {
  const { userId, thresholds, observationLevel, observationGrams } = params;
  const adjusted = applyObservationToThresholds(thresholds, observationLevel, observationGrams);
  if (adjusted === thresholds) {
    return thresholds;
  }

  await Promise.all(
    adjusted.map((entry) =>
      db.impairmentThreshold.update({
        where: { id: entry.id },
        data: {
          grams: entry.grams,
          confidence: entry.confidence,
        },
      })
    )
  );

  return adjusted;
}

export function applyObservationToThresholds(
  thresholds: ImpairmentThreshold[],
  observationLevel: number,
  observationGrams: number
) {
  if (!Number.isFinite(observationGrams) || observationGrams <= 0 || thresholds.length === 0) {
    return thresholds;
  }

  const level = clampLevel(Math.round(observationLevel));
  const ordered = thresholds.slice().sort((a, b) => a.level - b.level);
  const targetIndex = ordered.findIndex((entry) => entry.level === level);
  if (targetIndex === -1) {
    return thresholds;
  }

  ordered[targetIndex].grams = ewma(ordered[targetIndex].grams, observationGrams, EWMA_ALPHA);
  ordered[targetIndex].confidence = Math.min(1, ordered[targetIndex].confidence + 0.05);

  for (let i = targetIndex + 1; i < ordered.length; i++) {
    const minAllowed = ordered[i - 1].grams + MIN_GRAM_GAP;
    if (ordered[i].grams < minAllowed) {
      ordered[i].grams = minAllowed;
    }
  }

  for (let i = targetIndex - 1; i >= 0; i--) {
    const maxAllowed = ordered[i + 1].grams - MIN_GRAM_GAP;
    if (ordered[i].grams > maxAllowed) {
      ordered[i].grams = Math.max(MIN_GRAM_GAP, maxAllowed);
    }
  }

  return ordered;
}

function ewma(previous: number, observation: number, alpha: number) {
  return previous + alpha * (observation - previous);
}

function clampLevel(level: number) {
  if (level < 1) return 1;
  if (level > 10) return 10;
  return level;
}
