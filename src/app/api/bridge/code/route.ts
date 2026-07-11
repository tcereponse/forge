import { NextRequest, NextResponse } from "next/server";
import { bridgeState } from "@/lib/bridge-state";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function POST(req: NextRequest) {
  const body = await req.json();
  const content = body.content || body.response || "";
  const result = bridgeState.capture(content);
  if (!result) return NextResponse.json({ success: false, error: "No active mission" }, { status: 400 });
  return NextResponse.json({ success: true, ...result });
}
