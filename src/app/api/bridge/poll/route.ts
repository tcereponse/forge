import { NextResponse } from "next/server";
import { withCORS, handlePreflight } from "@/lib/cors";
import { bridgeState } from "@/lib/bridge-state";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function OPTIONS() { return handlePreflight(); }

export async function GET() {
  const m = await bridgeState.getMission();
  if (!m) return withCORS(NextResponse.json({ status: "idle", phase_num: 0, phase: 0 }));
  return withCORS(NextResponse.json({ status: m.status, phase: m.phase, phase_num: m.phase, prompt: m.currentPrompt, projectId: m.id }));
}
