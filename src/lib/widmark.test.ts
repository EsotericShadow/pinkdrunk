import { describe, expect, it } from "vitest";

import {
  bacToPinkDrunkLevel,
  calculateWidmark,
  estimateDrinksToTarget,
  estimateMinutesToTarget,
  pinkDrunkLevelToBac,
  volumeToAlcoholGrams,
} from "./widmark";

describe("volumeToAlcoholGrams", () => {
  it("converts ABV and volume to grams of alcohol", () => {
    const grams = volumeToAlcoholGrams(12, 150); // 12% wine, 150ml
    expect(grams).toBeCloseTo(14.202, 3);
  });
});

describe("calculateWidmark", () => {
  it("produces reasonable BAC and level for a medium tolerance user", () => {
    const result = calculateWidmark({
      totalAlcoholGrams: 42,
      weightKg: 68,
      gender: "female",
      elapsedHours: 0.25,
      metabolismScore: 5,
      toleranceScore: 5,
    });

    expect(result.bac).toBeGreaterThan(0.02);
    expect(result.bac).toBeLessThan(0.12);
    expect(result.level).toBeGreaterThan(2);
    expect(result.level).toBeLessThan(9.5);
  });

  it("adjusts for higher tolerance", () => {
    const lowTolerance = calculateWidmark({
      totalAlcoholGrams: 42,
      weightKg: 68,
      gender: "female",
      elapsedHours: 0.25,
      metabolismScore: 5,
      toleranceScore: 3,
    });

    const highTolerance = calculateWidmark({
      totalAlcoholGrams: 42,
      weightKg: 68,
      gender: "female",
      elapsedHours: 0.25,
      metabolismScore: 5,
      toleranceScore: 8,
    });

    expect(highTolerance.adjustedBac).toBeLessThan(lowTolerance.adjustedBac);
    expect(highTolerance.level).toBeLessThan(lowTolerance.level);
  });

  it("lowers BAC when TBW implies a higher r-factor", () => {
    const defaultR = calculateWidmark({
      totalAlcoholGrams: 30,
      weightKg: 60,
      gender: "female",
      elapsedHours: 0.5,
      metabolismScore: 5,
      toleranceScore: 5,
    });

    const hydrated = calculateWidmark({
      totalAlcoholGrams: 30,
      weightKg: 60,
      gender: "female",
      elapsedHours: 0.5,
      metabolismScore: 5,
      toleranceScore: 5,
      totalBodyWaterL: 40,
    });

    expect(hydrated.bac).toBeLessThan(defaultR.bac);
  });
});

describe("bac/level conversions", () => {
  it("maps level to target BAC and back", () => {
    const bac = pinkDrunkLevelToBac(5, 5);
    expect(bac).toBeCloseTo(0.06, 2);

    const level = bacToPinkDrunkLevel(bac, 5);
    expect(level).toBeCloseTo(5, 1);
  });
});

describe("estimateDrinksToTarget", () => {
  it("returns zero when already at target", () => {
    const drinks = estimateDrinksToTarget(
      6,
      5,
      (grams) => calculateWidmark({
        totalAlcoholGrams: 28 + grams,
        weightKg: 68,
        gender: "female",
        elapsedHours: 1,
        metabolismScore: 5,
        toleranceScore: 5,
      }).level
    );
    expect(drinks).toBe(0);
  });

  it("estimates drinks needed to reach target", () => {
    const drinks = estimateDrinksToTarget(
      2,
      5,
      (additionalGrams) => calculateWidmark({
        totalAlcoholGrams: 10 + additionalGrams,
        weightKg: 68,
        gender: "female",
        elapsedHours: 0.5,
        metabolismScore: 5,
        toleranceScore: 5,
      }).level
    );

    expect(drinks).toBeGreaterThan(0);
  });
});

describe("estimateMinutesToTarget", () => {
  it("returns zero when already below target", () => {
    const minutes = estimateMinutesToTarget(0.03, 5, 5, 5);
    expect(minutes).toBe(0);
  });

  it("estimates time to sober to target", () => {
    const minutes = estimateMinutesToTarget(0.08, 3, 5, 5);
    expect(minutes).toBeGreaterThan(0);
    expect(minutes).toBeLessThan(400);
  });
});
