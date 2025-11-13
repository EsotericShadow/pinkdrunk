# Deploying Pinkdrunk to Vercel

This guide covers the exact steps to push the app to GitHub and ship a working build on Vercel with a managed Postgres database (Neon/Supabase/Railway/Vercel Postgres).

## 1. Prep the repo
1. Ensure dependencies install locally with `pnpm install`.
2. Copy `.env.example` to `.env`, fill in values, and confirm `pnpm db:reset && pnpm dev` works against your Postgres instance.
3. Commit everything and push to GitHub:
   ```bash
   git add .
   git commit -m "feat: prepare vercel deployment"
   git remote add origin git@github.com:<user>/pinkdrunk.git
   git push -u origin main
   ```
   *(Skip the `remote add` if one already exists.)*

## 2. Provision PostgreSQL
Pick one of:
- **Vercel Postgres**: add the integration while creating the Vercel project.
- **Neon**: create a project → branching DB → grab the pooled connection string (`...neon.tech/neondb?sslmode=require`).
- **Supabase/Railway**: create a Postgres service and enable pooled + direct URIs.

Take note of two URLs:
- `DATABASE_URL` → pooled/pgBouncer connection string (recommended flags: `?sslmode=require&pgbouncer=true&connection_limit=1&pool_timeout=30`). This powers the app at runtime.
- `DIRECT_URL` → direct connection string for running Prisma migrations/seed jobs.

## 3. Environment variables
Create `.env.local` (for `pnpm dev`) and mirror the same keys inside Vercel → Project → Settings → Environment Variables. Required keys:

| Key | Scope | Notes |
| --- | --- | --- |
| `DATABASE_URL` | Production + Preview + Development | Use pooled string. |
| `DIRECT_URL` | Production + Preview | Same as DATABASE but **without** pgBouncer params so migrations can run. |
| `NEXTAUTH_SECRET` | Production + Preview | `openssl rand -base64 32`. Keep private. |
| `NEXTAUTH_URL` | Production (`https://<app>.vercel.app`) and Preview (`https://<branch>.<app>.vercel.app`) | Used by NextAuth callbacks. |

Vercel CLI helpers:
```bash
vercel env add DATABASE_URL production
vercel env add DIRECT_URL production
vercel env add NEXTAUTH_SECRET production
vercel env add NEXTAUTH_URL production
# repeat for preview if needed
```

## 4. Migrate + seed the remote database
Run these once, pointing to your production database (can be done locally or via Vercel CLI):
```bash
DATABASE_URL="<pooled>" DIRECT_URL="<direct>" pnpm db:migrate:deploy
DATABASE_URL="<pooled>" DIRECT_URL="<direct>" pnpm db:seed
```
If you are using Vercel Postgres, you can open a remote shell with `vercel env pull .env.production` to grab the credentials and feed them into the commands above.

## 5. Wire up Vercel
1. Go to https://vercel.com/new → **Import Git Repository** → pick the GitHub repo.
2. Framework preset: **Next.js**.
3. Set **Install Command** `pnpm install --frozen-lockfile`.
4. Set **Build Command** `pnpm build` (leave Output Directory empty; Vercel picks `.next`).
5. Add the environment variables defined earlier (Vercel will prompt during setup if they are missing).
6. If using the Vercel Postgres integration, link it now so the env vars are injected automatically.

## 6. Verify deploys
- Every push to `main` → production deployment, every PR/branch → preview deployment.
- Use `vercel env pull .env.local` to keep local env files synced.
- After the first deploy, visit the production URL, create an account, and make sure logging drinks hits the new Postgres data.

## 7. Troubleshooting
- **Prisma complains about pools**: ensure runtime `DATABASE_URL` includes `pgbouncer=true&connection_limit=1`.
- **Migrations hanging**: run them locally with `DIRECT_URL` (non-pooled) and redeploy.
- **Auth callback mismatch**: set `NEXTAUTH_URL` per-environment and redeploy to refresh NextAuth.
- **Seed ran twice**: the seed script upserts brands/presets, so re-running is safe.

With the above in place you and your girlfriend can open the Vercel URL on mobile, log drinks, and the data will persist in Postgres instead of the old local SQLite file.
