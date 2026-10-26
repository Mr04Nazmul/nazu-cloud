import {
  TeamPanel,
  AlertsPanel,
  UsagePanel,
} from "../../../components/management";
import { MonitorDetail } from "../../../components/monitor-detail";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Brand } from "../../../components/header";
import { ResourceForm, RevokeKey } from "../../../components/resource-form";
import { userId } from "../../../lib/auth";
import { db } from "../../../../../packages/database/src/index";
export const dynamic = "force-dynamic";
const sections = [
  "Overview",
  "Projects",
  "Monitors",
  "Incidents",
  "Alerts",
  "API Keys",
  "API Usage",
  "Wallet Auth",
  "Team",
  "Billing",
  "Settings",
  "Audit Logs",
];
export default async function Dashboard({
  params,
}: {
  params: Promise<{ section?: string[] }>;
}) {
  const { section = [] } = await params;
  const slug = section[0] ?? "";
  const configured = Boolean(
    process.env.DATABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_URL,
  );
  if (!configured)
    return (
      <main id="main" className="page-content">
        <Brand />
        <h1>Workspace setup required</h1>
        <p>
          The dashboard is connected to real data only. Authentication and
          database credentials have not been configured in this environment.
        </p>
        <div className="notice">
          No project counts, uptime figures, incidents or customer activity are
          fabricated.
        </div>
        <Link className="button" href="/docs">
          Deployment checklist
        </Link>
      </main>
    );
  let uid: string;
  try {
    uid = await userId();
  } catch {
    redirect("/login");
  }
  const sql = db();
  const orgs = await sql<
    { id: string; name: string; role: string }[]
  >`select o.id,o.name,m.role from nazu_cloud.organizations o join nazu_cloud.organization_members m on m.organization_id=o.id where m.user_id=${uid}`;
  const projects = await sql<
    { id: string; name: string; organization_id: string }[]
  >`select p.id,p.name,p.organization_id from nazu_cloud.projects p join nazu_cloud.organization_members m on m.organization_id=p.organization_id where m.user_id=${uid} order by p.created_at desc limit 100`;
  const monitors =
    await sql`select r.id,r.name,r.organization_id,r.chain_id,case when r.paused then 'paused' when r.last_checked_at is null or r.last_checked_at<now()-make_interval(secs=>r.interval_seconds*2) then 'unknown' else r.status end as status,r.last_checked_at from nazu_cloud.rpc_monitors r join nazu_cloud.organization_members m on m.organization_id=r.organization_id where m.user_id=${uid} order by r.created_at desc limit 100`;
  const title =
    sections.find((s) => s.toLowerCase().replaceAll(" ", "-") === slug) ??
    (slug ? "Resource" : "Overview");
  const manageable = orgs.filter((o) => ["owner", "admin"].includes(o.role));
  return (
    <main id="main" className="app-shell">
      <aside className="app-sidebar">
        <Brand />
        <nav aria-label="Workspace">
          {sections.map((s, i) => (
            <Link
              key={s}
              href={
                "/dashboard" +
                (i ? "/" + s.toLowerCase().replaceAll(" ", "-") : "")
              }
            >
              {s}
            </Link>
          ))}
        </nav>
      </aside>
      <div className="app-content">
        <div className="app-top">
          <span>Workspace / {title}</span>
          <form action="/auth/logout" method="post">
            <button className="button small">Sign out</button>
          </form>
        </div>
        <h1>{title}</h1>
        <p>Infrastructure visibility, backed by actual observations.</p>
        {!orgs.length && (
          <>
            <div className="empty">
              <h2>Your first workspace starts here.</h2>
              <p>
                Create an organization, then add a project and an approved
                endpoint.
              </p>
            </div>
            <ResourceForm kind="organization" />
          </>
        )}
        {slug === "" && (
          <>
            <div className="grid">
              {[
                ["Projects", projects.length],
                ["Monitors", monitors.length],
                [
                  "Healthy endpoints",
                  monitors.filter((m) => m.status === "healthy").length,
                ],
                [
                  "Unhealthy endpoints",
                  monitors.filter((m) => m.status === "down").length,
                ],
                ["Average RPC latency", "Unavailable"],
                ["Plan", "Free"],
              ].map(([label, value]) => (
                <div className="data-card" key={label}>
                  <span>{label}</span>
                  <strong>{value}</strong>
                </div>
              ))}
            </div>
            <div className="notice">
              Observations are collected by the independently deployed worker.
              Missing observations are unknown.
            </div>
            <Link href="/dashboard/monitors" className="button">
              Manage monitors
            </Link>
          </>
        )}
        {slug === "projects" && (
          <>
            <ResourceForm
              kind="project"
              organizations={
                orgs.filter((o) => o.role !== "readonly") as {
                  id: string;
                  name: string;
                }[]
              }
            />
            <div className="data-list">
              {projects.map((p) => (
                <Link
                  className="data-row"
                  key={p.id}
                  href={"/dashboard/projects/" + p.id}
                >
                  <b>{p.name}</b>
                  <code>{p.id}</code>
                </Link>
              ))}
            </div>
          </>
        )}
        {slug === "monitors" && (
          <>
            <ResourceForm
              kind="monitor"
              projects={projects as { id: string; name: string }[]}
            />
            <div className="data-list">
              {monitors.map((m) => (
                <Link
                  className="data-row"
                  key={m.id}
                  href={"/dashboard/monitors/" + m.id}
                >
                  <b>{m.name}</b>
                  <span>{m.status}</span>
                  <span>
                    {m.last_checked_at
                      ? new Date(m.last_checked_at).toISOString()
                      : "No checks yet"}
                  </span>
                </Link>
              ))}
            </div>
            {section[1] && <MonitorDetail id={section[1]} userId={uid} />}
          </>
        )}
        {slug === "api-keys" && (
          <>
            <ResourceForm
              kind="key"
              projects={
                projects.filter((p) =>
                  manageable.some((o) => o.id === p.organization_id),
                ) as { id: string; name: string }[]
              }
            />
            {await (async () => {
              const keys =
                await sql`select k.id,k.project_id,k.prefix,k.revoked_at from nazu_cloud.api_keys k join nazu_cloud.organization_members m on m.organization_id=k.organization_id where m.user_id=${uid} and m.role in ('owner','admin') order by k.created_at desc limit 100`;
              return (
                <div className="data-list">
                  {keys.map((k) => (
                    <div className="data-row" key={k.id}>
                      <code>{k.prefix}…</code>
                      {k.revoked_at ? (
                        <span>Revoked</span>
                      ) : (
                        <RevokeKey id={k.id} projectId={k.project_id} />
                      )}
                    </div>
                  ))}
                </div>
              );
            })()}
          </>
        )}
        {slug === "incidents" &&
          (await (async () => {
            const rows =
              await sql`select i.id,i.monitor_id,i.opened_at,i.resolved_at from nazu_cloud.monitor_incidents i join nazu_cloud.organization_members m on m.organization_id=i.organization_id where m.user_id=${uid} order by i.opened_at desc limit 100`;
            return rows.length ? (
              <div className="data-list">
                {rows.map((i) => (
                  <div className="data-row" key={i.id}>
                    <code>{i.monitor_id}</code>
                    <span>{i.resolved_at ? "Resolved" : "Open"}</span>
                    <span>{new Date(i.opened_at).toISOString()}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty">No incidents recorded.</div>
            );
          })())}
        {slug === "audit-logs" &&
          (await (async () => {
            const rows =
              await sql`select a.id,a.action,a.created_at from nazu_cloud.audit_logs a join nazu_cloud.organization_members m on m.organization_id=a.organization_id where m.user_id=${uid} and m.role in ('owner','admin') order by a.created_at desc limit 100`;
            return (
              <div className="data-list">
                {rows.map((a) => (
                  <div className="data-row" key={a.id}>
                    <span>{a.action}</span>
                    <span>{new Date(a.created_at).toISOString()}</span>
                  </div>
                ))}
              </div>
            );
          })())}
        {slug === "team" && <TeamPanel organizations={orgs} />}
        {slug === "alerts" && (
          <AlertsPanel
            organizations={orgs}
            monitors={monitors.map((m) => ({
              id: String(m.id),
              name: String(m.name),
              organization_id: String(m.organization_id),
            }))}
          />
        )}
        {slug === "api-usage" && <UsagePanel projects={projects} />}
        {["wallet-auth", "billing", "settings"].includes(slug) && (
          <div className="empty">
            <h2>{title} is in development.</h2>
            <p>
              {slug === "billing"
                ? "Live checkout and paid entitlements are disabled."
                : slug === "alerts"
                  ? "Email and Discord delivery have not been enabled."
                  : "This management interface is not implemented yet. See the implementation progress document for release gates."}
            </p>
            <Link href="/docs" className="button">
              View documentation
            </Link>
          </div>
        )}
      </div>
    </main>
  );
}
