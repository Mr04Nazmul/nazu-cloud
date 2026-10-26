import Link from "next/link";
import { Header, Footer } from "../../components/header";
export default function Page() {
  return (
    <>
      <Header />
      <main id="main" className="page-content">
        <span className="eyebrow">NAZU CLOUD · DEVELOPER PREVIEW</span>
        <h1>Security is an operating practice.</h1>
        <p>
          This product is under development and has not completed an independent
          security audit.
        </p>
        <h2>Current controls and remaining gates</h2>
        <p>
          API secrets are hashed. Browser database roles have no access to the
          isolated schema. Every server query is parameterized and tenant access
          is checked. Worker requests use provider allowlisting and pinned DNS.
          Remaining: production RLS/advisor review, least-privilege runtime
          roles, external wallet tests, load testing, secret encryption for
          provider URLs, egress firewall and backup restore drill.
        </p>
        <div className="notice">
          Development status is explicit. See the repository progress document
          before relying on a feature.
        </div>
        <Link className="button primary" href="/docs">
          Read the documentation →
        </Link>{" "}
        <a className="button" href="https://github.com/Mr04Nazmul/nazu-cloud">
          View source ↗
        </a>
      </main>
      <Footer />
    </>
  );
}
