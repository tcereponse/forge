import { NextRequest, NextResponse } from "next/server";
import { runBuild, getProcessStatus } from "@/lib/workspace";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const status = getProcessStatus(id);

    if (status.install !== "installed") {
      return NextResponse.json(
        {
          success: false,
          error:
            "Les dépendances doivent être installées d'abord. Attends la fin de npm install ou réessaie.",
        },
        { status: 400 }
      );
    }

    runBuild(id);
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
