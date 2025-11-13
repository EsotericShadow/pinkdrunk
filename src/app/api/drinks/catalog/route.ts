import { NextRequest, NextResponse } from "next/server";

import type { DrinkCatalogEntry, DrinkCategory } from "@/lib/drink-catalog";
import { loadDrinksByCategory } from "@/lib/drink-catalog-loader";

const VALID_CATEGORIES: DrinkCategory[] = ["beer", "wine", "cocktail", "shot", "other"];

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const categoryParam = (searchParams.get("category") ?? "all").toLowerCase();
  const categoriesToLoad =
    categoryParam === "all"
      ? VALID_CATEGORIES
      : VALID_CATEGORIES.includes(categoryParam as DrinkCategory)
        ? [categoryParam as DrinkCategory]
        : [];

  if (categoriesToLoad.length === 0) {
    return NextResponse.json({ error: "Missing or invalid category" }, { status: 400 });
  }

  const term = searchParams.get("term")?.toLowerCase().trim();
  const type = searchParams.get("type")?.toLowerCase().trim();
  const base = searchParams.get("base")?.toLowerCase().trim();
  const limit = Number(searchParams.get("limit") ?? 200);

  let drinks: DrinkCatalogEntry[] = [];
  for (const category of categoriesToLoad) {
    const entries = await loadDrinksByCategory(category);
    drinks = drinks.concat(entries);
  }

  let filtered = drinks;
  if (term) {
    filtered = filtered.filter((drink) => {
      return (
        drink.name.toLowerCase().includes(term) ||
        (drink.brand?.toLowerCase().includes(term) ?? false) ||
        drink.tags.some((tag) => tag.toLowerCase().includes(term))
      );
    });
  }

  if (type) {
    filtered = filtered.filter((drink) => drink.type?.toLowerCase().includes(type));
  }

  if (base) {
    filtered = filtered.filter((drink) => drink.base?.toLowerCase().includes(base));
  }

  const maxLimit = Math.max(10, Math.min(limit, 500));
  return NextResponse.json({ drinks: filtered.slice(0, maxLimit) });
}
