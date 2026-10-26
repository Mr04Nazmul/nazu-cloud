import { z } from "zod";
import { db } from "../../../../../../../../packages/database/src/index";
import {
  ApiError,
  roles,
  plans,
  type Role,
} from "../../../../../../../../packages/shared/src/index";
import { memberChange } from "../../../../../../../../packages/shared/src/access-policy";
import { member, sameOrigin } from "../../../../../../lib/auth";
import { body, errorResponse } from "../../../../../../lib/api";
type Context = { params: Promise<{ path?: string[] }> };
export async function GET(req: Request) {
  try {
    const org = z
      .uuid()
      .parse(new URL(req.url).searchParams.get("organizationId"));
    await member(org);
    return Response.json({
      data: await db()`select user_id,role from nazu_cloud.organization_members where organization_id=${org} order by user_id limit 100`,
    });
  } catch (e) {
    return errorResponse(e);
  }
}
async function mutation(
  req: Request,
  ctx: Context,
  operation: "add" | "update" | "remove",
) {
  sameOrigin(req);
  const input = z
    .object({
      organizationId: z.uuid(),
      userId: z.uuid().optional(),
      role: z.enum(roles).optional(),
    })
    .parse(await body(req));
  const path = (await ctx.params).path ?? [];
  if (
    (operation === "add" && path.length) ||
    (operation !== "add" && path.length !== 1)
  )
    throw new ApiError(404, "NOT_FOUND", "Unknown member resource");
  const actor = await member(input.organizationId, "manage");
  const target = operation === "add" ? input.userId : z.uuid().parse(path[0]);
  if (!target || (operation !== "remove" && !input.role))
    throw new ApiError(400, "INVALID_INPUT", "User and role required");
  return db().begin(async (tx) => {
    await tx`select id from nazu_cloud.organizations where id=${input.organizationId} for update`;
    const [a] =
      await tx`select role from nazu_cloud.organization_members where organization_id=${input.organizationId} and user_id=${actor}`;
    const [old] =
      await tx`select role from nazu_cloud.organization_members where organization_id=${input.organizationId} and user_id=${target}`;
    memberChange(
      a?.role as Role,
      actor,
      target,
      old?.role as Role | undefined,
      operation === "remove" ? "remove" : input.role!,
    );
    if (operation === "add") {
      if (old)
        throw new ApiError(409, "ALREADY_MEMBER", "User is already a member");
      const [count] =
        await tx`select count(*)::int as n from nazu_cloud.organization_members where organization_id=${input.organizationId}`;
      if (count.n >= plans.free.members)
        throw new ApiError(
          409,
          "QUOTA_EXCEEDED",
          "Free plan has one member; paid team entitlements are not enabled",
        );
      const [user] = await tx`select id from auth.users where id=${target}`;
      if (!user)
        throw new ApiError(404, "NOT_FOUND", "Registered user not found");
      await tx`insert into nazu_cloud.organization_members(organization_id,user_id,role) values (${input.organizationId},${target},${input.role!})`;
    } else {
      if (!old) throw new ApiError(404, "NOT_FOUND", "Member not found");
      if (operation === "remove")
        await tx`delete from nazu_cloud.organization_members where organization_id=${input.organizationId} and user_id=${target}`;
      else
        await tx`update nazu_cloud.organization_members set role=${input.role!} where organization_id=${input.organizationId} and user_id=${target}`;
    }
    await tx`insert into nazu_cloud.audit_logs(organization_id,actor_id,action) values (${input.organizationId},${actor},${"member." + operation})`;
    return { userId: target, role: operation === "remove" ? null : input.role };
  });
}
export async function POST(req: Request, ctx: Context) {
  try {
    return Response.json(
      { data: await mutation(req, ctx, "add") },
      { status: 201 },
    );
  } catch (e) {
    return errorResponse(e);
  }
}
export async function PATCH(req: Request, ctx: Context) {
  try {
    return Response.json({ data: await mutation(req, ctx, "update") });
  } catch (e) {
    return errorResponse(e);
  }
}
export async function DELETE(req: Request, ctx: Context) {
  try {
    await mutation(req, ctx, "remove");
    return new Response(null, { status: 204 });
  } catch (e) {
    return errorResponse(e);
  }
}
