import { randomUUID } from "node:crypto";
import { db } from "../../../packages/database/src/index";
import { runOne } from "./cycle";
const sql = db();
const worker = randomUUID();
let stopping = false;
process.on("SIGTERM", () => {
  stopping = true;
});
process.on("SIGINT", () => {
  stopping = true;
});

try {
  while (!stopping) {
    const batch = await Promise.allSettled(
      Array.from({ length: 4 }, () => runOne(sql, worker)),
    );
    await sql`insert into nazu_cloud.system_settings(key,value) values ('worker_heartbeat',jsonb_build_object('at',now(),'worker',${worker}::text)) on conflict(key) do update set value=excluded.value`;
    if (batch.some((r) => r.status === "rejected"))
      console.error("Worker cycle failed; retrying after backoff");
    await new Promise((r) => setTimeout(r, 5000));
  }
} finally {
  await sql.end({ timeout: 5 });
}
