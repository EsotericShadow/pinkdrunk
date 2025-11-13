import { deriveRFactor } from "@/lib/body-composition";

export type WidmarkInput = {
  totalAlcoholGrams: number;
  weightKg: number;
  gender: "female" | "male" | "nonbinary" | "custom";
  elapsedHours: number;
  metabolismScore: number; // 1-10
  toleranceScore: number; // 1-10
  totalBodyWaterL?: number | null;
};

export type WidmarkResult = {
  bac: number;
  adjustedBac: number;
  level: number;
};

const GRAMS_PER_ML_OF_ALCOHOL = 0.789;
const STANDARD_DRINK_GRAMS = 14;

export function volumeToAlcoholGrams(abvPercent: number, volumeMl: number): number {
  return (abvPercent / 100) * volumeMl * GRAMS_PER_ML_OF_ALCOHOL;
}

export function calculateWidmark(input: WidmarkInput): WidmarkResult {
  const {
    totalAlcoholGrams,
    weightKg,
    gender,
    elapsedHours,
    metabolismScore,
    toleranceScore,
    totalBodyWaterL,
  } = input;

  const weightGrams = weightKg * 1000;
  const r = deriveRFactor(weightKg, gender, totalBodyWaterL);

  const baseBac = (totalAlcoholGrams / (r * weightGrams)) * 100; // g/dL

  const metabolismAdjustment = 0.012 + (metabolismScore - 5) * 0.0008;
  const elimination = metabolismAdjustment * elapsedHours;

  const rawBac = Math.max(0, baseBac - elimination);

  const toleranceMultiplier = Math.max(0.5, 1 - (toleranceScore - 5) * 0.035);
  const adjustedBac = Math.max(0, rawBac * toleranceMultiplier);

  const level = bacToPinkDrunkLevel(adjustedBac, toleranceScore);

  return {
    bac: rawBac,
    adjustedBac,
    level,
  };
}

export function bacToPinkDrunkLevel(bac: number, toleranceScore: number): number {
  const baseLevel = (bac / 0.06) * 5;
  const toleranceShift = (toleranceScore - 5) * 0.25;
  return clamp(baseLevel + toleranceShift, 0, 10);
}

export function estimateDrinksToTarget(
  currentLevel: number,
  targetLevel: number,
  calculator: (additionalAlcoholGrams: number) => number
): number {
  if (currentLevel >= targetLevel) {
    return 0;
  }

  let drinks = 0;
  let level = currentLevel;

  while (level < targetLevel && drinks < 6) {
    drinks += 1;
    level = calculator(STANDARD_DRINK_GRAMS * drinks);
  }

  return Math.max(0, drinks - (level >= targetLevel ? 0 : 1));
}

export function estimateMinutesToTarget(
  currentBac: number,
  targetLevel: number,
  toleranceScore: number,
  metabolismScore: number
): number {
  const targetBac = pinkDrunkLevelToBac(targetLevel, toleranceScore);
  if (currentBac <= targetBac) {
    return 0;
  }

  const metabolismAdjustment = 0.012 + (metabolismScore - 5) * 0.0008;
  const hours = (currentBac - targetBac) / metabolismAdjustment;
  return Math.max(0, Math.round(hours * 60));
}

export function pinkDrunkLevelToBac(level: number, toleranceScore: number): number {
  const toleranceShift = (toleranceScore - 5) * 0.015;
  return ((level - toleranceShift) / 5) * 0.06;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}
