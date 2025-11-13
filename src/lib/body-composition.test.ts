import { describe, expect, it } from "vitest";

import { calculateBmi, deriveRFactor, estimateTotalBodyWaterLiters } from "./body-composition";

describe("calculateBmi", () => {
  it("returns zero when inputs invalid", () => {
    expect(calculateBmi(0, 70)).toBe(0);
  });

  it("calculates BMI to one decimal place", () => {
    expect(calculateBmi(170, 65)).toBeCloseTo(22.5, 1);
  });
});

describe("estimateTotalBodyWaterLiters", () => {
  it("uses Watson formula for male profiles", () => {
    const liters = estimateTotalBodyWaterLiters({
      heightCm: 180,
      weightKg: 80,
      age: 30,
      genderIdentity: "male",
    });

    expect(liters).toBeGreaterThan(40);
    expect(liters).toBeLessThan(50);
  });

  it("blends male/female estimates for nonbinary entries", () => {
    const liters = estimateTotalBodyWaterLiters({
      heightCm: 170,
      weightKg: 65,
      age: 28,
      genderIdentity: "nonbinary",
    });

    expect(liters).toBeGreaterThan(30);
    expect(liters).toBeLessThan(45);
  });
});

describe("deriveRFactor", () => {
  it("derives ratio from TBW when available", () => {
    const r = deriveRFactor(65, "female", 36);
    expect(r).toBeGreaterThan(0.5);
    expect(r).toBeLessThan(0.7);
  });

  it("falls back to gender defaults when TBW missing", () => {
    expect(deriveRFactor(65, "female", null)).toBeCloseTo(0.55, 2);
  });
});
