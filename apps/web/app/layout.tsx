import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = {
  title: {
    default: "NAZU Cloud — Know before your users do",
    template: "%s | NAZU Cloud",
  },
  description:
    "RPC health monitoring, latency diagnostics and developer authentication. NAZU Cloud developer preview.",
};
export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <a className="skip" href="#main">
          Skip to content
        </a>
        {children}
      </body>
    </html>
  );
}
