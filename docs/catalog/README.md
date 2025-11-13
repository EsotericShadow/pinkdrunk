# PinkDrunk Drink Catalog

## Templates
Starter CSVs live in `data/catalog-templates/` for beer, wine, cocktails, shots, and other (RTDs/seltzers). Each row uses the importer schema:

```
name,category,subcategory,type,style,abvPercent,defaultVolumeMl,description,brand,base,tags
```

Tags are semicolon or comma-separated (`"lager;macro"`). `subcategory` drives the nested folder (`src/data/drinks/<category>/<subcategory>/…`).

## Import workflow
1. Copy the appropriate template (or stitch multiple templates into one CSV) and fill in new rows.
2. Run `pnpm catalog:import ./path/to/file.csv` to generate/update JSON files under `src/data/drinks/`.
3. Commit both the CSV (if you want history) and the generated JSON files.

## Validation tips
- Keep `category` in the set: `beer`, `wine`, `cocktail`, `shot`, `other`.
- Use kebab-case IDs if you specify them; otherwise the importer slugifies `brand-name`.
- Include useful tags (`"ipa;west-coast"`, `"classic;iba"`) to boost search results.
