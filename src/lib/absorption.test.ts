import { describe, expect, it } from "vitest";

import { calculateAbsorbedAlcohol, gramsAbsorbedForDrink } from "./absorption";
import { volumeToAlcoholGrams } from "./widmark";

describe("gramsAbsorbedForDrink", () => {
  const baseDrink = {
    abvPercent: 12,
    volumeMl: 150,
    ingestionMins: 30,
    consumedAt: new Date(Date.now() - 10 * 60 * 1000),
  } as const;

  it("returns zero before consumption start", () => {
    const drink = { ...baseDrink, consumedAt: new Date(Date.now() + 5 * 60 * 1000) };
    expect(gramsAbsorbedForDrink(drink, new Date())).toBe(0);
  });

  it("caps absorption by ingestion progress", () => {
    const drink = { ...baseDrink, consumedAt: new Date(Date.now() - 2 * 60 * 1000) };
    const absorbed = gramsAbsorbedForDrink(drink, new Date());
    const total = volumeToAlcoholGrams(drink.abvPercent, drink.volumeMl);
    expect(absorbed).toBeGreaterThan(0);
    expect(absorbed).toBeLessThan(total);
  });

  it("approaches full absorption after long time", () => {
    const drink = { ...baseDrink, consumedAt: new Date(Date.now() - 3 * 60 * 60 * 1000) };
    const absorbed = gramsAbsorbedForDrink(drink, new Date());
    const total = volumeToAlcoholGrams(drink.abvPercent, drink.volumeMl);
    expect(absorbed / total).toBeGreaterThan(0.98);
  });
});

describe("calculateAbsorbedAlcohol", () => {
  it("sums absorption across drinks", () => {
    const now = new Date();
    const drinks = [
      { abvPercent: 12, volumeMl: 150, ingestionMins: 20, consumedAt: new Date(now.getTime() - 20 * 60 * 1000) },
      { abvPercent: 8, volumeMl: 350, ingestionMins: 15, consumedAt: new Date(now.getTime() - 5 * 60 * 1000) },
    ];

    const absorbed = calculateAbsorbedAlcohol(drinks, now);
    expect(absorbed).toBeGreaterThan(0);
  });
});
