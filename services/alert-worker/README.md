# Alert worker

Run `pnpm alert-worker` separately. Encrypted channels require a 32-byte base64 ALERT_ENCRYPTION_KEY. Email requires an operator-approved recipient allowlist, verified sender and Resend credentials. New channels remain unverified until ownership has been checked by the operator. Rules must be configured by the operator; their management UI/API is pending. Delivery is at-least-once: a crash after provider acceptance can cause a duplicate. No live delivery has been tested.
