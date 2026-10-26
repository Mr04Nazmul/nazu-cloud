import Link from "next/link";
import { Header, Footer } from "../../components/header";
export default function Page() {
  return (
    <>
      <Header />
      <main id="main" className="page-content">
        <span className="eyebrow">NAZU CLOUD · DEVELOPER PREVIEW</span>
        <h1>Terms of service.</h1>
        <p>Draft for developer preview. Not approved for commercial launch.</p>
        <h2>No paid production offer yet</h2>
        <p>
          No guaranteed uptime, SLA, token sale or custody service is offered.
          Before commercial use, complete operator details, acceptable use,
          payment/refund terms, liability, governing law and privacy review.
          Paid checkout is disabled.
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
