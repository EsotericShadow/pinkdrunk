# UX Framework & Brand Direction

## Experience Principles
- **Radically Honest, Never Moralizing:** Deliver blunt facts with wit; never shame, always empower.
- **Friction Where it Matters:** Collect critical physiology data with explanation tooltips; keep session logging one-handed.
- **Safety by Default:** PinkDrunk always knows your context (location, meds) and flags danger early without paternalism.
- **Playful Fem Futurism:** Lean into femme, queer aesthetics with neon warmth contrasted against data minimalism.
- **Grounded Felt State:** Anchor the experience around a concrete definition — PinkDrunk(5) = “Light buzz, warm confidence, steady balance, full control.”

## Target Personas
- **The Party Scientist:** 26yo queer femme, data-obsessed; wants precise control before big nights.
- **The Chill Caretaker:** 31yo bi woman who looks after friends; wants timely warnings and group cues.
- **The Cycle Hacker:** 29yo trans masc on HRT; needs cycle-aware adjustments and medication safety.

## Core Flows
1. **Onboarding & Profile Build**
   - Welcome sarcasm screen → consent + privacy summary → physiology intake (wizard) → tone quiz to calibrate sarcasm → PinkDrunk target slider (user sets ideal level day one).
2. **Pre-Game Session Setup**
   - Select intent (casual, big night, unknown) → confirm location → confirm PinkDrunk target (pre-filled from slider) → optional friends tagging (future).
3. **Live Session Dashboard**
   - Upper card: current PinkDrunk level with wavy gradient bar.
   - Middle: next recommended action (hydrate, wait X min, keep sipping) relative to user-defined target.
   - Bottom: quick-add drink buttons + manual entry + sarcasm ticker.
4. **Session Wind-Down**
   - Recap predicted vs. felt level, hydration tips, shareable summary.
   - Prompt to adjust tolerance / note meds changes.
5. **History & Insights**
   - Timeline of sessions with highlight cards (best PinkDrunk streak, caution nights).

## Information Architecture (v1)
- Tab 1: `Today` (live session / start new)
- Tab 2: `History`
- Tab 3: `Profile`
- Tab 4: `Settings`
- Global modal trigger for quick drink logging accessible via floating button.

## Voice & Tone Guidelines
- Sarcasm scale baseline at 6/9; allow user to soften via settings.
- Always pair sarcasm with a factual anchor (e.g., “Chaos math. Also your meds say no.”).
- Prohibited: lectures, moral judgments, gendered assumptions.
- Microcopy library maintained in localization JSON with tags for tone level.

## Visual Language
- **Palette**
  - Primary: `#FF5CA8` (PinkDrunk Pink)
  - Secondary: `#3B0F5C` (Midnight Plum)
  - Accent: `#5FF7D2` (Cyber Mint), `#FFD166` (Golden Hour)
  - Surface: Gradient combos (Pink → Plum) with glassmorphism overlays.
- **Typography**
  - Display: GT Flexa Alt (or SF Pro Rounded fallback)
  - Body: SF Pro Text
  - Numbers: Tabular alignment for PinkDrunk scale.
- **Iconography & Motion**
  - Custom glyphs for drink types with neon edge glow.
  - Motion easing: overshoot with damping to feel cheeky yet controlled.
  - Haptics: light taps for recommended action changes, stronger pulses for danger alerts.

## Accessibility & Inclusivity
- Minimum contrast 4.5:1 for text within primary surfaces.
- Provide text alternatives for color-coded warnings; use icons + text + haptics.
- Allow manual tone-down of sarcasm and disable animations mode.
- Support chosen name pronouns, non-binary cycle tracking options.

## Outstanding Design Questions
- Validation of pink-to-plum gradient legibility in low-light bars.
- Need for widget/complication support for Apple Watch (post-MVP?).
- Where to surface community guidance without introducing social pressure.
- Testing tolerance of sarcasm slider default in colder markets.
