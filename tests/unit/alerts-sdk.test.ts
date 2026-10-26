import { it, expect, vi, afterEach } from "vitest";
import {
  encryptDestination,
  decryptDestination,
  destination,
  backoffSeconds,
  deliver,
} from "../../services/alert-worker/src/delivery";
import { NazuCloud, NazuError } from "../../packages/sdk/src/index";
afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});
it("encrypts alert destinations with random IV and authenticated ciphertext", () => {
  vi.stubEnv("ALERT_ENCRYPTION_KEY", Buffer.alloc(32, 7).toString("base64"));
  const a = encryptDestination("sensitive@example.com"),
    b = encryptDestination("sensitive@example.com");
  expect(a).not.toBe(b);
  expect(a).not.toContain("sensitive");
  expect(decryptDestination(a)).toBe("sensitive@example.com");
  const parts = a.split(".");
  parts[2] = Buffer.from("tamper").toString("base64url");
  expect(() => decryptDestination(parts.join("."))).toThrow();
});
it("rejects unapproved recipients and webhook SSRF targets", () => {
  vi.stubEnv("ALERT_ALLOWED_EMAILS", "safe@example.com");
  expect(destination("email", "safe@example.com")).toBe("safe@example.com");
  expect(() => destination("email", "other@example.com")).toThrow();
  for (const url of [
    "https://discord.com.evil/api/webhooks/1/token",
    "http://discord.com/api/webhooks/1/token",
    "https://discord.com/api/webhooks/1/token?url=http://localhost",
    "https://127.0.0.1/api/webhooks/1/token",
  ])
    expect(() => destination("discord", url)).toThrow();
});
it("uses bounded retries", () => {
  expect(backoffSeconds(1)).toBe(30);
  expect(backoffSeconds(5)).toBe(480);
  expect(backoffSeconds(20)).toBe(3600);
});
it("sends a Discord payload with mentions disabled and redirects forbidden", async () => {
  vi.stubEnv("ALERT_ENCRYPTION_KEY", Buffer.alloc(32, 7).toString("base64"));
  const send = vi.fn().mockResolvedValue(new Response(null, { status: 204 }));
  await deliver(
    "discord",
    encryptDestination("https://discord.com/api/webhooks/123/token"),
    "down",
    "monitor",
    send,
  );
  expect(send.mock.calls[0][1].redirect).toBe("error");
  expect(JSON.parse(send.mock.calls[0][1].body).allowed_mentions.parse).toEqual(
    [],
  );
});
it("SDK never retries a write after failure", async () => {
  const send = vi
    .fn()
    .mockResolvedValue(
      new Response('{"error":"unavailable"}', { status: 503 }),
    );
  vi.stubGlobal("fetch", send);
  const client = new NazuCloud({
    apiKey: "server-secret",
    projectId: "project",
    baseUrl: "https://api.example/v1",
  });
  await expect(
    client.monitors.create({
      name: "RPC",
      endpoint: "https://rpc.example",
      chainId: 1,
    }),
  ).rejects.toBeInstanceOf(NazuError);
  expect(send).toHaveBeenCalledTimes(1);
});
it("SDK preserves typed API response and server auth header", async () => {
  const send = vi.fn().mockResolvedValue(
    Response.json({
      data: [{ id: "m", name: "RPC", status: "unknown", chain_id: 1 }],
    }),
  );
  vi.stubGlobal("fetch", send);
  const client = new NazuCloud({
    apiKey: "server-secret",
    projectId: "project",
    baseUrl: "https://api.example/v1",
  });
  expect((await client.monitors.list()).data[0].status).toBe("unknown");
  expect(send.mock.calls[0][1].headers.Authorization).toBe(
    "Bearer server-secret",
  );
});

it("encrypts provider URL credentials at rest and rejects tampering", async () => {
  vi.stubEnv("RPC_ENCRYPTION_KEY", Buffer.alloc(32, 9).toString("base64"));
  const { encryptEndpoint, decryptEndpoint } =
    await import("../../packages/shared/src/endpoint-secret");
  const url = "https://rpc.example/SECRET_PROVIDER_KEY";
  const sealed = encryptEndpoint(url);
  expect(sealed).not.toContain("SECRET_PROVIDER_KEY");
  expect(decryptEndpoint(sealed)).toBe(url);
  expect(() => decryptEndpoint("broken")).toThrow();
});

it("cancels delayed downtime after recovery without cancelling recovery notices", async () => {
  const { obsoleteDowntime } =
    await import("../../services/alert-worker/src/policy");
  expect(obsoleteDowntime("down", new Date())).toBe(true);
  expect(obsoleteDowntime("down", null)).toBe(false);
  expect(obsoleteDowntime("recovery", new Date())).toBe(false);
});
