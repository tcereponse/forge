import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/projects/[id]/snapshots/[sid] — fetch a single snapshot (full files)
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; sid: string }> }
) {
  try {
    const { id, sid } = await params;
    const snapshot = await db.snapshot.findFirst({
      where: { id: sid, projectId: id },
    });
    if (!snapshot) {
      return NextResponse.json(
        { success: false, error: "Snapshot introuvable" },
        { status: 404 }
      );
    }
    let files: unknown[] = [];
    try {
      files = JSON.parse(snapshot.filesJson);
    } catch {
      files = [];
    }
    return NextResponse.json({
      success: true,
      snapshot: {
        id: snapshot.id,
        label: snapshot.label,
        note: snapshot.note,
        fileCount: snapshot.fileCount,
        createdAt: snapshot.createdAt,
        files,
        prd: snapshot.prd,
      },
    });
  } catch (error) {
    console.error("[/api/projects/[id]/snapshots/[sid] GET]", error);
    return NextResponse.json(
      { success: false, error: "Impossible de charger le snapshot" },
      { status: 500 }
    );
  }
}

// POST /api/projects/[id]/snapshots/[sid]/restore — overwrite the project's
// current files with the snapshot's files. Returns the updated project.
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; sid: string }> }
) {
  try {
    const { id, sid } = await params;
    const snapshot = await db.snapshot.findFirst({
      where: { id: sid, projectId: id },
    });
    if (!snapshot) {
      return NextResponse.json(
        { success: false, error: "Snapshot introuvable" },
        { status: 404 }
      );
    }

    // Restore: overwrite project files + prd with snapshot content.
    // We keep the rest of the project config intact (stack, features, etc.).
    await db.project.update({
      where: { id },
      data: {
        filesJson: snapshot.filesJson,
        fileCount: snapshot.fileCount,
        prd: snapshot.prd,
        status: "ready",
        // Reset build status — the restored files need to be re-installed/built
        buildStatus: "pending",
        installStatus: "pending",
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      message: `Projet restauré au snapshot « ${snapshot.label} »`,
    });
  } catch (error) {
    console.error("[/api/projects/[id]/snapshots/[sid] restore]", error);
    return NextResponse.json(
      { success: false, error: "Impossible de restaurer le snapshot" },
      { status: 500 }
    );
  }
}

// DELETE /api/projects/[id]/snapshots/[sid] — delete a snapshot
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; sid: string }> }
) {
  try {
    const { id, sid } = await params;
    const snapshot = await db.snapshot.findFirst({
      where: { id: sid, projectId: id },
    });
    if (!snapshot) {
      return NextResponse.json(
        { success: false, error: "Snapshot introuvable" },
        { status: 404 }
      );
    }
    await db.snapshot.delete({ where: { id: sid } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[/api/projects/[id]/snapshots/[sid] DELETE]", error);
    return NextResponse.json(
      { success: false, error: "Impossible de supprimer le snapshot" },
      { status: 500 }
    );
  }
}
