import { PrismaClient, type ServingSizeType } from "@prisma/client";

import type { DrinkCatalogEntry, DrinkCategory } from "../src/lib/drink-catalog";
import { loadDrinksByCategory } from "../src/lib/drink-catalog-loader";

const prisma = new PrismaClient();

const uniqueByName = (entries: DrinkCatalogEntry[]) => {
  const seen = new Set<string>();
  return entries.filter((entry) => {
    if (seen.has(entry.name)) return false;
    seen.add(entry.name);
    return true;
  });
};

async function loadCatalogEntries() {
  const categories: DrinkCategory[] = ["beer", "wine", "shot", "other", "cocktail"];
  const entries = await Promise.all(
    categories.map(async (category) => [category, uniqueByName(await loadDrinksByCategory(category))] as const),
  );

  const lookup = Object.fromEntries(entries) as Record<DrinkCategory, DrinkCatalogEntry[]>;

  return {
    beerEntries: lookup.beer,
    wineEntries: lookup.wine,
    shotEntries: lookup.shot,
    otherEntries: lookup.other,
    cocktailEntries: lookup.cocktail,
  };
}

const BEER_SIZE_DEFAULTS = {
  pint: 473,
  halfPint: 237,
  pitcher: 1893,
};

function getServingSizes(entry: DrinkCatalogEntry): Array<{ sizeType: ServingSizeType; volumeMl: number }> {
  if (entry.category === "beer") {
    return [
      { sizeType: "can" as ServingSizeType, volumeMl: entry.defaultVolumeMl },
      { sizeType: "bottle" as ServingSizeType, volumeMl: entry.defaultVolumeMl },
      { sizeType: "pint" as ServingSizeType, volumeMl: BEER_SIZE_DEFAULTS.pint },
      { sizeType: "half_pint" as ServingSizeType, volumeMl: BEER_SIZE_DEFAULTS.halfPint },
      { sizeType: "pitcher" as ServingSizeType, volumeMl: BEER_SIZE_DEFAULTS.pitcher },
    ];
  }

  if (entry.category === "wine") {
    const base = [
      { sizeType: "wine_glass" as ServingSizeType, volumeMl: entry.defaultVolumeMl || 150 },
      { sizeType: "single" as ServingSizeType, volumeMl: entry.defaultVolumeMl || 150 },
      { sizeType: "double" as ServingSizeType, volumeMl: Math.round((entry.defaultVolumeMl || 150) * 2) },
      { sizeType: "bottle" as ServingSizeType, volumeMl: 750 },
    ];

    const isSparkling = /champagne|sparkling|prosecco|cava|brut|flute/i.test(entry.name);
    if (isSparkling) {
      base.push({ sizeType: "champagne_flute" as ServingSizeType, volumeMl: entry.defaultVolumeMl || 120 });
    }
    return base;
  }

  if (entry.category === "shot") {
    const volume = entry.defaultVolumeMl || 44;
    return [
      { sizeType: "shot" as ServingSizeType, volumeMl: volume },
      { sizeType: "single" as ServingSizeType, volumeMl: volume },
      { sizeType: "double" as ServingSizeType, volumeMl: Math.round(volume * 2) },
    ];
  }

  if (entry.category === "other") {
    const baseVolume = entry.defaultVolumeMl || 355;
    const bottleVolume = Math.min(Math.round(baseVolume * 4), 750);
    return [
      { sizeType: "can" as ServingSizeType, volumeMl: baseVolume },
      { sizeType: "bottle" as ServingSizeType, volumeMl: bottleVolume },
      { sizeType: "single" as ServingSizeType, volumeMl: baseVolume },
      { sizeType: "double" as ServingSizeType, volumeMl: Math.round(baseVolume * 2) },
    ];
  }

  return [];
}

function pickCocktailServingSize(volumeMl: number): ServingSizeType {
  if (volumeMl <= 90) return "rocks";
  if (volumeMl <= 150) return "martini";
  if (volumeMl <= 220) return "short";
  if (volumeMl <= 320) return "highball";
  if (volumeMl <= 400) return "tall";
  return "pitcher";
}

async function seedBrand(entry: DrinkCatalogEntry) {
  const brand = await prisma.drinkBrand.upsert({
    where: { name: entry.name },
    update: {
      abvPercent: entry.abvPercent,
      standardVolumeMl: entry.defaultVolumeMl,
      description: entry.notes ?? null,
      category: entry.category,
    },
    create: {
      name: entry.name,
      category: entry.category,
      abvPercent: entry.abvPercent,
      standardVolumeMl: entry.defaultVolumeMl,
      description: entry.notes ?? null,
    },
  });

  const servingSizes = getServingSizes(entry);
  if (servingSizes.length > 0) {
    await prisma.brandServingSize.deleteMany({ where: { brandId: brand.id } });
    await prisma.brandServingSize.createMany({
      data: servingSizes.map((size) => ({
        brandId: brand.id,
        sizeType: size.sizeType,
        volumeMl: size.volumeMl,
      })),
    });
  }
}

async function seedMixedDrink(entry: DrinkCatalogEntry) {
  await prisma.mixedDrink.upsert({
    where: { name: entry.name },
    update: {
      abvPercent: entry.abvPercent,
      volumeMl: entry.defaultVolumeMl,
      servingSize: pickCocktailServingSize(entry.defaultVolumeMl),
      description: entry.notes ?? null,
    },
    create: {
      name: entry.name,
      category: "cocktail",
      abvPercent: entry.abvPercent,
      volumeMl: entry.defaultVolumeMl,
      servingSize: pickCocktailServingSize(entry.defaultVolumeMl),
      ingredients: entry.notes ?? null,
      description: entry.notes ?? null,
    },
  });
}

async function seedPresets() {
  const presets = [
    { name: "Standard Beer", category: "beer" as const, abvPercent: 5, volumeMl: 355, servingSize: "can" as const, isDefault: true },
    { name: "Standard Wine", category: "wine" as const, abvPercent: 13.5, volumeMl: 150, servingSize: "wine_glass" as const, isDefault: true },
    { name: "Standard Cocktail", category: "cocktail" as const, abvPercent: 20, volumeMl: 150, servingSize: "martini" as const, isDefault: true },
    { name: "Standard Shot", category: "shot" as const, abvPercent: 40, volumeMl: 44, servingSize: "shot" as const, isDefault: true },
    { name: "Standard Other", category: "other" as const, abvPercent: 5, volumeMl: 355, servingSize: "can" as const, isDefault: true },
  ];

  for (const preset of presets) {
    await prisma.drinkPreset.upsert({
      where: { name: preset.name },
      update: preset,
      create: preset,
    });
  }
}

async function main() {
  console.log("🌱 Syncing drink catalog into Prisma...");

  const { beerEntries, wineEntries, shotEntries, otherEntries, cocktailEntries } = await loadCatalogEntries();

  for (const entry of [...beerEntries, ...wineEntries, ...shotEntries, ...otherEntries]) {
    await seedBrand(entry);
  }

  for (const entry of cocktailEntries) {
    await seedMixedDrink(entry);
  }

  await seedPresets();

  console.log("✅ Drink catalog synced to database");
}

main()
  .catch((error) => {
    console.error("❌ Error seeding:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
