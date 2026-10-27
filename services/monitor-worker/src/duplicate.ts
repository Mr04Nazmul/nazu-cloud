import type { TransactionSql } from "postgres";

/** A saved slot must not be processed twice or leave the monitor stuck on it. */
export async function advanceDuplicateSlot(
  tx: TransactionSql,
  monitorId: string,
) {
  await tx`update nazu_cloud.rpc_monitors set next_check_at=now()+make_interval(secs=>interval_seconds)+(random()*interval '15 seconds'),lease_until=null,lease_owner=null where id=${monitorId}`;
}
