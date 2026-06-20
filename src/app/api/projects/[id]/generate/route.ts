import { NextRequest, NextResponse } from "next/server";
import ZAI from "z-ai-web-dev-sdk";
import { db } from "@/lib/db";
import {
  type GeneratedFile,
  type ProjectConfig,
  buildStackDirective,
  inferLanguage,
} from "@/lib/forge-config";

export const runtime = "nodejs";
export const maxDuration = 120;

interface RawFile {
  path: string;
  content?: string;
  language?: string;
}

interface GeneratedPayload {
  files?: RawFile[];
  prd?: string;
  summary?: string;
}

function extractJson(text: string): unknown | null {
  // Strip markdown code fences if present
  let cleaned = text.trim();
  const fenceMatch = cleaned.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenceMatch) {
    cleaned = fenceMatch[1].trim();
  }

  // Try direct parse first
  try {
    return JSON.parse(cleaned);
  } catch {
    /* continue */
  }

  // Try to find the first { ... last }
  const first = cleaned.indexOf("{");
  const last = cleaned.lastIndexOf("}");
  if (first !== -1 && last !== -1 && last > first) {
    try {
      return JSON.parse(cleaned.slice(first, last + 1));
    } catch {
      /* continue */
    }
  }

  // Truncated JSON repair: try to close incomplete files array.
  // Pattern: { "files": [ { "path": "...", "content": "...", ... }, ... (truncated)
  // We find complete file objects and reconstruct a valid array.
  const filesStart = cleaned.indexOf('"files"');
  if (filesStart !== -1) {
    const arrayStart = cleaned.indexOf("[", filesStart);
    if (arrayStart !== -1) {
      const files: RawFile[] = [];
      // Match individual file objects: { "path": "...", "content": "...", "language": "..." }
      // Use a regex to find complete file objects with path + content
      const fileRegex =
        /\{\s*"path"\s*:\s*"((?:[^"\\]|\\.)*)"\s*,\s*"content"\s*:\s*"((?:[^"\\]|\\.)*)"(?:\s*,\s*"language"\s*:\s*"((?:[^"\\]|\\.)*)")?\s*\}/g;
      let match: RegExpExecArray | null;
      while ((match = fileRegex.exec(cleaned)) !== null) {
        files.push({
          path: match[1].replace(/\\(.)/g, "$1"),
          content: match[2].replace(/\\(.)/g, "$1"),
          language: match[3] ? match[3].replace(/\\(.)/g, "$1") : undefined,
        });
      }
      if (files.length > 0) {
        return { files };
      }
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
    files.push({
      path,
      content: String(rf.content ?? ""),
      language: rf.language || inferLanguage(path),
    });
  }
  return files;
}

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

    // Mark as generating
    await db.project.update({
      where: { id },
      data: { status: "generating" },
    });

    const config: ProjectConfig = {
      name: project.name,
      description: project.description,
      stack: project.stack as ProjectConfig["stack"],
      typescript: project.typescript,
      styling: project.styling as ProjectConfig["styling"],
      routing: project.routing as ProjectConfig["routing"],
      stateMgmt: project.stateMgmt as ProjectConfig["stateMgmt"],
      uiLib: project.uiLib as ProjectConfig["uiLib"],
      features: JSON.parse(project.features || "[]"),
    };

    const stackDirective = buildStackDirective(config);
    const tsExt = config.typescript ? "tsx" : "jsx";
    const tsOrJs = config.typescript ? "ts" : "js";

    // ───── PHASE 1: PRD (Product Requirements Document) ─────
    const prdSystem =
      "Tu es un Ingénieur Senior React. Tu rédiges des PRD techniques concis en Markdown français. Tu réponds sans introduction ni conclusion, directement avec le contenu demandé.";
    const prdUser = `Rédige un PRD technique concis en Markdown français pour l'application suivante.

Application : "${config.name}"
Vision : "${config.description}"
${stackDirective}

Format Markdown (max 250 mots) :
## Objectif
(1-2 phrases)
## Fonctionnalités clés
(liste à puces, 4-6 points)
## Architecture
(2-3 phrases sur la structure des dossiers et modules clés)
## Pages/Composants principaux
(liste)

Sois factuel et concis.`;

    const zai = await ZAI.create();

    const prdCompletion = await zai.chat.completions.create({
      messages: [
        { role: "assistant", content: prdSystem },
        { role: "user", content: prdUser },
      ],
      thinking: { type: "disabled" },
    });
    const prd = prdCompletion.choices[0]?.message?.content ?? "";

    // ───── PHASE 2: Code generation (structured JSON) ─────
    const fileStructureHint =
      config.stack === "next"
        ? `Structure Next.js (app router): app/layout.tsx, app/page.tsx, app/globals.css, components/, lib/, package.json, next.config.js, tsconfig.json${
            config.styling === "tailwind" ? ", tailwind.config.ts, postcss.config.js" : ""
          }`
        : `Structure Vite (FLAT, fichiers de config à la racine, code dans src/): index.html, vite.config.${tsOrJs}, tsconfig.json${
            config.typescript ? ", tsconfig.node.json" : ""
          }, package.json${
            config.styling === "tailwind"
              ? `, tailwind.config.${tsOrJs}, postcss.config.js`
              : ""
          }, src/main.${tsExt}, src/App.${tsExt}, src/index.css, src/components/, src/pages/${
            config.routing === "router" ? ", src/router.tsx" : ""
          }${config.stateMgmt === "zustand" ? ", src/store/" : ""}`;

    const codePrompt = `Génère un projet React COMPLET et FONCTIONNEL pour l'application décrite. Réponds UNIQUEMENT avec du JSON valide, AUCUN texte autour, AUCUN markdown.

Application : "${config.name}"
Description : "${config.description}"
${stackDirective}

Génère EXACTEMENT ces 6 fichiers (ni plus, ni moins) :
1. "package.json" — dépendances complètes avec versions
2. "index.html" — point d'entrée HTML avec <div id="root">
3. "src/main.${tsExt}" — rendu React (createRoot)
4. "src/App.${tsExt}" — composant principal AVEC LOGIQUE MÉTIER liée à l'app (pas juste Hello World)
5. "src/components/MainComponent.${tsExt}" — un composant métier clé (ex: TaskList, RecipeCard, ChatWindow selon l'app)
6. "src/index.css" — styles (${config.styling === "tailwind" ? "directives Tailwind @tailwind base/components/utilities + styles globaux" : "CSS global"})

RÈGLES :
- Code COMPLET, fonctionnel, prêt à npm install && npm run dev.
- Composants PascalCase, liés à l'app décrite (todo→TaskList, recipes→RecipeCard, etc.).
- ${config.typescript ? "TypeScript : interfaces pour les props, typage explicite." : "JavaScript ES6+."}
- ${config.styling === "tailwind" ? "Utilise des classes Tailwind pour TOUT le style." : config.styling === "css" ? "CSS Modules pour le style." : "Styled Components."}
- ${config.routing === "router" ? "Intègre react-router-dom v6 (HashRouter) dans App avec 2 routes." : "Pas de routing, single page."}
- Échappe les guillemets dans le JSON (utilise \\" pour les guillemets dans le code).
- Garde chaque fichier CONCIS mais complet (évite le code inutilement long).

Format JSON EXACT (commence par { et finis par }) :
{"files":[{"path":"package.json","content":"...","language":"json"},{"path":"index.html","content":"...","language":"html"},{"path":"src/main.${tsExt}","content":"...","language":"${tsExt}"},{"path":"src/App.${tsExt}","content":"...","language":"${tsExt}"},{"path":"src/components/MainComponent.${tsExt}","content":"...","language":"${tsExt}"},{"path":"src/index.css","content":"...","language":"css"}]}

Réponds MAINTENANT avec uniquement l'objet JSON.`;

    const codeCompletion = await zai.chat.completions.create({
      messages: [
        {
          role: "assistant",
          content:
            "Tu es un générateur de code React expert. Tu réponds UNIQUEMENT par du JSON valide, jamais de texte autour, jamais de markdown.",
        },
        { role: "user", content: codePrompt },
      ],
      thinking: { type: "disabled" },
    });

    const rawResponse = codeCompletion.choices[0]?.message?.content ?? "";
    const parsed = extractJson(rawResponse) as GeneratedPayload | null;

    if (!parsed || !Array.isArray(parsed.files) || parsed.files.length === 0) {
      await db.project.update({
        where: { id },
        data: {
          status: "failed",
          prd,
        },
      });
      return NextResponse.json(
        {
          success: false,
          error:
            "L'IA n'a pas retourné de fichiers valides. Réessaie avec une description plus précise.",
          prd,
          rawExcerpt: rawResponse.slice(0, 500),
        },
        { status: 422 }
      );
    }

    const files = parseFiles(parsed.files);

    if (files.length === 0) {
      await db.project.update({
        where: { id },
        data: { status: "failed", prd },
      });
      return NextResponse.json(
        { success: false, error: "Aucun fichier valide généré.", prd },
        { status: 422 }
      );
    }

    await db.project.update({
      where: { id },
      data: {
        status: "ready",
        prd,
        filesJson: JSON.stringify(files),
        fileCount: files.length,
      },
    });

    return NextResponse.json({
      success: true,
      project: {
        ...project,
        features: JSON.parse(project.features || "[]"),
        prd,
        files,
        fileCount: files.length,
        status: "ready" as const,
      },
    });
  } catch (error) {
    console.error("[/api/projects/[id]/generate]", error);
    // Mark as failed if possible
    try {
      const { id } = await params;
      await db.project.update({
        where: { id },
        data: { status: "failed" },
      });
    } catch {
      /* ignore */
    }
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Échec de la génération du projet",
      },
      { status: 500 }
    );
  }
}
