# Open Questions & Research Backlog

## UX & Interaction
- ~~What is the minimum viable onboarding flow that collects physiology data without fatigue?~~ **Resolved** — see onboarding flow below.
- How should the session screen surface the live PinkDrunk score without encouraging over-drinking?
- What offline modes (if any) are required for logging in low-connectivity environments like clubs?
- How granular should drink logging be (single tap presets vs. manual ABV + volume entry)?
- Which microcopy tone resonates in tests (how biting can sarcasm go before users feel judged)?

### Decision: MVP Onboarding Flow (v1)
1. **Sign up** — email + password.
2. **Profile basics** — name, auto geo, optional profile pic.
3. **Body stats** — height & weight (unit-flexible), derive BMI.
4. **Physiology** — age, gender selection, menstruation, medications, conditions; branching detail screens if any flags true.
5. **Metabolism** — self-report slider 1–10.
6. **Tolerance** — self-report slider 1–10.
7. **Define PinkDrunk target** — 0–10 slider defaulting to 5.
8. **Wrap up** — confirmation, lands on session start.

## BAC Algorithm & Personalization
- Which Widmark variant best fits diverse body types and hormonal cycle impacts?
- How frequently should the model retrain on user session history versus population baselines?
- What subjective impairment inputs are most predictive when combined with physiological factors?
- How do we model menstruation phase impacts when cycles are irregular or data is missing?
- What thresholds trigger cautionary messages versus hard warnings?

## Settings & Controls
- Which profile fields must remain editable mid-session (medications, conditions, geography)?
- How do we expose “reset tolerance” or “new baseline” options without confusing casual users?
- What data export or deletion controls are legally required in target regions?
- Do we support manual overrides for legal drink unit defaults when traveling?
- Should there be granular notification controls for session reminders and stop alerts?

## Brand, Style & Visual System
- What color palette communicates “femme, fun, harm reduction” without medicalizing the UI?
- How bold can the typography be while maintaining accessibility in dark environments?
- Which motion design cues cue “playful sarcasm” vs. “dangerous hype”?
- What visual metaphors best represent the 0–10 PinkDrunk scale?
- Are there cultural sensitivities in color or iconography for global launch markets?

## Research Tasks & Inputs Needed
- Conduct 5 qualitative interviews with target personas (femme, queer, nightlife-focused) to validate tone.
- Run diary study with drink logging prototypes to observe data entry fatigue and accuracy.
- Commission literature review on menstrual cycle impact on BAC to inform initial model priors.
- Benchmark competitor apps (BAC trackers, sober-curious tools) for feature gaps and compliance lessons.
- Validate regulatory requirements (GDPR, CCPA, regional drinking laws) with legal consultant.

## MVP Core Loop Reference (for context)
- Start session → log first drink → PinkDrunk converts to units → PinkDrunk predicts current level + drinks to target.
