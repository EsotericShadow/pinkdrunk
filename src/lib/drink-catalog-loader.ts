import { promises as fs } from "fs";
import path from "path";

import type { DrinkCatalogEntry, DrinkCategory } from "@/lib/drink-catalog";

const DATA_ROOT = path.join(process.cwd(), "src/data/drinks");

export type DrinkDataFile = {
  id: string;
  name: string;
  brand?: string;
  category: DrinkCategory;
  type?: string;
  style?: string;
  abvPercent: number;
  defaultVolumeMl: number;
  description?: string;
  base?: string;
  tags?: string[];
};

export async function loadDrinksByCategory(category: DrinkCategory): Promise<DrinkCatalogEntry[]> {
  const categoryPath = path.join(DATA_ROOT, category);
  const files = await collectJsonFiles(categoryPath);
  const entries: DrinkCatalogEntry[] = [];

  for (const file of files) {
    const raw = await fs.readFile(file, "utf-8");
    const parsed = JSON.parse(raw) as DrinkDataFile;
    entries.push({
      id: parsed.id,
      name: parsed.name,
      category,
      abvPercent: parsed.abvPercent,
      defaultVolumeMl: parsed.defaultVolumeMl,
      notes: parsed.description,
      brand: parsed.brand,
      type: parsed.type ?? parsed.style,
      base: parsed.base,
      tags: parsed.tags ?? [],
    });
  }

  return entries.sort((a, b) => a.name.localeCompare(b.name));
}

async function collectJsonFiles(dir: string): Promise<string[]> {
  const results: string[] = [];
  const entries = await safeReadDir(dir);
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...(await collectJsonFiles(fullPath)));
    } else if (entry.isFile() && entry.name.endsWith(".json")) {
      results.push(fullPath);
    }
  }
  return results;
}

async function safeReadDir(dir: string) {
  try {
    return await fs.readdir(dir, { withFileTypes: true });
  } catch (error) {
    return [];
  }
}
