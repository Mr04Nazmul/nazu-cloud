# Discovery audit

Inspected 2026-10-27 JST. Existing repositories were cloned read-only. No code from them is reused in NAZU Cloud.

## nazulabs

Inspected default HEAD `39addbaad5b96415dda53ce290d030b054464aaa`.

```text
origin/HEAD -> origin/main
  origin/backup-before-sync-fix-20261007
  origin/codex/nazorix-lycoris-hero
  origin/main
  origin/nazu-sepolia-wallet
  origin/nazu-token-contract
  origin/pinned-login-v1
```

## Nazu-last

Inspected default HEAD `8ede18045bca81fe78ff2b3eb9ba37b0ea69b0df`.

```text
origin/HEAD -> origin/main
  origin/main
```

## Nazu-testnet-

Inspected default HEAD `0d4f4364d7ed4a2c3f0dac819afa507c5f34b608`.

```text
origin/HEAD -> origin/main
  origin/main
```

## Findings

- nazulabs contains a Solidity fixed-supply 21,000,000 NAZU ERC-20 contract. contracts/README.md says source-only and not deployed. No chain address or deployment receipt was verified; on-chain status remains unconfirmed. No token operation was attempted.
- nazulabs also contains a separate Express/password/JWT backend with permissive CORS. It is not reused for this SaaS.
- Nazu-last verifies a wallet signature but updates challenge usage separately from session insertion; a parallel replay race is not prevented atomically. It uses wildcard CORS and is not a complete project-origin-scoped SIWE platform.
- Nazu-testnet- documents its browser node/points as demo/local. It is not a real infrastructure monitor.
- Historical branches were inventoried; default-branch contract, auth, schemas, deployment files and dependencies were reviewed. An exhaustive line-by-line security audit of every historical branch has NOT been completed.
- Reuse decision: no old application code copied. New dependency sources include Next.js, React, Supabase, viem, Zod, Radix, Motion and Lucide. Dependency versions are pinned; this is not a complete legal/security audit of transitive dependencies.

## Connected Supabase (read-only)

- vjygltfnrmyghlwyjtwu is active and contains testnet, wallet, mission, ledger and other application/catalog data. In the public schema inspection: 13 profile rows, 5 node sessions and 727 ledger rows; counts are a point-in-time discovery snapshot, not dashboard metrics. No records were fetched or changed.
- zarkjxlwrdfvpnvhvrpy is active, named Ek Ghonta Dev, and returned no public tables. It was not reassigned to NAZU Cloud.
- Security advisor on the shared project reported 8 signed-in executable SECURITY DEFINER warnings and disabled leaked-password protection, plus informational RLS-without-policy notices. Those findings belong to the existing project, not this unapplied Cloud migration. No existing functions/policies were modified.
- Relevant remediation: [security definer access](https://supabase.com/docs/guides/database/database-linter?lint=0029_authenticated_security_definer_function_executable) and [password protection](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection).

## Architecture selection

Keep the requested Next.js/Node monorepo, separate persistent workers and isolated schema. Deployment requires authorized staging database credentials and a Node-compatible hosting setup. No paid resources purchased. No existing data migration is necessary.

## Current references checked

Supabase changelog.md (downloaded), official Next.js installation docs, Supabase search_docs Next.js Auth guidance and live npm package versions. Next 16.4.3, React 19.3.1, Supabase JS 2.118.0 and SSR 0.12.7 were resolved at implementation time. TypeScript 7 is not supported by the selected typescript-eslint release; TypeScript 6.0.3 was selected after reproducing that incompatibility. Payment provider pricing/eligibility and hosting costs have NOT been verified; live billing remains disabled.
