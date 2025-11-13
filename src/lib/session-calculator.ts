import type {
  CareEvent,
  Drink,
  DrinkingSession,
  Profile,
  RecommendedAction,
} from "@prisma/client";

import { calculateAbsorbedAlcohol } from "@/lib/absorption";
import {
  calculateWidmark,
  estimateDrinksToTarget,
  estimateMinutesToTarget,
  pinkDrunkLevelToBac,
} from "@/lib/widmark";

export type ThresholdEntry = {
  level: number;
  grams: number;
  confidence: number;
};

export type SessionPrediction = {
  sessionId: string;
  levelEstimate: number;
  bac: number;
  adjustedBac: number;
  drinksToTarget: number;
  recommendedAction: RecommendedAction;
  minutesToTarget: number;
  targetLevel: number;
  targetBac: number;
  thresholds: ThresholdEntry[];
  absorbedAlcoholGrams: number;
};

export type PredictionInput = {
  session: DrinkingSession;
  drinks: Drink[];
  careEvents: CareEvent[];
  profile: Profile;
  now?: Date;
  thresholds?: ThresholdEntry[];
};

type CareOffsets = {
  levelOffset: number;
  bacOffset: number;
};

const HYDRATION_WINDOW_MS = 1000 * 60 * 60 * 2; // 2 hours
const FOOD_WINDOW_MS = 1000 * 60 * 60 * 3; // 3 hours
const FELT_LEVEL_DECAY_MS = 1000 * 60 * 45; // treat manual reports as ground truth for 45 minutes

function computeCareOffsets(events: CareEvent[], now: Date): CareOffsets {
  const nowMs = now.getTime();

  const hydrationLiters = events
    .filter((event) => event.type === "water" && nowMs - event.createdAt.getTime() <= HYDRATION_WINDOW_MS)
    .reduce((sum, event) => sum + (event.volumeMl ?? 0) / 1000, 0);

  const hydrationBacOffset = Math.min(hydrationLiters * 0.003, 0.01);
  const hydrationLevelOffset = Math.min(hydrationLiters * 0.4, 0.8);

  const foodScore = events
    .filter((event) => (event.type === "meal" || event.type === "snack") && nowMs - event.createdAt.getTime() <= FOOD_WINDOW_MS)
    .reduce((sum, event) => sum + (event.type === "meal" ? 1 : 0.5), 0);

  const foodBacOffset = Math.min(foodScore * 0.004, 0.012);
  const foodLevelOffset = Math.min(foodScore * 0.5, 1);

  return {
    bacOffset: hydrationBacOffset + foodBacOffset,
    levelOffset: hydrationLevelOffset + foodLevelOffset,
  };
}

export function computeSessionPrediction({
  session,
  drinks,
  careEvents,
  profile,
  now = new Date(),
  thresholds = [],
}: PredictionInput): SessionPrediction {
  const targetLevel = session.targetLevel ?? profile.pinkdrunkTargetUser;

  if (drinks.length === 0) {
    const targetBac = pinkDrunkLevelToBac(targetLevel, profile.toleranceScore);
    return {
      sessionId: session.id,
      levelEstimate: 0,
      bac: 0,
      adjustedBac: 0,
      drinksToTarget: 0,
      recommendedAction: "keep",
      minutesToTarget: 0,
      targetLevel,
      targetBac,
      thresholds,
      absorbedAlcoholGrams: 0,
    };
  }

  const absorbedAlcoholGrams = calculateAbsorbedAlcohol(drinks, now);

  const elapsedMs = Math.max(0, now.getTime() - session.startedAt.getTime());
  const elapsedHours = elapsedMs / (1000 * 60 * 60);

  const { bac, adjustedBac, level } = calculateWidmark({
    totalAlcoholGrams: absorbedAlcoholGrams,
    weightKg: profile.weightKg,
    gender: profile.genderIdentity,
    elapsedHours,
    metabolismScore: profile.metabolismScore,
    toleranceScore: profile.toleranceScore,
    totalBodyWaterL: profile.totalBodyWaterL,
  });

  const careOffsets = computeCareOffsets(careEvents, now);
  const caredLevel = Math.max(level - careOffsets.levelOffset, 0);
  const caredAdjustedBac = Math.max(adjustedBac - careOffsets.bacOffset, 0);

  const applyCareToLevel = (rawLevel: number) => Math.max(rawLevel - careOffsets.levelOffset, 0);

  const targetBac = pinkDrunkLevelToBac(targetLevel, profile.toleranceScore);

  const hasFreshReport =
    session.reportedLevel != null &&
    session.reportedAt != null &&
    now.getTime() - session.reportedAt.getTime() <= FELT_LEVEL_DECAY_MS;

  const effectiveLevel = hasFreshReport && session.reportedLevel != null ? session.reportedLevel : caredLevel;
  const effectiveAdjustedBac = hasFreshReport
    ? Math.max(0, pinkDrunkLevelToBac(effectiveLevel, profile.toleranceScore))
    : caredAdjustedBac;

  const drinksToTarget = estimateDrinksToTarget(effectiveLevel, targetLevel, (additionalGrams) => {
    const future = calculateWidmark({
      totalAlcoholGrams: absorbedAlcoholGrams + additionalGrams,
      weightKg: profile.weightKg,
      gender: profile.genderIdentity,
      elapsedHours,
      metabolismScore: profile.metabolismScore,
      toleranceScore: profile.toleranceScore,
      totalBodyWaterL: profile.totalBodyWaterL,
    });

    return applyCareToLevel(future.level);
  });

  const minutesToTarget = estimateMinutesToTarget(
    effectiveAdjustedBac,
    targetLevel,
    profile.toleranceScore,
    profile.metabolismScore
  );

  return {
    sessionId: session.id,
    levelEstimate: effectiveLevel,
    bac,
    adjustedBac: effectiveAdjustedBac,
    drinksToTarget,
    recommendedAction: pickRecommendedAction(effectiveLevel, targetLevel, effectiveAdjustedBac, targetBac),
    minutesToTarget,
    targetLevel,
    targetBac,
    thresholds,
    absorbedAlcoholGrams,
  };
}

function pickRecommendedAction(level: number, targetLevel: number, adjustedBac: number, targetBac: number): RecommendedAction {
  const levelDelta = level - targetLevel;

  if (levelDelta >= 2) {
    return "abort";
  }

  if (levelDelta >= 1) {
    return "stop";
  }

  if (adjustedBac >= targetBac * 0.95 && adjustedBac <= targetBac * 1.1) {
    return "slow";
  }

  if (levelDelta < -1) {
    return "hydrate";
  }

  return "keep";
}
