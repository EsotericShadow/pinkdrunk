# Prediction Upgrade Checklist

Keep this document in sync with actual progress. Check items only after code/tests land.

## Phase 1 – Data Hygiene
- [x] Introduce `care_events` table + API (water/snack/meal) and stop logging them as drinks.
- [x] Validate drink payloads server-side (volume/ABV bounds, ingestion minutes).
- [x] Add migration scripts + Prisma client regeneration automation (`postinstall` already added).

## Phase 2 – Physiological Accuracy
- [x] Compute Total Body Water (Watson) per profile and derive dynamic r-factor.
- [x] Store BMI / TBW in profile for analytics and update API responses to include them.
- [x] Implement ingestion-aware Widmark (absorption curve using `ingestionMinutes`).

## Phase 3 – Personal Calibration
- [x] Persist baseline impairment thresholds per user (seed from profile inputs).
- [x] After each session, compare predicted vs reported level and update thresholds via EWMA.
- [ ] Expose calibration confidence in UI (e.g., “Model 62% sure you peak at 6”).

## Phase 4 – Care-Action Modeling
- [ ] Log hydration/snack events in new table and display timeline.
- [ ] Adjust absorption/elimination temporarily when events occur.
- [ ] Surface reminders (“last water 48 min ago”).

## Phase 5 – Projection UX
- [ ] When composing a drink, show “If you log this now → Level X at HH:MM”.
- [ ] Update “Drinks to target” metric to use actual drink spec.
- [ ] Add explanation tooltip (“We assume you’ll sip this over N minutes”).

## Phase 6 – QA + Docs
- [ ] Unit tests covering absorption math, calibration updates, and hydration modifiers.
- [ ] Update `/docs/architecture/pinkdrunk-bac.md` with implementation details & equations.
- [ ] Record regression tests for onboarding/settings to ensure units + thresholds stay stable.
