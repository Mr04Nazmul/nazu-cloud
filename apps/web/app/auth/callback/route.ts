import { NextResponse } from "next/server";
import { supabase } from "../../../lib/auth";
export async function GET(req: Request) {
  const u = new URL(req.url);
  const code = u.searchParams.get("code");
  if (code) {
    try {
      const client = await supabase();
      const { error } = await client.auth.exchangeCodeForSession(code);
      if (!error) {
        const next = u.searchParams.get("next");
        return NextResponse.redirect(
          new URL(next === "/reset-password" ? next : "/onboarding", u.origin),
        );
      }
    } catch {}
  }
  return NextResponse.redirect(new URL("/login?error=callback", u.origin));
}
