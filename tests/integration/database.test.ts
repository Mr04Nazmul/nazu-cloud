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
  for (const name of readdirSync("supabase/migrations")
    .filter((x) => x.endsWith(".sql"))
    .sort())
    await db.exec(readFileSync("supabase/migrations/" + name, "utf8"));
  await db.query(
    "insert into nazu_cloud.organizations(id,name) values ($1,'Org A'),($2,'Org B')",
    [orgA, orgB],
  );
  await db.query(
    "insert into nazu_cloud.projects(id,organization_id,name) values($1,$2,'Project')",
    [project, orgA],
  );
  await db.query(
    "insert into nazu_cloud.rpc_monitors(id,organization_id,project_id,name,endpoint_ciphertext,chain_id) values($1,$2,$3,'RPC','encrypted-staging-fixture-not-a-url',1)",
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
        "insert into nazu_cloud.rpc_monitors(organization_id,project_id,name,endpoint_ciphertext,chain_id) values ($1,$2,'cross tenant','encrypted-staging-fixture-not-a-url',1)",
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

it("uses persisted delivery timestamps to honor per-monitor downtime cooldown", async () => {
  const channel = "00000000-0000-4000-8000-000000000021";
  await db.query(
    "insert into nazu_cloud.alert_channels(id,organization_id,kind,destination_ciphertext,verified_at) values($1,$2,'discord','encrypted-fixture',now())",
    [channel, orgA],
  );
  await db.query(
    "insert into nazu_cloud.alert_rules(organization_id,monitor_id,channel_id,cooldown_seconds) values($1,$2,$3,900)",
    [orgA, monitor, channel],
  );
  const incident = await db.query<{ id: string }>(
    "select id from nazu_cloud.monitor_incidents where monitor_id=$1 order by opened_at limit 1",
    [monitor],
  );
  await db.query(
    "insert into nazu_cloud.alert_deliveries(organization_id,incident_id,channel_id,event,status,delivered_at) values($1,$2,$3,'down','sent',now()-interval '60 seconds')",
    [orgA, incident.rows[0].id, channel],
  );
  const recent = await db.query<{
    cooldown_seconds: number;
    delivered_at: string;
  }>(
    "select max(other.delivered_at) as delivered_at,max(r.cooldown_seconds)::int as cooldown_seconds from nazu_cloud.alert_deliveries other join nazu_cloud.monitor_incidents i on i.id=other.incident_id join nazu_cloud.alert_rules r on r.channel_id=other.channel_id and r.monitor_id=i.monitor_id where other.channel_id=$1 and i.monitor_id=$2 and other.event='down' and other.status='sent' and other.delivered_at>now()-make_interval(secs=>r.cooldown_seconds)",
    [channel, monitor],
  );
  expect(recent.rows[0].cooldown_seconds).toBe(900);
  expect(recent.rows[0].delivered_at).not.toBeNull();
});
