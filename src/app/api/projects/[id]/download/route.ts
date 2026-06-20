import { NextRequest, NextResponse } from "next/server";
import JSZip from "jszip";
import { db } from "@/lib/db";
import { type GeneratedFile, inferLanguage } from "@/lib/forge-config";
import {
  createFullZipFromDisk,
  workspaceExists,
  nodeModulesExists,
} from "@/lib/workspace";

export const runtime = "nodejs";
export const maxDuration = 120;

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

    const url = new URL(request.url);
    const forceSourceOnly = url.searchParams.get("source") === "true";

    // Check if the workspace exists on disk with node_modules installed
    const wsExists = await workspaceExists(id);
    const hasNodeModules = await nodeModulesExists(id);
    // Full ZIP is available if node_modules exists on disk, regardless of
    // in-memory status (which resets on server restart).
    const canDownloadFull = !forceSourceOnly && wsExists && hasNodeModules;

    // ── Full ZIP (source + node_modules + dist) ──
    if (canDownloadFull) {
      const fullBuffer = await createFullZipFromDisk(id);
      if (fullBuffer) {
        const sizeMb = (fullBuffer.length / (1024 * 1024)).toFixed(1);
        return new NextResponse(fullBuffer as unknown as BodyInit, {
          status: 200,
          headers: {
            "Content-Type": "application/zip",
            "Content-Disposition": `attachment; filename="${project.slug}-full.zip"`,
            "Content-Length": String(fullBuffer.length),
            "X-Zip-Type": "full",
            "X-Zip-Size-Mb": sizeMb,
          },
        });
      }
    }

    // ── Source-only ZIP (fallback) ──
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
        "X-Zip-Type": "source",
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
