# Recent Changes Summary

## Catalog & Drink Logging
- Added data-driven drink catalog under `src/data/drinks/` with ~100 curated entries imported from CSV batches (`data/catalog-batches/`).
- `/api/drinks/catalog` plus the `useDrinkCatalog` hook now support `category=all`, cross-category search, and client caching.
- `EnhancedDrinkForm` reorganized into Recents / Popular / All / Custom tabs, with global search, localStorage-backed recents, and custom fields only when needed.

## Tutorial & UX
- Introduced `useDrinkFormTutorial` + `DrinkFormTutorial` overlay explaining the new tabs; it auto-opens on first visit and stores dismissal.
- Landing page copy/headline refreshed to match the “dry, witty” brand tone; header tagline updated to “Because blackout isn’t a personality.”

## Utilities & Scripts
- Added `scripts/import-drinks.ts` (run via `pnpm catalog:import`) to convert CSV rows into JSON catalog entries. Templates live in `data/catalog-templates/`.
- Documented the data pipeline in `docs/architecture/drink-catalog.md` and quick notes in `docs/catalog/README.md`.

## Deployment & Infra
- Prisma now targets PostgreSQL (pooled `DATABASE_URL` + `DIRECT_URL`) so the app can run on Vercel with Neon/Supabase/etc instead of local SQLite.
- Added `docs/deployment/vercel.md` that walks through GitHub pushes, Vercel env vars, migrations, and seeding a managed database.

Tests: `SKIP_VITEST_SETUP=1 npx vitest src/components/today/dashboard.test.tsx src/lib/absorption.test.ts src/lib/impairment-thresholds.test.ts src/lib/body-composition.test.ts src/lib/widmark.test.ts src/lib/session-calculator.test.ts --run`
