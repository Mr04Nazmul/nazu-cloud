import { z } from "zod";
import { db } from "../../../../../../packages/database/src/index";
import {
  ApiError,
  projectInput,
} from "../../../../../../packages/shared/src/index";
import { member, sameOrigin } from "../../../../lib/auth";
import { body, errorResponse } from "../../../../lib/api";
type Context = { params: Promise<{ id: string }> };
async function authorized(
  req: Request,
  ctx: Context,
  action: "read" | "write" | "manage",
) {
  const id = z.uuid().parse((await ctx.params).id);
  const [p] =
    await db()`select id,organization_id,name,origins,created_at from nazu_cloud.projects where id=${id}`;
  if (!p) throw new ApiError(404, "NOT_FOUND", "Project not found");
  if (action !== "read") sameOrigin(req);
  const actor = await member(p.organization_id, action);
  return { p, actor };
}
export async function GET(req: Request, ctx: Context) {
  try {
    return Response.json({ data: (await authorized(req, ctx, "read")).p });
  } catch (e) {
    return errorResponse(e);
  }
}
export async function PATCH(req: Request, ctx: Context) {
  try {
    const { p, actor } = await authorized(req, ctx, "manage");
    const input = projectInput
      .pick({ name: true, origins: true })
      .partial()
      .refine((v) => Object.keys(v).length > 0)
      .parse(await body(req));
    const data = await db().begin(async (tx) => {
      const [updated] =
        await tx`update nazu_cloud.projects set name=${input.name ?? p.name},origins=${input.origins ?? p.origins} where id=${p.id} returning id,name,origins`;
      await tx`insert into nazu_cloud.audit_logs(organization_id,actor_id,action) values (${p.organization_id},${actor},'project.updated')`;
      return updated;
    });
    return Response.json({ data });
  } catch (e) {
    return errorResponse(e);
  }
}
export async function DELETE(req: Request, ctx: Context) {
  try {
    const { p, actor } = await authorized(req, ctx, "manage");
    const confirmation = z
      .object({ confirmName: z.string() })
      .parse(await body(req));
    if (confirmation.confirmName !== p.name)
      throw new ApiError(
        409,
        "CONFIRMATION_REQUIRED",
        "Exact project name required",
      );
    await db().begin(async (tx) => {
      await tx`insert into nazu_cloud.audit_logs(organization_id,actor_id,action) values (${p.organization_id},${actor},'project.deleted')`;
      await tx`delete from nazu_cloud.projects where id=${p.id}`;
    });
    return new Response(null, { status: 204 });
  } catch (e) {
    return errorResponse(e);
  }
}
