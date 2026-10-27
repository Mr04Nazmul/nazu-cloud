import { PGlite } from "@electric-sql/pglite";
import { readFileSync, readdirSync } from "node:fs";
import type { Sql } from "postgres";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { next } from "../../services/alert-worker/src/cycle";
import type { deliver } from "../../services/alert-worker/src/delivery";

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
const org = "00000000-0000-4000-8000-000000000001",
  channel = "00000000-0000-4000-8000-000000000002",
  worker = "00000000-0000-4000-8000-000000000003";
beforeAll(async () => {
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
    "insert into nazu_cloud.alert_channels(id,organization_id,kind,destination_ciphertext,verified_at) values($1,$2,'email','fixture',now())",
    [channel, org],
  );
});
afterAll(async () => pg.close());
describe("alert delivery cycle", () => {
  it("retries provider failure then records a successful delivery", async () => {
    const [job] = (
      await pg.query<{ id: string }>(
        "insert into nazu_cloud.alert_deliveries(organization_id,channel_id,event) values($1,$2,'test') returning id",
        [org, channel],
      )
    ).rows;
    const sql = adapter(pg as unknown as Queryable) as unknown as Sql;
    const failure: typeof deliver = async () => {
      throw new Error("simulated provider failure");
    };
    await next(sql, worker, failure);
    const failed = await pg.query<{
      status: string;
      attempts: number;
      scheduled: boolean;
      locked: boolean;
    }>(
      "select status,attempts,next_attempt_at>now() as scheduled,locked_until is not null as locked from nazu_cloud.alert_deliveries where id=$1",
      [job.id],
    );
    expect(failed.rows[0]).toEqual({
      status: "pending",
      attempts: 1,
      scheduled: true,
      locked: false,
    });
    await pg.query(
      "update nazu_cloud.alert_deliveries set next_attempt_at=now()-interval '1 second' where id=$1",
      [job.id],
    );
    const success = vi.fn(async () => {}) as typeof deliver;
    await next(sql, worker, success);
    const sent = await pg.query<{
      status: string;
      attempts: number;
      delivered: boolean;
    }>(
      "select status,attempts,delivered_at is not null as delivered from nazu_cloud.alert_deliveries where id=$1",
      [job.id],
    );
    expect(sent.rows[0]).toEqual({
      status: "sent",
      attempts: 2,
      delivered: true,
    });
    expect(success).toHaveBeenCalledOnce();
  });
  it("marks an alert failed after five attempts", async () => {
    const [job] = (
      await pg.query<{ id: string }>(
        "insert into nazu_cloud.alert_deliveries(organization_id,channel_id,event,attempts) values($1,$2,'test',4) returning id",
        [org, channel],
      )
    ).rows;
    await next(
      adapter(pg as unknown as Queryable) as unknown as Sql,
      worker,
      async () => {
        throw new Error("simulated");
      },
    );
    const row = await pg.query<{ status: string; attempts: number }>(
      "select status,attempts from nazu_cloud.alert_deliveries where id=$1",
      [job.id],
    );
    expect(row.rows[0]).toEqual({ status: "failed", attempts: 5 });
  });
});
