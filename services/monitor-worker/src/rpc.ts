import https from "node:https";
import { lookup } from "node:dns/promises";
import ipaddr from "ipaddr.js";
import type { Health } from "../../../packages/shared/src/index";
export function publicAddress(address: string) {
  try {
    const p = ipaddr.process(address);
    return p.range() === "unicast";
  } catch {
    return false;
  }
}
export function approvedEndpoint(value: string, allowedHosts: string[]) {
  const u = new URL(value);
  if (
    u.protocol !== "https:" ||
    u.username ||
    u.password ||
    u.hash ||
    (u.port && u.port !== "443") ||
    !allowedHosts.includes(u.hostname)
  )
    throw new Error("Endpoint is not an approved HTTPS provider");
  return u;
}
export async function resolveEndpoint(value: string, allowedHosts: string[]) {
  const url = approvedEndpoint(value, allowedHosts);
  const answers = await Promise.race([
    lookup(url.hostname, { all: true }),
    new Promise<never>((_, reject) => {
      const timer = setTimeout(
        () => reject(new Error("DNS deadline exceeded")),
        5000,
      );
      timer.unref();
    }),
  ]);
  if (!answers.length || answers.some((a) => !publicAddress(a.address)))
    throw new Error("Non-public DNS result");
  return { url, address: answers[0].address, family: answers[0].family };
}
export type PinnedEndpoint = Awaited<ReturnType<typeof resolveEndpoint>>;
export function rpcRequest(
  target: PinnedEndpoint,
  method: "eth_chainId" | "eth_blockNumber",
  id: number,
): Promise<unknown> {
  return new Promise((resolve, reject) => {
    let bytes = 0;
    const chunks: Buffer[] = [];
    const request = https.request(
      target.url,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        lookup: (_host, _opts, cb) => cb(null, target.address, target.family),
        agent: false,
      },
      (response) => {
        if (response.statusCode !== 200) {
          response.resume();
          reject(new Error("HTTP error"));
          return;
        }
        response.on("data", (chunk: Buffer) => {
          bytes += chunk.length;
          if (bytes > 65536) {
            response.destroy();
            reject(new Error("Response too large"));
          } else chunks.push(chunk);
        });
        response.on("error", reject);
        response.on("end", () => {
          try {
            const body = JSON.parse(Buffer.concat(chunks).toString()) as {
              jsonrpc?: string;
              id?: number;
              result?: unknown;
              error?: unknown;
            };
            if (
              body.jsonrpc !== "2.0" ||
              body.id !== id ||
              body.error ||
              typeof body.result !== "string" ||
              !/^0x[0-9a-f]+$/i.test(body.result)
            )
              throw new Error("Invalid JSON-RPC result");
            resolve(body.result);
          } catch (e) {
            reject(e);
          }
        });
      },
    );
    const timeout = setTimeout(
      () => request.destroy(new Error("RPC deadline exceeded")),
      8000,
    );
    request.on("close", () => clearTimeout(timeout));
    request.on("error", reject);
    request.end(JSON.stringify({ jsonrpc: "2.0", id, method, params: [] }));
  });
}
export async function checkRpc(
  endpoint: string,
  chainId: number,
  threshold: number,
  allowedHosts: string[],
  request = rpcRequest,
  resolver = resolveEndpoint,
): Promise<{
  status: Health;
  latency_ms: number | null;
  block_number: string | null;
  error_code: string | null;
}> {
  const start = performance.now();
  try {
    const target = await resolver(endpoint, allowedHosts);
    const chain = await request(target, "eth_chainId", 1);
    if (BigInt(chain as string) !== BigInt(chainId))
      throw new Error("Chain mismatch");
    const block = await request(target, "eth_blockNumber", 2);
    const latency = Math.round(performance.now() - start);
    return {
      status: latency > threshold ? "degraded" : "healthy",
      latency_ms: latency,
      block_number: BigInt(block as string).toString(),
      error_code: null,
    };
  } catch {
    return {
      status: "down",
      latency_ms: null,
      block_number: null,
      error_code: "RPC_CHECK_FAILED",
    };
  }
}
