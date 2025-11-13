import { describe, expect, it } from "vitest";

import { drinkPayloadSchema } from "./drink-payload";

describe("drinkPayloadSchema", () => {
  it("accepts a well-formed custom drink and applies defaults", () => {
    const parsed = drinkPayloadSchema.safeParse({
      category: "cocktail",
      label: "Negroni Sbagliato",
      abvPercent: 18,
      volumeMl: 180,
    });

    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.ingestionMins).toBe(10);
      expect(parsed.data.label).toBe("Negroni Sbagliato");
    }
  });

  it("allows brand/preset references without a label", () => {
    const parsed = drinkPayloadSchema.safeParse({
      category: "beer",
      abvPercent: 5,
      volumeMl: 355,
      brandId: "cjld2cjxh0000qzrmn831i7rn",
    });

    expect(parsed.success).toBe(true);
  });

  it("rejects impossible ABV or volume values", () => {
    const invalid = drinkPayloadSchema.safeParse({
      category: "shot",
      label: "Mystery",
      abvPercent: 0,
      volumeMl: 5,
    });

    expect(invalid.success).toBe(false);
  });

  it("rejects out-of-range ingestion minutes", () => {
    const invalid = drinkPayloadSchema.safeParse({
      category: "wine",
      label: "Quick sip",
      abvPercent: 12,
      volumeMl: 150,
      ingestionMins: 0,
    });

    expect(invalid.success).toBe(false);
  });

  it("rejects payloads referencing multiple catalog sources", () => {
    const invalid = drinkPayloadSchema.safeParse({
      category: "wine",
      label: "Too many refs",
      abvPercent: 13,
      volumeMl: 150,
      presetId: "cjld2cjxh0000qzrmn831i7ro",
      mixedDrinkId: "cjld2cjxh0000qzrmn831i7rp",
    });

    expect(invalid.success).toBe(false);
  });
});
