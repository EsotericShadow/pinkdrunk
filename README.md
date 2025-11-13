# PINKDRUNK

Because blackout isn’t a personality.

## Stack
- Next.js 16 + App Router
- TypeScript + React 19
- Prisma + PostgreSQL (Neon/Supabase/local Docker)
- React Query for client caching
- Vitest + Testing Library

## Getting Started
1. Provision PostgreSQL (Neon, Supabase, Railway, or local Docker). Example local command:
   ```bash
   docker run --name pinkdrunk-postgres \
     -e POSTGRES_PASSWORD=postgres \
     -e POSTGRES_DB=pinkdrunk \
     -p 5432:5432 -d postgres:16
   ```
2. Copy `.env.example` to `.env` and set:
   - `DATABASE_URL` – your Postgres connection string (include pooling params if using Neon/Vercel)
   - `NEXTAUTH_SECRET` – `openssl rand -base64 32`
   - `NEXTAUTH_URL` – usually `http://localhost:3000` during dev, Vercel URL in prod
3. Install deps, migrate, seed, and run the app:
   ```bash
pnpm install
pnpm db:reset       # drops + migrates + seeds Postgres
pnpm dev            # http://localhost:3000
```

## Deployment
- Full GitHub + Vercel walkthrough: `docs/deployment/vercel.md`

### NPM Scripts
| Script | Purpose |
| --- | --- |
| `pnpm dev` | Start Next dev server |
| `pnpm build` / `pnpm start` | Production build & serve |
| `pnpm test` | Vitest suite (see docs below for filters) |
| `pnpm db:*` | Prisma helpers (`db:migrate`, `db:reset`, etc.) |
| `pnpm catalog:import <csv>` | Convert a CSV of drinks into JSON entries |

## Drink Catalog Pipeline
- JSON lives in `src/data/drinks/<category>/<subcategory>/<id>.json`.
- Templates: `data/catalog-templates/`
- Batch imports: `data/catalog-batches/`
- Script: `scripts/import-drinks.ts` → `pnpm catalog:import data/catalog-batches/batch-03.csv`
- API: `/api/drinks/catalog?category=beer|wine|cocktail|shot|other|all&term=...`

See `docs/architecture/drink-catalog.md` + `docs/catalog/README.md` for schema + workflow details.

## Drink Form UX
- Tabs: **Recents**, **Popular**, **All**, **Custom**.
- Recents store locally (`pinkdrunk-recents`) so users can access log history without a session.
- `All` search spans every catalog entry (default preview + search results).
- A tutorial overlay explains the tabs (auto-shows on first visit, stored in `pinkdrunk-tutorial-v1`).

## Tests
```
SKIP_VITEST_SETUP=1 npx vitest \
  src/components/today/dashboard.test.tsx \
  src/lib/absorption.test.ts \
  src/lib/impairment-thresholds.test.ts \
  src/lib/body-composition.test.ts \
  src/lib/widmark.test.ts \
  src/lib/session-calculator.test.ts \
  --run
```

## Docs
- `docs/architecture/pinkdrunk-bac.md` – BAC model + roadmap
- `docs/architecture/drink-catalog.md` – catalog structure/importer
- `docs/catalog/README.md` – quick catalog reference
- `docs/NEW_CHANGES.md` – latest summary (temporary)

## Contributing
1. Create a feature branch.
2. Run `pnpm lint && pnpm test`.
3. Document catalog/model changes in `docs/`.
4. Open a PR referencing the relevant sections in `docs/NEW_CHANGES.md`.
