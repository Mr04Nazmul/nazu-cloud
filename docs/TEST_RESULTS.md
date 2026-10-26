# Verification evidence

Latest verified source commit: `70ea92e54f5feebfc060fddde3e9d742d34c84df`.

[GitHub Actions run 40358342670](https://github.com/Mr04Nazmul/nazu-cloud/actions/runs/40358342670) passed formatting, lint, typecheck, 66 tests, production build and dependency audit. The 53-test results below describe the earlier baseline.

[GitHub Actions run 40353768447](https://github.com/Mr04Nazmul/nazu-cloud/actions/runs/40353768447) completed successfully. Its install, formatting, lint, strict typecheck, Vitest, production build and production dependency audit steps all passed.

- 53 automated tests across 5 files passed locally and in the verified source CI run.
- Actual SQL migration executed in embedded PostgreSQL/PGlite, including tenant FK constraints, direct browser-role denial, incident/check deduplication, expired nonce rejection and at-most-once nonce consumption.
- EOA SIWE signatures tested using ephemeral test keys generated in memory. No user wallet keys requested, stored or transmitted.
- RPC transport tests use injected resolvers/requests. No live provider or deployed worker success is claimed.
- Alert tests use an injected mock transport. No real email/Discord delivery is claimed.
- Browser QA used the production build: homepage rendered; outage toggle changed state/graph; desktop overflow check false; signup was disabled with an explicit missing-configuration notice; dashboard showed setup state without invented metrics.
- Mobile-device QA, configured Supabase auth, configured live HTTP replay race, EIP-1271 live-chain tests, paid billing, load/recovery tests and public deployment smoke tests were not completed.
- An executor HTTP smoke attempt could not reliably connect to the isolated preview server. It is not passing evidence.

A green build is not an authorization to launch. See SECURITY.md and OPERATIONS.md for remaining gates.

## Follow-up source verification

66 tests pass locally across 7 files, with formatting/lint/typecheck/production build passing. The new handler suite runs actual key, monitor, project/member and wallet route handlers against PGlite. It verifies key expiry/revocation/scopes, actual response outcome metering, quota rejection, cross-organization denial and parallel replay/session revocation. Developer Supabase identity remains mocked. Cooldown lookup runs against persisted SQL fixtures. MFA policy is unit-tested; configured Supabase MFA is not tested. Follow-up CI run 40358342670 passed all steps for the 66-test source.
