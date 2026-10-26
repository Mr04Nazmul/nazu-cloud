# NAZU Cloud

Infrastructure you can trust. APIs you can build on.

**Development build, not a production service.** This repository contains a working Next.js application, server route handlers, isolated PostgreSQL migration, independent monitoring/alert worker source and automated tests. Registration, persisted data, real monitoring and notifications require staging infrastructure and integration verification. Read [IMPLEMENTATION_PROGRESS.md](IMPLEMENTATION_PROGRESS.md) for exact evidence and release gates.

## Local setup

Use Node 24 and pnpm 11.25.0. Package versions and the lockfile are pinned.

```sh
corepack enable
corepack prepare pnpm@11.25.0 --activate
pnpm install --frozen-lockfile
cp .env.example apps/web/.env.local
# Fill apps/web/.env.local using your own staging environment; do not commit it.
pnpm typecheck
pnpm lint
pnpm test
pnpm build
pnpm dev
```

Next.js reads the environment from `apps/web/.env.local`, not the monorepo root. Put web environment values there instead of the root file, or inject them through your host process environment. Worker commands use process environment only; use your host's secret manager or Node `--env-file` with tsx.

```sh
pnpm worker
pnpm alert-worker
```

The worker must run continuously on a container/process host. Vercel request functions alone do not run continuous monitoring. See [OPERATIONS.md](OPERATIONS.md).

## Implemented source

- Public SaaS pages, labeled interactive demo, documentation, initial authenticated dashboard and setup states.
- Supabase developer sign-in/signup/reset forms, code callback, server user validation and mutation origin checks.
- Organizations/projects, role checks and member-management policies, project update/delete, API key one-time generation, hashing, scopes, revocation and atomic rotation.
- SIWE messages, signature verification through viem, atomic nonce consumption, expiring hashed wallet sessions.
- EVM monitor APIs and a scheduler using row leases and `FOR UPDATE SKIP LOCKED`.
- Exact HTTPS provider allowlist, public DNS checks, pinned connections, redirect rejection, body limits and request deadlines.
- Actual check storage, 3-failure incident opening, successful-check recovery and deduplicated alert outbox.
- AES-GCM channel encryption, restricted email/Discord destinations, alert retries with exponential backoff. Ownership verification and rule setup are operator steps; no live delivery claim.
- Local TypeScript SDKs. **Not published to npm.**

## Not ready for commercial launch

Payments, email team invitations, complete admin mutation controls, retention automation and latency alerts and end-to-end configured deployment remain incomplete. Token deployment, minting, distribution and sales are out of scope.

## API and documentation

No verified production base URL exists. Local development uses `http://localhost:3000/v1`. Documentation is at `/docs`, API guide at `/docs/api`, SDK guide at `/docs/sdk`, machine contract at [docs/openapi.json](docs/openapi.json). The API reference documents only implemented routes. List results are capped; pagination is not implemented.

## Data isolation

No existing repository was modified. No connected Supabase schema was altered. The migration creates only `nazu_cloud`, revokes browser-role grants and enables RLS on every table. Server-side membership checks provide the application boundary; runtime database role hardening remains a launch gate. Never expose this schema through PostgREST without reviewed tenant RLS policies.
