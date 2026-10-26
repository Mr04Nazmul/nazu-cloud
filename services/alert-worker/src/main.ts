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
      await tx`select d.*,c.kind,c.destination_ciphertext,i.monitor_id from nazu_cloud.alert_deliveries d join nazu_cloud.alert_channels c on c.id=d.channel_id left join nazu_cloud.monitor_incidents i on i.id=d.incident_id where d.status='pending' and d.next_attempt_at<=now() and (d.locked_until is null or d.locked_until<now()) and c.verified_at is not null order by d.next_attempt_at for update of d skip locked limit 1`;
    if (!d) return null;
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
    if (results.some((r) => r.status === "rejected"))
      console.error("Alert queue unavailable");
    await new Promise((resolve) => setTimeout(resolve, 5000));
  }
} finally {
  await sql.end({ timeout: 5 });
}
