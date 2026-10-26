export interface WalletChallenge {
  id: string;
  message: string;
}
export class NazuWallet {
  constructor(private options: { baseUrl: string; projectId: string }) {}
  async login(
    address: string,
    chainId: number,
    signMessage: (message: string) => Promise<string>,
  ) {
    const challenge = (await this.post("/auth/challenge", {
      projectId: this.options.projectId,
      address,
      chainId,
    })) as { data: WalletChallenge };
    const signature = await signMessage(challenge.data.message);
    return this.post("/auth/verify", {
      projectId: this.options.projectId,
      challengeId: challenge.data.id,
      signature,
    });
  }
  private async post(path: string, body: unknown) {
    const r = await fetch(this.options.baseUrl + path, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(15000),
    });
    if (!r.ok) throw new Error("Wallet authentication failed");
    return r.json() as Promise<unknown>;
  }
}
// Session tokens must be kept in memory. A relying-party backend should exchange them for its own HttpOnly session cookie. Never embed a developer API key here.
