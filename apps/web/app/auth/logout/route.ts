import { NextResponse } from "next/server";
import { supabase, sameOrigin } from "../../../lib/auth";
import { errorResponse } from "../../../lib/api";
export async function POST(req: Request) {
  try {
    sameOrigin(req);
    await (await supabase()).auth.signOut();
    return NextResponse.redirect(new URL("/login", req.url), 303);
  } catch (e) {
    return errorResponse(e);
  }
}
