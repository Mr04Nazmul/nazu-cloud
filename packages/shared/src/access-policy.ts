import { ApiError, authorize, type Role, type Health } from "./index";
export function memberChange(
  actor: Role,
  actorId: string,
  targetId: string,
  current: Role | undefined,
  desired: Role | "remove",
) {
  authorize(actor, "manage");
  if (actorId === targetId)
    throw new ApiError(
      409,
      "SELF_CHANGE",
      "Self-role changes are not allowed here",
    );
  if (current === "owner" || desired === "owner")
    throw new ApiError(
      403,
      "OWNER_PROTECTED",
      "Ownership changes require a separate reviewed transfer",
    );
  if (actor === "admin" && (current === "admin" || desired === "admin"))
    throw new ApiError(
      403,
      "ADMIN_PROTECTED",
      "Only an owner can manage admins",
    );
}
export function observedStatus(
  m: {
    status: Health;
    paused: boolean;
    last_checked_at: string | Date | null;
    interval_seconds: number;
  },
  now = Date.now(),
): Health {
  if (m.paused) return "paused";
  if (
    !m.last_checked_at ||
    now - new Date(m.last_checked_at).getTime() > m.interval_seconds * 2000
  )
    return "unknown";
  return m.status;
}

export function adminAllowed(
  id: string,
  metadata: Record<string, unknown>,
  allowlist: string[],
  assurance: string | null,
) {
  return (
    allowlist.includes(id) &&
    metadata.nazu_admin === true &&
    assurance === "aal2"
  );
}
