# PinkDrunk BAC & Impairment Architecture

_Last updated: $(date +%Y-%m-%d)_

## 1. Purpose
Establish a single source of truth for how PinkDrunk converts logged drinks + physiology into predicted impairment levels, including upcoming upgrades (absorption curve, tolerance learning, hydration modifiers). All engineering/AI agents should reference this doc before touching prediction logic.

## 2. Current Implementation (v0)
- **Model**: Widmark equation using Watson-derived r-factors when TBW is available, falling back to gender defaults (0.55F / 0.68M / 0.62). Each drink now follows a first-order absorption curve (`k_a = 1.5/hr`) gated by its `ingestionMinutes`, so partial pours keep BAC lower until they’re actually absorbed.
- **Inputs**: Sum of drink grams, user weight, gender, elapsed hours. Metabolism slider only tweaks elimination rate (~±0.0032 g/dL/hr). Tolerance slider scales BAC before mapping to 0–10 scale.
- **Care events**: Hydration/food logged as zero-ABV drinks; offsets subtract arbitrary values (≤0.012 BAC / 1.8 levels).
- **Projection**: `estimateDrinksToTarget` assumes standard 14-gram drinks with instant absorption; `estimateMinutesToTarget` uses constant elimination.
- **Learning**: User-reported impairment (logged via `/api/session/[id]/report`) now nudges per-level gram thresholds using an EWMA update; confidence ticks up with each observation.
- **Calibration staging**: Baseline impairment thresholds (levels 1–10) are persisted per user, surfaced in the UI with confidence labels, and bundled with every prediction; EWMA updates refine them whenever users log their felt level.

## 3. Identified Gaps
1. **Absorption**: k_a model ignores hydration/food modifiers and assumes a single constant for everyone; ingestion curves don’t yet adapt for chasers or multi-stage pours.
2. **Body composition**: BMI/TBW now derived and persisted, but meds/conditions still unused; r-factor doesn’t yet account for medication/body fat modifiers beyond Watson.
3. **Tolerance learning**: Slider only scales BAC; no data-driven category thresholds.
4. **Hydration/Food**: No physiological basis; subtracts values directly from BAC.
5. **Projection accuracy**: Predicts “drinks to target” via 14 g increments rather than actual drink spec; no scenario preview.
6. **Data separation**: Care events stored as drinks, polluting session logs.

## 4. Target Architecture (v1.1+)
| Layer | Upgrade | Notes |
| --- | --- | --- |
| Ingestion | Track absorption curves per drink using ingestion minutes + first-order kinetics. | Use k_a ~1.5/hr (tweakable). |
| Body model | Derive total body water (Watson) from height/weight/age/sex; compute r dynamically. | Allows BMI impact + future meds modifiers. |
| Calibration | Maintain per-category ethanol thresholds seeded from onboarding questionnaire; update via EWMA of (reported level vs predicted). | Store thresholds in DB per user. |
| Hydration/Food | Store care events separately with timestamps + volume/type. | Hydration reduces absorption rate temporarily; meals delay absorption start. |
| Projection | Provide per-drink preview: if user submits current form, compute future level/time. | Surface in UI before logging. |
| Learning loop | Persist user-reported category per session (already captured) and feed back into thresholds. | Adds API/DB table `impairment_calibration`. |

## 5. Data/Schema Additions (planned)
- `care_events` table with `{ id, sessionId, type: 'water' | 'meal' | 'snack', volumeMl, loggedAt }`. ✅
- `impairment_thresholds` table storing grams required for each scale bucket plus metadata (updatedAt, confidence). ✅ baseline only; adaptive updates next.
- Optional `drink_ingestion_minutes` override for drink presets.

## 6. Algorithm Outline (future work)
1. **Absorption model**
   ```text
   grams_absorbed(t) = \sum drink_i grams_i * (1 - e^{-k_a * (t - start_i)}) for t >= start_i
   ```
   Subtract elimination `k_e = base + metabolism_adjustment` continuously.
2. **TBW-based r-factor**
   - Use Watson formula -> TBW liters -> r = TBW / weight.
3. **Threshold learning**
   - Initialize thresholds from onboarding “X drinks until Y” by converting to grams.
   - After each session: error = (reported_level - predicted_level); adjust surrounding thresholds.
4. **Hydration/Food adjustments**
   - Water: reduce k_a by α for 45 min, or add delay if large volume.
   - Meal/snack: delay absorption start or reduce effective grams.
5. **Projection**
   - Provide function `predictLevelAfter(drinkPayload, minutesAhead)` returning level & time to target.

## 7. Implementation Order (suggested)
1. Add care-event model + move water/food logs out of drinks.
2. Introduce TBW-based r-factor + ingestion-aware Widmark (no learning yet).
3. Build per-user threshold storage + calibration job.
4. Wire hydration/food effects and update UI (hydration cards show effect).
5. Upgrade projection + UI preview.

## 8. References
- Watson TBW formula
- Widmark elimination constants
- NHTSA data on food/hydration delays (link TODO)

_Next action: see `/docs/checklists/prediction-roadmap.md` for task-level tracking._
