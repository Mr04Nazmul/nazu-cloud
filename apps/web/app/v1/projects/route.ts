import { db } from "../../../../../packages/database/src/index";
import { projectInput } from "../../../../../packages/shared/src/index";
import { userId, member, sameOrigin } from "../../../lib/auth";
import { body, errorResponse } from "../../../lib/api";
export async function GET() {
  try {
    const id = await userId();
    const rows =
      await db()`select p.id,p.name,p.organization_id,p.origins,p.created_at from nazu_cloud.projects p join nazu_cloud.organization_members m on m.organization_id=p.organization_id where m.user_id=${id} order by p.created_at desc limit 100`;
    return Response.json({ data: rows });
  } catch (e) {
    return errorResponse(e);
  }
}
export async function POST(req: Request) {
  try {
    sameOrigin(req);
    const input = projectInput.parse(await body(req));
    const actor = await member(input.organizationId, "write");
    const rows = await db().begin(async (tx) => {
      const projects =
        await tx`insert into nazu_cloud.projects(organization_id,name,origins) values (${input.organizationId},${input.name},${input.origins}) returning id,name,organization_id,origins`;
      await tx`insert into nazu_cloud.audit_logs(organization_id,actor_id,action) values (${input.organizationId},${actor},'project.created')`;
      return projects;
    });
    return Response.json({ data: rows[0] }, { status: 201 });
  } catch (e) {
    return errorResponse(e);
  }
}
