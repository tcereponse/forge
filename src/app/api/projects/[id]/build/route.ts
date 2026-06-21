import { NextRequest, NextResponse } from "next/server";
import { runBuild, nodeModulesExists } from "@/lib/workspace";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Check disk reality: node_modules must exist to build
    const hasNm = await nodeModulesExists(id);
    if (!hasNm) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Les dépendances doivent être installées d'abord. Attends la fin de npm install ou réessaie.",
        },
        { status: 400 }
      );
    }

    await runBuild(id);
    return NextResponse.json({
      success: true,
      message: "Build démarré",
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Impossible de démarrer le build" },
      { status: 500 }
    );
  }
}
