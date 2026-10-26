import Link from "next/link";
import { Header, Footer } from "../../../components/header";
export default function Page() {
  return (
    <>
      <Header />
      <main id="main" className="page-content">
        <span className="eyebrow">NAZU CLOUD · DEVELOPER PREVIEW</span>
        <h1>A pulse for every endpoint.</h1>
        <p>
          Know whether your EVM endpoint answers correctly, not just whether a
          URL responds.
        </p>
        <h2>Bounded checks, useful context</h2>
        <p>
          Approved hostnames, public DNS validation, pinned connections, no
          redirects, 64 KiB response limits and request deadlines. Three
          consecutive down checks open an incident; the next successful check
          closes it. Block freshness diagnostics and multi-region checks are not
          implemented.
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
