import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";
import { z } from "zod";
function key() {
  const k = Buffer.from(process.env.ALERT_ENCRYPTION_KEY ?? "", "base64");
  if (k.length !== 32) throw new Error("32-byte ALERT_ENCRYPTION_KEY required");
  return k;
}
export function encryptDestination(text: string) {
  const iv = randomBytes(12),
    cipher = createCipheriv("aes-256-gcm", key(), iv);
  const encrypted = Buffer.concat([
    cipher.update(text, "utf8"),
    cipher.final(),
  ]);
  return [iv, cipher.getAuthTag(), encrypted]
    .map((v) => v.toString("base64url"))
    .join(".");
}
export function decryptDestination(text: string) {
  const parts = text.split(".").map((v) => Buffer.from(v, "base64url"));
  if (parts.length !== 3) throw new Error("Invalid encrypted destination");
  const decipher = createDecipheriv("aes-256-gcm", key(), parts[0]);
  decipher.setAuthTag(parts[1]);
  return Buffer.concat([decipher.update(parts[2]), decipher.final()]).toString(
    "utf8",
  );
}
export function destination(kind: "email" | "discord", value: string) {
  if (kind === "email") {
    z.email().max(254).parse(value);
    if (!(process.env.ALERT_ALLOWED_EMAILS ?? "").split(",").includes(value))
      throw new Error("Recipient not approved for beta alerts");
    return value;
  }
  const u = new URL(value);
  if (
    u.protocol !== "https:" ||
    u.hostname !== "discord.com" ||
    u.port ||
    u.username ||
    u.password ||
    u.hash ||
    u.search ||
    !/^\/api\/webhooks\/[0-9]+\/[A-Za-z0-9_-]+$/.test(u.pathname)
  )
    throw new Error("Invalid Discord webhook");
  return u.href;
}
export async function deliver(
  kind: "email" | "discord",
  encrypted: string,
  event: string,
  monitorId: string,
  send: typeof fetch = fetch,
) {
  const target = destination(kind, decryptDestination(encrypted));
  const message = `NAZU Cloud: ${event}. Monitor ${monitorId}. Check your dashboard for observations.`;
  const url = kind === "email" ? "https://api.resend.com/emails" : target;
  if (
    kind === "email" &&
    (!process.env.RESEND_API_KEY || !process.env.ALERT_FROM_EMAIL)
  )
    throw new Error("Email provider not configured");
  const response = await send(url, {
    method: "POST",
    redirect: "error",
    signal: AbortSignal.timeout(8000),
    headers: {
      "Content-Type": "application/json",
      ...(kind === "email"
        ? { Authorization: "Bearer " + process.env.RESEND_API_KEY }
        : {}),
    },
    body: JSON.stringify(
      kind === "email"
        ? {
            from: process.env.ALERT_FROM_EMAIL,
            to: [target],
            subject: "NAZU Cloud infrastructure " + event,
            text: message,
          }
        : { content: message, allowed_mentions: { parse: [] } },
    ),
  });
  await response.body?.cancel();
  if (!response.ok) throw new Error("Alert provider rejected delivery");
}
export const backoffSeconds = (attempt: number) =>
  Math.min(3600, 30 * 2 ** Math.max(0, attempt - 1));
