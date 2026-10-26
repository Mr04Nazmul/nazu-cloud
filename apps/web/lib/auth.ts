import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import {
  ApiError,
  authorize,
  type Role,
} from "../../../packages/shared/src/index";
import { db } from "../../../packages/database/src/index";
export async function supabase() {
  const jar = await cookies();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL,
    key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key)
    throw new ApiError(
      503,
      "NOT_CONFIGURED",
      "Developer authentication is not configured",
    );
  return createServerClient(url, key, {
    cookies: {
      getAll: () => jar.getAll(),
      setAll(values) {
        try {
          for (const v of values) jar.set(v.name, v.value, v.options);
        } catch {
          /* Server Components cannot write cookies; proxy refreshes protected routes. */
        }
      },
    },
  });
}
export async function userId() {
  const client = await supabase();
  const { data, error } = await client.auth.getUser();
  if (error || !data.user)
    throw new ApiError(401, "UNAUTHENTICATED", "Sign in to continue");
  return data.user.id;
}
export async function member(
  organizationId: string,
  action: "read" | "write" | "manage" = "read",
) {
  const id = await userId();
  const [row] =
    await db()`select role from nazu_cloud.organization_members where organization_id=${organizationId} and user_id=${id}`;
  authorize(row?.role as Role | undefined, action);
  return id;
}
export function sameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  if (!process.env.APP_ORIGIN || origin !== process.env.APP_ORIGIN)
    throw new ApiError(
      403,
      "ORIGIN_DENIED",
      "Request origin does not match this application",
    );
}
