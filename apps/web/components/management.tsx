"use client";
import { useState, useEffect } from "react";
type Organization = { id: string; name: string; role: string };
type Monitor = { id: string; name: string; organization_id: string };
async function api(path: string, method = "GET", payload?: unknown) {
  const r = await fetch("/v1/" + path, {
    method,
    headers: { "Content-Type": "application/json" },
    body: payload ? JSON.stringify(payload) : undefined,
  });
  const v = r.status === 204 ? {} : await r.json();
  if (!r.ok) throw new Error(v.error?.message ?? "Request failed");
  return v.data;
}
export function TeamPanel({
  organizations,
}: {
  organizations: Organization[];
}) {
  const [org, setOrg] = useState(organizations[0]?.id ?? ""),
    [members, setMembers] = useState<{ user_id: string; role: string }[]>([]),
    [status, setStatus] = useState("");
  const selected = organizations.find((o) => o.id === org),
    manage = ["owner", "admin"].includes(selected?.role ?? "");
  async function refresh() {
    try {
      setMembers(
        await api("organizations/current/members?organizationId=" + org),
      );
    } catch (e) {
      setStatus(String(e));
    }
  }
  useEffect(() => {
    if (org) {
      api("organizations/current/members?organizationId=" + org)
        .then(setMembers)
        .catch((e) => setStatus(String(e)));
    }
  }, [org]);
  async function change(id: string, role: string | undefined) {
    try {
      await api(
        "organizations/current/members/" + id,
        role ? "PATCH" : "DELETE",
        { organizationId: org, role },
      );
      await refresh();
      setStatus("Member updated.");
    } catch (e) {
      setStatus(String(e));
    }
  }
  return (
    <section>
      <label className="field">
        Organization
        <select value={org} onChange={(e) => setOrg(e.target.value)}>
          {organizations.map((o) => (
            <option key={o.id} value={o.id}>
              {o.name}
            </option>
          ))}
        </select>
      </label>
      <div className="notice">
        Free organizations have one seat. Paid team entitlements are disabled.
        Owners and your own role cannot be changed here. No email invitations
        are sent.
      </div>
      {members.map((m) => (
        <div className="data-row" key={m.user_id}>
          <code>{m.user_id}</code>
          <span>{m.role}</span>
          {manage && m.role !== "owner" && (
            <>
              <select
                aria-label={"Role for " + m.user_id}
                value={m.role}
                onChange={(e) => change(m.user_id, e.target.value)}
              >
                <option>readonly</option>
                <option>developer</option>
                {selected?.role === "owner" && <option>admin</option>}
              </select>
              <button
                className="button small"
                onClick={() => change(m.user_id, undefined)}
              >
                Remove
              </button>
            </>
          )}
        </div>
      ))}
      {manage && (
        <form
          className="form-panel"
          onSubmit={async (e) => {
            e.preventDefault();
            const f = new FormData(e.currentTarget);
            try {
              await api("organizations/current/members", "POST", {
                organizationId: org,
                userId: f.get("userId"),
                role: f.get("role"),
              });
              await refresh();
              setStatus("Member added.");
            } catch (err) {
              setStatus(String(err));
            }
          }}
        >
          <h2>Add a registered developer</h2>
          <label className="field">
            Existing user ID
            <input name="userId" required />
          </label>
          <label className="field">
            Role
            <select name="role">
              <option>readonly</option>
              <option>developer</option>
              {selected?.role === "owner" && <option>admin</option>}
            </select>
          </label>
          <button className="button">Add member</button>
        </form>
      )}
      <p role="status">{status}</p>
    </section>
  );
}
export function AlertsPanel({
  organizations,
  monitors,
}: {
  organizations: Organization[];
  monitors: Monitor[];
}) {
  const [org, setOrg] = useState(organizations[0]?.id ?? ""),
    [channels, setChannels] = useState<
      { id: string; kind: string; verified_at: string | null }[]
    >([]),
    [rules, setRules] = useState<
      {
        id: string;
        monitor_id: string;
        channel_id: string;
        cooldown_seconds: number;
      }[]
    >([]),
    [deliveries, setDeliveries] = useState<
      { id: string; event: string; status: string; attempts: number }[]
    >([]),
    [status, setStatus] = useState("");
  const manage = ["owner", "admin"].includes(
    organizations.find((o) => o.id === org)?.role ?? "",
  );
  async function load() {
    const [a, b, c] = await Promise.all([
      api("alert-channels?organizationId=" + org),
      api("alert-rules?organizationId=" + org),
      api("alert-deliveries?organizationId=" + org),
    ]);
    setChannels(a);
    setRules(b);
    setDeliveries(c);
  }
  useEffect(() => {
    if (org)
      Promise.all([
        api("alert-channels?organizationId=" + org),
        api("alert-rules?organizationId=" + org),
        api("alert-deliveries?organizationId=" + org),
      ])
        .then(([a, b, c]) => {
          setChannels(a);
          setRules(b);
          setDeliveries(c);
        })
        .catch((e) => setStatus(String(e)));
  }, [org]);
  return (
    <section>
      <label className="field">
        Organization
        <select value={org} onChange={(e) => setOrg(e.target.value)}>
          {organizations.map((o) => (
            <option key={o.id} value={o.id}>
              {o.name}
            </option>
          ))}
        </select>
      </label>
      <div className="notice">
        Channels start unverified. An operator must confirm recipient ownership
        before delivery. A queued notification is not proof of delivery.
      </div>
      {manage && (
        <form
          className="form-panel"
          onSubmit={async (e) => {
            e.preventDefault();
            const form = e.currentTarget,
              f = new FormData(form);
            try {
              await api("alert-channels", "POST", {
                organizationId: org,
                kind: f.get("kind"),
                destination: f.get("destination"),
              });
              form.reset();
              await load();
              setStatus("Channel created; ownership verification required.");
            } catch (err) {
              setStatus(String(err));
            }
          }}
        >
          <h2>Create alert channel</h2>
          <label className="field">
            Channel type
            <select name="kind">
              <option value="email">Email</option>
              <option value="discord">Discord webhook</option>
            </select>
          </label>
          <label className="field">
            Recipient or webhook URL
            <input
              name="destination"
              type="password"
              autoComplete="off"
              required
              maxLength={2000}
            />
          </label>
          <button className="button">Create encrypted channel</button>
        </form>
      )}
      {channels.map((c) => (
        <div className="data-row" key={c.id}>
          <span>
            {c.kind} · {c.verified_at ? "Operator verified" : "Unverified"}
          </span>
          <code>{c.id}</code>
          {manage && (
            <button
              className="button small"
              disabled={!c.verified_at}
              onClick={async () => {
                try {
                  await api("alert-channels/" + c.id + "/test", "POST", {
                    organizationId: org,
                  });
                  setStatus(
                    "Test queued. Check delivery history for the outcome.",
                  );
                  await load();
                } catch (e) {
                  setStatus(String(e));
                }
              }}
            >
              Queue test
            </button>
          )}
        </div>
      ))}
      {manage && (
        <form
          className="form-panel"
          onSubmit={async (e) => {
            e.preventDefault();
            const f = new FormData(e.currentTarget);
            try {
              await api("alert-rules", "POST", {
                organizationId: org,
                monitorId: f.get("monitorId"),
                channelId: f.get("channelId"),
                cooldownSeconds: Number(f.get("cooldown")),
              });
              await load();
              setStatus("Alert rule saved.");
            } catch (err) {
              setStatus(String(err));
            }
          }}
        >
          <h2>Assign a channel to a monitor</h2>
          <label className="field">
            Monitor
            <select name="monitorId" required>
              <option value="">Choose monitor</option>
              {monitors
                .filter((m) => m.organization_id === org)
                .map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
            </select>
          </label>
          <label className="field">
            Channel
            <select name="channelId" required>
              <option value="">Choose channel</option>
              {channels.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.kind} · {c.id.slice(0, 8)}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            Downtime notification cooldown (seconds)
            <input
              type="number"
              name="cooldown"
              min={300}
              max={86400}
              defaultValue={900}
            />
          </label>
          <button className="button">Save rule</button>
        </form>
      )}
      <h2>Assigned rules</h2>
      {rules.map((rule) => (
        <div className="data-row" key={rule.id}>
          <span>
            {monitors.find((m) => m.id === rule.monitor_id)?.name ??
              rule.monitor_id}
          </span>
          <span>{rule.cooldown_seconds}s cooldown</span>
          {manage && (
            <button
              className="button small"
              onClick={async () => {
                try {
                  await api(
                    "alert-rules/" + rule.id + "?organizationId=" + org,
                    "DELETE",
                  );
                  await load();
                } catch (e) {
                  setStatus(String(e));
                }
              }}
            >
              Remove rule
            </button>
          )}
        </div>
      ))}
      <h2>Delivery history</h2>
      {deliveries.length ? (
        deliveries.map((d) => (
          <div className="data-row" key={d.id}>
            <span>{d.event}</span>
            <b>{d.status}</b>
            <span>{d.attempts} attempts</span>
          </div>
        ))
      ) : (
        <p>No delivery records.</p>
      )}
      <p role="status">{status}</p>
    </section>
  );
}
export function UsagePanel({
  projects,
}: {
  projects: { id: string; name: string }[];
}) {
  const [project, setProject] = useState(projects[0]?.id ?? ""),
    [data, setData] = useState<Record<string, unknown> | null>(null),
    [status, setStatus] = useState("");
  useEffect(() => {
    if (project)
      api("usage/summary?projectId=" + project)
        .then(setData)
        .catch((e) => setStatus(String(e)));
  }, [project]);
  return (
    <section>
      <label className="field">
        Project
        <select value={project} onChange={(e) => setProject(e.target.value)}>
          {projects.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      </label>
      <div className="notice">
        Counts cover developer API-key requests. A zero/unknown outcome remains
        unknown; it is never counted as success. Free quota: 10,000
        authenticated requests per organization per UTC month, and 60 per key
        per minute.
      </div>
      <div className="grid">
        {Object.entries(data ?? {})
          .filter(([key]) => key !== "note")
          .map(([k, v]) => (
            <div className="data-card" key={k}>
              <span>{k.replaceAll("_", " ")}</span>
              <strong>{String(v)}</strong>
            </div>
          ))}
      </div>
      <p role="status">{status}</p>
    </section>
  );
}
