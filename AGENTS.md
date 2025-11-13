# Repository Guidelines

## Project Structure & Module Organization
PinkDrunk is a Next.js 16 + TypeScript app under `src/`. `src/app` owns route groups and server actions, `src/components` hosts shared UI, `src/features` contains domain flows, and `src/lib` keeps calculators, session helpers, and utilities (tests sit alongside, e.g., `src/lib/widmark.test.ts`). Prisma schema, migrations, and seeds live in `prisma/`, while static media belongs in `public/`. Keep environment templates in `.env.example`; never commit your filled `.env`.

## Build, Test & Development Commands
- `npm run dev`: start the Next dev server with hot reload.
- `npm run build`: compile the production bundle and perform type emission checks.
- `npm run start`: serve the `.next` output for local smoke tests after building.
- `npm run lint`: enforce the ESLint (Next config) rules over `.ts/.tsx`.
- `npm run typecheck`: run `tsc --noEmit` for CI-parity type safety.
- `npm test` / `npm run test:ui`: execute Vitest in CLI or UI mode.
- Database helpers: `npm run db:push`, `npm run db:seed`, `npm run db:studio` whenever you touch `prisma/schema.prisma`.

## Coding Style & Naming Conventions
Use TypeScript, ES modules, and default React Server Component patterns. Follow the repo’s Prettier-equivalent formatting: 2-space indentation, double quotes, trailing commas where valid. Component files use PascalCase (e.g., `components/AuthDialog.tsx`); hooks and utilities use camelCase (e.g., `useSessionStore.ts`). Keep server-only logic in `src/lib` or dedicated route handlers and export explicit types instead of `any`. Run `npm run lint` before opening a PR; fix auto-fixable issues with `eslint --fix`.

## Testing Guidelines
Vitest with Testing Library powers unit and integration coverage. Name tests `*.test.ts` beside their subjects and favor behavior-focused `describe/it` blocks. Use jsdom helpers from `vitest.setup.ts` for component tests, and stub network or auth boundaries explicitly. Target edge cases for calculators and hydration logic, and add regression tests before modifying algorithms. Use `npm test -- --runInBand` if a flaky async case appears in CI.

## Commit & PR Guidelines
History currently favors short imperative subjects (e.g., “Initial commit from Create Next App”). Keep summaries under ~72 chars (“Add widmark calculator tests”) and include body context for migrations or UI shifts. PRs should link issues, describe user-facing impact, list new env vars or Prisma operations, and attach screenshots or CLI logs for UI/data changes. Confirm lint, typecheck, tests, and any schema command before requesting review.

## Security & Configuration Tips
Copy `.env.example` to `.env` and supply NextAuth secrets, database URLs, and encryption keys locally only. After schema updates, run `npm run db:push` and reseed with `npm run db:seed` before demos. Keep sensitive assets out of `public/`; prefer signed URLs or storage integrations when adding user uploads or analytics dumps.
