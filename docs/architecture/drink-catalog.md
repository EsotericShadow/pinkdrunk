# Drink Catalog Data Flow

## Directory layout
Drink metadata now lives under `src/data/drinks/`, organized by category → subtype → brand. Each JSON file represents a single SKU or archetype and follows this schema:

```json
{
  "id": "budweiser",
  "name": "Budweiser",
  "brand": "Anheuser-Busch",
  "category": "beer",
  "type": "lager",
  "style": "American Lager",
  "abvPercent": 5,
  "defaultVolumeMl": 355,
  "description": "Classic American adjunct lager.",
  "base": "barley",
  "tags": ["lager", "american", "macro"]
}
```

Categories mirror the UI filters (`beer`, `wine`, `cocktail`, `shot`, `other`). Deeper directories (e.g., `beer/lager/` or `cocktail/spritz/`) keep things tidy but are purely organizational.

## Loading strategy
- `src/lib/drink-catalog-loader.ts` walks the filesystem server-side (via `fs`) and normalizes JSON into `DrinkCatalogEntry` objects.
- `/api/drinks/catalog` exposes a chunked endpoint: clients request one category at a time, with optional `term`, `type`, `base`, and `limit` query params.
- Client components (`EnhancedDrinkForm`) fetch per-category data on demand instead of bundling thousands of entries up front. Search now filters within the loaded chunk, and error/loading states are displayed inline.

## Defaults & fallbacks
`src/lib/drink-catalog.ts` keeps lightweight defaults so session forms still have sensible values before the first fetch completes. Adding a new canonical default per category only requires editing that map.

## Adding new drinks
1. Drop a JSON file in the appropriate directory (`src/data/drinks/<category>/<subtype>/brand-name.json>`).
2. Keep IDs kebab-cased and unique; include `tags` for better search coverage.
3. No code changes are required after adding the file—the loader and API will pick it up automatically.

### Bulk importing via CSV
Use the importer script when you have a spreadsheet of entries:

```bash
pnpm catalog:import ./data/drinks.csv
```

CSV headers should include: `name,category,subcategory,type,style,abvPercent,defaultVolumeMl,description,brand,base,tags`. Each row produces `src/data/drinks/<category>/<subcategory>/<id>.json` (IDs are auto-slugified if missing). The importer skips rows with unknown categories and reports counts when finished.

Starter templates live in `data/catalog-templates/` (beer/wine/cocktail/shot/other). Copy the relevant file, fill in new rows, and pass it to `pnpm catalog:import` to generate matching JSON files.
