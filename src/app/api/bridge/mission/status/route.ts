import { NextResponse } from "next/server";
import { bridgeState } from "@/lib/bridge-state";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET() {
  const m = bridgeState.getMission();
  if (!m) return NextResponse.json({ status: "idle", phase: 0 });
  return NextResponse.json({
    status: m.status, phase: m.phase,
    phaseName: m.phase === 1 ? "PRD Generation" : m.phase === 2 ? "Code Generation" : m.phase === 5 ? "Done" : "Unknown",
    prd: m.prd, files: m.files, fileCount: m.files.length,
    capturedLength: m.capturedContent.length, missionId: m.id, name: m.name, projectId: m.projectId,
  });
}
