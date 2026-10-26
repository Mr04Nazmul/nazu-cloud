import {
  PATCH as memberUpdate,
  GET as membersList,
} from "../../apps/web/app/v1/organizations/current/members/[[...path]]/route";
import { PGlite } from "@electric-sql/pglite";
import { readFileSync, readdirSync } from "node:fs";
import { beforeAll, afterAll, beforeEach, it, expect, vi } from "vitest";
import { privateKeyToAccount, generatePrivateKey } from "viem/accounts";
import { authorize, type Role } from "../../packages/shared/src/index";
const state = vi.hoisted(() => ({
  sql: null as unknown,
  member: vi.fn(),
  sameOrigin: vi.fn(),
  userId: "00000000-0000-4000-8000-000000000011",
}));
vi.mock("../../packages/database/src/index", () => ({ db: () => state.sql }));
vi.mock("../../apps/web/lib/auth", () => ({
  member: state.member,
  sameOrigin: state.sameOrigin,
  userId: async () => state.userId,
}));
import {
  POST as keyCreate,
  DELETE as keyDelete,
} from "../../apps/web/app/v1/api-keys/[[...path]]/route";
import { POST as monitorCreate } from "../../apps/web/app/v1/monitors/route";
import {
  PATCH as projectUpdate,
  DELETE as projectDelete,
} from "../../apps/web/app/v1/projects/[id]/route";
import {
  POST as walletPost,
  GET as walletGet,
} from "../../apps/web/app/v1/auth/[action]/route";
import { ApiError } from "../../packages/shared/src/index";
let pg: PGlite;
const orgA = "00000000-0000-4000-8000-000000000001",
  orgB = "00000000-0000-4000-8000-000000000002",
  projectA = "00000000-0000-4000-8000-000000000003",
  projectB = "00000000-0000-4000-8000-000000000004";
type Queryable = {
  query: (
    query: string,
    params: unknown[],
  ) => Promise<{ rows: Record<string, unknown>[] }>;
};
function adapter(client: Queryable) {
  const tag = async (strings: TemplateStringsArray, ...values: unknown[]) => {
    const query = strings.reduce(
      (s, part, i) => s + (i ? "$" + i : "") + part,
      "",
    );
    return (await client.query(query, values)).rows;
  };
  return Object.assign(tag, {
    begin: async <T>(
      callback: (sql: ReturnType<typeof adapter>) => Promise<T>,
    ): Promise<T> =>
      pg.transaction(async (tx) =>
        callback(adapter(tx as unknown as Queryable)),
      ),
  });
}
const request = (path: string, payload: unknown, secret?: string) =>
  new Request("https://console.example/v1/" + path, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Origin: "https://app.example",
      ...(secret ? { Authorization: "Bearer " + secret } : {}),
    },
    body: JSON.stringify(payload),
  });
