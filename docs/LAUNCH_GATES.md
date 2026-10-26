# NAZU Cloud launch gates

The master blueprint remains the implementation contract. A passing test/build is not production acceptance.

## Before any external beta users

1. Select the organization for a new isolated staging project. Do not repurpose existing testnet or unrelated application data. Obtain and approve any nonzero infrastructure quote before provisioning.
2. Inject secrets through the hosting secret manager. Never place database passwords, reusable developer keys, encryption keys or mail credentials in browser code, GitHub, screenshots or chat.
3. Review/apply staging migrations only to the selected target. Split least-privilege web/worker roles and verify tenant isolation with two real accounts and every role.
4. Deploy the Node web app and persistent workers separately. Configure actual region, HTTPS, owned staging/domain, egress allowlists, worker health and error tracking.
5. Verify real signup/confirmation/login/reset/logout/refresh and wallet EOA/EIP-1271/replay/session flows. Local mocked developer identity does not satisfy this gate.
6. Run actual RPC checks and deliberate failures/recovery. Stop/restart workers, wait for lease expiry, test missing coverage, duplicated delivery possibilities and queue backoff.
7. Verify controlled email/Discord ownership and actual delivery logs, cooldown and recovery behavior. Never label queue acceptance as successful delivery.
8. Test desktop/mobile/keyboard/reduced motion, every management form and unauthorized access. Add admin MFA enrollment/verification UI; no global mutation controls until audit and authorization tests exist.
9. Implement retention/rollups, quota visibility and pagination. Run a backup restore into a separate test environment and prepare rollback/runbooks.
10. Finalize legal operator/contact, privacy/terms, data retention and support expectations before onboarding customers. Do not publish invented SLAs or testimonials.

## Before accepting money

- Verify the payment account/business country eligibility and costs using the actual owner's business details.
- Implement hosted checkout, customer portal, signed/idempotent webhooks, invoice access and entitlement transitions in test mode first.
- Verify payment-to-entitlement, cancellation, renewal, downgrade, duplicate/out-of-order webhook and failure flows end to end.
- Review real per-monitor/provider/DB/mail/worker costs and capacity before activating plan allowances.
- Obtain approval before any paid service or live billing. No token minting, deployment, sale or distribution.

## Beta business validation

Recruit 5–10 developers only after technical gates pass. Milestones: five successful integrations, three repeatedly active teams, one explicit willingness-to-pay commitment, then sustainable unit economics. Outreach and customer communications require separate explicit instructions.
