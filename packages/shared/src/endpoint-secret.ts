import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";
function key() {
  const k = Buffer.from(process.env.RPC_ENCRYPTION_KEY ?? "", "base64");
  if (k.length !== 32) throw new Error("32-byte RPC_ENCRYPTION_KEY required");
  return k;
}
export function encryptEndpoint(value: string) {
  const iv = randomBytes(12),
    cipher = createCipheriv("aes-256-gcm", key(), iv);
  const bytes = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
  return [iv, cipher.getAuthTag(), bytes]
    .map((v) => v.toString("base64url"))
    .join(".");
}
export function decryptEndpoint(value: string) {
  const parts = value.split(".").map((v) => Buffer.from(v, "base64url"));
  if (parts.length !== 3 || parts[0].length !== 12 || parts[1].length !== 16)
    throw new Error("Invalid endpoint envelope");
  const decipher = createDecipheriv("aes-256-gcm", key(), parts[0]);
  decipher.setAuthTag(parts[1]);
  return Buffer.concat([decipher.update(parts[2]), decipher.final()]).toString(
    "utf8",
  );
}
