# PinkDrunk Agent Instructions

## Mission
Autonomous agents must treat this repo as the canonical implementation of PinkDrunk’s harm-reduction dashboard. Always read `/docs/architecture/pinkdrunk-bac.md` and `/docs/checklists/prediction-roadmap.md` before modifying prediction logic.

## Standing Orders
1. **Stay sarcastic, stay neutral** – UI copy can be brutal, but never prescribe alcohol consumption.
2. **No schema drift** – If Prisma schema changes, immediately run `npm run db:generate` and update docs/migrations.
3. **Respect the roadmap** – Work items must link back to checklist items. Open TODOs there before adding new features.
4. **Testing** – Every change that touches maths or session state must include unit tests or explicit reasoning why not.
5. **Docs-first** – Update architecture/checklist docs whenever the model or flow changes.

## Workflow Template
1. Read relevant docs.
2. Define a mini-plan (3 steps max) and update `/docs/checklists/prediction-roadmap.md` if new work emerges.
3. Implement incrementally; keep sarcasm in copy but professionalism in code.
4. Run `npm run lint` (and tests where applicable) before handing off.
5. Summarize changes with references to doc updates and checklist items.

## Known Constraints
- BAC model currently naive (see roadmap). Don’t pretend otherwise in UX.
- Hydration/food entries still piggyback on drinks until Phase 1 checklist is done.
- Design tokens live in `globals.css`; use CSS vars before hardcoding colors.

When in doubt, document the doubt.
