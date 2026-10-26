"use client";
import { useState } from "react";
type Kind = "organization" | "project" | "monitor" | "key";
export function ResourceForm({
  kind,
  organizations = [],
  projects = [],
}: {
  kind: Kind;
  organizations?: { id: string; name: string }[];
  projects?: { id: string; name: string }[];
}) {
  const [status, setStatus] = useState(""),
    [secret, setSecret] = useState(""),
    [busy, setBusy] = useState(false);
  return (
    <form
      className="form-panel"
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        setStatus("");
        setSecret("");
        const f = new FormData(e.currentTarget);
        const values = Object.fromEntries(f.entries());
        const payload =
          kind === "organization"
            ? { name: values.name }
            : kind === "project"
              ? {
                  name: values.name,
                  organizationId: values.organizationId,
                  origins: values.origins
                    ? String(values.origins)
                        .split(",")
                        .map((v) => v.trim())
                    : [],
                }
              : kind === "monitor"
                ? {
                    name: values.name,
                    projectId: values.projectId,
                    endpoint: values.endpoint,
                    chainId: Number(values.chainId),
                  }
                : {
                    projectId: values.projectId,
                    scopes: ["monitors:read", "monitors:write"],
                  };
        try {
          const response = await fetch(
            "/v1/" +
              {
                organization: "organizations/current",
                project: "projects",
                monitor: "monitors",
                key: "api-keys",
              }[kind],
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(payload),
            },
          );
          const data = (await response.json()) as {
            data?: { secret?: string };
            error?: { message: string };
          };
          if (!response.ok)
            throw new Error(data.error?.message ?? "Request failed");
          if (data.data?.secret) {
            setSecret(data.data.secret);
            setStatus("Copy this API key now. It will not be displayed again.");
          } else {
            setStatus("Created. Refresh to view the resource.");
            location.reload();
          }
        } catch (err) {
          setStatus(err instanceof Error ? err.message : "Request failed");
        } finally {
          setBusy(false);
        }
      }}
    >
      <h2>Create {kind === "key" ? "API key" : kind}</h2>
      {kind !== "key" && (
        <label className="field">
          Name
          <input name="name" required minLength={2} maxLength={80} />
        </label>
      )}
      {kind === "project" && (
        <>
          <label className="field">
            Organization
            <select name="organizationId" required>
              <option value="">Choose organization</option>
              {organizations.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.name}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            Authorized HTTPS origins (comma separated)
            <input name="origins" placeholder="https://your-app.example" />
          </label>
        </>
      )}
      {(kind === "monitor" || kind === "key") && (
        <label className="field">
          Project
          <select name="projectId" required>
            <option value="">Choose project</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </label>
      )}
      {kind === "monitor" && (
        <>
          <label className="field">
            Approved HTTPS RPC endpoint
            <input
              name="endpoint"
              type="url"
              required
              placeholder="https://approved-provider.example"
              maxLength={2048}
            />
          </label>
          <label className="field">
            EVM chain ID
            <input
              name="chainId"
              type="number"
              min={1}
              required
              defaultValue={1}
            />
          </label>
          <p>
            Free: 1 monitor per organization, checks at least 5 minutes apart.
            Your provider host must be explicitly approved by the operator.
          </p>
        </>
      )}
      <button className="button primary" disabled={busy}>
        {busy ? "Creating…" : "Create " + kind}
      </button>
      <p role="status" className="form-status">
        {status}
      </p>
      {secret && (
        <div className="secret">
          <code>{secret}</code>
        </div>
      )}
    </form>
  );
}
export function RevokeKey({
  id,
  projectId,
}: {
  id: string;
  projectId: string;
}) {
  const [status, setStatus] = useState("");
  return (
    <span>
      <button
        className="button small"
        onClick={async () => {
          const r = await fetch(
            "/v1/api-keys/" +
              encodeURIComponent(id) +
              "?projectId=" +
              encodeURIComponent(projectId),
            { method: "DELETE" },
          );
          if (r.ok) location.reload();
          else setStatus("Revocation failed");
        }}
      >
        Revoke
      </button>
      <span role="status">{status}</span>
    </span>
  );
}
