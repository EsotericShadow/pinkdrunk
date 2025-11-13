"use client";

import { useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DrinkCatalogEntry, DrinkCategory, getDefaultOptionForCategory } from "@/lib/drink-catalog";
import { useDrinkCatalog } from "@/hooks/useDrinkCatalog";
import { useDrinkFormTutorial } from "@/hooks/useDrinkFormTutorial";
import { DrinkFormTutorial } from "@/components/today/drink-form-tutorial";

export type DrinkFormState = {
  category: DrinkCategory;
  mode: "catalog" | "custom";
  optionId?: string;
  label: string;
  abvPercent: string;
  volumeMl: string;
  quantity: string;
};

type Props = {
  drinkForm: DrinkFormState;
  onChange: (next: DrinkFormState) => void;
  onSubmit: () => void;
  disabled: boolean;
  isPending: boolean;
};

const categories: DrinkCategory[] = ["beer", "wine", "cocktail", "shot", "other"];
const RECENTS_KEY = "pinkdrunk-recents";

export function EnhancedDrinkForm({ drinkForm, onChange, onSubmit, disabled, isPending }: Props) {
  const [popularFilter, setPopularFilter] = useState("");
  const [globalSearch, setGlobalSearch] = useState("");
  const [activeSection, setActiveSection] = useState<"recents" | "popular" | "all" | "custom">("popular");
  const [recents, setRecents] = useState<DrinkCatalogEntry[]>([]);

  const globalEnabled = globalSearch.trim().length >= 2;
  const { data: allEntries = [], isLoading: isAllLoading } = useDrinkCatalog("all", undefined);
  const {
    data: globalResults = [],
    isLoading: isGlobalLoading,
  } = useDrinkCatalog("all", globalSearch.trim(), { enabled: globalEnabled });
  const allPreview = useMemo(() => allEntries.slice(0, 30), [allEntries]);
  const showAllPreview = globalSearch.trim().length === 0;
  const tutorial = useDrinkFormTutorial();

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const stored = window.localStorage.getItem(RECENTS_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as DrinkCatalogEntry[];
        setRecents(parsed);
      }
    } catch (error) {
      console.warn("Could not load recents", error);
    }
  }, []);

  const popularEntries = useMemo(() => {
    if (allEntries.length === 0) return [];
    const picks: DrinkCatalogEntry[] = [];
    const capPerCategory = 6;
    categories.forEach((category) => {
      picks.push(
        ...allEntries
          .filter((entry) => entry.category === category)
          .slice(0, capPerCategory)
          .filter((entry) => !picks.some((pick) => pick.id === entry.id))
      );
    });
    return picks;
  }, [allEntries]);

  const popularFiltered = useMemo(() => {
    if (!popularFilter.trim()) {
      return popularEntries;
    }
    const term = popularFilter.toLowerCase();
    return popularEntries.filter((option) => {
      return (
        option.name.toLowerCase().includes(term) ||
        (option.brand?.toLowerCase().includes(term) ?? false) ||
        option.tags.some((tag) => tag.toLowerCase().includes(term))
      );
    });
  }, [popularEntries, popularFilter]);

  const handleCategoryChange = (category: DrinkCategory) => {
    const defaultOption = getDefaultOptionForCategory(category);
    onChange({
      ...drinkForm,
      category,
      mode: "catalog",
      optionId: defaultOption?.id,
      label: defaultOption?.name ?? "",
      abvPercent: (defaultOption?.abvPercent ?? 0).toString(),
      volumeMl: (defaultOption?.defaultVolumeMl ?? 0).toString(),
    });
  };

  const handleOptionSelect = (option: DrinkCatalogEntry) => {
    onChange({
      ...drinkForm,
      mode: "catalog",
      optionId: option.id,
      label: option.name,
      abvPercent: option.abvPercent.toString(),
      volumeMl: option.defaultVolumeMl.toString(),
    });

    const nextRecents = [option, ...recents.filter((recent) => recent.id !== option.id)].slice(0, 12);
    setRecents(nextRecents);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(RECENTS_KEY, JSON.stringify(nextRecents));
    }
  };

  const handleSectionChange = (section: "recents" | "popular" | "all" | "custom") => {
    setActiveSection(section);

    if (section === "custom") {
      onChange({
        ...drinkForm,
        mode: "custom",
        optionId: undefined,
      });
      return;
    }

    if (drinkForm.mode !== "catalog") {
      const selectedOption = drinkForm.optionId
        ? recents.find((recent) => recent.id === drinkForm.optionId) ??
          globalResults.find((option) => option.id === drinkForm.optionId) ??
          allEntries.find((option) => option.id === drinkForm.optionId)
        : undefined;

      const fallback = selectedOption ?? getDefaultOptionForCategory(drinkForm.category);
      const resolvedAbv = (fallback?.abvPercent ?? Number(drinkForm.abvPercent)) || 0;
      const resolvedVolume = (fallback?.defaultVolumeMl ?? Number(drinkForm.volumeMl)) || 0;
      onChange({
        ...drinkForm,
        mode: "catalog",
        optionId: fallback?.id,
        label: fallback?.name ?? drinkForm.label,
        abvPercent: resolvedAbv.toString(),
        volumeMl: resolvedVolume.toString(),
      });
    }
  };

  const handleFieldChange = <K extends keyof DrinkFormState>(field: K, value: DrinkFormState[K]) => {
    onChange({ ...drinkForm, [field]: value });
  };

  const parsedAbv = Number(drinkForm.abvPercent) || 0;
  const parsedVolume = Number(drinkForm.volumeMl) || 0;
  const parsedQuantity = Number(drinkForm.quantity) || 1;
  const totalVolume = parsedVolume * parsedQuantity;
  const standardDrinks = parsedAbv > 0 && totalVolume > 0 ? ((parsedAbv / 100) * totalVolume) / 14 : 0;

  return (
    <div className="space-y-5">
      {tutorial.enabled && <DrinkFormTutorial onDismiss={tutorial.dismiss} />}
      <div className="grid gap-2 md:grid-cols-[auto_auto]">
        <div className="flex flex-wrap gap-2">
          {categories.map((category) => (
            <button
              key={category}
              type="button"
              className={`rounded-full px-3 py-2 text-xs font-semibold uppercase tracking-wide transition ${
                drinkForm.category === category
                  ? "bg-[var(--color-primary)] text-[var(--color-background)]"
                  : "bg-white/10 text-white/70 hover:bg-white/20"
              }`}
              onClick={() => handleCategoryChange(category)}
            >
              {category}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          {["recents", "popular", "all", "custom"].map((section) => (
            <button
              key={section}
              type="button"
              className={`rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.3em] transition ${
                activeSection === section
                  ? "bg-[var(--color-secondary)] text-[var(--color-background)]"
                  : "text-white/60 hover:text-white"
              }`}
              onClick={() => handleSectionChange(section as typeof activeSection)}
            >
              {section}
            </button>
          ))}
        </div>
      </div>

      {activeSection === "all" && (
        <div className="space-y-3 rounded-[var(--radius-md)] border border-white/10 bg-white/5 p-4">
          <div className="flex flex-col gap-1">
            <span className="text-xs uppercase tracking-[0.35em] text-muted">Search all drinks</span>
            <Input
              placeholder="Search by brand, drink, or flavor"
              value={globalSearch}
              onChange={(event) => setGlobalSearch(event.target.value)}
              className="placeholder-muted"
            />
          </div>
          <div className="space-y-2">
            {showAllPreview ? (
              <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                {allPreview.map((option) => (
                  <button
                    key={`${option.category}-${option.id}`}
                    type="button"
                    className="w-full rounded-[var(--radius-sm)] border border-white/10 bg-white/5 px-3 py-2 text-left text-sm text-muted transition hover:border-white/40"
                    onClick={() => handleOptionSelect(option)}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="font-semibold text-foreground">{option.name}</p>
                        <p className="text-xs text-muted">
                          {option.brand ? `${option.brand} · ` : ""}
                          {option.abvPercent}% · {option.category}
                        </p>
                      </div>
                      <span className="tag-pill text-[10px]">{option.category}</span>
                    </div>
                  </button>
                ))}
              </div>
            ) : isGlobalLoading ? (
              <p className="text-sm text-muted">Finding matches...</p>
            ) : globalEnabled && globalResults.length === 0 ? (
              <p className="text-sm text-muted">No results yet. Try another keyword.</p>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                {globalResults.slice(0, 20).map((option) => (
                  <button
                    key={`${option.category}-${option.id}`}
                    type="button"
                    className="w-full rounded-[var(--radius-sm)] border border-white/10 bg-white/5 px-3 py-2 text-left text-sm text-muted transition hover:border-white/40"
                    onClick={() => handleOptionSelect(option)}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="font-semibold text-foreground">{option.name}</p>
                        <p className="text-xs text-muted">
                          {option.brand ? `${option.brand} · ` : ""}
                          {option.abvPercent}% · {option.category}
                        </p>
                      </div>
                      <span className="tag-pill text-[10px]">{option.category}</span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {activeSection === "popular" && (
        <div className="space-y-3">
          <Input
            placeholder="Filter popular drinks"
            value={popularFilter}
            onChange={(event) => setPopularFilter(event.target.value)}
            disabled={isAllLoading}
          />
          {isAllLoading ? (
            <p className="text-sm text-white/60">Loading favorites…</p>
          ) : popularFiltered.length === 0 ? (
            <p className="text-sm text-white/60">No matches yet. Try a different keyword.</p>
          ) : (
            <div className="max-h-72 space-y-2 overflow-y-auto pr-1">
              {popularFiltered.slice(0, 24).map((option) => (
                <button
                  key={`${option.category}-${option.id}`}
                  type="button"
                  className={`w-full rounded-[var(--radius-md)] border px-3 py-2 text-left transition ${
                    drinkForm.optionId === option.id
                      ? "border-[var(--color-primary)] bg-[var(--color-primary)]/10"
                      : "border-white/10 bg-white/5 hover:border-white/30"
                  }`}
                  onClick={() => handleOptionSelect(option)}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-semibold text-white">{option.name}</p>
                      <p className="text-xs text-white/60">
                        {option.brand ? `${option.brand} · ` : ""}
                        {option.abvPercent}% · {option.category}
                      </p>
                    </div>
                    <span className="tag-pill text-[10px]">{option.category}</span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {activeSection === "recents" && (
        <div className="space-y-3">
          {recents.length === 0 ? (
            <p className="text-sm text-muted">No recents yet. Log something once and it’ll show up here.</p>
          ) : (
            <div className="max-h-72 space-y-2 overflow-y-auto pr-1">
              {recents.map((option) => (
                <button
                  key={`${option.category}-${option.id}`}
                  type="button"
                  className="w-full rounded-[var(--radius-md)] border border-white/15 bg-white/5 px-3 py-2 text-left transition hover:border-white/40"
                  onClick={() => handleOptionSelect(option)}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-semibold text-white">{option.name}</p>
                      <p className="text-xs text-white/60">
                        {option.brand ? `${option.brand} · ` : ""}
                        {option.abvPercent}% · {option.category}
                      </p>
                    </div>
                    <span className="tag-pill text-[10px]">{option.category}</span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {activeSection === "custom" && (
        <div className="space-y-3 rounded-[var(--radius-lg)] border border-white/10 bg-white/5 p-4">
          <p className="text-xs uppercase tracking-wide text-white/60">Serving details</p>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="text-xs uppercase tracking-wide text-white/60">Label</label>
              <Input
                value={drinkForm.label}
                onChange={(event) => handleFieldChange("label", event.target.value)}
                placeholder="What did you just drink?"
              />
            </div>
            <div>
              <label className="text-xs uppercase tracking-wide text-white/60">ABV %</label>
              <Input
                type="number"
                min="0"
                max="100"
                step="0.5"
                value={drinkForm.abvPercent}
                onChange={(event) => handleFieldChange("abvPercent", event.target.value)}
              />
            </div>
            <div>
              <label className="text-xs uppercase tracking-wide text-white/60">Volume (ml)</label>
              <Input
                type="number"
                min="10"
                max="2000"
                step="10"
                value={drinkForm.volumeMl}
                onChange={(event) => handleFieldChange("volumeMl", event.target.value)}
              />
            </div>
            <div>
              <label className="text-xs uppercase tracking-wide text-white/60">Quantity</label>
              <Input
                type="number"
                min="0.25"
                step="0.25"
                value={drinkForm.quantity}
                onChange={(event) => handleFieldChange("quantity", event.target.value)}
              />
            </div>
            <div className="rounded-[var(--radius-md)] bg-white/10 px-3 py-2 text-sm text-white/70">
              <p>Total volume: {totalVolume.toFixed(0)} ml</p>
              <p className="text-xs text-white/50">≈ {standardDrinks.toFixed(2)} standard drinks</p>
            </div>
          </div>
        </div>
      )}

      <Button onClick={onSubmit} disabled={disabled || isPending} className="w-full">
        {isPending ? "Logging..." : "Log drink"}
      </Button>
    </div>
  );
}
