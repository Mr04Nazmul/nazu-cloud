import { withUsage } from "../../../../lib/api";
import { z } from "zod";
import { db } from "../../../../../../packages/database/src/index";
import { ApiError } from "../../../../../../packages/shared/src/index";
import { access, errorResponse } from "../../../../lib/api";
async function getHandler(
  req: Request,
  ctx: { params: Promise<{ kind: string }> },
) {
  try {
    const { kind } = await ctx.params;
    const project = z
      .uuid()
      .parse(new URL(req.url).searchParams.get("projectId"));
    await access(req, project);
    if (kind === "limits")
      return Response.json({
        data: {
          plan: "free",
          monitors: 1,
          requestsPerMinutePerKey: 60,
          monthlyQuotaEnforced: true,
          monthlyOrganizationRequestQuota: 10000,
        },
      });
    if (kind === "history") {
      return Response.json({
        data: await db()`select date_trunc('day',created_at) as day,count(*)::int as authenticated_requests from nazu_cloud.api_usage_events where project_id=${project} and created_at>now()-interval '30 days' group by 1 order by 1`,
      });
    }
    if (kind !== "summary")
      throw new ApiError(404, "NOT_FOUND", "Unknown usage resource");
    const [data] =
      await db()`select count(*)::int as authenticated_requests,count(*) filter(where status_code between 200 and 399)::int as successful_requests,count(*) filter(where status_code>=400 and status_code<>429)::int as failed_requests,count(*) filter(where status_code=429)::int as rate_limited_requests,count(*) filter(where status_code=0)::int as pending_or_unknown_requests from nazu_cloud.api_usage_events where project_id=${project} and created_at>=date_trunc('month',now())`;
    return Response.json({
      data: {
        ...data,
        note: "API-key requests only. The current request can be pending; interrupted metering is unknown rather than successful.",
      },
    });
  } catch (e) {
    return errorResponse(e);
  }
}

export async function GET(
  req: Request,
  ctx: { params: Promise<{ kind: string }> },
) {
  return withUsage(req, () => getHandler(req, ctx));
}
