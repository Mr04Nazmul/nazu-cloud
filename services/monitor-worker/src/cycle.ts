import type { Sql } from "postgres";
import { decryptEndpoint } from "../../../packages/shared/src/endpoint-secret";
import { checkRpc } from "./rpc";
import { advanceDuplicateSlot } from "./duplicate";
export async function runOne(
  sql: Sql,
  worker: string,
  check: typeof checkRpc = checkRpc,
) {
  const claimed = await sql.begin(async (tx) => {
    const rows =
      await tx`select * from nazu_cloud.rpc_monitors where not paused and next_check_at<=now() and (lease_until is null or lease_until<now()) order by next_check_at for update skip locked limit 1`;
    if (!rows[0]) return null;
    const m = rows[0];
    await tx`update nazu_cloud.rpc_monitors set lease_until=now()+interval '60 seconds',lease_owner=${worker} where id=${m.id}`;
    return m;
  });
  if (!claimed) return false;
  const result = await check(
    decryptEndpoint(claimed.endpoint_ciphertext),
    claimed.chain_id,
    claimed.latency_threshold_ms,
    (process.env.RPC_ALLOWED_HOSTS ?? "").split(",").filter(Boolean),
  );
  await sql.begin(async (tx) => {
    const rows =
      await tx`select * from nazu_cloud.rpc_monitors where id=${claimed.id} and lease_owner=${worker} for update`;
    const m = rows[0];
    if (!m) return;
    const [saved] =
      await tx`insert into nazu_cloud.monitor_checks (organization_id,monitor_id,scheduled_at,status,latency_ms,block_number,error_code) values (${m.organization_id},${m.id},${m.next_check_at},${result.status},${result.latency_ms},${result.block_number},${result.error_code}) on conflict (monitor_id,scheduled_at) do nothing returning id`;
    if (!saved) {
      await advanceDuplicateSlot(tx, m.id);
      return;
    }
    const failures = result.status === "down" ? m.consecutive_failures + 1 : 0;
    await tx`update nazu_cloud.rpc_monitors set status=${result.status},consecutive_failures=${failures},last_checked_at=now(),next_check_at=now()+make_interval(secs=>interval_seconds)+(random()*interval '15 seconds'),lease_until=null,lease_owner=null where id=${m.id}`;
    if (failures >= 3) {
      const opened =
        await tx`insert into nazu_cloud.monitor_incidents (organization_id,monitor_id) values (${m.organization_id},${m.id}) on conflict (monitor_id) where resolved_at is null do nothing returning id`;
      if (opened[0])
        await tx`insert into nazu_cloud.alert_deliveries(organization_id,incident_id,channel_id,event) select ${m.organization_id},${opened[0].id},r.channel_id,'down' from nazu_cloud.alert_rules r join nazu_cloud.alert_channels c on c.id=r.channel_id where r.monitor_id=${m.id} and c.verified_at is not null on conflict(incident_id,channel_id,event) do nothing`;
    }
    if (result.status === "healthy" || result.status === "degraded") {
      const recovered =
        await tx`update nazu_cloud.monitor_incidents set resolved_at=now() where monitor_id=${m.id} and resolved_at is null returning id`;
      for (const incident of recovered)
        await tx`insert into nazu_cloud.alert_deliveries(organization_id,incident_id,channel_id,event) select ${m.organization_id},${incident.id},r.channel_id,'recovery' from nazu_cloud.alert_rules r join nazu_cloud.alert_channels c on c.id=r.channel_id where r.monitor_id=${m.id} and c.verified_at is not null on conflict(incident_id,channel_id,event) do nothing`;
    }
    await tx`insert into nazu_cloud.system_settings(key,value) values ('worker_heartbeat',jsonb_build_object('at',now(),'worker',${worker}::text)) on conflict(key) do update set value=excluded.value`;
  });
  return true;
}
