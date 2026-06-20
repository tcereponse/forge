import { NextRequest, NextResponse } from "next/server";
import JSZip from "jszip";
import { db } from "@/lib/db";
import { type GeneratedFile, inferLanguage } from "@/lib/forge-config";

export const runtime = "nodejs";
export const maxDuration = 60;

function parseFiles(s: string): GeneratedFile[] {
  try {
    const v = JSON.parse(s);
    if (!Array.isArray(v)) return [];
    return v
      .filter(
        (f): f is { path: string; content?: string; language?: string } =>
          typeof f === "object" && f !== null && "path" in f
      )
      .map((f) => ({
        path: String(f.path),
        content: String(f.content ?? ""),
        language: f.language || inferLanguage(String(f.path)),
      }));
  } catch {
    return [];
  }
}

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

    const files = parseFiles(project.filesJson);
    if (files.length === 0) {
      return NextResponse.json(
        { success: false, error: "Aucun fichier à télécharger. Génère le projet d'abord." },
        { status: 400 }
      );
    }

    const zip = new JSZip();
    const root = zip.folder(project.slug) ?? zip;

    for (const file of files) {
      root.file(file.path, file.content);
    }

    // Add a README
    root.file(
      "README.md",
      `# ${project.name}\n\n${project.description}\n\n## Stack\n\n- ${project.stack} + React 18${project.typescript ? " + TypeScript" : ""}\n- Styling: ${project.styling}\n- Routing: ${project.routing}\n- State: ${project.stateMgmt}\n- UI: ${project.uiLib}\n${JSON.parse(project.features || "[]").length > 0 ? `- Features: ${JSON.parse(project.features || "[]").join(", ")}\n` : ""}\n## Démarrage\n\n\`\`\`bash\nnpm install\nnpm run dev\n\`\`\`\n\n---\nGénéré par React Forge le ${new Date().toLocaleString("fr-FR")}.\n`
    );

    const buffer = await zip.generateAsync({ type: "nodebuffer" });

    return new NextResponse(buffer as unknown as BodyInit, {
      status: 200,
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="${project.slug}.zip"`,
        "Content-Length": String(buffer.length),
      },
    });
  } catch (error) {
    console.error("[/api/projects/[id]/download]", error);
    return NextResponse.json(
      { success: false, error: "Impossible de générer le ZIP" },
      { status: 500 }
    );
  }
}
