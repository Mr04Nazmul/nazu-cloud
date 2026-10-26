import { obsoleteDowntime } from "./policy";
import { randomUUID } from "node:crypto";
import { db } from "../../../packages/database/src/index";
import { deliver, backoffSeconds } from "./delivery";
const sql = db(),
  worker = randomUUID();
let stopping = false;
process.on("SIGTERM", () => {
  stopping = true;
});
process.on("SIGINT", () => {
  stopping = true;
});
async function next() {
  const job = await sql.begin(async (tx) => {
    const [d] =
      await tx`select d.*,c.kind,c.destination_ciphertext,i.monitor_id,i.resolved_at from nazu_cloud.alert_deliveries d join nazu_cloud.alert_channels c on c.id=d.channel_id left join nazu_cloud.monitor_incidents i on i.id=d.incident_id where d.status='pending' and d.next_attempt_at<=now() and (d.locked_until is null or d.locked_until<now()) and c.verified_at is not null order by d.next_attempt_at for update of d skip locked limit 1`;
    if (!d) return null;
    if (obsoleteDowntime(d.event, d.resolved_at)) {
      await tx`update nazu_cloud.alert_deliveries set status='failed' where id=${d.id}`;
      return null;
    }
    await tx`select id from nazu_cloud.alert_channels where id=${d.channel_id} for update`;
    const [busy] =
      await tx`select id from nazu_cloud.alert_deliveries where channel_id=${d.channel_id} and id<>${d.id} and locked_until>now() and status='pending' limit 1`;
    if (busy) return null;
    if (d.event === "down") {
      const [recent] =
        await tx`select max(other.delivered_at) as delivered_at,max(r.cooldown_seconds)::int as cooldown_seconds from nazu_cloud.alert_deliveries other join nazu_cloud.monitor_incidents i on i.id=other.incident_id join nazu_cloud.alert_rules r on r.channel_id=other.channel_id and r.monitor_id=i.monitor_id where other.channel_id=${d.channel_id} and i.monitor_id=${d.monitor_id} and other.event='down' and other.status='sent' and other.delivered_at>now()-make_interval(secs=>r.cooldown_seconds)`;
      if (recent?.delivered_at) {
        await tx`update nazu_cloud.alert_deliveries set next_attempt_at=${recent.delivered_at}::timestamptz+make_interval(secs=>${recent.cooldown_seconds}) where id=${d.id}`;
        return null;
      }
    }

    await tx`update nazu_cloud.alert_deliveries set locked_until=now()+interval '30 seconds',lease_owner=${worker} where id=${d.id}`;
    return d;
  });
  if (!job) return;
  try {
    await deliver(
      job.kind,
      job.destination_ciphertext,
      job.event,
      job.monitor_id ?? "test",
    );
    await sql`update nazu_cloud.alert_deliveries set status='sent',delivered_at=now(),attempts=attempts+1,locked_until=null,lease_owner=null where id=${job.id} and lease_owner=${worker}`;
  } catch {
    const attempts = job.attempts + 1;
    await sql`update nazu_cloud.alert_deliveries set status=${attempts >= 5 ? "failed" : "pending"},attempts=${attempts},next_attempt_at=now()+make_interval(secs=>${backoffSeconds(attempts)}),locked_until=null,lease_owner=null where id=${job.id} and lease_owner=${worker}`;
  }
}
try {
  while (!stopping) {
    const results = await Promise.allSettled([next(), next()]);
    await sql`insert into nazu_cloud.system_settings(key,value) values ('alert_worker_heartbeat',jsonb_build_object('at',now(),'worker',${worker}::text)) on conflict(key) do update set value=excluded.value`;
    if (results.some((r) => r.status === "rejected"))
      console.error("Alert queue unavailable");
    await new Promise((resolve) => setTimeout(resolve, 5000));
  }
} finally {
  await sql.end({ timeout: 5 });
}
