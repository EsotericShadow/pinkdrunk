import { describe, expect, it } from "vitest";

import { applyObservationToThresholds, buildThresholdsFromProfile } from "./impairment-thresholds";

const mockThresholds = Array.from({ length: 10 }).map((_, idx) => ({
  id: `t${idx + 1}`,
  userId: "user",
  level: idx + 1,
  grams: (idx + 1) * 10,
  confidence: 0.2,
  createdAt: new Date(),
  updatedAt: new Date(),
}));

const profile = {
  id: "profile",
  userId: "user",
  name: "Test",
  geoLocation: "",
  profileImageUrl: null,
  heightCm: 170,
  weightKg: 65,
  bmi: 22.5,
  totalBodyWaterL: 36,
  age: 28,
  genderIdentity: "female",
  genderCustomLabel: "",
  menstruation: false,
  medications: false,
  medicationDetails: "",
  conditions: false,
  conditionDetails: "",
  metabolismScore: 5,
  toleranceScore: 5,
  pinkdrunkTargetUser: 5,
  pinkdrunkTargetConfidence: 0.2,
  cycleDay: null,
  createdAt: new Date(),
  updatedAt: new Date(),
} as const;

describe("buildThresholdsFromProfile", () => {
  it("creates ascending thresholds for each level", () => {
    const thresholds = buildThresholdsFromProfile(profile);
    expect(thresholds).toHaveLength(10);
    for (let i = 1; i < thresholds.length; i += 1) {
      expect(thresholds[i].grams).toBeGreaterThan(thresholds[i - 1].grams);
    }
  });
});

describe("applyObservationToThresholds", () => {
  it("applies EWMA to the observed level", () => {
    const adjusted = applyObservationToThresholds(mockThresholds, 5, 80);
    expect(adjusted.find((entry) => entry.level === 5)?.grams).toBeGreaterThan(50);
  });
});
