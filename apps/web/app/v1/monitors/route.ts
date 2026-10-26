import { encryptEndpoint } from "../../../../../packages/shared/src/endpoint-secret";
import { z } from "zod";
import { db } from "../../../../../packages/database/src/index";
import {
  monitorInput,
  ApiError,
} from "../../../../../packages/shared/src/index";
import { approvedEndpoint } from "../../../../../services/monitor-worker/src/rpc";
import { access, body, errorResponse } from "../../../lib/api";
export async function GET(req: Request) {
  try {
    const projectId = z
      .uuid()
      .parse(new URL(req.url).searchParams.get("projectId"));
    await access(req, projectId);
    const data =
      await db()`select id,project_id,name,chain_id,status,interval_seconds,last_checked_at,paused,created_at from nazu_cloud.rpc_monitors where project_id=${projectId} order by created_at desc limit 100`;
    return Response.json({ data });
  } catch (e) {
    return errorResponse(e);
  }
}
export async function POST(req: Request) {
  try {
    const input = monitorInput.parse(await body(req));
    const p = await access(req, input.projectId, true, "monitors:write");
    approvedEndpoint(
      input.endpoint,
      (process.env.RPC_ALLOWED_HOSTS ?? "").split(",").filter(Boolean),
    );
    const data = await db().begin(async (tx) => {
      await tx`select id from nazu_cloud.organizations where id=${p.organization_id} for update`;
      const [count] =
        await tx`select count(*)::int as n from nazu_cloud.rpc_monitors where organization_id=${p.organization_id}`;
      if (count.n >= 1)
        throw new ApiError(
          409,
          "QUOTA_EXCEEDED",
          "Free plan supports one monitor; paid entitlements are not enabled",
        );
      const [m] =
        await tx`insert into nazu_cloud.rpc_monitors(organization_id,project_id,name,endpoint_ciphertext,chain_id,interval_seconds,latency_threshold_ms) values (${p.organization_id},${p.id},${input.name},${encryptEndpoint(input.endpoint)},${input.chainId},${input.intervalSeconds},${input.latencyThresholdMs}) returning id,name,chain_id,status`;
      return m;
    });
    return Response.json({ data }, { status: 201 });
  } catch (e) {
    return errorResponse(e);
  }
}
