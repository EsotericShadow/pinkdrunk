import type { Drink } from "@prisma/client";

import { volumeToAlcoholGrams } from "@/lib/widmark";

const ABSORPTION_RATE_PER_HOUR = 1.5; // ka ~1.5/hr per roadmap
const MIN_INGESTION_MINS = 1;

export type AbsorptionDrink = Pick<Drink, "abvPercent" | "volumeMl" | "ingestionMins" | "consumedAt">;

export function calculateAbsorbedAlcohol(drinks: AbsorptionDrink[], now: Date): number {
  return drinks.reduce((total, drink) => total + gramsAbsorbedForDrink(drink, now), 0);
}

export function gramsAbsorbedForDrink(drink: AbsorptionDrink, now: Date): number {
  const grams = volumeToAlcoholGrams(drink.abvPercent, drink.volumeMl);
  if (!Number.isFinite(grams) || grams <= 0) {
    return 0;
  }

  const deltaMinutes = (now.getTime() - drink.consumedAt.getTime()) / (1000 * 60);
  if (deltaMinutes <= 0) {
    return 0;
  }

  const ingestionMinutes = Math.max(drink.ingestionMins ?? 10, MIN_INGESTION_MINS);
  const ingestionFraction = Math.min(1, deltaMinutes / ingestionMinutes);

  const deltaHours = deltaMinutes / 60;
  const absorptionFraction = 1 - Math.exp(-ABSORPTION_RATE_PER_HOUR * deltaHours);

  const absorbedFraction = Math.min(ingestionFraction, absorptionFraction);
  return grams * clamp(absorbedFraction, 0, 1);
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export const absorptionConstants = {
  ratePerHour: ABSORPTION_RATE_PER_HOUR,
};
