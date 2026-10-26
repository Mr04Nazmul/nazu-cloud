import Link from "next/link";
import { Header, Footer } from "../../../components/header";
export default function Page() {
  return (
    <>
      <Header />
      <main id="main" className="page-content">
        <span className="eyebrow">NAZU CLOUD · DEVELOPER PREVIEW</span>
        <h1>Turn signals into action.</h1>
        <p>
          Planned email and Discord notifications for downtime and recovery.
        </p>
        <h2>Delivery is not enabled</h2>
        <p>
          The implementation includes encrypted channel destinations, alert
          rules and deduplicated deliveries. The alert worker, retries,
          cooldowns and delivery tests remain incomplete. No notification
          delivery is claimed.
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
