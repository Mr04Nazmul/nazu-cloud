# NAZU Cloud — retained build contract

This records the user's master build instruction and follow-up priorities for future work. It is an implementation contract, not a claim of completion. Read IMPLEMENTATION_PROGRESS.md, SECURITY.md and OPERATIONS.md before changing the project.

## Mission and scope

Build and deploy a commercially usable Web3 infrastructure reliability/developer API SaaS. Primary services: EVM RPC monitoring, latency/availability history, incidents and alerts. Secondary services: project-scoped API keys, SIWE wallet authentication, teams, usage and billing. A static mockup, fake dashboard or token investment site does not satisfy the request.

Repository: Mr04Nazmul/nazu-cloud. Existing Mr04Nazmul/nazulabs, Nazu-last and Nazu-testnet- must remain intact. Preserve all existing testnet users/data. NAZU token contract source has fixed 21 million supply; independently verify any deployment claim. Do not deploy, mint, distribute or sell tokens. Core SaaS must not depend on tokens.

## Non-negotiable operating rules

- Inspect current repositories/branches, connected Supabase schemas and relevant documentation before changes.
- Reuse third-party code only after functionality, licensing, security and compatibility review.
- Use strict TypeScript, parameterized SQL, server authorization and tenant isolation. Hash reusable API keys and wallet session tokens; encrypt provider/channel credentials.
- Never expose private keys, seed phrases, service-role credentials, API secrets or database passwords. Never request wallet seed phrases.
- Actual dashboards must use actual stored observations. Demo data must be explicitly labeled. Missing data is unknown, not zero or successful uptime.
- Test every critical API/auth flow; fix failures; make meaningful commits; update the progress document; continue independently where authorized.
- No feature completion claim solely from generated code. No deployment success claim without live verification. No invented tests, customers, revenue, transactions or SLA guarantees.
- Ask before purchases, paid infrastructure, production data migration or irreversible operations. No live payments until account/business eligibility and payment/entitlement E2E tests are verified.
- When credentials/authorization block work, finish independent implementation and document exact remaining steps. Do not ask for secrets in chat.
- The user's priority is protecting the business: preserve existing assets, control costs, avoid premature launch promises, and do not enable unverified paid services.

## Required implementation

Requested stack: Next.js/React, TypeScript, Tailwind/shadcn/Radix, Lucide/Motion, Supabase PostgreSQL/Auth, viem + SIWE, Zod, independent Node workers, reliable scheduler, rate limiting, email, payment provider, error tracking, OpenAPI 3.1, Vitest/Playwright, GitHub Actions and suitable app/worker hosting. Verify current compatibility, documentation, pricing and availability before enabling services.

Maintain the pnpm monorepo with apps/web, packages/sdk, wallet-sdk, shared, database, config; independent monitor/alert workers; migrations; docs; critical unit/integration/E2E/security tests; CI and operations documentation.

Website: original premium dark navy/black SaaS identity with electric blue/violet accents, clear hierarchy, responsive design, accessibility, keyboard and reduced-motion support. Avoid copied branding, meaningless 3D, fabricated statistics or clutter. Public product/docs/pricing/status/security/privacy/terms/contact/changelog pages; developer auth/onboarding; project/monitor/incident/alerts/key/usage/wallet/team/billing/settings/audit dashboards; server-authorized admin sections.

APIs: key lifecycle including one-time display/hash/scopes/expiry/rotation; SIWE challenge/verify/session/logout with domain/URI/chain/time/nonce/project/origin checks and EOA/EIP-1271 verification; EVM monitor CRUD/checks/metrics/incidents; encrypted email/Discord alert channels and delivery logs/retries/cooldown; accurate usage/limits/history; organization/project/member roles and server permissions.

Worker: approved HTTPS EVM endpoints, public DNS checks and pinned resolution, no redirects, restricted methods, size/time bounds, independent egress policy, concurrency limits, leases/retries/idempotency, incident deduplication, recovery and health monitoring. Start with eth_chainId and eth_blockNumber; do not advertise non-EVM support. Record latency, actual availability and monitoring coverage separately.

Database: the 19 requested domain tables with proper constraints/indexes/retention and RLS on exposed data; private schema/browser denial is not a substitute for reviewing privileged backend role isolation. Never migrate the old testnet without a reviewed backup/migration plan.

SDK/docs: typed responses, useful errors, timeouts, safe retries, examples in JS/TS/cURL/Python, accurate OpenAPI, quick start/auth/wallet/monitor/alert/limits/pagination/webhook/troubleshooting guidance and a genuinely scoped sandbox. Do not publish npm packages until names/ownership and release tests are verified.

Billing: proposed Free $0/1 monitor, Starter $9/5, Pro $29/25, Business $99/100 are research prices, not proven economics. Define actual quotas/intervals/retention/alerts/seats/support. Hosted checkout/portal, subscription lifecycle, signed and idempotent webhook processing, invoice access and verified entitlements are required. Redirect success is never proof of payment.

Admin: explicitly allowlisted accounts, strong authentication/MFA, real operational metrics, worker/incident/delivery health, customer/organization/usage/subscription views and logged privileged changes. Unimplemented controls must not masquerade as operational.

## Release acceptance

Verify real desktop/mobile registration/login, organization/project/key operations, valid wallet signatures and invalid/replayed signature rejection, approved endpoint monitoring from deployed workers, persisted check history, downtime/recovery incidents, delivered/logged alerts, real metrics, cross-tenant denial, matching API docs, automated tests, green CI, verified live deployment and documented operations. Billing is complete only after payment-to-entitlement E2E verification.

The requested phases are discovery → foundation → website → developer platform → wallet auth → monitoring → alerts → docs/SDK → payments → testing/security → deployment → beta. Phases may overlap, but missing acceptance gates must stay visible.

## Business validation and final handoff

After technical launch gates pass, target 5–10 test developers; five successful integrations, three repeatedly active teams, one willingness-to-pay commitment, then sustainable unit economics. Do not fabricate testimonials or spam communities. No customer outreach is authorized merely by this build task.

Final handoff must state repository/live/API/docs URLs (only if verified), Supabase architecture, implemented features, test evidence, deployment/security status, remaining configuration, known limitations and next business milestones.

Future multi-region monitoring, RPC failover/proxy, transaction monitoring, customer status pages, advanced enterprise commitments and optional token utility remain outside the initial core until separately reviewed.
