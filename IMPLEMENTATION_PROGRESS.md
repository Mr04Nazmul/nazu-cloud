# Implementation progress

Updated 2026-10-27 JST. **Development implementation, not a completed production product.** Existing NAZU repositories and existing Supabase projects/data remain unchanged. A new isolated staging project was created and configured.

## Current verification

- 70 local automated tests pass across 8 files, including 4 database TLS configuration tests.
- Formatting, ESLint, strict TypeScript and Next.js production build pass.
- Handler integration tests execute actual API handlers and SQL in PGlite. Supabase developer identity is mocked; wallet signatures use ephemeral local EOA keys and actual viem verification.
- Verified flows: key create/hash → monitor create/encrypted URL → quota rejection → key revocation; stored key expiry and scope rejection; cross-organization project/member denial; exact-name delete guard; parallel SIWE replay allows one session; session lookup/logout/revocation.
- Other tests cover tenant foreign keys, browser-role denial, stale status, cooldown lookup, obsolete downtime cancellation, member/owner protection, admin/MFA policy, bounded requests and SSRF controls.
- Latest source CI run [40358342670](https://github.com/Mr04Nazmul/nazu-cloud/actions/runs/40358342670) passed all steps on commit 70ea92e54f5feebfc060fddde3e9d742d34c84df (66 tests). Backend-stage run 40358232688 also passed. Documentation-only contract/evidence updates do not change the tested source.
- Prior production browser preview: homepage and outage toggle worked; signup was disabled without configuration; dashboard displayed setup state. Updated authenticated controls have not had configured browser E2E or mobile QA.
- No live website, API, worker or billing success is claimed.

## Phase status

| Phase              | Implemented                                                                                                                                 | Still required                                                                                                     |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| Discovery          | Repository/default-source review, branch inventory, connected schema summaries and existing security-advisor review                         | Exhaustive historical review and on-chain token deployment proof                                                   |
| Foundation         | Strict pnpm monorepo, Next.js, private-schema migration and additive indexes, CI                                                            | Runtime staging credentials, least-privilege DB roles, real Auth tests                                             |
| Website            | Public pages, docs, auth forms, labeled demo, responsive styles                                                                             | Mobile/accessibility QA, legal operator details                                                                    |
| Developer platform | Organization/project creation; project update/delete; member CRUD/policies; API key lifecycle; quota/metering source; management dashboards | Live Supabase auth tests, email invitations, paid entitlements, pagination                                         |
| Wallet auth        | SIWE, atomic nonce/session transaction, real signed-handler replay test, revocation, project limiter                                        | Live EIP-1271, relying-party cookie exchange, distributed abuse tests                                              |
| RPC monitoring     | Secure checker, leased worker, encrypted URLs, actual check/incident source, charts, stale status becomes unknown                           | Deployed provider checks, block freshness, failure/load tests                                                      |
| Alerts             | Encrypted channels, channel edits/re-verification, rules/UI, delivery history, outbox, retries/cooldown, recovery cancellation              | Operator ownership procedure, latency alerts, real delivery/recovery tests                                         |
| SDK/docs           | Local typed SDKs, OpenAPI, examples and SDK tests                                                                                           | Release packaging, ownership verification, sandbox, broad contract coverage                                        |
| Billing            | Proposed plans; free quotas enforced                                                                                                        | Provider/business eligibility, checkout, portal, signed/idempotent webhooks and paid entitlements: not implemented |
| Admin              | Server ID allowlist + admin metadata + MFA policy; read-only DB counts/audits/heartbeat views                                               | MFA enrollment/verification UI and real auth tests; audited admin mutation workflows                               |
| Operations         | Separate worker instructions, Dockerfiles, encrypted secrets configuration                                                                  | Hosting, staging runtime configuration, verified domain, retention jobs, backups/restore, error tracking           |
| Beta               | Business milestones documented                                                                                                              | No outreach, integrations, customers or revenue claimed                                                            |

## Staging configuration

The user selected the connected **Nazu testnet** organization and approved a quoted $0/month project. On 2026-10-27 JST, a separate project **NAZU Cloud Staging** (`rmvmnxijigbbjnunwfwk`, Tokyo region) was created, status ACTIVE_HEALTHY. The two repository migrations were applied to this new empty staging database only; no existing testnet data was migrated. All 20 nazu_cloud tables have RLS enabled; anon and authenticated have no schema USAGE privileges. The Supabase security advisor reports 20 informational RLS-without-policy findings, consistent with the current browser-deny design. Privileged backend isolation and independent production review remain open.

Still configure least-privilege database access and actual Supabase Auth, process hosting, server secret values, approved RPCs, actual worker region and controlled alert sender/recipients. No live website, API, worker or billing success is claimed. Never paste secrets into chat. No production migration or paid infrastructure may run without the user's approval.

## Known limitations

RLS denies direct browser access; the backend still needs least-privilege tenant-context database hardening. Monitoring coverage estimates do not reconstruct pauses/jitter. Alert delivery is at-least-once and can duplicate after a crash. Updated UI controls are build-checked, not authenticated browser-tested. Unknown usage outcomes stay unknown; daily rollups and retention automation are pending. Global admin mutation controls and all paid billing remain disabled.

No token operations, existing-data migration, npm publication, purchases or customer communications were performed.

The retained user build contract is in docs/BUILD_CONTRACT.md, with launch gates in docs/LAUNCH_GATES.md.

## Hosting preparation and TLS hardening

The database client now verifies server certificate chains and hostnames; disable mode is restricted to explicitly marked development/test loopback connections. 70 local tests, lint, strict typecheck and production build passed. Actual provider TLS connectivity is not verified. Vercel and Railway integrations were identified but are not connected. Host account availability, eligibility, costs, runtime credentials, app deployment and persistent worker deployment remain unverified; no payment, purchase or deployment was initiated. See docs/STAGING_DEPLOYMENT.md.

Follow-up GitHub CI run [40414625767](https://github.com/Mr04Nazmul/nazu-cloud/actions/runs/40414625767) passed all steps for source commit `cc948131458a96246e03042bc2d97c8167694072` (70 tests), including the database TLS hardening. The actual hosted database connection and web/worker deployment remain unverified.

## Free staging trial preparation

Render is connected in the confirmed workspace; existing services and data were not changed. A manual-only bounded GitHub Actions worker trial and setup guide were added on this branch. Formatting, lint, typecheck and 70 local tests pass; the workflow has not run against staging and is not scheduled. Staging-only credentials, actual TLS, alert delivery and operational reliability remain unverified. Existing Render free database expires 2026-11-05; a protected backup and restore verification are outstanding. See docs/FREE_STAGING_WORKERS.md.

## Hostless staging web preview

The Hostless `nazu-cloud-staging` web app built commit `80d250b48b11d5614157aa06eb9c61d60970ba1a` and showed Running on 2026-10-27. The public homepage, its labeled demo outage toggle, documentation page, and `/v1/health` were checked in a browser. The health endpoint explicitly reports dependencies not checked. This is an unauthenticated development preview; no database, authentication, monitor worker, alert delivery, or production readiness is verified. The configuration review estimated $0.00; actual billing is provider-dependent. Existing Render data remains unmodified; its backup is outstanding. Staging URL: https://nazu-cloud-staging.hostless.app/.

## Staging readiness follow-up

On 2026-10-27, the dedicated Supabase staging project was rechecked as ACTIVE_HEALTHY and the deployed `/signup` page was verified to disable account creation while Supabase configuration is missing. Authentication redirects and least-privilege database runtime credentials are not configured; no end-to-end signup, monitoring, or alert is claimed. Render database `nazu-db` remains available and expires 2026-11-05; a complete private export and restore test remain outstanding. The connected Render API provides read-only SQL but no database export or connection credentials; do not copy password hashes into the public repository.

## Staging authentication redirect configuration

On 2026-10-27 the dedicated NAZU Cloud Staging Supabase Auth site URL was changed from localhost to `https://nazu-cloud-staging.hostless.app` and the exact `/auth/callback` redirect was added and verified in the dashboard. No other project was changed. The web app still lacks the runtime environment and safe database credentials; registration, login and email flows remain disabled/unverified. Render's dashboard confirms built-in export on the existing free database requires a paid plan; a complete free manual export and restore validation remain outstanding.

## Auth and mail staging prerequisites

Reviewed the deployed auth form and callback and current Supabase documentation. The built-in SMTP provider is restricted to project-team email addresses and has a small development-only rate limit; customer signup requires a configured custom SMTP provider or equivalent and verified delivery. The app's NEXT_PUBLIC Supabase values must be provided at build time, and backend database access must use separately managed server-only least-privilege credentials with verified TLS. Neither environment configuration nor real signup, callback, reset, or email delivery has been tested. No production migration, paid service, live billing, or old database change occurred.
