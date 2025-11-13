export type DrinkCategory = "beer" | "wine" | "cocktail" | "shot" | "other";

export type DrinkCatalogEntry = {
  id: string;
  name: string;
  category: DrinkCategory;
  abvPercent: number;
  defaultVolumeMl: number;
  notes?: string;
  brand?: string;
  type?: string;
  base?: string;
  tags: string[];
};

const DEFAULT_ENTRIES: Record<DrinkCategory, DrinkCatalogEntry> = {
  beer: {
    id: "default-beer",
    name: "Standard Beer",
    category: "beer",
    abvPercent: 5,
    defaultVolumeMl: 355,
    notes: "Generic 12 oz lager",
    tags: ["default"],
  },
  wine: {
    id: "default-wine",
    name: "House Wine",
    category: "wine",
    abvPercent: 13,
    defaultVolumeMl: 150,
    notes: "5 oz pour",
    tags: ["default"],
  },
  cocktail: {
    id: "default-cocktail",
    name: "Balanced Cocktail",
    category: "cocktail",
    abvPercent: 20,
    defaultVolumeMl: 150,
    notes: "Classic stirred drink",
    tags: ["default"],
  },
  shot: {
    id: "default-shot",
    name: "Standard Shot",
    category: "shot",
    abvPercent: 40,
    defaultVolumeMl: 44,
    notes: "1.5 oz pour",
    tags: ["default"],
  },
  other: {
    id: "default-other",
    name: "Hard Seltzer",
    category: "other",
    abvPercent: 5,
    defaultVolumeMl: 355,
    notes: "Highball or RTD",
    tags: ["default"],
  },
};

export function getDefaultOptionForCategory(category: DrinkCategory): DrinkCatalogEntry | undefined {
  return DEFAULT_ENTRIES[category];
}
