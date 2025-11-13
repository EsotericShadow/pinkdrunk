# Tech Stack & Architecture Decisions

## Mobile (v1 Target: Native iOS)
- Language & UI: Swift 6 with SwiftUI for declarative views, SF Symbols for iconography.
- State Management: Composable Architecture (TCA) to keep prediction logic isolated and testable.
- Networking: Combine + async/await layered over a shared API client with request signing.
- Local Persistence: Core Data for session caching and retry queue when offline.
- Analytics: Segment SDK feeding anonymized events to warehouse (no ad networks).

## Backend Services
- API: Node.js 22 with TypeScript using NestJS for modular domain boundaries and validation.
- Auth: Auth0 (OIDC) → JWT access tokens consumed by the API and mobile client.
- Storage: PostgreSQL 16 on AWS RDS (encrypted at rest) for relational data.
- Caching: Redis (ElastiCache) for session-in-progress lookups and rate limiting.
- Background Jobs: BullMQ workers for nightly model retraining and digest emails.
- Infrastructure as Code: Terraform Cloud managing AWS VPC, RDS, ECS Fargate services.

## BAC & Personalization Engine
- Approach: Hybrid — Widmark core implemented in TypeScript library + Python microservice for ML enhancements.
- Model Service: FastAPI container hosting personalization models (subjective impairment regression).
- Feature Store: PostgreSQL schema w/ materialized views feeding both services.
- Model Training: Scheduled job on AWS Batch invoking SageMaker Processing for retrains.
- Observability: MLflow tracking experiments; Prometheus + Grafana dashboards for drift alerts.

## Integrations & External Services
- Payments: Not required v1 (no monetization yet) but Stripe account stubbed.
- Notifications: Firebase Cloud Messaging (via APNs) for session nudges and stop alerts.
- Geolocation Context: Mapbox Places API for venue tagging and legal limit references.
- Compliance: DataDog audit logs + AWS CloudTrail for access tracking.
- CI/CD: GitHub Actions pipelines (lint, test, build, deploy to TestFlight + ECS).

## Security & Privacy Baseline
- Secrets managed in AWS Secrets Manager, rotated automatically.
- PII encryption at rest and in transit; Row-Level Security for multi-tenant future.
- Data retention policy: auto-delete session event data after 18 months unless user opts in.
- Disaster recovery: Daily RDS snapshots + cross-region replica for failover.
- Access controls: SOC2-ready RBAC; engineering access via SSO + MFA only.
