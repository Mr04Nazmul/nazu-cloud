import { db } from "../../../../../../packages/database/src/index";
import { userId, sameOrigin } from "../../../../lib/auth";
import { errorResponse, body } from "../../../../lib/api";
import { z } from "zod";
export async function GET() {
  try {
    const id = await userId();
    const data =
      await db()`select o.id,o.name,m.role from nazu_cloud.organizations o join nazu_cloud.organization_members m on m.organization_id=o.id where m.user_id=${id} order by o.created_at limit 100`;
    return Response.json({ data });
  } catch (e) {
    return errorResponse(e);
  }
}
export async function POST(req: Request) {
  try {
    sameOrigin(req);
    const id = await userId();
    const input = z
      .object({ name: z.string().trim().min(2).max(80) })
      .parse(await body(req));
    const data = await db().begin(async (tx) => {
      await tx`select pg_advisory_xact_lock(hashtext(${id}))`;
      const [count] =
        await tx`select count(*)::int as n from nazu_cloud.organization_members where user_id=${id}`;
      if (count.n >= 5) throw new Error("Organization limit reached");
      const [org] =
        await tx`insert into nazu_cloud.organizations(name) values (${input.name}) returning id,name`;
      await tx`insert into nazu_cloud.organization_members(organization_id,user_id,role) values (${org.id},${id},'owner')`;
      await tx`insert into nazu_cloud.audit_logs(organization_id,actor_id,action) values (${org.id},${id},'organization.created')`;
      return org;
    });
    return Response.json({ data }, { status: 201 });
  } catch (e) {
    return errorResponse(e);
  }
}
