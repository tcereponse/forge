import { NextResponse } from "next/server";
import { getExtensionPacksSummary, FEATURE_PACK_MAP } from "@/lib/extension-parser";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const packs = await getExtensionPacksSummary();
    return NextResponse.json({
      success: true,
      packs,
      featureMap: FEATURE_PACK_MAP,
      totalPacks: packs.length,
      totalPRDs: packs.reduce((acc, p) => acc + p.prdCount, 0),
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Impossible de charger les extensions" },
      { status: 500 }
    );
  }
}
