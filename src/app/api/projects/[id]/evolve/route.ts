import { NextRequest, NextResponse } from "next/server";
import ZAI from "z-ai-web-dev-sdk";
import { db } from "@/lib/db";
import { type GeneratedFile, type ProjectConfig, buildStackDirective, inferLanguage } from "@/lib/forge-config";
import { buildExtensionDirective, getExtensionPacksSummary } from "@/lib/extension-parser";
import { unescapeJsonString } from "@/lib/forge-anticorruption";
import { writeProjectFiles, runInstall } from "@/lib/workspace";

export const runtime = "nodejs";
export const maxDuration = 120;

interface RawFile { path: string; content?: string; language?: string; }
interface GeneratedPayload { files?: RawFile[]; }

function extractJson(text: string): unknown | null {
  let cleaned = text.trim();
  const fenceMatch = cleaned.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenceMatch) cleaned = fenceMatch[1].trim();
  try { return JSON.parse(cleaned); } catch {}
  const first = cleaned.indexOf("{");
  const last = cleaned.lastIndexOf("}");
  if (first !== -1 && last !== -1 && last > first) {
    try { return JSON.parse(cleaned.slice(first, last + 1)); } catch {}
  }
  const filesStart = cleaned.indexOf('"files"');
  if (filesStart !== -1) {
    const arrayStart = cleaned.indexOf("[", filesStart);
    if (arrayStart !== -1) {
      const files: RawFile[] = [];
      const fileRegex = /\{\s*"path"\s*:\s*"((?:[^"\\]|\\.)*)"\s*,\s*"content"\s*:\s*"((?:[^"\\]|\\.)*)"(?:\s*,\s*"language"\s*:\s*"((?:[^"\\]|\\.)*)")?\s*\}/g;
      let match: RegExpExecArray | null;
      while ((match = fileRegex.exec(cleaned)) !== null) {
        files.push({ path: unescapeJsonString(match[1]), content: unescapeJsonString(match[2]), language: match[3] ? unescapeJsonString(match[3]) : undefined });
      }
      if (files.length > 0) return { files };
    }
  }
  return null;
}

function parseFiles(raw: unknown): GeneratedFile[] {
  if (!Array.isArray(raw)) return [];
  const seen = new Set<string>();
  const files: GeneratedFile[] = [];
  for (const f of raw) {
    if (typeof f !== "object" || f === null || !("path" in f)) continue;
    const rf = f as RawFile;
    const path = String(rf.path).replace(/^\.?\//, "").trim();
    if (!path || seen.has(path)) continue;
    seen.add(path);
    files.push({ path, content: String(rf.content ?? ""), language: rf.language || inferLanguage(path) });
  }
  return files;
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { addFeatures = [], addPacks = [], newDescription = "" } = body as { addFeatures?: string[]; addPacks?: string[]; newDescription?: string };

    const project = await db.project.findUnique({ where: { id } });
    if (!project) return NextResponse.json({ success: false, error: "Projet introuvable" }, { status: 404 });

    const existingFeatures: string[] = JSON.parse(project.features || "[]");
    const existingPacks: string[] = JSON.parse(project.selectedPacks || "[]");
    const allFeatures = [...new Set([...existingFeatures, ...addFeatures])];
    const allPacks = [...new Set([...existingPacks, ...addPacks])];

    const existingFiles: GeneratedFile[] = (() => {
      try {
        const v = JSON.parse(project.filesJson);
        return Array.isArray(v) ? v.map((f: RawFile) => ({ path: String(f.path), content: String(f.content ?? ""), language: f.language || inferLanguage(String(f.path)) })) : [];
      } catch { return []; }
    })();

    const config: ProjectConfig = {
      name: project.name, description: newDescription || project.description,
      stack: project.stack as ProjectConfig["stack"], typescript: project.typescript,
      styling: project.styling as ProjectConfig["styling"], routing: project.routing as ProjectConfig["routing"],
      stateMgmt: project.stateMgmt as ProjectConfig["stateMgmt"], uiLib: project.uiLib as ProjectConfig["uiLib"],
      features: allFeatures, selectedPacks: allPacks,
    };

    const tsExt = config.typescript ? "tsx" : "jsx";
    const extensionDirective = await buildExtensionDirective(allFeatures, allPacks);
    const extPacksSummary = await getExtensionPacksSummary();
    const packNames = allPacks.map((pid) => { const pack = extPacksSummary.find((p) => p.id === pid); return pack ? `${pack.name}` : pid; });
    const packDirective = packNames.length > 0 ? `\n## PACKS (${packNames.length}): ${packNames.join(", ")}` : "";

    const existingCodeSummary = existingFiles
      .filter((f) => f.path.startsWith("src/") && (f.language === "tsx" || f.language === "ts" || f.language === "jsx" || f.language === "javascript"))
      .map((f) => `### ${f.path} (${f.content.split("\n").length} lignes)\n${f.content.slice(0, 800)}${f.content.length > 800 ? "\n// ... (tronqué)" : ""}`)
      .join("\n\n");

    const evolvePrompt = `Tu es un développeur React Senior. Le projet "${config.name}" existe déjà et doit ÉVOLUER.

## ÉVOLUTION DEMANDÉE
${addFeatures.length > 0 ? `Nouvelles fonctionnalités: ${addFeatures.join(", ")}\n` : ""}${addPacks.length > 0 ? `Nouveaux packs: ${addPacks.join(", ")}\n` : ""}${newDescription ? `Nouvelle vision: ${newDescription}\n` : ""}

## CONTEXTE
${buildStackDirective(config)}
${extensionDirective}
${packDirective}

## CODE EXISTANT
${existingCodeSummary}

## MISSION
Génère les fichiers MIS À JOUR qui préservent le code existant et ajoutent les nouvelles fonctionnalités.
Si tu importes un composant, tu DOIS le créer.
Format JSON: {"files":[{"path":"...","content":"...","language":"..."}]}`;

    const zai = await ZAI.create();
    const completion = await zai.chat.completions.create({
      messages: [
        { role: "assistant", content: "Tu es un développeur React Senior. Tu fais évoluer un projet. Tu réponds UNIQUEMENT par du JSON valide." },
        { role: "user", content: evolvePrompt },
      ],
      thinking: { type: "disabled" },
    });

    const raw = completion.choices[0]?.message?.content ?? "";
    const parsed = extractJson(raw) as GeneratedPayload | null;
    if (!parsed?.files || !Array.isArray(parsed.files) || parsed.files.length === 0) {
      return NextResponse.json({ success: false, error: "Évolution échouée" }, { status: 422 });
    }

    const newFiles = parseFiles(parsed.files);
    const newPaths = new Set(newFiles.map((f) => f.path));
    const mergedFiles: GeneratedFile[] = [
      ...existingFiles.filter((f) => !newPaths.has(f.path) && !f.path.endsWith(".css") && f.path.startsWith("src/")),
      ...newFiles,
    ];

    await db.project.update({
      where: { id },
      data: { features: JSON.stringify(allFeatures), selectedPacks: JSON.stringify(allPacks), description: config.description, filesJson: JSON.stringify(mergedFiles), fileCount: mergedFiles.length, buildStatus: "pending" },
    });

    try { await writeProjectFiles(id, mergedFiles); runInstall(id); } catch (e) { console.error("[evolve] write failed:", e); }

    return NextResponse.json({ success: true, project: { ...project, features: allFeatures, selectedPacks: allPacks, description: config.description, files: mergedFiles, fileCount: mergedFiles.length } });
  } catch (error) {
    console.error("[/api/projects/[id]/evolve]", error);
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : "Échec" }, { status: 500 });
  }
}
