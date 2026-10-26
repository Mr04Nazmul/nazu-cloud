import { z } from "zod";
import { db } from "../../../../../../packages/database/src/index";
import { ApiError } from "../../../../../../packages/shared/src/index";
import { access, errorResponse } from "../../../../lib/api";
export async function GET(
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
          monthlyQuotaEnforced: false,
          remainingMonthlyRequests: null,
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
      await db()`select count(*)::int as authenticated_requests from nazu_cloud.api_usage_events where project_id=${project} and created_at>=date_trunc('month',now())`;
    return Response.json({
      data: {
        ...data,
        successfulRequests: null,
        failedRequests: null,
        rateLimitedRequests: null,
        note: "Only accepted API-key authentication events are counted. Response outcome instrumentation is not implemented.",
      },
    });
  } catch (e) {
    return errorResponse(e);
  }
}
