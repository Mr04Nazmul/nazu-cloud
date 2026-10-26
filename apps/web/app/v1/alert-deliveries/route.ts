import { z } from "zod";
import { db } from "../../../../../packages/database/src/index";
import { member } from "../../../lib/auth";
import { errorResponse } from "../../../lib/api";
export async function GET(req: Request) {
  try {
    const org = z
      .uuid()
      .parse(new URL(req.url).searchParams.get("organizationId"));
    await member(org);
    return Response.json({
      data: await db()`select id,incident_id,channel_id,event,status,attempts,next_attempt_at,delivered_at from nazu_cloud.alert_deliveries where organization_id=${org} order by next_attempt_at desc limit 100`,
    });
  } catch (e) {
    return errorResponse(e);
  }
}
