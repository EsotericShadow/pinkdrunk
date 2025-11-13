import type { GenderIdentity } from "@prisma/client";

const DEFAULT_R_FACTORS: Record<GenderIdentity, number> = {
  female: 0.55,
  male: 0.68,
  nonbinary: 0.62,
  custom: 0.62,
};

export type BodyCompositionInput = {
  heightCm: number;
  weightKg: number;
  age: number;
  genderIdentity: GenderIdentity;
};

export function calculateBmi(heightCm: number, weightKg: number): number {
  if (heightCm <= 0 || weightKg <= 0) {
    return 0;
  }
  const heightMeters = heightCm / 100;
  const bmi = weightKg / (heightMeters * heightMeters);
  return roundToOneDecimal(bmi);
}

export function estimateTotalBodyWaterLiters(input: BodyCompositionInput): number {
  const { heightCm, weightKg, age, genderIdentity } = input;
  if (heightCm <= 0 || weightKg <= 0) {
    return 0;
  }

  const maleEstimate = 2.447 - 0.09516 * age + 0.1074 * heightCm + 0.3362 * weightKg;
  const femaleEstimate = -2.097 + 0.1069 * heightCm + 0.2466 * weightKg;

  let estimate: number;
  if (genderIdentity === "male") {
    estimate = maleEstimate;
  } else if (genderIdentity === "female") {
    estimate = femaleEstimate;
  } else {
    estimate = (maleEstimate + femaleEstimate) / 2;
  }

  return roundToOneDecimal(Math.max(0, estimate));
}

export function deriveRFactor(
  weightKg: number,
  genderIdentity: GenderIdentity,
  totalBodyWaterL?: number | null
): number {
  if (weightKg > 0 && totalBodyWaterL && totalBodyWaterL > 0) {
    const ratio = totalBodyWaterL / weightKg;
    return clamp(ratio, 0.45, 0.85);
  }

  return DEFAULT_R_FACTORS[genderIdentity] ?? 0.62;
}

export function deriveBodyMetrics(input: BodyCompositionInput) {
  const bmi = calculateBmi(input.heightCm, input.weightKg);
  const totalBodyWaterL = estimateTotalBodyWaterLiters(input);
  const rFactor = deriveRFactor(input.weightKg, input.genderIdentity, totalBodyWaterL);

  return {
    bmi,
    totalBodyWaterL,
    rFactor,
  };
}

function roundToOneDecimal(value: number): number {
  return Math.round(value * 10) / 10;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export { DEFAULT_R_FACTORS };
