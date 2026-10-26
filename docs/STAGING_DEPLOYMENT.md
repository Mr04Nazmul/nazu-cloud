# NAZU Cloud staging deployment — prepared, not deployed

Current dedicated staging Supabase project: `NAZU Cloud Staging`, Tokyo region; migrations are applied. Existing testnet data is unrelated and untouched. The app/API and two persistent workers are not deployed.

## Required integrations

- An authorized host for the Next.js web/API. Vercel is one option. Its Hobby plan is restricted to personal, non-commercial use; verify plan eligibility for the actual business before commercial deployment. Connecting an integration does not authorize a paid plan.
- An authorized host for the independently running monitor and alert workers, such as Railway. Confirm current service prices, trial limits and always-on capability for the specific account before creating paid infrastructure. A worker cannot rely on Vercel serverless request handling to stay continuously alive.
- Dedicated least-privilege database runtime credentials. Do not put the database password or connection string in chat, the repository, logs or browser code.
- Sender/provider setup, approved RPC provider hosts and chain RPCs, and a verified HTTPS host origin. Keep paid billing disabled.

## Web host configuration to verify on provider connection

- GitHub source: `Mr04Nazmul/nazu-cloud`, default branch `main`.
- Next.js workspace: `apps/web`. When using it as the Vercel Root Directory, enable inclusion of files outside that directory because this app imports `packages/` and worker validation modules. Confirm the monorepo install and framework detection in the provider's build logs.
- Install dependencies from the committed pnpm lockfile with pnpm 11.25.0 and build with the repository's `pnpm build` workflow (adapt command working directory to provider). Node 24 is used in CI.
- Public values: `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` for the dedicated staging project. These values are public-client credentials, subject to RLS and schema privilege protections.
- Server-only secrets: `DATABASE_URL`, optional `DB_SSL_CA`, `RPC_ENCRYPTION_KEY`, `WALLET_CHAIN_RPC_JSON`; also configure `APP_ORIGIN`, `RPC_ALLOWED_HOSTS` and monitoring region where applicable. Generate encryption keys securely through the deployment environment and share only through a secret store.
- Use Supabase Connect to obtain the correct host/pooler connection string. Enforce TLS certificate and hostname verification. Supply the trusted certificate when the chosen provider endpoint requires it. The new strict TLS code has not been tested against the hosted staging database yet.
- Supabase Auth site and redirect URLs must exactly match the resulting staging host, including `/auth/callback`; verify sign-in, reset and session refresh before enabling onboarding.

## Worker configuration to verify on provider connection

Use the repository root as the Docker build context. The prepared Dockerfiles are `services/monitor-worker/Dockerfile` and `services/alert-worker/Dockerfile`. If using Railway, configure each service's `RAILWAY_DOCKERFILE_PATH` without narrowing the repository context. Deploy two independent services only after examining the account's current pricing and obtaining any required paid-infrastructure approval. Monitor and alert workers need TLS-verified database access; monitor worker also needs the same RPC encryption key and approved host list; alert worker needs its own alert encryption key and verified sender/provider secrets.

## Acceptance checks

1. Build logs confirm that the exact committed source compiles with workspace dependencies.
2. Verify web process and `/v1/health`; remember that endpoint does not test database/worker dependencies.
3. Verify real Supabase signup, login, password reset, session refresh and logout; check redirect and email configuration.
4. Verify two organizations/roles, key create/revoke, real TLS DB connectivity, endpoint check storage, timeout/incident/recovery and signed EOA/EIP-1271 wallet flows.
5. Verify a controlled recipient gets alerts, with accurate delivery logs and cooldown behavior; test worker interruption and restart.
6. Review security advisors and runtime least-privilege boundaries, backups, restore, limits and costs. Only after smoke tests pass report a real deployed URL. Production data migration, paid infrastructure and live billing require user approval.

## Official references checked 2026-10-27

- https://vercel.com/docs/monorepos/monorepo-faq
- https://vercel.com/docs/plans/hobby
- https://docs.railway.com/deployments/monorepo
- https://docs.railway.com/builds/dockerfiles
- https://docs.railway.com/pricing/plans
- https://supabase.com/docs/guides/database/connecting-to-postgres
- https://supabase.com/docs/guides/platform/ssl-enforcement
