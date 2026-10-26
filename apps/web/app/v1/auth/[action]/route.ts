import { randomBytes } from "node:crypto";
import { z } from "zod";
import { createPublicClient, http, type Hex } from "viem";
import { createSiweMessage } from "viem/siwe";
import { db } from "../../../../../../packages/database/src/index";
import {
  ApiError,
  hashSecret,
} from "../../../../../../packages/shared/src/index";
import { body, errorResponse } from "../../../../lib/api";
type Context = { params: Promise<{ action: string }> };
async function originProject(req: Request, projectId: string) {
  const origin = req.headers.get("origin");
  if (!origin) throw new ApiError(403, "ORIGIN_DENIED", "Origin required");
  const [p] =
    await db()`select * from nazu_cloud.projects where id=${projectId} and ${origin}=any(origins)`;
  if (!p)
    throw new ApiError(
      403,
      "ORIGIN_DENIED",
      "Project origin is not registered",
    );
  return { p, origin };
}
export async function OPTIONS(req: Request) {
  const origin = req.headers.get("origin");
  if (!origin) return new Response(null, { status: 403 });
  const [p] =
    await db()`select id from nazu_cloud.projects where ${origin}=any(origins) limit 1`;
  return new Response(null, {
    status: p ? 204 : 403,
    headers: p
      ? {
          "Access-Control-Allow-Origin": origin,
          "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type,Authorization",
          Vary: "Origin",
        }
      : {},
  });
}
export async function POST(req: Request, ctx: Context) {
  try {
    const { action } = await ctx.params;
    const input = z
      .object({
        projectId: z.uuid(),
        address: z
          .string()
          .regex(/^0x[0-9a-fA-F]{40}$/)
          .optional(),
        chainId: z.number().int().positive().optional(),
        challengeId: z.uuid().optional(),
        signature: z
          .string()
          .regex(/^0x[0-9a-fA-F]+$/)
          .max(16384)
          .optional(),
      })
      .parse(await body(req));
    const { p, origin } = await originProject(req, input.projectId);
    const sql = db();
    const headers = {
      "Access-Control-Allow-Origin": origin,
      Vary: "Origin",
      "Cache-Control": "no-store",
    };
    if (action === "challenge") {
      if (!input.address || !input.chainId)
        throw new ApiError(
          400,
          "INVALID_INPUT",
          "Address and chainId required",
        );
      const address = input.address,
        chainId = input.chainId;
      const rpcMap = JSON.parse(
        process.env.WALLET_CHAIN_RPC_JSON ?? "{}",
      ) as Record<string, string>;
      if (!rpcMap[String(input.chainId)])
        throw new ApiError(
          400,
          "UNSUPPORTED_CHAIN",
          "Chain verification provider not configured",
        );
      const issued = new Date(),
        expires = new Date(issued.getTime() + 300000),
        nonce = randomBytes(24).toString("hex");
      const message = createSiweMessage({
        address: input.address as Hex,
        chainId: input.chainId,
        domain: new URL(origin).host,
        uri: origin,
        version: "1",
        nonce,
        issuedAt: issued,
        expirationTime: expires,
        statement:
          "Sign in to this application. This does not authorize a transaction.",
      });
      const data = await sql.begin(async (tx) => {
        await tx`select id from nazu_cloud.projects where id=${p.id} for update`;
        const [count] =
          await tx`select count(*)::int as n from nazu_cloud.wallet_challenges where project_id=${p.id} and issued_at>now()-interval '1 minute'`;
        if (count.n >= 30)
          throw new ApiError(429, "RATE_LIMITED", "Challenge limit exceeded");
        const [c] =
          await tx`insert into nazu_cloud.wallet_challenges(organization_id,project_id,address,chain_id,origin,message,nonce,issued_at,expires_at) values (${p.organization_id},${p.id},${address.toLowerCase()},${chainId},${origin},${message},${nonce},${issued},${expires}) returning id,message`;
        return c;
      });
      return Response.json({ data }, { headers });
    }
    if (action === "verify") {
      if (!input.challengeId || !input.signature)
        throw new ApiError(
          400,
          "INVALID_INPUT",
          "Challenge and signature required",
        );
      const [c] =
        await sql`select * from nazu_cloud.wallet_challenges where id=${input.challengeId} and project_id=${p.id} and origin=${origin} and used_at is null and expires_at>now() and issued_at<=now()`;
      if (!c)
        throw new ApiError(
          401,
          "INVALID_CHALLENGE",
          "Challenge expired or already used",
        );
      const map = JSON.parse(
        process.env.WALLET_CHAIN_RPC_JSON ?? "{}",
      ) as Record<string, string>;
      const rpc = map[String(c.chain_id)];
      if (!rpc)
        throw new ApiError(
          503,
          "NOT_CONFIGURED",
          "Chain verification unavailable",
        );
      const client = createPublicClient({
        transport: http(rpc, { timeout: 8000, retryCount: 0 }),
      });
      const valid = await client.verifySiweMessage({
        message: c.message,
        signature: input.signature as Hex,
        address: c.address as Hex,
        domain: new URL(origin).host,
        nonce: c.nonce,
        time: new Date(),
      });
      if (!valid)
        throw new ApiError(
          401,
          "INVALID_SIGNATURE",
          "Signature verification failed",
        );
      const token = randomBytes(32).toString("base64url");
      const expires = new Date(Date.now() + 3600000);
      await sql.begin(async (tx) => {
        const consumed =
          await tx`update nazu_cloud.wallet_challenges set used_at=now() where id=${c.id} and used_at is null and expires_at>now() returning id`;
        if (!consumed.length)
          throw new ApiError(
            401,
            "REPLAYED_CHALLENGE",
            "Challenge already consumed",
          );
        await tx`insert into nazu_cloud.wallet_sessions(organization_id,project_id,address,origin,token_hash,expires_at) values (${p.organization_id},${p.id},${c.address},${origin},${hashSecret(token)},${expires})`;
      });
      return Response.json(
        { data: { token, expiresAt: expires, address: c.address } },
        { headers },
      );
    }
    if (action === "logout") {
      const token = req.headers.get("authorization")?.replace(/^Bearer /, "");
      if (!token)
        throw new ApiError(401, "UNAUTHENTICATED", "Session token required");
      await sql`update nazu_cloud.wallet_sessions set revoked_at=now() where token_hash=${hashSecret(token)} and project_id=${p.id} and origin=${origin}`;
      return new Response(null, { status: 204, headers });
    }
    throw new ApiError(404, "NOT_FOUND", "Unknown authentication action");
  } catch (e) {
    return errorResponse(e);
  }
}
export async function GET(req: Request, ctx: Context) {
  try {
    if ((await ctx.params).action !== "session")
      throw new ApiError(404, "NOT_FOUND", "Unknown authentication action");
    const projectId = z
      .uuid()
      .parse(new URL(req.url).searchParams.get("projectId"));
    const { p, origin } = await originProject(req, projectId);
    const token = req.headers.get("authorization")?.replace(/^Bearer /, "");
    if (!token)
      throw new ApiError(401, "UNAUTHENTICATED", "Session token required");
    const [session] =
      await db()`select address,expires_at from nazu_cloud.wallet_sessions where token_hash=${hashSecret(token)} and project_id=${p.id} and origin=${origin} and revoked_at is null and expires_at>now()`;
    if (!session)
      throw new ApiError(
        401,
        "INVALID_SESSION",
        "Session is invalid or expired",
      );
    return Response.json(
      { data: session },
      {
        headers: {
          "Access-Control-Allow-Origin": origin,
          Vary: "Origin",
          "Cache-Control": "no-store",
        },
      },
    );
  } catch (e) {
    return errorResponse(e);
  }
}
