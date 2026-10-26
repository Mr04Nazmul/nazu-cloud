import Link from "next/link";
import { Header, Footer } from "../../components/header";
export default function Page() {
  return (
    <>
      <Header />
      <main id="main" className="page-content">
        <span className="eyebrow">NAZU CLOUD · DEVELOPER PREVIEW</span>
        <h1>Privacy information.</h1>
        <p>Draft for developer preview. Not approved for commercial launch.</p>
        <h2>Data minimization</h2>
        <p>
          The implementation stores account references, organization
          memberships, endpoint check history, wallet address and session
          hashes, key hashes and usage/audit events. No seed phrases or wallet
          private keys are requested. Before public registration, identify the
          legal operator, contact details, subprocessors, retention,
          deletion/export process and applicable transfer terms.
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
