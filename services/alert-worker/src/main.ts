import { randomUUID } from "node:crypto";
import { db } from "../../../packages/database/src/index";
import { next } from "./cycle";
const sql = db(),
  worker = randomUUID();
let stopping = false;
process.on("SIGTERM", () => {
  stopping = true;
});
process.on("SIGINT", () => {
  stopping = true;
});

try {
  while (!stopping) {
    const results = await Promise.allSettled([
      next(sql, worker),
      next(sql, worker),
    ]);
    await sql`insert into nazu_cloud.system_settings(key,value) values ('alert_worker_heartbeat',jsonb_build_object('at',now(),'worker',${worker}::text)) on conflict(key) do update set value=excluded.value`;
    if (results.some((r) => r.status === "rejected"))
      console.error("Alert queue unavailable");
    await new Promise((resolve) => setTimeout(resolve, 5000));
  }
} finally {
  await sql.end({ timeout: 5 });
}
