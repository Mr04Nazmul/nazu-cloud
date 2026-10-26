import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
export async function proxy(request: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL,
    key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) return NextResponse.next();
  let response = NextResponse.next({ request });
  const client = createServerClient(url, key, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll(values) {
        for (const v of values) request.cookies.set(v.name, v.value);
        response = NextResponse.next({ request });
        for (const v of values)
          response.cookies.set(v.name, v.value, v.options);
      },
    },
  });
  const { data } = await client.auth.getUser();
  if (!data.user) {
    const login = NextResponse.redirect(new URL("/login", request.url));
    for (const c of response.cookies.getAll()) login.cookies.set(c);
    return login;
  }
  return response;
}
export const config = {
  matcher: ["/dashboard/:path*", "/onboarding", "/admin/:path*"],
};
