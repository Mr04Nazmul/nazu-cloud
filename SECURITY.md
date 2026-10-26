# Security review and launch gates

Do not send secrets in public issues. A private vulnerability reporting channel and operator identity must be established before accepting production customers.

## Verified locally

Unit and database tests cover key randomness/hash matching, RBAC denial, request size limits, safe error responses, SIWE EOA signature/domain/nonce/expiry rejection, single-use nonce updates, reserved-address/URL blocking, chain validation, composite tenant foreign keys, browser-role denial, duplicate check/incident prevention, authenticated ciphertext and SDK safe write behavior.

These are not equivalent to a configured Supabase authentication or production penetration test. PGlite tests execute the actual SQL migration but do not run Supabase Auth or its management advisors on the new schema.

## Required before launch

1. Deploy to a dedicated staging database and apply the reviewed migration. Do not touch testnet tables.
2. Split least-privilege database roles; test every route with two real organizations and all role combinations.
3. Configure Supabase callback allowlists, SMTP, password policy, leaked-password protection and admin MFA. Review advisors on the new project.
4. Test RPC endpoint encryption-key rotation and restrict worker network egress independently of application validation.
5. Test parallel SIWE replays through the HTTP endpoint, EIP-1271 contract wallets and relying-party cookie/CSRF behavior.
6. Wallet verification/session endpoints now share a 120 requests/minute/project limiter; challenge issuance is also capped. Validate distributed abuse and denial-of-service behavior on staging.
7. Replace CSP unsafe-inline with request nonces where deployment runtime supports them. unsafe-eval is development-only.
8. Verify alert channel ownership, retries and duplicate behavior with controlled recipients. Staging-test configured cooldowns before broadly enabling alerts.
9. Add managed backup/restore tests, retention automation, job-lag monitoring, load/failure recovery tests and external error tracking.
10. Verify payment eligibility, signed webhook idempotency and entitlements before enabling checkout.

No private keys, seed phrases or service-role credentials are committed. No token operations are implemented.
