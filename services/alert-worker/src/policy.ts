export function obsoleteDowntime(
  event: string,
  resolvedAt: Date | string | null | undefined,
) {
  return event === "down" && resolvedAt != null;
}
