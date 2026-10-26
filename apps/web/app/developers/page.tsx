import Link from "next/link";
import { Header, Footer } from "../../components/header";
export default function Page() {
  return (
    <>
      <Header />
      <main id="main" className="page-content">
        <span className="eyebrow">NAZU CLOUD · DEVELOPER PREVIEW</span>
        <h1>A small surface. A clear contract.</h1>
        <p>Project-scoped APIs and TypeScript workspace SDKs.</p>
        <h2>Start with the source</h2>
        <p>
          The SDK packages are local monorepo packages, not published npm
          dependencies. Configure a staging backend and a registered project
          first. Public playground credentials are not issued yet.
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
