import { z } from "zod";
import { db } from "../../../packages/database/src/index";
import { metrics, type Health } from "../../../packages/shared/src/index";
export async function MonitorDetail({
  id,
  userId,
}: {
  id: string;
  userId: string;
}) {
  if (!z.uuid().safeParse(id).success)
    return <div className="notice">Monitor not found.</div>;
  const sql = db();
  const [monitor] =
    await sql`select r.id,r.name,r.chain_id,r.status,r.paused,r.interval_seconds,r.created_at,r.last_checked_at from nazu_cloud.rpc_monitors r join nazu_cloud.organization_members m on m.organization_id=r.organization_id where r.id=${id} and m.user_id=${userId}`;
  if (!monitor)
    return <div className="notice">Monitor not found or inaccessible.</div>;
  const checks = await sql<
    {
      status: Health;
      latency_ms: number | null;
      checked_at: Date;
      error_code: string | null;
    }[]
  >`select status,latency_ms,checked_at,error_code from nazu_cloud.monitor_checks where monitor_id=${id} and checked_at>=now()-interval '24 hours' order by checked_at asc limit 1000`;
  const incidents =
    await sql`select id,opened_at,resolved_at from nazu_cloud.monitor_incidents where monitor_id=${id} order by opened_at desc limit 100`;
  const channels =
    await sql`select c.id,c.kind,c.verified_at from nazu_cloud.alert_channels c join nazu_cloud.alert_rules r on r.channel_id=c.id where r.monitor_id=${id}`;
  const total = Math.floor(
    Math.min(
      86400,
      (Date.now() - new Date(monitor.created_at).getTime()) / 1000,
    ) / monitor.interval_seconds,
  );
  const data = metrics(checks, total);
  const latest = checks.at(-1);
  const lastSuccess = checks.findLast(
    (c) => c.status === "healthy" || c.status === "degraded",
  );
  const stale =
    !monitor.last_checked_at ||
    Date.now() - new Date(monitor.last_checked_at).getTime() >
      monitor.interval_seconds * 2000;
  const status = monitor.paused ? "paused" : stale ? "unknown" : monitor.status;
  const max = Math.max(1, ...checks.map((c) => c.latency_ms ?? 0));
  const x = (i: number) => 10 + (i * 780) / Math.max(1, checks.length - 1);
  const y = (v: number) => 140 - (v * 120) / max;
  return (
    <section className="form-panel" style={{ maxWidth: "100%" }}>
      <span className="eyebrow">ACTUAL MONITOR OBSERVATIONS</span>
      <h2>{monitor.name}</h2>
      <p>
        Chain {monitor.chain_id} · Status: {status} · {monitor.interval_seconds}
        s interval · Region: {process.env.MONITOR_REGION || "Not configured"}
      </p>
      <div className="grid">
        {[
          [
            "Latest latency",
            latest?.latency_ms === null || latest?.latency_ms === undefined
              ? "Unavailable"
              : latest.latency_ms + " ms",
          ],
          [
            "Observed availability",
            data.availability === null
              ? "Unavailable"
              : (data.availability * 100).toFixed(2) + "%",
          ],
          [
            "Monitoring coverage",
            data.coverage === null
              ? "Unavailable"
              : (data.coverage * 100).toFixed(2) + "%",
          ],
        ].map(([label, value]) => (
          <div key={label} className="data-card">
            <span>{label}</span>
            <strong>{value}</strong>
          </div>
        ))}
      </div>
      <p>
        Last successful check:{" "}
        {lastSuccess
          ? new Date(lastSuccess.checked_at).toISOString()
          : "Unavailable"}
        <br />
        Missing estimated slots: {data.missingChecks}. Coverage is an interval
        estimate; paused periods and scheduling jitter are not reconstructed
        yet.
      </p>
      <h3>Response latency · last 24 hours</h3>
      {checks.length ? (
        <svg
          viewBox="0 0 800 160"
          role="img"
          aria-label="Observed RPC latency. Gaps represent missing or failed checks."
          style={{ width: "100%", height: 160 }}
        >
          {checks.map((c, i) => {
            const prev = checks[i - 1];
            if (
              !prev ||
              prev.latency_ms === null ||
              c.latency_ms === null ||
              new Date(c.checked_at).getTime() -
                new Date(prev.checked_at).getTime() >
                monitor.interval_seconds * 2000
            )
              return null;
            return (
              <line
                key={i}
                x1={x(i - 1)}
                y1={y(prev.latency_ms)}
                x2={x(i)}
                y2={y(c.latency_ms)}
                stroke="#90a6ff"
                strokeWidth="2"
              />
            );
          })}
        </svg>
      ) : (
        <div className="empty">
          No observed checks yet. Start the monitoring worker.
        </div>
      )}
      <h3>Recent check history</h3>
      <div style={{ display: "flex", gap: 3, flexWrap: "wrap" }}>
        {checks.slice(-100).map((c, i) => (
          <span
            key={i}
            title={new Date(c.checked_at).toISOString() + " · " + c.status}
            style={{
              width: 6,
              height: 18,
              borderRadius: 2,
              background:
                c.status === "healthy"
                  ? "#4fb59b"
                  : c.status === "down"
                    ? "#ee8c91"
                    : "#a89be0",
            }}
          />
        ))}
      </div>
      <h3>Incident timeline</h3>
      {incidents.length ? (
        incidents.map((i) => (
          <div className="data-row" key={i.id}>
            <span>Opened {new Date(i.opened_at).toISOString()}</span>
            <span>
              {i.resolved_at
                ? "Recovered " + new Date(i.resolved_at).toISOString()
                : "Open"}
            </span>
          </div>
        ))
      ) : (
        <p>No incidents recorded.</p>
      )}
      <h3>Recent RPC errors</h3>
      {checks
        .filter((c) => c.error_code)
        .slice(-10)
        .map((c, i) => (
          <div className="data-row" key={i}>
            <code>{c.error_code}</code>
            <span>{new Date(c.checked_at).toISOString()}</span>
          </div>
        ))}
      <h3>Configured alert channels</h3>
      {channels.length ? (
        channels.map((c) => (
          <p key={c.id}>
            {c.kind} ·{" "}
            {c.verified_at
              ? "Operator verified"
              : "Awaiting ownership verification"}
          </p>
        ))
      ) : (
        <p>No alert channels assigned.</p>
      )}
    </section>
  );
}
