import { createHash, randomBytes, timingSafeEqual } from "node:crypto";
import { z } from "zod";
export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
  ) {
    super(message);
  }
}
export const hashSecret = (secret: string) =>
  createHash("sha256").update(secret).digest("hex");
export function newKey() {
  const secret = "nazu_live_" + randomBytes(32).toString("base64url");
  return { secret, prefix: secret.slice(0, 18), hash: hashSecret(secret) };
}
export function secretMatches(secret: string, hash: string) {
  const digest = hashSecret(secret);
  return (
    hash.length === digest.length &&
    timingSafeEqual(Buffer.from(digest), Buffer.from(hash))
  );
}
export const roles = ["owner", "admin", "developer", "readonly"] as const;
export type Role = (typeof roles)[number];
export function authorize(
  role: Role | undefined,
  action: "read" | "write" | "manage",
) {
  if (
    !role ||
    (action === "write" && role === "readonly") ||
    (action === "manage" && !["owner", "admin"].includes(role))
  )
    throw new ApiError(
      403,
      "FORBIDDEN",
      "Insufficient organization permissions",
    );
}
export const projectInput = z.object({
  organizationId: z.uuid(),
  name: z.string().trim().min(2).max(80),
  origins: z
    .array(
      z.url().refine((v) => {
        const u = new URL(v);
        return u.protocol === "https:" && u.origin === v;
      }, "Use exact HTTPS origins"),
    )
    .max(10)
    .default([]),
});
export const monitorInput = z.object({
  projectId: z.uuid(),
  name: z.string().trim().min(2).max(80),
  endpoint: z.url().max(2048),
  chainId: z.number().int().positive(),
  intervalSeconds: z.number().int().min(300).max(86400).default(300),
  latencyThresholdMs: z.number().int().min(100).max(30000).default(2000),
});
export type Health = "healthy" | "degraded" | "down" | "unknown" | "paused";
export function metrics(
  checks: { status: Health; latency_ms: number | null }[],
  scheduled: number,
) {
  const observed = checks.filter(
    (c) => c.status !== "unknown" && c.status !== "paused",
  );
  const available = observed.filter(
    (c) => c.status === "healthy" || c.status === "degraded",
  ).length;
  const times = observed.flatMap((c) =>
    c.latency_ms === null ? [] : [c.latency_ms],
  );
  return {
    scheduledChecks: scheduled,
    observedChecks: observed.length,
    missingChecks: Math.max(0, scheduled - observed.length),
    availability: observed.length ? available / observed.length : null,
    coverage: scheduled ? Math.min(1, observed.length / scheduled) : null,
    averageLatencyMs: times.length
      ? times.reduce((a, b) => a + b, 0) / times.length
      : null,
  };
}
export const plans = {
  free: {
    price: 0,
    monitors: 1,
    interval: 300,
    retentionDays: 7,
    requests: 10000,
    members: 1,
  },
  starter: {
    price: 9,
    monitors: 5,
    interval: 300,
    retentionDays: 14,
    requests: 100000,
    members: 2,
  },
  pro: {
    price: 29,
    monitors: 25,
    interval: 300,
    retentionDays: 30,
    requests: 500000,
    members: 5,
  },
  business: {
    price: 99,
    monitors: 100,
    interval: 300,
    retentionDays: 90,
    requests: 2000000,
    members: 10,
  },
} as const;
