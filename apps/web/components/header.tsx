import Link from "next/link";
import { ArrowUpRight, AudioLines } from "lucide-react";
export function Brand() {
  return (
    <Link href="/" className="brand">
      <span className="brandmark">
        <AudioLines size={21} />
      </span>{" "}
      NAZU<span className="brand-light">Cloud</span>
    </Link>
  );
}
export function Header() {
  return (
    <>
      <div className="announcement">
        <span className="dot" /> Building in the open{" "}
        <span className="announcement-note">· Developer preview</span>
        <Link href="/changelog">
          See what’s new <ArrowUpRight size={12} />
        </Link>
      </div>
      <header>
        <Brand />
        <nav aria-label="Main navigation">
          <Link href="/product">Platform</Link>
          <Link href="/developers">Developers</Link>
          <Link href="/pricing">Pricing</Link>
          <Link href="/docs">Docs</Link>
        </nav>
        <div className="header-actions">
          <Link href="/login" className="login-link">
            Log in
          </Link>
          <Link href="/signup" className="button small">
            Get started <ArrowUpRight size={14} />
          </Link>
        </div>
      </header>
    </>
  );
}
export function Footer() {
  return (
    <footer>
      <div>
        <Brand />
        <p>
          Infrastructure you can trust.
          <br />
          APIs you can build on.
        </p>
        <small>© {new Date().getFullYear()} NAZU Cloud</small>
      </div>
      <div>
        <b>Platform</b>
        <Link href="/products/rpc-monitoring">RPC monitoring</Link>
        <Link href="/products/wallet-auth">Wallet authentication</Link>
        <Link href="/products/alerts">Alerts</Link>
        <Link href="/status">Service status</Link>
      </div>
      <div>
        <b>Developers</b>
        <Link href="/docs">Documentation</Link>
        <Link href="/docs/api">API reference</Link>
        <Link href="/docs/sdk">SDK guide</Link>
        <a href="https://github.com/Mr04Nazmul/nazu-cloud">GitHub ↗</a>
      </div>
      <div>
        <b>Company</b>
        <Link href="/security">Security</Link>
        <Link href="/contact">Contact</Link>
        <Link href="/privacy">Privacy</Link>
        <Link href="/terms">Terms</Link>
      </div>
    </footer>
  );
}
