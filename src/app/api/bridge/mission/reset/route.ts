import { NextResponse } from "next/server";
import { withCORS, handlePreflight } from "@/lib/cors";
import { bridgeState } from "@/lib/bridge-state";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function OPTIONS() { return handlePreflight(); }

export async function POST() {
  await bridgeState.reset();
  return withCORS(NextResponse.json({ success: true }));
}
