# PinkDrunk Product Brief v0.1

## One Sentence
Predicts how many drinks get you to PinkDrunk level 5 — the “just right” buzz — using your body, tolerance, cycle, meds, and history.

## Mission
Blackout isn’t a personality. Give people a cybernetic self-awareness about drinking. PinkDrunk is not moralizing, not medical, not a cop — just a sarcastic smart drink calculator.

## MVP Success Metric
Primary KPI: accuracy of predicted drink quantity required to reach level 5 on the PinkDrunk scale. All other experiences support this prediction loop.

## Target Definition
PinkDrunk(5) = “Light buzz, warm confidence, steady balance, full control.”

## Personalization Strategy
- Default target presented as 5 during onboarding.
- User sets their own PinkDrunk target on day one via 0–10 slider; we store that as `pinkdrunk_target_user`.
- Subsequent sessions refine recommendations by comparing predictions vs. self-reported impairment around the chosen target.

## Brand Voice Anchors
- Sarcasm level 6/9, femme and queer friendly.
- Witty harm reduction; never judgmental.
- Sample tone: “You are 1 drink away from Perfect PinkDrunk.” / “That shot would be chaos math. Not recommended.”

## Core Loop
1. User signs up.
2. Onboarding collects physiology profile and PinkDrunk target preference.
3. User starts a session and selects drink type.
4. Logs drinks as they consume.
5. PinkDrunk shows current predicted level (0–10) and drinks to hit user target.
6. User ends session and reviews recap.

## Scale (0–10)
0 Designated Driver → … → 5 PinkDrunk (target) → 10 Blackout. Level 9 customizable for future personalization.

## Algorithm Position
Internal: Hybrid of Widmark math + learned subjective impairment, cycle, tolerance history. Output: predicted subjective number. Public: never show %BAC or medical claims.

## Platform Scope (v1)
- Native iOS app with cloud sync.
- Sessions stored server-side; geo used for legal context and unit defaults.

## Future Phases
Friend mode, streaks, club integrations, bartender mode, AI drink parser. All post-v1.
