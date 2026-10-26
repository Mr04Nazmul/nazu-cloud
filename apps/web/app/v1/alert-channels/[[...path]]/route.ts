import { z } from "zod";
import { db } from "../../../../../../packages/database/src/index";
import { ApiError } from "../../../../../../packages/shared/src/index";
import { body, errorResponse } from "../../../../lib/api";
import { member, sameOrigin } from "../../../../lib/auth";
import {
  destination,
  encryptDestination,
} from "../../../../../../services/alert-worker/src/delivery";
type Context = { params: Promise<{ path?: string[] }> };
export async function GET(req: Request) {
  try {
    const org = z
      .uuid()
      .parse(new URL(req.url).searchParams.get("organizationId"));
    await member(org, "read");
    return Response.json({
      data: await db()`select id,kind,verified_at,created_at from nazu_cloud.alert_channels where organization_id=${org} order by created_at desc limit 100`,
    });
  } catch (e) {
    return errorResponse(e);
  }
}
export async function POST(req: Request, ctx: Context) {
  try {
    sameOrigin(req);
    const { path = [] } = await ctx.params;
    const input = z
      .object({
        organizationId: z.uuid(),
        kind: z.enum(["email", "discord"]).optional(),
        destination: z.string().max(2000).optional(),
      })
      .parse(await body(req));
    await member(input.organizationId, "manage");
    if (path.length === 2 && path[1] === "test") {
      const channel = z.uuid().parse(path[0]);
      const data = await db().begin(async (tx) => {
        const [c] =
          await tx`select id from nazu_cloud.alert_channels where id=${channel} and organization_id=${input.organizationId} and verified_at is not null for update`;
        if (!c)
          throw new ApiError(404, "NOT_FOUND", "Approved channel not found");
        const [recent] =
          await tx`select id from nazu_cloud.alert_deliveries where channel_id=${channel} and next_attempt_at>now()-interval '5 minutes' limit 1`;
        if (recent)
          throw new ApiError(429, "COOLDOWN", "Wait before another test");
        const [d] =
          await tx`insert into nazu_cloud.alert_deliveries(organization_id,channel_id,event) values (${input.organizationId},${channel},'test') returning id,status`;
        return d;
      });
      return Response.json({ data }, { status: 202 });
    }
    if (path.length) throw new ApiError(404, "NOT_FOUND", "Unknown resource");
    if (!input.kind || !input.destination)
      throw new ApiError(
        400,
        "INVALID_INPUT",
        "Channel kind and destination required",
      );
    const ciphertext = encryptDestination(
      destination(input.kind, input.destination),
    );
    const [data] =
      await db()`insert into nazu_cloud.alert_channels(organization_id,kind,destination_ciphertext) values (${input.organizationId},${input.kind},${ciphertext}) returning id,kind,verified_at`;
    return Response.json({ data }, { status: 201 });
  } catch (e) {
    return errorResponse(e);
  }
}
export async function DELETE(req: Request, ctx: Context) {
  try {
    sameOrigin(req);
    const { path = [] } = await ctx.params;
    if (path.length !== 1)
      throw new ApiError(404, "NOT_FOUND", "Unknown resource");
    const org = z
      .uuid()
      .parse(new URL(req.url).searchParams.get("organizationId"));
    await member(org, "manage");
    await db()`delete from nazu_cloud.alert_channels where id=${z.uuid().parse(path[0])} and organization_id=${org}`;
    return new Response(null, { status: 204 });
  } catch (e) {
    return errorResponse(e);
  }
}

export async function PATCH(req: Request, ctx: Context) {
  try {
    sameOrigin(req);
    const path = (await ctx.params).path ?? [];
    if (path.length !== 1)
      throw new ApiError(404, "NOT_FOUND", "Unknown channel resource");
    const input = z
      .object({ organizationId: z.uuid(), destination: z.string().max(2000) })
      .parse(await body(req));
    const actor = await member(input.organizationId, "manage");
    const data = await db().begin(async (tx) => {
      const [c] =
        await tx`select id,kind from nazu_cloud.alert_channels where id=${z.uuid().parse(path[0])} and organization_id=${input.organizationId} for update`;
      if (!c) throw new ApiError(404, "NOT_FOUND", "Channel not found");
      const encrypted = encryptDestination(
        destination(c.kind, input.destination),
      );
      const [updated] =
        await tx`update nazu_cloud.alert_channels set destination_ciphertext=${encrypted},verified_at=null where id=${c.id} returning id,kind,verified_at`;
      await tx`update nazu_cloud.alert_deliveries set status='failed',locked_until=null,lease_owner=null where channel_id=${c.id} and status='pending'`;
      await tx`insert into nazu_cloud.audit_logs(organization_id,actor_id,action) values (${input.organizationId},${actor},'alert_channel.destination_changed')`;
      return updated;
    });
    return Response.json({ data });
  } catch (e) {
    return errorResponse(e);
  }
}
