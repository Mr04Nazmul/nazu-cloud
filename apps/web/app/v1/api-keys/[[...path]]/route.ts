import { z } from "zod";
import { db } from "../../../../../../packages/database/src/index";
import { newKey, ApiError } from "../../../../../../packages/shared/src/index";
import { keyManager, errorResponse, body } from "../../../../lib/api";
import { member } from "../../../../lib/auth";
type Context = { params: Promise<{ path?: string[] }> };
export async function GET(req: Request) {
  try {
    const project = z
      .uuid()
      .parse(new URL(req.url).searchParams.get("projectId"));
    const [p] =
      await db()`select organization_id from nazu_cloud.projects where id=${project}`;
    if (!p) throw new ApiError(404, "NOT_FOUND", "Project not found");
    await member(p.organization_id, "manage");
    const data =
      await db()`select id,prefix,scopes,expires_at,revoked_at,created_at from nazu_cloud.api_keys where project_id=${project} order by created_at desc limit 100`;
    return Response.json({ data });
  } catch (e) {
    return errorResponse(e);
  }
}
export async function POST(req: Request, ctx: Context) {
  try {
    const { path = [] } = await ctx.params;
    const input = z
      .object({
        projectId: z.uuid(),
        scopes: z
          .array(z.enum(["monitors:read", "monitors:write"]))
          .min(1)
          .default(["monitors:read"]),
        expiresAt: z.iso
          .datetime()
          .refine((v) => Date.parse(v) > Date.now())
          .optional(),
      })
      .parse(await body(req));
    const p = await keyManager(req, input.projectId);
    const key = newKey();
    const data = await db().begin(async (tx) => {
      if (path.length) {
        if (path.length !== 2 || path[1] !== "rotate")
          throw new ApiError(404, "NOT_FOUND", "Unknown resource");
        const old =
          await tx`update nazu_cloud.api_keys set revoked_at=now() where id=${z.uuid().parse(path[0])} and project_id=${input.projectId} and revoked_at is null returning id`;
        if (!old.length) throw new ApiError(404, "NOT_FOUND", "Key not found");
      }
      const [k] =
        await tx`insert into nazu_cloud.api_keys(organization_id,project_id,prefix,secret_hash,scopes,expires_at) values (${p.organization_id},${input.projectId},${key.prefix},${key.hash},${input.scopes},${input.expiresAt ?? null}) returning id,prefix,scopes,expires_at`;
      await tx`insert into nazu_cloud.audit_logs(organization_id,action) values (${p.organization_id},${path.length ? "api_key.rotated" : "api_key.created"})`;
      return k;
    });
    return Response.json(
      { data: { ...data, secret: key.secret } },
      { status: 201, headers: { "Cache-Control": "no-store" } },
    );
  } catch (e) {
    return errorResponse(e);
  }
}
export async function DELETE(req: Request, ctx: Context) {
  try {
    const { path = [] } = await ctx.params;
    if (path.length !== 1)
      throw new ApiError(404, "NOT_FOUND", "Unknown resource");
    const project = z
      .uuid()
      .parse(new URL(req.url).searchParams.get("projectId"));
    const p = await keyManager(req, project);
    await db().begin(async (tx) => {
      await tx`update nazu_cloud.api_keys set revoked_at=now() where id=${z.uuid().parse(path[0])} and project_id=${project}`;
      await tx`insert into nazu_cloud.audit_logs(organization_id,action) values (${p.organization_id},'api_key.revoked')`;
    });
    return new Response(null, { status: 204 });
  } catch (e) {
    return errorResponse(e);
  }
}
