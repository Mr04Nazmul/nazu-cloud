import { withUsage } from "../../../../../lib/api";
import { observedStatus } from "../../../../../../../packages/shared/src/access-policy";
import { z } from "zod";
import { db } from "../../../../../../../packages/database/src/index";
import {
  ApiError,
  metrics,
} from "../../../../../../../packages/shared/src/index";
import { access, errorResponse, body } from "../../../../../lib/api";
type Context = { params: Promise<{ id: string; detail?: string[] }> };
async function monitor(req: Request, id: string, write = false) {
  const [m] =
    await db()`select * from nazu_cloud.rpc_monitors where id=${z.uuid().parse(id)}`;
  if (!m) throw new ApiError(404, "NOT_FOUND", "Monitor not found");
  await access(
    req,
    m.project_id,
    write,
    write ? "monitors:write" : "monitors:read",
  );
  return m;
}
async function getHandler(req: Request, ctx: Context) {
  try {
    const { id, detail } = await ctx.params;
    const m = await monitor(req, id);
    const part = detail?.join("/") ?? "";
    if (part === "incidents")
      return Response.json({
        data: await db()`select id,opened_at,resolved_at from nazu_cloud.monitor_incidents where monitor_id=${id} order by opened_at desc limit 100`,
      });
    if (part === "checks" || part === "metrics") {
      const checks = await db()<
        {
          status: "healthy" | "degraded" | "down" | "unknown";
          latency_ms: number | null;
        }[]
      >`select status,latency_ms,checked_at,error_code,block_number from nazu_cloud.monitor_checks where monitor_id=${id} and checked_at>=now()-interval '24 hours' order by checked_at desc limit 1000`;
      return Response.json({
        data:
          part === "checks"
            ? checks
            : metrics(
                checks as {
                  status: "healthy" | "degraded" | "down" | "unknown";
                  latency_ms: number | null;
                }[],
                Math.floor(
                  Math.min(
                    86400,
                    (Date.now() - new Date(m.created_at).getTime()) / 1000,
                  ) / m.interval_seconds,
                ),
              ),
      });
    }
    if (part) throw new ApiError(404, "NOT_FOUND", "Unknown resource");
    const {
      endpoint_ciphertext: _endpoint,
      lease_owner: _leaseOwner,
      lease_until: _leaseUntil,
      ...safe
    } = m;
    return Response.json({
      data: {
        ...safe,
        status: observedStatus({
          status: m.status,
          paused: m.paused,
          last_checked_at: m.last_checked_at,
          interval_seconds: m.interval_seconds,
        }),
      },
    });
  } catch (e) {
    return errorResponse(e);
  }
}
async function patchHandler(req: Request, ctx: Context) {
  try {
    const { id, detail } = await ctx.params;
    if (detail?.length)
      throw new ApiError(404, "NOT_FOUND", "Unknown resource");
    await monitor(req, id, true);
    const input = z.object({ paused: z.boolean() }).parse(await body(req));
    await db()`update nazu_cloud.rpc_monitors set lease_owner=null,lease_until=null,paused=${input.paused},status=${input.paused ? "paused" : "unknown"},next_check_at=now() where id=${id}`;
    return Response.json({ data: { id, paused: input.paused } });
  } catch (e) {
    return errorResponse(e);
  }
}
async function deleteHandler(req: Request, ctx: Context) {
  try {
    const { id, detail } = await ctx.params;
    if (detail?.length)
      throw new ApiError(404, "NOT_FOUND", "Unknown resource");
    await monitor(req, id, true);
    await db()`delete from nazu_cloud.rpc_monitors where id=${id}`;
    return new Response(null, { status: 204 });
  } catch (e) {
    return errorResponse(e);
  }
}

export async function GET(req: Request, ctx: Context) {
  return withUsage(req, () => getHandler(req, ctx));
}

export async function PATCH(req: Request, ctx: Context) {
  return withUsage(req, () => patchHandler(req, ctx));
}

export async function DELETE(req: Request, ctx: Context) {
  return withUsage(req, () => deleteHandler(req, ctx));
}
