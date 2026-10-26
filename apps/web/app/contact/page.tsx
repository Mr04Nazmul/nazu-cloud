import Link from "next/link";
import { Header, Footer } from "../../components/header";
export default function Page() {
  return (
    <>
      <Header />
      <main id="main" className="page-content">
        <span className="eyebrow">NAZU CLOUD · DEVELOPER PREVIEW</span>
        <h1>Talk about your infrastructure.</h1>
        <p>We are building for small teams monitoring EVM RPC endpoints.</p>
        <h2>Reach the project</h2>
        <p>
          Use the GitHub repository issues for non-sensitive product questions.
          Do not post endpoint credentials, API keys, wallet signatures or
          personal data. No support SLA is offered.
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
