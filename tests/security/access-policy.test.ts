import { it, expect } from "vitest";
import {
  memberChange,
  adminAllowed,
  observedStatus,
} from "../../packages/shared/src/access-policy";
it("protects owner, self and admin roles from escalation", () => {
  expect(() => memberChange("owner", "a", "a", "owner", "remove")).toThrow();
  expect(() => memberChange("admin", "a", "b", "owner", "developer")).toThrow();
  expect(() => memberChange("admin", "a", "b", "developer", "admin")).toThrow();
  expect(() => memberChange("admin", "a", "b", "admin", "remove")).toThrow();
  expect(() =>
    memberChange("developer", "a", "b", "readonly", "developer"),
  ).toThrow();
  expect(() => memberChange("owner", "a", "b", "developer", "owner")).toThrow();
});
it("allows intended member changes", () => {
  expect(() =>
    memberChange("owner", "a", "b", "developer", "admin"),
  ).not.toThrow();
  expect(() =>
    memberChange("admin", "a", "b", "readonly", "developer"),
  ).not.toThrow();
});
it("never keeps stale endpoints healthy", () => {
  const now = Date.now();
  expect(
    observedStatus(
      {
        status: "healthy",
        paused: false,
        last_checked_at: new Date(now - 601000),
        interval_seconds: 300,
      },
      now,
    ),
  ).toBe("unknown");
  expect(
    observedStatus(
      {
        status: "down",
        paused: false,
        last_checked_at: null,
        interval_seconds: 300,
      },
      now,
    ),
  ).toBe("unknown");
  expect(
    observedStatus(
      {
        status: "healthy",
        paused: true,
        last_checked_at: null,
        interval_seconds: 300,
      },
      now,
    ),
  ).toBe("paused");
  expect(
    observedStatus(
      {
        status: "healthy",
        paused: false,
        last_checked_at: new Date(now - 10000),
        interval_seconds: 300,
      },
      now,
    ),
  ).toBe("healthy");
});

it("requires all admin authorization factors, not merely metadata or allowlist", () => {
  expect(adminAllowed("a", { nazu_admin: true }, ["a"], "aal2")).toBe(true);
  expect(adminAllowed("a", { nazu_admin: true }, ["b"], "aal2")).toBe(false);
  expect(adminAllowed("a", {}, ["a"], "aal2")).toBe(false);
  expect(adminAllowed("a", { nazu_admin: true }, ["a"], "aal1")).toBe(false);
});
