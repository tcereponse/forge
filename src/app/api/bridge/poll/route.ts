import { NextResponse } from "next/server";
import { bridgeState } from "@/lib/bridge-state";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET() {
  const m = await bridgeState.getMission();
  if (!m) return NextResponse.json({ status: "idle", phase_num: 0, phase: 0 });
  return NextResponse.json({ status: m.status, phase: m.phase, phase_num: m.phase, prompt: m.currentPrompt, projectId: m.id });
}
