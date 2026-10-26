import Link from "next/link";
import { Header, Footer } from "../../../components/header";
export default function Page() {
  return (
    <>
      <Header />
      <main id="main" className="page-content">
        <span className="eyebrow">NAZU CLOUD · DEVELOPER PREVIEW</span>
        <h1>Identity without custody.</h1>
        <p>
          Sign-In with Ethereum challenges, scoped to a registered project and
          HTTPS origin.
        </p>
        <h2>One challenge. One use.</h2>
        <p>
          The server creates the complete EIP-4361 message with chain, domain,
          URI, nonce and expiry. viem verifies signatures; an atomic database
          operation consumes the challenge before a hashed session token is
          stored. EOA and contract-wallet live integration testing remains
          required.
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
