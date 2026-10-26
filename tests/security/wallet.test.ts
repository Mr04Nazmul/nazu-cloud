import { it, expect } from "vitest";
import { createPublicClient, http } from "viem";
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";
import { createSiweMessage } from "viem/siwe";
it("verifies EOA SIWE signatures and rejects tampering, wrong domain, nonce and expiry", async () => {
  const account = privateKeyToAccount(generatePrivateKey());
  const now = new Date();
  const message = createSiweMessage({
    address: account.address,
    chainId: 1,
    domain: "app.example",
    uri: "https://app.example",
    version: "1",
    nonce: "randomnonce123456",
    issuedAt: now,
    expirationTime: new Date(now.getTime() + 300000),
  });
  const signature = await account.signMessage({ message });
  const client = createPublicClient({
    transport: http("http://127.0.0.1:1", { retryCount: 0, timeout: 100 }),
  });
  expect(
    await client.verifySiweMessage({
      message,
      signature,
      domain: "app.example",
      nonce: "randomnonce123456",
      time: now,
    }),
  ).toBe(true);
  expect(
    await client.verifySiweMessage({
      message,
      signature,
      domain: "evil.example",
      time: now,
    }),
  ).toBe(false);
  expect(
    await client.verifySiweMessage({
      message,
      signature,
      nonce: "wrongnonce",
      time: now,
    }),
  ).toBe(false);
  expect(
    await client.verifySiweMessage({
      message,
      signature,
      time: new Date(now.getTime() + 3600000),
    }),
  ).toBe(false);
  expect(
    await client.verifySiweMessage({
      message: message.replace("app.example", "evil.example"),
      signature,
      domain: "app.example",
      time: now,
    }),
  ).toBe(false);
});
