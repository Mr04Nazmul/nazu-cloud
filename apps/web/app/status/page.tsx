import Link from "next/link";
import { Header, Footer } from "../../components/header";
export default function Page() {
  return (
    <>
      <Header />
      <main id="main" className="page-content">
        <span className="eyebrow">NAZU CLOUD · DEVELOPER PREVIEW</span>
        <h1>Service status.</h1>
        <p>No production deployment has been verified.</p>
        <h2>Operational status: unknown</h2>
        <p>
          This page does not infer service health from a static website build.
          Frontend, database, API and monitoring worker must pass separate smoke
          tests before operational status is published.
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
