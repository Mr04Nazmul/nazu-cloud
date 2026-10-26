# Architecture decisions

## Execution boundaries

Browser → Next.js route handlers → Supabase Auth / PostgreSQL `nazu_cloud` schema.
Monitoring workers → approved public HTTPS EVM providers → checks/incidents/alert outbox.
Alert workers → operator-verified encrypted channels → fixed email provider or Discord webhooks.

The browser receives only Supabase publishable credentials. Reusable developer keys are intended for server SDK use. Wallet sessions identify relying-party users; they do not grant Cloud organization/admin access.

## Database

A new private `nazu_cloud` schema holds 19 requested domain tables plus a rate-limit bucket table. Composite project/organization and monitor/organization foreign keys prevent cross-tenant resource reassignment. Every table has RLS enabled; browser roles have no schema/table/sequence privileges. No security-definer functions or public policies are introduced.

The current server connection requires a privileged database role. Membership checks are mandatory before access. Before launch split web/worker roles, define minimal grants and strengthen database-enforced server tenant context; do not advertise comprehensive database-level tenant RLS policies as implemented.

## Scheduling

Due monitors are leased transactionally using SKIP LOCKED. Four monitor checks run concurrently per worker. A lease expires after 60 seconds, results require the current lease owner, and `(monitor_id, scheduled_at)` deduplicates checks. Next checks are scheduled after completion plus configured interval and 0–15 seconds jitter. This is a leased polling scheduler, not a Redis queue. Missing monitoring periods are not successes. Multi-region measurement is not implemented.

## RPC security

Exact operator allowlist, HTTPS-only, no URL credentials, public DNS answers only, resolved address pinned into TLS connection lookup, no redirects, bounded response bytes, explicit methods and deadlines. Provider API keys embedded in endpoint paths are not encrypted at rest yet: use nonsecret staging URLs until endpoint encryption is implemented. Production egress firewall is still required.

## Wallet protocol

The complete server-generated EIP-4361 message binds project-origin, domain, URI, chain, issued/expiration times and nonce. viem verifies EOA signatures and can consult configured RPC for contract-wallet verification. Nonce consumption and session creation share a transaction. Session tokens are random, hashed, one-hour TTL and revocable. EIP-1271 live-chain and relying-party cookie exchange tests remain incomplete. Browser SDK keeps no developer API key.

## Notifications

Incident creation/recovery and delivery enqueue share a database transaction. New channels start unverified. Operator verifies ownership and sets alert rules before delivery. Secrets are encrypted with AES-256-GCM. Alert worker leases a delivery, retries up to five times, then marks failure. Provider send and database acknowledgement cannot be atomic: delivery is at-least-once and a crash after send may duplicate a notification. Cooldown/escalation and latency alerts are unfinished.

## Metering and payments

Accepted API-key authentication events are stored with outcome code 0 (unknown). Response success/failure instrumentation, daily rollups and monthly enforcement remain unfinished. Free monitor count is serialized per organization and capped at 1. Only 60 requests/minute/key is enforced. Proposed paid prices do not activate entitlements. Billing remains disabled.
