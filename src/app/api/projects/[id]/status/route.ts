import { NextRequest, NextResponse } from "next/server";
import { getReconciledStatus } from "@/lib/workspace";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const status = await getReconciledStatus(id);
    return NextResponse.json({
      success: true,
      install: {
        status: status.install,
        log: status.installLog,
      },
      build: {
        status: status.build,
        log: status.buildLog,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Impossible de récupérer le statut" },
      { status: 500 }
    );
  }
}
