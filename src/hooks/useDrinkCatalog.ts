"use client";

import { useQuery } from "@tanstack/react-query";

import type { DrinkCatalogEntry, DrinkCategory } from "@/lib/drink-catalog";

type DrinkCatalogResponse = {
  drinks: DrinkCatalogEntry[];
};

type CatalogCategory = DrinkCategory | "all";

export function useDrinkCatalog(
  category: CatalogCategory,
  term?: string,
  options?: { enabled?: boolean }
) {
  const enabled = options?.enabled ?? true;
  const searchTerm = term?.trim();

  return useQuery({
    queryKey: ["drink-catalog", category, searchTerm ?? ""],
    enabled,
    queryFn: async (): Promise<DrinkCatalogEntry[]> => {
      const params = new URLSearchParams();
      params.set("category", category);
      if (searchTerm) {
        params.set("term", searchTerm);
      }

      const response = await fetch(`/api/drinks/catalog?${params.toString()}`);
      if (!response.ok) {
        throw new Error("Failed to load drink catalog");
      }
      const data = (await response.json()) as DrinkCatalogResponse;
      return data.drinks ?? [];
    },
    staleTime: 1000 * 60 * 15,
    gcTime: 1000 * 60 * 30,
    refetchOnWindowFocus: false,
  });
}
