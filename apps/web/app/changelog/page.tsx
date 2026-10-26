import Link from "next/link";
import { Header, Footer } from "../../components/header";
export default function Page() {
  return (
    <>
      <Header />
      <main id="main" className="page-content">
        <span className="eyebrow">NAZU CLOUD · DEVELOPER PREVIEW</span>
        <h1>Built in the open.</h1>
        <p>Development log — October 2026.</p>
        <h2>0.1.0 · Foundation</h2>
        <p>
          Initial strict TypeScript monorepo; project, key, monitor and wallet
          route handlers; isolated database migration; independent monitoring
          worker; public website and initial dashboard. See GitHub
          IMPLEMENTATION_PROGRESS.md for test evidence and incomplete release
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
