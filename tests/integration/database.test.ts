import { PGlite } from "@electric-sql/pglite";
import { readFileSync, readdirSync } from "node:fs";
import { beforeAll, afterAll, describe, it, expect } from "vitest";
let db: PGlite;
const orgA = "00000000-0000-4000-8000-000000000001",
  orgB = "00000000-0000-4000-8000-000000000002",
  project = "00000000-0000-4000-8000-000000000003",
  monitor = "00000000-0000-4000-8000-000000000004";
beforeAll(async () => {
  db = new PGlite();
  await db.exec(
    "create role anon;create role authenticated;create schema auth;create table auth.users(id uuid primary key);",
  );
  const path =
    "supabase/migrations/" +
    readdirSync("supabase/migrations").find((x) => x.endsWith(".sql"));
  await db.exec(readFileSync(path, "utf8"));
  await db.query(
    "insert into nazu_cloud.organizations(id,name) values ($1,'Org A'),($2,'Org B')",
    [orgA, orgB],
  );
  await db.query(
    "insert into nazu_cloud.projects(id,organization_id,name) values($1,$2,'Project')",
    [project, orgA],
  );
  await db.query(
    "insert into nazu_cloud.rpc_monitors(id,organization_id,project_id,name,endpoint,chain_id) values($1,$2,$3,'RPC','https://rpc.example',1)",
    [monitor, orgA, project],
  );
});
afterAll(async () => db.close());
describe("migration and tenant constraints", () => {
  it("enables RLS on every cloud table", async () => {
    const r = await db.query<{ relrowsecurity: boolean }>(
      "select relrowsecurity from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname='nazu_cloud' and relkind='r'",
    );
    expect(r.rows.length).toBeGreaterThanOrEqual(19);
    expect(r.rows.every((x) => x.relrowsecurity)).toBe(true);
  });
  it("denies direct browser access", async () => {
    await db.exec("set role authenticated");
    try {
      await expect(
        db.query("select * from nazu_cloud.projects"),
      ).rejects.toThrow(/permission denied/);
    } finally {
      await db.exec("reset role");
    }
  });
  it("rejects a monitor assigned to another organization project", async () => {
    await expect(
      db.query(
        "insert into nazu_cloud.rpc_monitors(organization_id,project_id,name,endpoint,chain_id) values ($1,$2,'cross tenant','https://rpc.example',1)",
        [orgB, project],
      ),
    ).rejects.toThrow(/foreign key/);
  });
  it("deduplicates checks by scheduled slot", async () => {
    const q =
      "insert into nazu_cloud.monitor_checks(organization_id,monitor_id,scheduled_at,status) values($1,$2,'2026-10-26T00:00:00Z','down') on conflict(monitor_id,scheduled_at) do nothing returning id";
    const a = await db.query(q, [orgA, monitor]),
      b = await db.query(q, [orgA, monitor]);
    expect(a.rows).toHaveLength(1);
    expect(b.rows).toHaveLength(0);
  });
  it("deduplicates open incidents and permits a new one after recovery", async () => {
    const q =
      "insert into nazu_cloud.monitor_incidents(organization_id,monitor_id) values($1,$2) on conflict(monitor_id) where resolved_at is null do nothing returning id";
    expect((await db.query(q, [orgA, monitor])).rows).toHaveLength(1);
    expect((await db.query(q, [orgA, monitor])).rows).toHaveLength(0);
    await db.query(
      "update nazu_cloud.monitor_incidents set resolved_at=now() where monitor_id=$1",
      [monitor],
    );
    expect((await db.query(q, [orgA, monitor])).rows).toHaveLength(1);
  });
  it("consumes a challenge at most once", async () => {
    await db.query(
      "insert into nazu_cloud.wallet_challenges(organization_id,project_id,address,chain_id,origin,message,nonce,issued_at,expires_at) values($1,$2,'0xabc',1,'https://example.com','fixture','unique-nonce',now(),now()+interval '5 minutes')",
      [orgA, project],
    );
    const q =
      "update nazu_cloud.wallet_challenges set used_at=now() where nonce='unique-nonce' and used_at is null and expires_at>now() returning id";
    const outcomes = await Promise.all([db.query(q), db.query(q)]);
    expect(outcomes.reduce((n, r) => n + r.rows.length, 0)).toBe(1);
  });
  it("does not consume expired challenges", async () => {
    await db.query(
      "insert into nazu_cloud.wallet_challenges(organization_id,project_id,address,chain_id,origin,message,nonce,issued_at,expires_at) values($1,$2,'0xabc',1,'https://example.com','fixture','expired',now()-interval '2 hours',now()-interval '1 hour')",
      [orgA, project],
    );
    expect(
      (
        await db.query(
          "update nazu_cloud.wallet_challenges set used_at=now() where nonce='expired' and used_at is null and expires_at>now() returning id",
        )
      ).rows,
    ).toHaveLength(0);
  });
});
