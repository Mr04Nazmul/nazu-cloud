# Implementation progress

Updated 2026-10-27 JST. **Development implementation, not a completed production product.** Existing NAZU repositories and connected Supabase data remain unchanged.

## Current verification

- 66 local automated tests pass across 7 files.
- Formatting, ESLint, strict TypeScript and Next.js production build pass.
- Handler integration tests execute actual API handlers and SQL in PGlite. Supabase developer identity is mocked; wallet signatures use ephemeral local EOA keys and actual viem verification.
- Verified flows: key create/hash → monitor create/encrypted URL → quota rejection → key revocation; stored key expiry and scope rejection; cross-organization project/member denial; exact-name delete guard; parallel SIWE replay allows one session; session lookup/logout/revocation.
- Other tests cover tenant foreign keys, browser-role denial, stale status, cooldown lookup, obsolete downtime cancellation, member/owner protection, admin/MFA policy, bounded requests and SSRF controls.
- Previous source CI run [40353768447](https://github.com/Mr04Nazmul/nazu-cloud/actions/runs/40353768447) passed at the 53-test milestone. Follow-up commits require their own CI verification.
- Prior production browser preview: homepage and outage toggle worked; signup was disabled without configuration; dashboard displayed setup state. Updated authenticated controls have not had configured browser E2E or mobile QA.
- No live website, API, worker or billing success is claimed.

## Phase status

| Phase              | Implemented                                                                                                                                 | Still required                                                                                                     |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| Discovery          | Repository/default-source review, branch inventory, connected schema summaries and existing security-advisor review                         | Exhaustive historical review and on-chain token deployment proof                                                   |
| Foundation         | Strict pnpm monorepo, Next.js, private-schema migration and additive indexes, CI                                                            | Dedicated staging credentials, least-privilege DB roles, hosted advisor review                                     |
| Website            | Public pages, docs, auth forms, labeled demo, responsive styles                                                                             | Mobile/accessibility QA, legal operator details                                                                    |
| Developer platform | Organization/project creation; project update/delete; member CRUD/policies; API key lifecycle; quota/metering source; management dashboards | Live Supabase auth tests, email invitations, paid entitlements, pagination                                         |
| Wallet auth        | SIWE, atomic nonce/session transaction, real signed-handler replay test, revocation, project limiter                                        | Live EIP-1271, relying-party cookie exchange, distributed abuse tests                                              |
| RPC monitoring     | Secure checker, leased worker, encrypted URLs, actual check/incident source, charts, stale status becomes unknown                           | Deployed provider checks, block freshness, failure/load tests                                                      |
| Alerts             | Encrypted channels, channel edits/re-verification, rules/UI, delivery history, outbox, retries/cooldown, recovery cancellation              | Operator ownership procedure, latency alerts, real delivery/recovery tests                                         |
| SDK/docs           | Local typed SDKs, OpenAPI, examples and SDK tests                                                                                           | Release packaging, ownership verification, sandbox, broad contract coverage                                        |
| Billing            | Proposed plans; free quotas enforced                                                                                                        | Provider/business eligibility, checkout, portal, signed/idempotent webhooks and paid entitlements: not implemented |
| Admin              | Server ID allowlist + admin metadata + MFA policy; read-only DB counts/audits/heartbeat views                                               | MFA enrollment/verification UI and real auth tests; audited admin mutation workflows                               |
| Operations         | Separate worker instructions, Dockerfiles, encrypted secrets configuration                                                                  | Hosting, dedicated staging, verified domain, retention jobs, backups/restore, external error tracking              |
| Beta               | Business milestones documented                                                                                                              | No outreach, integrations, customers or revenue claimed                                                            |

## Exact next configuration decision

The connected Supabase organization is **Nazu testnet** (`xwssbsavwunzmvxxvlwn`). Its existing shared project contains testnet and unrelated app data; it will not be repurposed. The other existing project is named for a different app and will not be repurposed silently. Select an organization for a new isolated NAZU Cloud staging project before project creation. Obtain a cost quote and explicit approval for any nonzero cost. No cost or purchase has been authorized.

Then configure dedicated database/Auth, process hosting, server secret values, approved RPCs, actual worker region and controlled alert sender/recipients. Do not paste secrets into chat. No production migration may run without the user's approval.

## Known limitations

RLS denies direct browser access; the backend still needs least-privilege tenant-context database hardening. Monitoring coverage estimates do not reconstruct pauses/jitter. Alert delivery is at-least-once and can duplicate after a crash. Updated UI controls are build-checked, not authenticated browser-tested. Unknown usage outcomes stay unknown; daily rollups and retention automation are pending. Global admin mutation controls and all paid billing remain disabled.

No token operations, existing-data migration, npm publication, purchases or customer communications were performed.