beforeAll(async () => {
  pg = new PGlite();
  await pg.exec(
    "create role anon;create role authenticated;create schema auth;create table auth.users(id uuid primary key);",
  );
  for (const name of readdirSync("supabase/migrations")
    .filter((n) => n.endsWith(".sql"))
    .sort())
    await pg.exec(readFileSync("supabase/migrations/" + name, "utf8"));
  state.sql = adapter(pg as unknown as Queryable);
  await pg.query("insert into auth.users(id) values ($1)", [state.userId]);
  await pg.query(
    "insert into nazu_cloud.organizations(id,name) values($1,'Alpha'),($2,'Beta')",
    [orgA, orgB],
  );
  await pg.query(
    "insert into nazu_cloud.organization_members values($1,$2,'owner')",
    [orgA, state.userId],
  );
  await pg.query(
    "insert into nazu_cloud.projects(id,organization_id,name,origins) values($1,$2,'Alpha project',array['https://app.example']),($3,$4,'Beta project',array['https://app.example'])",
    [projectA, orgA, projectB, orgB],
  );
  state.member.mockImplementation(
    async (org: string, action: "read" | "write" | "manage" = "read") => {
      const q = await pg.query<{ role: Role }>(
        "select role from nazu_cloud.organization_members where organization_id=$1 and user_id=$2",
        [org, state.userId],
      );
      authorize(q.rows[0]?.role, action);
      return state.userId;
    },
  );
  state.sameOrigin.mockImplementation((req: Request) => {
    if (req.headers.get("origin") !== "https://app.example")
      throw new ApiError(403, "ORIGIN_DENIED", "denied");
  });
});
beforeEach(() => {
  vi.stubEnv("RPC_ALLOWED_HOSTS", "rpc.example");
  vi.stubEnv("RPC_ENCRYPTION_KEY", Buffer.alloc(32, 6).toString("base64"));
  vi.stubEnv(
    "WALLET_CHAIN_RPC_JSON",
    JSON.stringify({ "1": "http://127.0.0.1:1" }),
  );
});
afterAll(async () => {
  vi.unstubAllEnvs();
  await pg.close();
});
it("runs real key -> monitor -> quota -> revoke routes against PostgreSQL", async () => {
  const created = await keyCreate(
    request("api-keys", {
      projectId: projectA,
      scopes: ["monitors:read", "monitors:write"],
    }),
    { params: Promise.resolve({ path: [] }) },
  );
  expect(created.status).toBe(201);
  const { data: key } = await created.json();
  const persisted = await pg.query<{ secret_hash: string }>(
    "select secret_hash from nazu_cloud.api_keys where id=$1",
    [key.id],
  );
  expect(persisted.rows[0].secret_hash).not.toContain(key.secret);
  const payload = {
    projectId: projectA,
    name: "Mainnet",
    endpoint: "https://rpc.example/PROVIDER_SECRET",
    chainId: 1,
  };
  expect(
    (await monitorCreate(request("monitors", payload, key.secret))).status,
  ).toBe(201);
  expect(
    (
      await monitorCreate(
        request("monitors", { ...payload, name: "Second" }, key.secret),
      )
    ).status,
  ).toBe(409);
  const stored = await pg.query<{ endpoint_ciphertext: string }>(
    "select endpoint_ciphertext from nazu_cloud.rpc_monitors where project_id=$1",
    [projectA],
  );
  expect(stored.rows[0].endpoint_ciphertext).not.toContain("PROVIDER_SECRET");
  const events = await pg.query<{ status_code: number }>(
    "select status_code from nazu_cloud.api_usage_events where project_id=$1 order by id",
    [projectA],
  );
  expect(events.rows.map((e) => e.status_code)).toEqual([201, 409]);
  const revoked = await keyDelete(
    new Request(
      "https://console.example/v1/api-keys/" +
        key.id +
        "?projectId=" +
        projectA,
      { method: "DELETE", headers: { Origin: "https://app.example" } },
    ),
    { params: Promise.resolve({ path: [key.id] }) },
  );
  expect(revoked.status).toBe(204);
  expect(
    (await monitorCreate(request("monitors", payload, key.secret))).status,
  ).toBe(401);
});
it("denies cross-organization project writes and requires exact delete confirmation", async () => {
  const context = { params: Promise.resolve({ id: projectB }) };
  const edit = new Request("https://console.example/v1/projects/" + projectB, {
    method: "PATCH",
    headers: { Origin: "https://app.example" },
    body: JSON.stringify({ name: "Hijacked" }),
  });
  expect((await projectUpdate(edit, context)).status).toBe(403);
  const removal = new Request(
    "https://console.example/v1/projects/" + projectA,
    {
      method: "DELETE",
      headers: { Origin: "https://app.example" },
      body: JSON.stringify({ confirmName: "wrong" }),
    },
  );
  expect(
    (
      await projectDelete(removal, {
        params: Promise.resolve({ id: projectA }),
      })
    ).status,
  ).toBe(409);
  const names = await pg.query<{ name: string }>(
    "select name from nazu_cloud.projects where id=$1",
    [projectB],
  );
  expect(names.rows[0].name).toBe("Beta project");
});
it("verifies an actual signed challenge, rejects parallel HTTP replay and revokes the session", async () => {
  const account = privateKeyToAccount(generatePrivateKey());
  const issued = await walletPost(
    request("auth/challenge", {
      projectId: projectA,
      address: account.address,
      chainId: 1,
    }),
    { params: Promise.resolve({ action: "challenge" }) },
  );
  expect(issued.status).toBe(200);
  const { data: challenge } = await issued.json();
  const signature = await account.signMessage({ message: challenge.message });
  const payload = { projectId: projectA, challengeId: challenge.id, signature };
  const responses = await Promise.all([
    walletPost(request("auth/verify", payload), {
      params: Promise.resolve({ action: "verify" }),
    }),
    walletPost(request("auth/verify", payload), {
      params: Promise.resolve({ action: "verify" }),
    }),
  ]);
  expect(responses.map((r) => r.status).sort()).toEqual([200, 401]);
  const { data: session } = await responses
    .find((r) => r.status === 200)!
    .json();
  const sessionReq = () =>
    new Request(
      "https://console.example/v1/auth/session?projectId=" + projectA,
      {
        headers: {
          Origin: "https://app.example",
          Authorization: "Bearer " + session.token,
        },
      },
    );
  expect(
    (
      await walletGet(sessionReq(), {
        params: Promise.resolve({ action: "session" }),
      })
    ).status,
  ).toBe(200);
  expect(
    (
      await walletPost(
        request("auth/logout", { projectId: projectA }, session.token),
        { params: Promise.resolve({ action: "logout" }) },
      )
    ).status,
  ).toBe(204);
  expect(
    (
      await walletGet(sessionReq(), {
        params: Promise.resolve({ action: "session" }),
      })
    ).status,
  ).toBe(401);
});

it("rejects member self changes and cross-organization member listing through handlers", async () => {
  const update = new Request(
    "https://console.example/v1/organizations/current/members/" + state.userId,
    {
      method: "PATCH",
      headers: { Origin: "https://app.example" },
      body: JSON.stringify({ organizationId: orgA, role: "developer" }),
    },
  );
  expect(
    (
      await memberUpdate(update, {
        params: Promise.resolve({ path: [state.userId] }),
      })
    ).status,
  ).toBe(409);
  const list = await membersList(
    new Request(
      "https://console.example/v1/organizations/current/members?organizationId=" +
        orgB,
    ),
  );
  expect(list.status).toBe(403);
});
it("enforces stored key expiry and read-only API scopes", async () => {
  const create = await keyCreate(
    request("api-keys", { projectId: projectA, scopes: ["monitors:read"] }),
    { params: Promise.resolve({ path: [] }) },
  );
  const { data: key } = await create.json();
  const payload = {
    projectId: projectA,
    name: "Read only",
    endpoint: "https://rpc.example",
    chainId: 1,
  };
  expect(
    (await monitorCreate(request("monitors", payload, key.secret))).status,
  ).toBe(403);
  await pg.query(
    "update nazu_cloud.api_keys set expires_at=now()-interval '1 hour' where id=$1",
    [key.id],
  );
  expect(
    (await monitorCreate(request("monitors", payload, key.secret))).status,
  ).toBe(401);
});
