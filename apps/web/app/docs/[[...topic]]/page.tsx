import Link from "next/link";
import { notFound } from "next/navigation";
import { Header, Footer } from "../../../components/header";
const guides: Record<string, { title: string; text: string; code?: string }> = {
  "": {
    title: "Your first clear signal",
    text: "NAZU Cloud is in development. No verified production API domain exists. Run the monorepo locally or deploy to an authorized staging host. Follow README and OPERATIONS.md before configuring account services.",
    code: "pnpm install --frozen-lockfile\npnpm test\npnpm typecheck\npnpm build\npnpm dev",
  },
  api: {
    title: "API reference · v1",
    text: "The machine-readable OpenAPI 3.1 specification describes implemented routes only. List endpoints return at most 100 records; cursor pagination is not implemented. Account/project management uses Supabase developer sessions. Monitor APIs accept project-scoped bearer API keys.",
    code: 'GET /v1/monitors?projectId=PROJECT_UUID\nAuthorization: Bearer YOUR_SERVER_SIDE_KEY\n\nPOST /v1/monitors\nContent-Type: application/json\n{ "projectId": "PROJECT_UUID", "name": "Mainnet",\n  "endpoint": "https://APPROVED_HOST", "chainId": 1 }',
  },
  sdk: {
    title: "TypeScript SDK",
    text: "@nazu-cloud/sdk and @nazu-cloud/wallet are local workspace packages. They have not been published to npm. Use a monorepo workspace dependency until ownership, packaging and release tests are complete.",
    code: 'import { NazuCloud } from "@nazu-cloud/sdk";\nconst nazu = new NazuCloud({\n  apiKey: process.env.NAZU_API_KEY!,\n  baseUrl: process.env.NAZU_API_URL!,\n  projectId: process.env.NAZU_PROJECT_ID!\n});\nconst { data } = await nazu.monitors.list();',
  },
  authentication: {
    title: "Authentication and API keys",
    text: "Register a developer account, create an organization and project, then generate a key. Raw keys are shown once; only SHA-256 hashes are retained. Monitor read/write scopes are explicit. Expiration, revocation and atomic rotation are implemented in route code. Browser apps must not contain reusable developer secrets.",
  },
  "wallet-login": {
    title: "Wallet login",
    text: "Register exact HTTPS origins on your project. Configure the server-only chain RPC map. Request a challenge, sign its complete message and submit the challenge ID and signature. Tokens expire after one hour and are stored hashed. Browser SDK callers should retain tokens in memory and exchange them through their backend for an HttpOnly application cookie. CORS errors and relying-party session exchange need integration tests before launch.",
  },
  monitoring: {
    title: "RPC monitoring",
    text: "Allowlist provider hostnames in RPC_ALLOWED_HOSTS, create a monitor, deploy the worker as a persistent process, and verify check rows. Checks run at least 5 minutes apart with up to 15 seconds jitter. Three consecutive failures open an incident; a successful response resolves it. Only eth_chainId and eth_blockNumber are allowed. No block freshness, archival RPC or non-EVM support is claimed.",
  },
  alerts: {
    title: "Alert integrations",
    text: "Encrypted channel storage, deduplicated incident outbox and a leased retry worker are implemented in source. Channels start unverified; an operator must verify ownership and configure alert rules. Cooldowns, latency alerts and live delivery tests remain release gates. Do not use production recipients yet.",
  },
  errors: {
    title: "Errors, limits and troubleshooting",
    text: "Errors use { error: { code, message } }. 400 INVALID_INPUT/INVALID_JSON; 401 UNAUTHENTICATED/INVALID_KEY/INVALID_SIGNATURE; 403 FORBIDDEN/SCOPE_DENIED/ORIGIN_DENIED; 404 NOT_FOUND; 409 QUOTA_EXCEEDED; 413 TOO_LARGE; 429 RATE_LIMITED; 503 NOT_CONFIGURED/UNAVAILABLE. Lists are capped, not paginated. If checks remain unknown, inspect worker deployment, allowlist and last heartbeat.",
  },
  webhooks: {
    title: "Webhook security",
    text: "Inbound payment webhooks and outbound alert webhooks are not enabled. Future implementations must verify signatures on raw request bytes, reject stale timestamps and record event IDs transactionally. Never treat redirect success as payment verification.",
  },
  "quick-start": {
    title: "Staging setup",
    text: "Create a dedicated Supabase project or approved isolated development database. Do not migrate the existing testnet. Apply the reviewed migration, configure environment secrets, configure Supabase email/callback allowlists and deploy the Next.js app plus persistent worker separately. Review OPERATIONS.md and IMPLEMENTATION_PROGRESS.md for exact missing gates.",
  },
};
export default async function Docs({
  params,
}: {
  params: Promise<{ topic?: string[] }>;
}) {
  const key = (await params).topic?.join("/") ?? "";
  const guide = guides[key];
  if (!guide) notFound();
  return (
    <>
      <Header />
      <main id="main" className="page-content">
        <span className="eyebrow">DEVELOPER DOCUMENTATION</span>
        <h1>Build on a clear contract.</h1>
        <div className="docs-grid">
          <nav className="docs-nav" aria-label="Documentation">
            {Object.entries(guides).map(([k, g]) => (
              <Link key={k} href={"/docs" + (k ? "/" + k : "")}>
                {g.title}
              </Link>
            ))}
          </nav>
          <article className="docs-body">
            <span className="status-badge">v0.1 · Development</span>
            <h2>{guide.title}</h2>
            <p>{guide.text}</p>
            {guide.code && (
              <pre>
                <code>{guide.code}</code>
              </pre>
            )}
            <div className="notice">
              No public sandbox credentials or production base URL have been
              issued. Use your own staging configuration.
            </div>
            <a
              className="text-link"
              href="https://github.com/Mr04Nazmul/nazu-cloud/blob/main/docs/openapi.json"
            >
              OpenAPI specification ↗
            </a>
          </article>
        </div>
      </main>
      <Footer />
    </>
  );
}
