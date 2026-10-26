import Link from "next/link";
import { Header, Footer } from "../../components/header";
export default function Page() {
  return (
    <>
      <Header />
      <main id="main" className="page-content">
        <span className="eyebrow">NAZU CLOUD · DEVELOPER PREVIEW</span>
        <h1>Infrastructure, in focus.</h1>
        <p>
          NAZU Cloud brings EVM RPC checks, project access and wallet
          authentication into one developer workspace.
        </p>
        <h2>RPC monitoring</h2>
        <p>
          The worker checks eth_chainId and eth_blockNumber over approved HTTPS
          endpoints, measures latency, and records failure and recovery
          incidents. Deployment and external integration tests remain release
          gates.
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
