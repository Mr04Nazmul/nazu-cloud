export class NazuError extends Error {
  constructor(
    public status: number,
    public body: unknown,
  ) {
    super("NAZU API request failed");
  }
}
export interface Monitor {
  id: string;
  name: string;
  status: "healthy" | "degraded" | "down" | "unknown" | "paused";
  chain_id: number;
}
export class NazuCloud {
  constructor(
    private options: {
      apiKey: string;
      baseUrl: string;
      projectId: string;
      timeoutMs?: number;
    },
  ) {
    if (
      !options.baseUrl.startsWith("https://") &&
      !options.baseUrl.startsWith("http://localhost:")
    )
      throw new Error("HTTPS API URL required");
  }
  monitors = {
    list: () =>
      this.request<{ data: Monitor[] }>(
        "/monitors?projectId=" + encodeURIComponent(this.options.projectId),
      ),
    get: (id: string) =>
      this.request<{ data: Monitor }>("/monitors/" + encodeURIComponent(id)),
    create: (input: { name: string; endpoint: string; chainId: number }) =>
      this.request<{ data: Monitor }>("/monitors", "POST", {
        ...input,
        projectId: this.options.projectId,
      }),
  };
  private async request<T>(
    path: string,
    method = "GET",
    body?: unknown,
  ): Promise<T> {
    for (let attempt = 0; ; attempt++) {
      const r = await fetch(this.options.baseUrl.replace(/\/$/, "") + path, {
        method,
        headers: {
          Authorization: "Bearer " + this.options.apiKey,
          "Content-Type": "application/json",
        },
        body: body ? JSON.stringify(body) : undefined,
        signal: AbortSignal.timeout(this.options.timeoutMs ?? 10000),
      });
      if (
        method === "GET" &&
        [502, 503, 504].includes(r.status) &&
        attempt < 2
      ) {
        await new Promise((resolve) => setTimeout(resolve, 100 * 2 ** attempt));
        continue;
      }
      if (!r.ok)
        throw new NazuError(r.status, await r.json().catch(() => null));
      return r.json() as Promise<T>;
    }
  }
}
