import { describe, expect, it } from "vitest";

import { computeSessionPrediction } from "./session-calculator";
import type { Drink, DrinkingSession, Profile } from "@prisma/client";

const baseProfile = {
  id: "profile",
  userId: "user",
  name: "Test User",
  geoLocation: "Toronto",
  profileImageUrl: null,
  heightCm: 170,
  weightKg: 65,
  bmi: 22.5,
  totalBodyWaterL: 36.1,
  age: 28,
  genderIdentity: "female" as Profile["genderIdentity"],
  genderCustomLabel: "",
  menstruation: true,
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
} satisfies Profile;

const baseSession = {
  id: "session",
  userId: "user",
  startedAt: new Date(Date.now() - 30 * 60 * 1000),
  endedAt: null,
  targetLevel: 5,
  targetSource: "user",
  endedReason: null,
  createdAt: new Date(),
  updatedAt: new Date(),
} satisfies DrinkingSession;

const mockThresholds = Array.from({ length: 10 }).map((_, idx) => ({
  level: idx + 1,
  grams: (idx + 1) * 10,
  confidence: 0.2,
}));

describe("computeSessionPrediction", () => {
  it("returns baseline values when no drinks logged", () => {
    const prediction = computeSessionPrediction({
      session: baseSession,
      drinks: [],
      careEvents: [],
      profile: baseProfile,
      thresholds: mockThresholds,
    });

    expect(prediction.levelEstimate).toBe(0);
    expect(prediction.drinksToTarget).toBe(0);
    expect(prediction.recommendedAction).toBe("keep");
    expect(prediction.thresholds).toEqual(mockThresholds);
    expect(prediction.absorbedAlcoholGrams).toBe(0);
  });

  it("converts drink list into meaningful prediction", () => {
    const drinks: Drink[] = [
      {
        id: "d1",
        sessionId: baseSession.id,
        category: "cocktail",
        label: "Negroni",
        abvPercent: 18,
        volumeMl: 120,
        brandId: null,
        presetId: null,
        mixedDrinkId: null,
        consumedAt: new Date(Date.now() - 20 * 60 * 1000),
        ingestionMins: 10,
      },
      {
        id: "d2",
        sessionId: baseSession.id,
        category: "cocktail",
        label: "Negroni",
        abvPercent: 18,
        volumeMl: 120,
        brandId: null,
        presetId: null,
        mixedDrinkId: null,
        consumedAt: new Date(Date.now() - 5 * 60 * 1000),
        ingestionMins: 10,
      },
    ];

    const prediction = computeSessionPrediction({
      session: baseSession,
      drinks,
      careEvents: [],
      profile: baseProfile,
      now: new Date(),
      thresholds: mockThresholds,
    });

    expect(prediction.levelEstimate).toBeGreaterThan(1);
    expect(prediction.levelEstimate).toBeLessThan(9);
    expect(prediction.drinksToTarget).toBeGreaterThanOrEqual(0);
    expect(prediction.minutesToTarget).toBeGreaterThanOrEqual(0);
    expect(prediction.absorbedAlcoholGrams).toBeGreaterThan(0);
  });

  it("keeps early-session level low while drink is still absorbing", () => {
    const drink: Drink = {
      id: "d-slow",
      sessionId: baseSession.id,
      category: "cocktail",
      label: "Slow Spritz",
      abvPercent: 12,
      volumeMl: 200,
      brandId: null,
      presetId: null,
      mixedDrinkId: null,
      consumedAt: new Date(),
      ingestionMins: 45,
    };

    const prediction = computeSessionPrediction({
      session: baseSession,
      drinks: [drink],
      careEvents: [],
      profile: baseProfile,
      now: new Date(),
      thresholds: mockThresholds,
    });

    expect(prediction.levelEstimate).toBeLessThan(2);
  });

  it("detects over target for safety messaging", () => {
    const heavyDrinks: Drink[] = Array.from({ length: 5 }).map((_, idx) => ({
      id: `d${idx}`,
      sessionId: baseSession.id,
      category: "shot" as Drink["category"],
      label: "Tequila",
      abvPercent: 40,
      volumeMl: 44,
      brandId: null,
      presetId: null,
      mixedDrinkId: null,
      consumedAt: new Date(Date.now() - (60 + idx * 5) * 60 * 1000),
      ingestionMins: 5,
    }));

    const prediction = computeSessionPrediction({
      session: baseSession,
      drinks: heavyDrinks,
      careEvents: [],
      profile: baseProfile,
      thresholds: mockThresholds,
    });

    expect(["stop", "abort"]).toContain(prediction.recommendedAction);
  });
});
