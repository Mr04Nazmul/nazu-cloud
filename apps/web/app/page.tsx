import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  Activity,
  Bell,
  Code2,
  Fingerprint,
  GitBranch,
  Globe2,
  Layers,
  LockKeyhole,
  Radio,
  ShieldCheck,
  Terminal,
} from "lucide-react";
import { Header, Footer } from "../components/header";
import { Demo } from "../components/demo";
export default function Home() {
  return (
    <>
      <Header />
      <main id="main">
        <section className="hero">
          <div className="hero-grid" />
          <div className="eyebrow">
            <span className="dot" /> THE SIGNAL IN YOUR INFRASTRUCTURE
          </div>
          <h1>
            Know before
            <br />
            <span>your users do.</span>
          </h1>
          <p className="hero-sub">
            Monitor your Web3 infrastructure.
            <br className="mobile-break" /> Before your users notice a problem.
          </p>
          <p className="hero-description">
            Track RPC health, monitor latency, and manage your
            <br className="desktop-break" /> infrastructure from one developer
            platform.
          </p>
          <div className="hero-buttons">
            <Link className="button primary" href="/signup">
              Start for free <ArrowRight size={16} />
            </Link>
            <Link className="button secondary" href="/docs">
              Explore API docs <Code2 size={16} />
            </Link>
          </div>
          <p className="hero-note">
            Free tier planned <span>·</span> No token required <span>·</span>{" "}
            Developer preview
          </p>
          <div className="hero-console">
            <div className="console-caption">
              <span>
                <span className="dot" /> A clearer view of your infrastructure
              </span>
              <small>TRY THE INTERACTIVE PREVIEW BELOW</small>
            </div>
            <Demo />
          </div>
        </section>
        <section className="network-strip">
          <span>BUILT FOR THE EVM ECOSYSTEM</span>
          <div>
            <b>Ξ Ethereum</b>
            <b>◉ Base</b>
            <b>⬡ Polygon</b>
            <b>△ Arbitrum</b>
            <b>◎ Optimism</b>
          </div>
          <small>
            EVM monitoring architecture. Network support depends on configured,
            approved providers.
          </small>
        </section>
        <section className="section">
          <div className="section-intro">
            <span className="eyebrow">LESS GUESSWORK. MORE BUILDING.</span>
            <h2>
              Your infrastructure.
              <br />
              In focus.
            </h2>
            <p>
              Stop switching between terminals, provider dashboards,
              <br />
              and unanswered questions.
            </p>
          </div>
          <div className="feature-grid">
            <article className="feature large">
              <div className="feature-icon">
                <Activity />
              </div>
              <h3>Every endpoint. One pulse.</h3>
              <p>
                Connectivity, chain identity, block height and latency in a
                single monitoring workflow. See failures as they happen.
              </p>
              <div className="signal">
                <span>REQUEST</span>
                <i />
                <Radio />
                <i />
                <span>RPC</span>
              </div>
              <Link href="/products/rpc-monitoring">
                Explore RPC monitoring <ArrowUpRight size={15} />
              </Link>
            </article>
            <article className="feature">
              <div className="feature-icon violet">
                <Fingerprint />
              </div>
              <h3>Signatures, not seed phrases.</h3>
              <p>
                Standards-based wallet authentication with one-time challenges
                and project-scoped sessions.
              </p>
              <div className="code-mini">
                signature.verify()<span>↳ identity, verified</span>
              </div>
              <Link href="/products/wallet-auth">
                Explore Wallet Auth <ArrowUpRight size={15} />
              </Link>
            </article>
            <article className="feature">
              <div className="feature-icon emerald">
                <Bell />
              </div>
              <h3>Make downtime actionable.</h3>
              <p>
                Incident detection after consecutive failures. Delivery
                integrations are in development; no alerts are claimed yet.
              </p>
              <div className="alert-preview">
                <span className="dot" />
                <div>
                  Incident engine<small>Failure → incident → recovery</small>
                </div>
                <span>BUILDING</span>
              </div>
              <Link href="/products/alerts">
                Alert roadmap <ArrowUpRight size={15} />
              </Link>
            </article>
          </div>
        </section>
        <section className="section integration">
          <div>
            <span className="eyebrow">BUILT FOR YOUR WORKFLOW</span>
            <h2>
              From first request
              <br />
              to a clearer picture.
            </h2>
            <p>
              A small API surface. Typed responses.
              <br />
              Documentation that tells you what actually works.
            </p>
            <div className="steps">
              {[
                [
                  "01",
                  "Create your workspace",
                  "Keep projects and access organized.",
                ],
                [
                  "02",
                  "Add an approved RPC endpoint",
                  "Check connectivity without opening your network.",
                ],
                [
                  "03",
                  "Read the signal",
                  "Review observed checks and incident history.",
                ],
              ].map(([n, t, d]) => (
                <div key={n}>
                  <span>{n}</span>
                  <div>
                    <b>{t}</b>
                    <p>{d}</p>
                  </div>
                </div>
              ))}
            </div>
            <Link href="/docs" className="text-link">
              Read the quick start <ArrowRight size={16} />
            </Link>
          </div>
          <div className="code-panel">
            <div>
              <span>
                <Terminal size={14} /> monitor.ts
              </span>
              <small>TypeScript · SDK source preview</small>
            </div>
            <pre>
              <code>{`import { NazuCloud } from '@nazu-cloud/sdk';

// Local workspace package. Not published on npm.
const nazu = new NazuCloud({
  apiKey: process.env.NAZU_API_KEY!,
  baseUrl: process.env.NAZU_API_URL!,
  projectId: process.env.NAZU_PROJECT_ID!
});

const { data } = await nazu.monitors.list();
console.log(data);`}</code>
            </pre>
            <div className="code-footer">
              <LockKeyhole size={13} /> Your API key stays on your server.
            </div>
          </div>
        </section>
        <section className="section security-section">
          <div className="security-emblem">
            <ShieldCheck size={34} />
          </div>
          <span className="eyebrow">TRUST BEGINS WITH TRANSPARENCY</span>
          <h2>Measured. Never made up.</h2>
          <p>
            Missing checks are unknown, not uptime. Demo data is labeled.
            <br />
            No guaranteed SLAs until the operations support them.
          </p>
          <div className="trust-items">
            <span>
              <LockKeyhole size={15} /> Hashed API secrets
            </span>
            <span>
              <Layers size={15} /> Tenant isolation
            </span>
            <span>
              <Globe2 size={15} /> Restricted RPC egress
            </span>
            <span>
              <GitBranch size={15} /> Open development
            </span>
          </div>
          <Link href="/security" className="text-link">
            Read our security approach <ArrowUpRight size={15} />
          </Link>
        </section>
        <section className="section">
          <div className="section-intro centered">
            <span className="eyebrow">START SMALL. BUILD WITH CONFIDENCE.</span>
            <h2>A plan for your next stage.</h2>
            <p>Proposed beta pricing. Paid checkout is not enabled.</p>
          </div>
          <div className="pricing-grid">
            {[
              ["Free", "0", "1 monitor", "For your first endpoint"],
              ["Starter", "9", "5 monitors", "For a growing project"],
              ["Pro", "29", "25 monitors", "For teams shipping more"],
              ["Business", "99", "100 monitors", "For a broader operation"],
            ].map(([n, p, m, d], i) => (
              <article
                key={n}
                className={"price-card " + (i === 2 ? "featured" : "")}
              >
                {i === 2 && <span className="popular">ROOM TO GROW</span>}
                <h3>{n}</h3>
                <p>{d}</p>
                <strong>
                  ${p}
                  <small>/ month</small>
                </strong>
                <span>{m}</span>
                <span>5-minute minimum interval</span>
                <Link
                  href="/pricing"
                  className={"button " + (i === 2 ? "primary" : "secondary")}
                >
                  View proposed plan <ArrowUpRight size={14} />
                </Link>
              </article>
            ))}
          </div>
        </section>
        <section className="section faq">
          <div>
            <span className="eyebrow">A FEW CLEAR ANSWERS</span>
            <h2>Before you build.</h2>
          </div>
          <div>
            {[
              [
                "Is NAZU Cloud live?",
                "The product is in development. The preview demonstrates the interface; production services are not yet advertised as operational.",
              ],
              [
                "Does this require NAZU tokens?",
                "No. NAZU Cloud is a developer infrastructure product. No tokens are minted, sold or distributed.",
              ],
              [
                "Which endpoints can I monitor?",
                "The initial worker supports EVM JSON-RPC over HTTPS using an explicit provider hostname allowlist. Non-EVM chains are not supported.",
              ],
              [
                "How is uptime measured?",
                "Availability uses observed valid checks. Coverage and missing checks are reported separately. Missing observations never count as successful checks.",
              ],
            ].map(([q, a]) => (
              <details key={q}>
                <summary>{q}</summary>
                <p>{a}</p>
              </details>
            ))}
          </div>
        </section>
        <section className="final-cta">
          <span className="eyebrow">LESS DOWNTIME. MORE MOMENTUM.</span>
          <h2>Build on a clearer signal.</h2>
          <p>Your next endpoint deserves better visibility.</p>
          <Link href="/signup" className="button primary">
            Start building <ArrowRight size={16} />
          </Link>
          <Link href="/docs" className="text-link">
            Explore the documentation <ArrowUpRight size={14} />
          </Link>
        </section>
      </main>
      <Footer />
    </>
  );
}
