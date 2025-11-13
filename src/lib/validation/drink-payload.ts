import { z } from "zod";

const DRINK_CATEGORIES = ["beer", "wine", "cocktail", "shot", "other"] as const;
const MIN_ABV = 0.1; // Below this is effectively mocktail noise
const MAX_ABV = 96; // Everclear-ish ceiling; anything higher is fantasy
const MIN_VOLUME_ML = 10;
const MAX_VOLUME_ML = 2000;
const MIN_INGESTION_MINS = 1;
const MAX_INGESTION_MINS = 180;

const cuidRef = z.string().cuid().nullish();

export const drinkPayloadSchema = z
  .object({
    category: z.enum(DRINK_CATEGORIES),
    label: z
      .string()
      .trim()
      .min(1, "Label cannot be empty")
      .max(120)
      .optional()
      .transform((value) => (value && value.trim().length > 0 ? value.trim() : undefined)),
    abvPercent: z
      .number()
      .min(MIN_ABV, `ABV must be at least ${MIN_ABV}%`)
      .max(MAX_ABV, `ABV must be below ${MAX_ABV}%`),
    volumeMl: z
      .number()
      .min(MIN_VOLUME_ML, `Volume must be at least ${MIN_VOLUME_ML} ml`)
      .max(MAX_VOLUME_ML, `Volume must be below ${MAX_VOLUME_ML} ml`),
    brandId: cuidRef,
    presetId: cuidRef,
    mixedDrinkId: cuidRef,
    consumedAt: z.coerce.date().optional(),
    ingestionMins: z
      .number()
      .int("Ingestion minutes must be a whole number")
      .min(MIN_INGESTION_MINS)
      .max(MAX_INGESTION_MINS)
      .optional()
      .default(10),
  })
  .superRefine((payload, ctx) => {
    const referenceCount = [payload.brandId, payload.presetId, payload.mixedDrinkId].filter(Boolean).length;
    if (referenceCount > 1) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Only one of brandId, presetId, or mixedDrinkId can be provided",
        path: ["brandId"],
      });
    }

    if (!payload.label && referenceCount === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Provide a label when no preset or brand is referenced",
        path: ["label"],
      });
    }
  });

export type DrinkPayload = z.infer<typeof drinkPayloadSchema>;
