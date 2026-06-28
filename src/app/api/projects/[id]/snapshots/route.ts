import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/projects/[id]/snapshots — list all snapshots for a project (newest first)
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const project = await db.project.findUnique({ where: { id } });
    if (!project) {
      return NextResponse.json(
        { success: false, error: "Projet introuvable" },
        { status: 404 }
      );
    }
    const snapshots = await db.snapshot.findMany({
      where: { projectId: id },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        label: true,
        fileCount: true,
        note: true,
        createdAt: true,
      },
    });
    return NextResponse.json({ success: true, snapshots });
  } catch (error) {
    console.error("[/api/projects/[id]/snapshots GET]", error);
    return NextResponse.json(
      { success: false, error: "Impossible de charger les snapshots" },
      { status: 500 }
    );
  }
}

// POST /api/projects/[id]/snapshots — create a snapshot from the project's current files
// Body: { label?: string, note?: string }
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const project = await db.project.findUnique({ where: { id } });
    if (!project) {
      return NextResponse.json(
        { success: false, error: "Projet introuvable" },
        { status: 404 }
      );
    }
    if (project.status !== "ready" || project.fileCount === 0) {
      return NextResponse.json(
        { success: false, error: "Le projet n'a pas encore de fichiers à sauvegarder" },
        { status: 400 }
      );
    }

    let body: { label?: string; note?: string } = {};
    try {
      body = await request.json();
    } catch {
      // empty body is fine
    }

    const label =
      (body.label && String(body.label).trim().slice(0, 80)) ||
      `Snapshot ${new Date().toLocaleString("fr-FR", {
        day: "2-digit",
        month: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      })}`;
    const note = body.note ? String(body.note).trim().slice(0, 280) : "";

    const snapshot = await db.snapshot.create({
      data: {
        projectId: id,
        label,
        note,
        filesJson: project.filesJson,
        fileCount: project.fileCount,
        prd: project.prd,
      },
      select: {
        id: true,
        label: true,
        fileCount: true,
        note: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ success: true, snapshot });
  } catch (error) {
    console.error("[/api/projects/[id]/snapshots POST]", error);
    return NextResponse.json(
      { success: false, error: "Impossible de créer le snapshot" },
      { status: 500 }
    );
  }
}
