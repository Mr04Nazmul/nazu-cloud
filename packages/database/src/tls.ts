import type { ConnectionOptions } from "node:tls";

/** Verify both the server certificate chain and hostname. Only local development may disable TLS. */
export function databaseTlsOptions(input: {
  url: string;
  mode?: string;
  ca?: string;
  nodeEnv?: string;
}): false | ConnectionOptions {
  let url: URL;
  try {
    url = new URL(input.url);
  } catch {
    throw new Error("DATABASE_URL must be a valid PostgreSQL URL");
  }
  if (!["postgres:", "postgresql:"].includes(url.protocol))
    throw new Error("DATABASE_URL must be a PostgreSQL URL");
  if (input.mode === "disable") {
    const loopback = ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname);
    if (!["development", "test"].includes(input.nodeEnv ?? "") || !loopback)
      throw new Error(
        "Database TLS can be disabled only for loopback development",
      );
    return false;
  }
  if (input.mode && !["verify-full", "require"].includes(input.mode))
    throw new Error("Unsupported DB_SSL mode");
  if (input.ca && !input.ca.includes("-----BEGIN CERTIFICATE-----"))
    throw new Error("DB_SSL_CA must be a PEM certificate");
  return input.ca
    ? { rejectUnauthorized: true, ca: input.ca }
    : { rejectUnauthorized: true };
}
