import { z } from "zod";
import { ApiError, hashSecret } from "../../../packages/shared/src/index";
import { db } from "../../../packages/database/src/index";
import { member, sameOrigin } from "./auth";
export function errorResponse(e: unknown) {
  if (e instanceof ApiError)
    return Response.json(
      { error: { code: e.code, message: e.message } },
      { status: e.status },
    );
  if (e instanceof z.ZodError)
    return Response.json(
      {
        error: {
          code: "INVALID_INPUT",
          message: "Request validation failed",
          issues: e.issues.map((i) => ({ path: i.path, message: i.message })),
        },
      },
      { status: 400 },
    );
  return Response.json(
    {
      error: {
        code: "UNAVAILABLE",
        message: "Service unavailable; check server configuration",
      },
    },
    { status: 503 },
  );
}
export async function body(request: Request) {
  const reader = request.body?.getReader();
  const chunks: Uint8Array[] = [];
  let length = 0;
  if (reader) {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      length += value.byteLength;
      if (length > 16384) {
        await reader.cancel();
        throw new ApiError(413, "TOO_LARGE", "Request body exceeds limit");
      }
      chunks.push(value);
    }
  }
  const text = Buffer.concat(chunks).toString("utf8");
  try {
    return JSON.parse(text) as unknown;
  } catch {
    throw new ApiError(400, "INVALID_JSON", "JSON body required");
  }
}
export async function access(
  request: Request,
  projectId: string,
  write = false,
  scope = "monitors:read",
) {
  const sql = db();
  const [p] =
    await sql`select id,organization_id from nazu_cloud.projects where id=${projectId}`;
  if (!p) throw new ApiError(404, "NOT_FOUND", "Project not found");
  const key = request.headers.get("authorization")?.replace(/^Bearer /, "");
  if (key?.startsWith("nazu_live_")) {
    const [k] =
      await sql`select id,scopes from nazu_cloud.api_keys where project_id=${projectId} and secret_hash=${hashSecret(key)} and revoked_at is null and (expires_at is null or expires_at>now())`;
    if (!k) throw new ApiError(401, "INVALID_KEY", "Invalid API key");
    if (!k.scopes.includes(scope))
      throw new ApiError(
        403,
        "SCOPE_DENIED",
        "API key scope does not permit this request",
      );
    await sql.begin(async (tx) => {
      const [usage] =
        await tx`insert into nazu_cloud.rate_limits(bucket,window_start,count) values (${k.id},date_trunc('minute',now()),1) on conflict(bucket,window_start) do update set count=nazu_cloud.rate_limits.count+1 returning count`;
      if (usage.count > 60)
        throw new ApiError(
          429,
          "RATE_LIMITED",
          "60 requests per minute exceeded",
        );
      await tx`insert into nazu_cloud.api_usage_events(organization_id,project_id,api_key_id,status_code) values (${p.organization_id},${p.id},${k.id},0)`;
    });
  } else {
    if (write) sameOrigin(request);
    await member(p.organization_id, write ? "write" : "read");
  }
  return p as { id: string; organization_id: string };
}
export async function keyManager(request: Request, projectId: string) {
  sameOrigin(request);
  const [p] =
    await db()`select organization_id from nazu_cloud.projects where id=${projectId}`;
  if (!p) throw new ApiError(404, "NOT_FOUND", "Project not found");
  await member(p.organization_id, "manage");
  return p;
}
