import { NextRequest, NextResponse } from "next/server";
import { deleteSession, getTokenFromRequest } from "@/lib/auth";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const token = getTokenFromRequest(request);
  await deleteSession(token);
  const response = NextResponse.json({ success: true });
  response.cookies.delete("auth-token");
  return response;
}
