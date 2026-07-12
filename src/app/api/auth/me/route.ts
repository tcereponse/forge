import { NextRequest, NextResponse } from "next/server";
import { getSession, getTokenFromRequest } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const token = getTokenFromRequest(request);
  const session = await getSession(token);
  return NextResponse.json({
    authenticated: !!session,
    user: session ? { id: session.userId, username: session.username } : null,
  });
}
