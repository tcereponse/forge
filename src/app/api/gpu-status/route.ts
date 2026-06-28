// GPU Status API route
// Returns GPU service capabilities for the UI badge

import { NextResponse } from "next/server";
import { getGpuStatusForUI } from "@/lib/gpu/client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const status = await getGpuStatusForUI();
    return NextResponse.json({
      success: true,
      ...status,
    });
  } catch {
    return NextResponse.json({
      success: true,
      available: false,
      backend: "zai-cloud",
      mode: "auto",
      active: false,
      totalRequests: 0,
      gpuRequests: 0,
      cpuFallbacks: 0,
    });
  }
}
