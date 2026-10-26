import { adminAllowed } from "../../../../../packages/shared/src/access-policy";
import { notFound } from "next/navigation";
import Link from "next/link";
import { supabase } from "../../../lib/auth";
import { db } from "../../../../../packages/database/src/index";
export const dynamic = "force-dynamic";
const sections = [
  "Overview",
  "Customers",
  "Organizations",
  "Usage",
  "Monitors",
  "Incidents",
  "Billing",
  "System Health",
  "Audit Logs",
];
export default async function Admin({
  params,
}: {
  params: Promise<{ section?: string[] }>;
}) {
  let allowed = false;
  try {
    const client = await supabase();
    const { data } = await client.auth.getUser();
    if (
      data.user &&
      (process.env.ADMIN_USER_IDS ?? "").split(",").includes(data.user.id) &&
      data.user.app_metadata?.nazu_admin === true
    ) {
      const assurance = await client.auth.mfa.getAuthenticatorAssuranceLevel();
      allowed =
        !assurance.error &&
        adminAllowed(
          data.user.id,
          data.user.app_metadata,
          (process.env.ADMIN_USER_IDS ?? "").split(","),
          assurance.data.currentLevel,
        );
    }
  } catch {
    notFound();
  }
  if (!allowed) notFound();
  const slug = (await params).section?.[0] ?? "";
  const selected =
    sections.find((s) => s.toLowerCase().replaceAll(" ", "-") === slug) ??
    (!slug ? "Overview" : null);
  if (!selected) notFound();
  const sql = db();
  const [counts] =
    await sql`select (select count(*)::int from nazu_cloud.organizations) as organizations,(select count(*)::int from nazu_cloud.billing_customers) as billing_customers,(select count(*)::int from nazu_cloud.rpc_monitors where not paused) as active_monitors,(select count(*)::int from nazu_cloud.monitor_incidents where resolved_at is null) as open_incidents,(select count(*)::int from nazu_cloud.alert_deliveries where status='failed') as failed_alerts,(select count(*)::int from nazu_cloud.api_usage_events where created_at>now()-interval '24 hours') as api_requests_24h`;
  const heartbeat =
    await sql`select key,value from nazu_cloud.system_settings where key in ('worker_heartbeat','alert_worker_heartbeat')`;
  return (
    <main id="main" className="app-shell">
      <aside className="app-sidebar">
        <h2>NAZU Operations</h2>
        <nav>
          {sections.map((s, i) => (
            <Link
              key={s}
              href={
                "/admin" + (i ? "/" + s.toLowerCase().replaceAll(" ", "-") : "")
              }
            >
              {s}
            </Link>
          ))}
        </nav>
      </aside>
      <div className="app-content">
        <span className="eyebrow">
          SERVER-AUTHORIZED · MFA REQUIRED · READ ONLY
        </span>
        <h1>{selected}</h1>
        <div className="grid">
          {Object.entries(counts).map(([key, value]) => (
            <div className="data-card" key={key}>
              <span>{key.replaceAll("_", " ")}</span>
              <strong>{String(value)}</strong>
            </div>
          ))}
        </div>
        {slug === "organizations" &&
          (await (async () => {
            const rows =
              await sql`select id,name,created_at from nazu_cloud.organizations order by created_at desc limit 100`;
            return (
              <div className="data-list">
                {rows.map((o) => (
                  <div key={o.id} className="data-row">
                    <span>{o.name}</span>
                    <code>{o.id}</code>
                    <span>{new Date(o.created_at).toISOString()}</span>
                  </div>
                ))}
              </div>
            );
          })())}
        {slug === "audit-logs" &&
          (await (async () => {
            const rows =
              await sql`select id,organization_id,action,created_at from nazu_cloud.audit_logs order by created_at desc limit 100`;
            return (
              <div className="data-list">
                {rows.map((o) => (
                  <div key={o.id} className="data-row">
                    <code>{o.organization_id}</code>
                    <span>{o.action}</span>
                    <span>{new Date(o.created_at).toISOString()}</span>
                  </div>
                ))}
              </div>
            );
          })())}
        {slug === "system-health" && (
          <>
            <h2>Observed worker heartbeats</h2>
            {heartbeat.length ? (
              heartbeat.map((h) => {
                const at = h.value?.at as string | undefined;
                const age = at ? Date.now() - Date.parse(at) : null;
                return (
                  <div className="data-row" key={h.key}>
                    <b>{h.key}</b>
                    <span>
                      {age === null
                        ? "Unknown"
                        : age > 30000
                          ? "Stale / investigate"
                          : "Recently observed"}
                    </span>
                    <span>{at ?? "Unavailable"}</span>
                  </div>
                );
              })
            ) : (
              <div className="empty">
                No worker heartbeat observations. Health is unknown.
              </div>
            )}
          </>
        )}
        {slug === "billing" && (
          <div className="notice">
            Live billing is disabled. A billing-customer row does not establish
            active payment or revenue.
          </div>
        )}
        <div className="notice">
          Counts come from database records. No privileged mutation controls are
          exposed. Global maintenance notices, feature flags and abuse-review
          actions remain pending a dedicated audited admin workflow. This
          console has not been tested against configured Supabase MFA yet.
        </div>
      </div>
    </main>
  );
}
