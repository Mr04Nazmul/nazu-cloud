import { describe, it, expect, vi, beforeEach } from "vitest";
const mocks = vi.hoisted(() => ({
  query: vi.fn(),
  begin: vi.fn(),
  member: vi.fn(),
  sameOrigin: vi.fn(),
}));
vi.mock("../../packages/database/src/index", () => ({
  db: () => Object.assign(mocks.query, { begin: mocks.begin }),
}));
vi.mock("../../apps/web/lib/auth", () => ({
  member: mocks.member,
  sameOrigin: mocks.sameOrigin,
}));
import { access, body, errorResponse, withUsage } from "../../apps/web/lib/api";
import { ApiError } from "../../packages/shared/src/index";
beforeEach(() => {
  vi.clearAllMocks();
  mocks.begin.mockResolvedValue({
    id: "event",
    rateLimited: false,
    quotaExceeded: false,
  });
});
describe("API access boundary", () => {
  it("rejects an unknown project", async () => {
    mocks.query.mockResolvedValueOnce([]);
    await expect(
      access(new Request("https://api.example"), crypto.randomUUID()),
    ).rejects.toMatchObject({ status: 404 });
  });
  it("rejects invalid or revoked keys", async () => {
    mocks.query
      .mockResolvedValueOnce([{ id: "p", organization_id: "a" }])
      .mockResolvedValueOnce([]);
    await expect(
      access(
        new Request("https://api.example", {
          headers: { Authorization: "Bearer nazu_live_invalid" },
        }),
        "p",
      ),
    ).rejects.toMatchObject({ status: 401 });
  });
  it("rejects insufficient API scopes", async () => {
    mocks.query
      .mockResolvedValueOnce([{ id: "p", organization_id: "a" }])
      .mockResolvedValueOnce([{ id: "k", scopes: ["monitors:read"] }]);
    await expect(
      access(
        new Request("https://api.example", {
          headers: { Authorization: "Bearer nazu_live_key" },
        }),
        "p",
        true,
        "monitors:write",
      ),
    ).rejects.toMatchObject({ status: 403 });
  });
  it("enforces organization membership for developer sessions", async () => {
    mocks.query.mockResolvedValueOnce([{ id: "p", organization_id: "org-b" }]);
    mocks.member.mockRejectedValueOnce(
      new ApiError(403, "FORBIDDEN", "denied"),
    );
    await expect(
      access(new Request("https://api.example"), "p"),
    ).rejects.toMatchObject({ status: 403 });
    expect(mocks.member).toHaveBeenCalledWith("org-b", "read");
  });
  it("validates browser mutation origin", async () => {
    mocks.query.mockResolvedValueOnce([{ id: "p", organization_id: "a" }]);
    mocks.sameOrigin.mockImplementationOnce(() => {
      throw new ApiError(403, "ORIGIN_DENIED", "denied");
    });
    await expect(
      access(new Request("https://api.example", { method: "POST" }), "p", true),
    ).rejects.toMatchObject({ status: 403 });
    expect(mocks.member).not.toHaveBeenCalled();
  });
});
describe("bounded input and safe errors", () => {
  it("rejects malformed JSON", async () => {
    await expect(
      body(
        new Request("https://api.example", { method: "POST", body: "invalid" }),
      ),
    ).rejects.toMatchObject({ status: 400 });
  });
  it("rejects streamed oversized payload", async () => {
    await expect(
      body(
        new Request("https://api.example", {
          method: "POST",
          body: "x".repeat(17000),
        }),
      ),
    ).rejects.toMatchObject({ status: 413 });
  });
  it("does not leak database or credential errors", async () => {
    const response = errorResponse(new Error("postgres password SECRET"));
    expect(response.status).toBe(503);
    expect(await response.text()).not.toContain("SECRET");
  });
});

it("records final HTTP outcomes instead of optimistic successes", async () => {
  const req = new Request("https://api.example", {
    headers: { Authorization: "Bearer nazu_live_key" },
  });
  mocks.query
    .mockResolvedValueOnce([{ id: "p", organization_id: "a" }])
    .mockResolvedValueOnce([{ id: "k", scopes: ["monitors:read"] }])
    .mockResolvedValueOnce([]);
  const response = await withUsage(req, async () => {
    await access(req, "p");
    return Response.json({ ok: false }, { status: 409 });
  });
  expect(response.status).toBe(409);
  expect(mocks.query.mock.calls.at(-1)?.slice(1)).toEqual([409, "event"]);
});
it("commits rate limiting before rejecting a request and meters 429", async () => {
  const req = new Request("https://api.example", {
    headers: { Authorization: "Bearer nazu_live_key" },
  });
  mocks.query
    .mockResolvedValueOnce([{ id: "p", organization_id: "a" }])
    .mockResolvedValueOnce([{ id: "k", scopes: ["monitors:read"] }])
    .mockResolvedValueOnce([]);
  mocks.begin.mockResolvedValueOnce({
    id: "event",
    rateLimited: true,
    quotaExceeded: false,
  });
  const response = await withUsage(req, async () => {
    await access(req, "p");
    return Response.json({});
  });
  expect(response.status).toBe(429);
  expect(mocks.query.mock.calls.at(-1)?.slice(1)).toEqual([429, "event"]);
});
