# Data Model & Storage Blueprint

## Entity Overview
- `users`: Auth identity (Auth0 subject), email, legal consent flags.
- `profiles`: One-to-one with user; physiology snapshot (age, height, weight, gender, menstrual settings) and PinkDrunk preference.
- `sessions`: Drinking sessions; holds start/end, context (location, intent), target level.
- `drinks`: Child of sessions; captures drink type, ABV, volume, timestamp, ingestion method.
- `impairment_logs`: Subjective ratings (0–10), notes, optional selfies for computer vision exploration (future).
- `algorithms`: Versioned metadata for Widmark parameters and ML model hash.
- `predictions`: History of predicted PinkDrunk levels with confidence intervals and recommended actions.
- `alerts`: User-facing warnings or nudges emitted during a session.
- `experiments`: Flags for personalization tests (cycle-aware adjustments, tolerance recalibration).

## Relationships
- `users` 1—1 `profiles`
- `users` 1—N `sessions`
- `sessions` 1—N `drinks`
- `sessions` 1—N `impairment_logs`
- `sessions` 1—N `predictions`
- `predictions` 1—N `alerts`
- `algorithms` 1—N `predictions`
- `experiments` N—N `users` (via join table `experiment_enrollments`)

## Key Fields & Types
### profiles
- `id` UUID (PK)
- `user_id` UUID (FK)
- `height_cm` DECIMAL(5,2)
- `weight_kg` DECIMAL(5,2)
- `bmi` DECIMAL(4,1) (derived)
- `gender_identity` ENUM(`female`,`male`,`nonbinary`,`custom`)
- `menstruation_enabled` BOOLEAN
- `cycle_day` SMALLINT (nullable)
- `medications` JSONB (name, interaction risk)
- `conditions` JSONB (condition, notes)
- `metabolism_score` SMALLINT
- `tolerance_score` SMALLINT
- `pinkdrunk_target_user` SMALLINT DEFAULT 5 (user-selected ideal level 0–10)
- `pinkdrunk_target_confidence` DECIMAL(3,2) DEFAULT 0.0 (model-learned confidence in user target)

### sessions
- `id` UUID (PK)
- `user_id` UUID (FK)
- `started_at` TIMESTAMPTZ
- `ended_at` TIMESTAMPTZ (nullable)
- `location_geo` GEOGRAPHY(Point,4326)
- `venue_type` ENUM(`home`,`bar`,`club`,`restaurant`,`event`,`other`)
- `target_level` SMALLINT DEFAULT 5
- `target_source` ENUM(`user`,`model_inferred`) DEFAULT `user`
- `ended_reason` ENUM(`user_end`,`auto_alert`,`timeout`)
- `notes` TEXT

### drinks
- `id` UUID (PK)
- `session_id` UUID (FK)
- `drink_category` ENUM(`beer`,`wine`,`cocktail`,`shot`,`other`)
- `label` TEXT (user-entered name)
- `abv_percent` DECIMAL(4,1)
- `volume_ml` DECIMAL(6,1)
- `consumed_at` TIMESTAMPTZ
- `ingestion_minutes` SMALLINT DEFAULT 10 (duration to consume)

### predictions
- `id` UUID (PK)
- `session_id` UUID (FK)
- `algorithm_id` UUID (FK)
- `produced_at` TIMESTAMPTZ
- `level_estimate` DECIMAL(3,1) (0–10 scale)
- `confidence_low` DECIMAL(3,1)
- `confidence_high` DECIMAL(3,1)
- `recommended_action` ENUM(`keep`,`slow`,`stop`,`hydrate`,`abort`)
- `next_drink_eta_minutes` SMALLINT (nullable)

## Data Flow & Storage Notes
- PostgreSQL schemas: `core` (users, sessions, drinks), `ml` (predictions, algorithms), `audit` (alerts, events).
- Materialized view `ml.session_features` aggregates per-session features for the ML service.
- Stream ingest: Each drink event published to Kafka topic `drinks.ingested` for near-real-time predictions.
- S3 data lake receives nightly parquet exports for analytics and long-term model training.
- Personally identifying data separated via row-level security policies to enable anonymized research queries.

## Algorithm Inputs & Outputs
- Inputs: physiology profile, drink queue, elapsed time, subjective impairment, menstrual cycle phase, medication modifiers, user-selected PinkDrunk target.
- Outputs: predicted PinkDrunk level, delta to user target, time-to-descend to safe range, recommended actions.
- Feedback loop: After session completion, compare predicted vs. actual self-report to update tolerance calibration and adjust `pinkdrunk_target_confidence`.
- Monitoring: Track MAE between predicted and reported levels; trigger retraining if MAE > 1.2 over rolling 14 days.
