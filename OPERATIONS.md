# Staging and production operations

## Current status

No production deployment, production domain, production database migration or paid infrastructure has been created by this implementation. Local preview is not a live public service.

## Exact configuration sequence

1. Choose an authorized, dedicated development Supabase project. The existing shared testnet/catalog project must remain unchanged. The empty connected project is named for a different app and has not been repurposed.
2. Back up/review the target; review and apply `supabase/migrations/*_cloud_initial.sql` to the dedicated target. No migration to existing NAZU user tables is needed.
3. Provision separate least-privilege web and worker database logins, require TLS, and inject DATABASE_URL through the hosting secret manager.
4. Set Supabase publishable URL/key, auth site URL, exact callback/reset URLs, email delivery and password policies. Store web development env at `apps/web/.env.local` or use process environment.
5. Set a separate 32-byte base64 RPC_ENCRYPTION_KEY on the web and monitoring worker. Set APP_ORIGIN to the exact web HTTPS origin. Configure RPC_ALLOWED_HOSTS and trusted WALLET_CHAIN_RPC_JSON on the server. Keep all endpoint credentials private.
6. Deploy Next.js on a Node-compatible host: repository root, install `pnpm install --frozen-lockfile`, build `pnpm build`, start `pnpm --filter @nazu-cloud/web start`. A Vercel monorepo project can instead target apps/web, with root workspace access enabled. Validate host configuration before deployment.
7. Deploy `pnpm worker` as a persistent process with restart policy and independent egress rules. Set MONITOR_REGION to the actual location, not a marketing region.
8. Provision a 32-byte base64 ALERT_ENCRYPTION_KEY in a secret manager, a verified Resend sender and controlled ALERT_ALLOWED_EMAILS. Deploy `pnpm alert-worker`. Create channels via API, verify ownership out-of-band, then set verified_at using an operator-only maintenance procedure. Manage alert rules through the authenticated alert settings dashboard. Never mark arbitrary public channels verified automatically.
9. Do not configure billing yet. Eligibility/business/tax validation, provider implementation and test payments are pending.
10. Connect only a verified owned domain. Until then document a verified staging host rather than constructing a fake API domain.

## Required smoke tests

- Homepage/docs/login across desktop and mobile; no console hydration errors.
- Real signup confirmation, login, reset, logout and expired-session refresh.
- Two organizations, four roles, cross-resource access denial.
- Key create/list/revoke/rotate/expire and 61st request in one minute.
- Valid EOA signature; invalid/domain/nonce/expired/parallel replay rejection; EIP-1271 success/failure.
- Create approved monitor; inspect actual scheduled check rows; wrong chain and inaccessible endpoint failure.
- Stop worker, wait for lease expiry, restart, verify no duplicate slot; observe missing coverage.
- Three failures → one open incident → recovery; verified recipient receives both events, delivery rows confirm result.
- Check system_settings worker heartbeat independently. `/v1/health` only proves the web process responds, not dependency health.
- Restore a backup into a separate environment. Do not declare backup readiness without this drill.

## Retention and costs

No automated deletion is enabled. Retention targets on pricing are proposals. Implement and test bounded cleanup and daily rollups before extended beta. Measure database size, provider check cost, sender limits and host process costs with 5–10 developers before selling paid plans.
