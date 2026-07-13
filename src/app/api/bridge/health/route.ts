import { NextResponse } from "next/server";
import { withCORS, handlePreflight } from "@/lib/cors";
import { bridgeState } from "@/lib/bridge-state";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function OPTIONS() { return handlePreflight(); }

export async function GET() {
  const m = await bridgeState.getMission();
  return withCORS(NextResponse.json({ service: "KIROV Bridge", status: "online", port: "integrated", mission: m ? { id: m.id, phase: m.phase, status: m.status } : null }));
}
