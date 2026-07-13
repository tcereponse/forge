import { NextRequest, NextResponse } from "next/server";
import { withCORS, handlePreflight } from "@/lib/cors";
import { bridgeState } from "@/lib/bridge-state";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function OPTIONS() { return handlePreflight(); }

export async function POST(req: NextRequest) {
  const body = await req.json();
  const content = body.content || body.response || "";

  // Check if this is a one-shot capture (phase 10)
  const m = await bridgeState.getMission();
  if (m && m.phase === 10) {
    const result = await bridgeState.submitOneShotCapture(content);
    if (!result.success) {
      return withCORS(NextResponse.json({ success: false, error: "No active one-shot mission" }, { status: 400 }));
    }
    return withCORS(NextResponse.json({ success: true, mode: "oneshot", phase: 10 }));
  }

  // Normal mission capture (phase 1 → 2 → 5)
  const result = await bridgeState.capture(content);
  if (!result) return withCORS(NextResponse.json({ success: false, error: "No active mission" }, { status: 400 }));
  return withCORS(NextResponse.json({ success: true, ...result }));
}
