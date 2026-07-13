import { NextResponse } from "next/server";
import { bridgeState } from "@/lib/bridge-state";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET() {
  const m = await bridgeState.getMission();
  return NextResponse.json({ service: "KIROV Bridge", status: "online", port: "integrated", mission: m ? { id: m.id, phase: m.phase, status: m.status } : null });
}
