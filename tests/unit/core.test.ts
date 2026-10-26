import { describe, it, expect } from "vitest";
import {
  newKey,
  secretMatches,
  authorize,
  metrics,
  projectInput,
  monitorInput,
} from "../../packages/shared/src/index";
import {
  approvedEndpoint,
  publicAddress,
  checkRpc,
} from "../../services/monitor-worker/src/rpc";
describe("API key security", () => {
  it("creates unpredictable keys and stores only hash material", () => {
    const a = newKey(),
      b = newKey();
    expect(a.secret).not.toBe(b.secret);
    expect(a.hash).not.toContain(a.secret);
    expect(a.hash).toHaveLength(64);
    expect(secretMatches(a.secret, a.hash)).toBe(true);
    expect(secretMatches(b.secret, a.hash)).toBe(false);
    expect(secretMatches(a.secret, "short")).toBe(false);
  });
});
describe("RBAC", () => {
  it("rejects outsiders and readonly writes", () => {
    expect(() => authorize(undefined, "read")).toThrow();
    expect(() => authorize("readonly", "write")).toThrow();
    expect(() => authorize("developer", "manage")).toThrow();
  });
  it("allows only expected permissions", () => {
    expect(() => authorize("readonly", "read")).not.toThrow();
    expect(() => authorize("developer", "write")).not.toThrow();
    expect(() => authorize("admin", "manage")).not.toThrow();
    expect(() => authorize("owner", "manage")).not.toThrow();
  });
});
describe("transparent metrics", () => {
  it("never invents uptime with no observations", () => {
    expect(metrics([], 10)).toEqual({
      scheduledChecks: 10,
      observedChecks: 0,
      missingChecks: 10,
      availability: null,
      coverage: 0,
      averageLatencyMs: null,
    });
  });
  it("separates availability and coverage and preserves zero latency", () => {
    expect(
      metrics(
        [
          { status: "healthy", latency_ms: 0 },
          { status: "degraded", latency_ms: 100 },
          { status: "down", latency_ms: null },
          { status: "unknown", latency_ms: null },
        ],
        5,
      ),
    ).toMatchObject({
      availability: 2 / 3,
      coverage: 0.6,
      averageLatencyMs: 50,
      missingChecks: 2,
    });
  });
});
describe("SSRF controls", () => {
  it.each([
    "127.0.0.1",
    "10.1.1.1",
    "169.254.169.254",
    "172.16.0.1",
    "192.168.1.1",
    "0.0.0.0",
    "100.64.0.1",
    "224.0.0.1",
    "::1",
    "::",
    "fe80::1",
    "fc00::1",
    "::ffff:127.0.0.1",
  ])("blocks reserved IP %s", (ip) => expect(publicAddress(ip)).toBe(false));
  it("accepts public unicast", () => {
    expect(publicAddress("1.1.1.1")).toBe(true);
    expect(publicAddress("2606:4700:4700::1111")).toBe(true);
  });
  it.each([
    "http://rpc.example",
    "https://user:secret@rpc.example",
    "https://rpc.example:444",
    "https://rpc.example.evil",
    "https://127.0.0.1",
    "https://rpc.example/#x",
  ])("rejects unsafe endpoints %s", (url) =>
    expect(() => approvedEndpoint(url, ["rpc.example"])).toThrow(),
  );
  it("allows only exact hosts", () =>
    expect(
      approvedEndpoint("https://rpc.example/path?key=x", ["rpc.example"])
        .hostname,
    ).toBe("rpc.example"));
});
describe("RPC correctness", () => {
  const resolver = async () => ({
    url: new URL("https://rpc.example"),
    address: "1.1.1.1",
    family: 4,
  });
  it("validates chain and parses block", async () =>
    expect(
      await checkRpc(
        "https://rpc.example",
        1,
        2000,
        ["rpc.example"],
        async (_t, m) => (m === "eth_chainId" ? "0x1" : "0x10"),
        resolver,
      ),
    ).toMatchObject({
      status: "healthy",
      block_number: "16",
      error_code: null,
    }));
  it("rejects incorrect chain", async () =>
    expect(
      await checkRpc(
        "https://rpc.example",
        1,
        2000,
        ["rpc.example"],
        async () => "0x2",
        resolver,
      ),
    ).toMatchObject({ status: "down", error_code: "RPC_CHECK_FAILED" }));
  it("redacts provider failures", async () => {
    const r = await checkRpc(
      "https://rpc.example/private-key",
      1,
      2000,
      ["rpc.example"],
      async () => {
        throw Error("private-key");
      },
      resolver,
    );
    expect(JSON.stringify(r)).not.toContain("private-key");
    expect(r.latency_ms).toBeNull();
  });
});
describe("input validation", () => {
  it("rejects origin paths, insecure origins and subminute checks", () => {
    expect(
      projectInput.safeParse({
        name: "ok",
        organizationId: crypto.randomUUID(),
        origins: ["https://example.com/path"],
      }).success,
    ).toBe(false);
    expect(
      projectInput.safeParse({
        name: "ok",
        organizationId: crypto.randomUUID(),
        origins: ["http://example.com"],
      }).success,
    ).toBe(false);
    expect(
      monitorInput.safeParse({
        projectId: crypto.randomUUID(),
        name: "RPC",
        endpoint: "https://rpc.example",
        chainId: 1,
        intervalSeconds: 1,
      }).success,
    ).toBe(false);
  });
});
