import { NextResponse } from "next/server";
import { withCORS, handlePreflight } from "@/lib/cors";
import { bridgeState } from "@/lib/bridge-state";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function OPTIONS() { return handlePreflight(); }

export async function GET() {
  const m = await bridgeState.getMission();
  if (!m || !m.currentPrompt) return withCORS(NextResponse.json({ status: "idle", prompt: null, phase: 0 }));
  return withCORS(NextResponse.json({ status: m.status, prompt: m.currentPrompt, phase: m.phase, phase_num: m.phase, projectId: m.id }));
}
