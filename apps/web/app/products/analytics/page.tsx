import Link from "next/link";
import { Header, Footer } from "../../../components/header";
export default function Page() {
  return (
    <>
      <Header />
      <main id="main" className="page-content">
        <span className="eyebrow">NAZU CLOUD · DEVELOPER PREVIEW</span>
        <h1>Measure what happened.</h1>
        <p>
          Observed availability and monitoring coverage are separate metrics.
        </p>
        <h2>Unknown means unknown</h2>
        <p>
          Availability is successful observed checks divided by all observed
          checks. Healthy and degraded responses are available. Missing
          scheduled checks are reported separately, and never treated as
          successful uptime. Charts in the homepage preview contain demo data.
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
