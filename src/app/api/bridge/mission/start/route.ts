import { NextRequest, NextResponse } from "next/server";
import { withCORS, handlePreflight } from "@/lib/cors";
import { bridgeState } from "@/lib/bridge-state";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function OPTIONS() { return handlePreflight(); }

export async function POST(req: NextRequest) {
  const body = await req.json();
  const m = await bridgeState.startMission(body.name || "Untitled", body.prompt || body.vision || "", body.projectId);
  return withCORS(NextResponse.json({ success: true, missionId: m.id, phase: 1 }));
}
