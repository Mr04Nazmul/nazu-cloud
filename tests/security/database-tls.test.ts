import { describe, it, expect } from "vitest";
import postgres from "postgres";
import { databaseTlsOptions } from "../../packages/database/src/tls";

describe("database TLS configuration", () => {
  const remote =
    "postgresql://test:secret@db.example.com:5432/postgres?sslmode=require";
  it("enforces certificate verification even if URL requests sslmode=require", () => {
    const ssl = databaseTlsOptions({
      url: remote,
      mode: "require",
      nodeEnv: "production",
    });
    const client = postgres(remote, { ssl });
    expect(client.options.ssl).toEqual({ rejectUnauthorized: true });
  });
  it("supports an explicitly configured trusted CA", () => {
    const ca =
      "-----BEGIN CERTIFICATE-----\nfixture\n-----END CERTIFICATE-----";
    expect(() =>
      databaseTlsOptions({ url: "postgres://localhost/db", mode: "disable" }),
    ).toThrow();
    expect(databaseTlsOptions({ url: remote, ca })).toEqual({
      rejectUnauthorized: true,
      ca,
    });
  });
  it("rejects TLS bypass in production or for remote development hosts", () => {
    expect(() =>
      databaseTlsOptions({
        url: remote,
        mode: "disable",
        nodeEnv: "development",
      }),
    ).toThrow();
    expect(() =>
      databaseTlsOptions({
        url: "postgres://localhost/db",
        mode: "disable",
        nodeEnv: "production",
      }),
    ).toThrow();
    expect(
      databaseTlsOptions({
        url: "postgres://127.0.0.1/db",
        mode: "disable",
        nodeEnv: "test",
      }),
    ).toBe(false);
  });
  it("rejects invalid certificates and non-PostgreSQL URLs", () => {
    expect(() =>
      databaseTlsOptions({ url: remote, ca: "not-a-certificate" }),
    ).toThrow();
    expect(() => databaseTlsOptions({ url: "https://example.com" })).toThrow();
    try {
      databaseTlsOptions({ url: "postgres://secret:private@ bad" });
      throw new Error("expected failure");
    } catch (err) {
      expect(String(err)).not.toContain("private");
    }
  });
});
