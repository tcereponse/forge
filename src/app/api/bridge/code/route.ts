import { NextRequest, NextResponse } from "next/server";
import { withCORS, handlePreflight } from "@/lib/cors";
import { bridgeState } from "@/lib/bridge-state";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function OPTIONS() { return handlePreflight(); }

export async function POST(req: NextRequest) {
  const body = await req.json();
  const content = body.content || body.response || "";
  const result = await bridgeState.capture(content);
  if (!result) return withCORS(NextResponse.json({ success: false, error: "No active mission" }, { status: 400 }));
  return withCORS(NextResponse.json({ success: true, ...result }));
}
