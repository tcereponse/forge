import { NextResponse } from "next/server";
import { bridgeState } from "@/lib/bridge-state";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function POST() {
  bridgeState.reset();
  return NextResponse.json({ success: true });
}
