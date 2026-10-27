import { PGlite } from "@electric-sql/pglite";
import { readFileSync, readdirSync } from "node:fs";
import type { Sql } from "postgres";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { encryptEndpoint } from "../../packages/shared/src/endpoint-secret";
import { runOne } from "../../services/monitor-worker/src/cycle";
import type { checkRpc } from "../../services/monitor-worker/src/rpc";

type Queryable = {
  query: (
    query: string,
    params: unknown[],
  ) => Promise<{ rows: Record<string, unknown>[] }>;
};
let pg: PGlite;
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
const org = "00000000-0000-4000-8000-000000000001";
const project = "00000000-0000-4000-8000-000000000002";
const monitor = "00000000-0000-4000-8000-000000000003";
const channel = "00000000-0000-4000-8000-000000000004";
const worker = "00000000-0000-4000-8000-000000000005";
beforeAll(async () => {
  vi.stubEnv("RPC_ENCRYPTION_KEY", Buffer.alloc(32, 8).toString("base64"));
  pg = new PGlite();
  await pg.exec(
    "create role anon; create role authenticated; create schema auth; create table auth.users(id uuid primary key);",
  );
  for (const name of readdirSync("supabase/migrations")
    .filter((n) => n.endsWith(".sql"))
    .sort())
    await pg.exec(readFileSync("supabase/migrations/" + name, "utf8"));
  await pg.query(
    "insert into nazu_cloud.organizations(id,name) values($1,'Test')",
    [org],
  );
  await pg.query(
    "insert into nazu_cloud.projects(id,organization_id,name) values($1,$2,'Test')",
    [project, org],
  );
  await pg.query(
    "insert into nazu_cloud.rpc_monitors(id,organization_id,project_id,name,endpoint_ciphertext,chain_id) values($1,$2,$3,'RPC',$4,1)",
    [monitor, org, project, encryptEndpoint("https://rpc.example")],
  );
  await pg.query(
    "insert into nazu_cloud.alert_channels(id,organization_id,kind,destination_ciphertext,verified_at) values($1,$2,'email','encrypted-fixture',now())",
    [channel, org],
  );
  await pg.query(
    "insert into nazu_cloud.alert_rules(organization_id,monitor_id,channel_id) values($1,$2,$3)",
    [org, monitor, channel],
  );
});
afterAll(async () => {
  vi.unstubAllEnvs();
  await pg.close();
});
describe("monitor incident cycle", () => {
  it("stores checks, opens one incident after failures and enqueues recovery", async () => {
    const sql = adapter(pg as unknown as Queryable) as unknown as Sql;
    const down: typeof checkRpc = async () => ({
      status: "down",
      latency_ms: null,
      block_number: null,
      error_code: "RPC_CHECK_FAILED",
    });
    const healthy: typeof checkRpc = async () => ({
      status: "healthy",
      latency_ms: 50,
      block_number: "123",
      error_code: null,
    });
    for (let i = 0; i < 4; i++) {
      await pg.query(
        "update nazu_cloud.rpc_monitors set next_check_at=now()-make_interval(secs=>$1) where id=$2",
        [i + 1, monitor],
      );
      expect(await runOne(sql, worker, down)).toBe(true);
      const active = await pg.query<{ count: number }>(
        "select count(*)::int as count from nazu_cloud.monitor_incidents where monitor_id=$1 and resolved_at is null",
        [monitor],
      );
      expect(active.rows[0].count).toBe(i < 2 ? 0 : 1);
    }
    const opened = await pg.query<{ count: number }>(
      "select count(*)::int as count from nazu_cloud.monitor_incidents where monitor_id=$1 and resolved_at is null",
      [monitor],
    );
    expect(opened.rows[0].count).toBe(1);
    await pg.query(
      "update nazu_cloud.rpc_monitors set next_check_at=now()-interval '10 seconds' where id=$1",
      [monitor],
    );
    expect(await runOne(sql, worker, healthy)).toBe(true);
    const checks = await pg.query<{ status: string }>(
      "select status from nazu_cloud.monitor_checks where monitor_id=$1 order by id",
      [monitor],
    );
    expect(checks.rows.map((r) => r.status)).toEqual([
      "down",
      "down",
      "down",
      "down",
      "healthy",
    ]);
    const incidents = await pg.query<{ resolved: boolean }>(
      "select resolved_at is not null as resolved from nazu_cloud.monitor_incidents where monitor_id=$1",
      [monitor],
    );
    expect(incidents.rows).toEqual([{ resolved: true }]);
    const deliveries = await pg.query<{ event: string }>(
      "select event from nazu_cloud.alert_deliveries where organization_id=$1 order by event",
      [org],
    );
    expect(deliveries.rows.map((r) => r.event).sort()).toEqual([
      "down",
      "recovery",
    ]);
  });
});
