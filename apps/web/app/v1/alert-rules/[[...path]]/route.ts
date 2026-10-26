import { z } from "zod";
import { db } from "../../../../../../packages/database/src/index";
import { ApiError } from "../../../../../../packages/shared/src/index";
import { member, sameOrigin } from "../../../../lib/auth";
import { body, errorResponse } from "../../../../lib/api";
export async function GET(req: Request) {
  try {
    const org = z
      .uuid()
      .parse(new URL(req.url).searchParams.get("organizationId"));
    await member(org);
    return Response.json({
      data: await db()`select id,monitor_id,channel_id,cooldown_seconds from nazu_cloud.alert_rules where organization_id=${org} order by id limit 100`,
    });
  } catch (e) {
    return errorResponse(e);
  }
}
export async function POST(req: Request) {
  try {
    sameOrigin(req);
    const input = z
      .object({
        organizationId: z.uuid(),
        monitorId: z.uuid(),
        channelId: z.uuid(),
        cooldownSeconds: z.number().int().min(300).max(86400).default(900),
      })
      .parse(await body(req));
    const actor = await member(input.organizationId, "manage");
    const data = await db().begin(async (tx) => {
      const [monitor] =
        await tx`select id from nazu_cloud.rpc_monitors where id=${input.monitorId} and organization_id=${input.organizationId} for update`;
      const [channel] =
        await tx`select id from nazu_cloud.alert_channels where id=${input.channelId} and organization_id=${input.organizationId}`;
      if (!monitor || !channel)
        throw new ApiError(
          404,
          "NOT_FOUND",
          "Monitor and channel must belong to this organization",
        );
      const [old] =
        await tx`select id from nazu_cloud.alert_rules where monitor_id=${input.monitorId} and channel_id=${input.channelId}`;
      let result;
      if (old) {
        [result] =
          await tx`update nazu_cloud.alert_rules set cooldown_seconds=${input.cooldownSeconds} where id=${old.id} returning id,monitor_id,channel_id,cooldown_seconds`;
      } else {
        [result] =
          await tx`insert into nazu_cloud.alert_rules(organization_id,monitor_id,channel_id,cooldown_seconds) values (${input.organizationId},${input.monitorId},${input.channelId},${input.cooldownSeconds}) returning id,monitor_id,channel_id,cooldown_seconds`;
      }
      await tx`insert into nazu_cloud.audit_logs(organization_id,actor_id,action) values (${input.organizationId},${actor},'alert_rule.saved')`;
      return result;
    });
    return Response.json({ data }, { status: 201 });
  } catch (e) {
    return errorResponse(e);
  }
}
export async function DELETE(
  req: Request,
  ctx: { params: Promise<{ path?: string[] }> },
) {
  try {
    sameOrigin(req);
    const path = (await ctx.params).path ?? [];
    if (path.length !== 1)
      throw new ApiError(404, "NOT_FOUND", "Unknown rule resource");
    const org = z
      .uuid()
      .parse(new URL(req.url).searchParams.get("organizationId"));
    const actor = await member(org, "manage");
    await db().begin(async (tx) => {
      await tx`delete from nazu_cloud.alert_rules where id=${z.uuid().parse(path[0])} and organization_id=${org}`;
      await tx`insert into nazu_cloud.audit_logs(organization_id,actor_id,action) values (${org},${actor},'alert_rule.deleted')`;
    });
    return new Response(null, { status: 204 });
  } catch (e) {
    return errorResponse(e);
  }
}
