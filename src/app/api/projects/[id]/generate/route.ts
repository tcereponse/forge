import { NextRequest, NextResponse } from "next/server";
import { ensureZaiConfig } from "@/lib/zai-config";
import ZAI from "z-ai-web-dev-sdk";
import { db } from "@/lib/db";
import {
  type GeneratedFile,
  type ProjectConfig,
  buildStackDirective,
  inferLanguage,
} from "@/lib/forge-config";
import { buildTemplateFiles, buildIndexCss } from "@/lib/forge-templates";
import { postProcessProject, type ValidationReport } from "@/lib/forge-postprocess";
import { unescapeJsonString } from "@/lib/forge-anticorruption";
import { writeProjectFiles, runInstall } from "@/lib/workspace";
import { buildExtensionDirective } from "@/lib/extension-parser";
import { generateArsenal } from "@/lib/forge-arsenal";

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
          path: unescapeJsonString(match[1]),
          content: unescapeJsonString(match[2]),
          language: match[3] ? unescapeJsonString(match[3]) : undefined,
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

// Build feature-specific instructions that tell the LLM HOW to implement each feature
function buildFeatureInstructions(features: string[], tsExt: string): string {
  if (features.length === 0) return "";

  const instructions: string[] = ["", "## FEATURES À IMPLÉMENTER (VRAIMENT FONCTIONNELLES)"];

  for (const feature of features) {
    const instruction = FEATURE_INSTRUCTIONS[feature];
    if (instruction) {
      instructions.push(`### ${feature}\n${instruction(tsExt)}`);
    }
  }

  return instructions.join("\n\n");
}

const FEATURE_INSTRUCTIONS: Record<string, (tsExt: string) => string> = {
  darkmode: () =>
    "IMPLÉMENTE un vrai toggle dark mode : useState pour le thème, bouton qui bascule la classe 'dark' sur document.documentElement, et utilise les classes 'dark:' de Tailwind. Le toggle doit être visible dans le header.",
  auth: () =>
    "IMPLÉMENTE une fausse authentification : un formulaire de login (email/password) avec useState pour l'utilisateur connecté. Affiche 'Connecté en tant que {email}' quand authentifié, sinon affiche le formulaire. Bouton de déconnexion.",
  api: () =>
    "IMPLÉMENTE une couche API : crée une fonction fetchProducts() qui simule un appel API avec setTimeout/Promise (données mockées). Affiche un état de chargement (loading) puis les données. Gère les erreurs.",
  forms: () =>
    "IMPLÉMENTE un formulaire avec react-hook-form : un formulaire d'ajout (nom, description) avec validation (champs requis), onSubmit qui ajoute à une liste. Affiche les erreurs de validation sous chaque champ.",
  charts: () =>
    "IMPLÉMENTE un graphique avec recharts : un BarChart ou LineChart avec données mockées (ex: ventes par mois). Importe BarChart/LineChart de recharts. ResponsiveContainer pour le redimensionnement.",
  tables: () =>
    "IMPLÉMENTE un tableau de données : affiche une liste de données dans un tableau HTML avec en-têtes triables (clique sur l'en-tête pour trier). Pagination simple (précédent/suivant) si plus de 10 lignes.",
  pwa: () =>
    "IMPLÉMENTE le support PWA : le manifest est géré par vite-plugin-pwa (déjà dans package.json). Ajoute un bouton 'Installer l'app' qui appelle le beforeinstallprompt event si disponible.",
  i18n: () =>
    "IMPLÉMENTE l'internationalisation : un sélecteur de langue (FR/EN) dans le header avec useState. Les textes principaux de l'app (titre, boutons) doivent changer de langue au clic. Utilise un objet de traduction simple.",
  tests: () =>
    "Les tests Vitest sont gérés séparément. Assure-toi que les fonctions principales (ajout, suppression, tri) sont exportables et testables. Évite la logique inline dans le JSX.",
  animations: () =>
    "IMPLÉMENTE des animations avec framer-motion : anime l'apparition des éléments (motion.div avec initial/animate), transitions au hover des boutons (whileHover), et animation de la liste (AnimatePresence pour les ajouts/suppressions).",
};

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
      selectedPacks: JSON.parse(project.selectedPacks || "[]"),
    };

    const stackDirective = buildStackDirective(config);
    const tsExt = config.typescript ? "tsx" : "jsx";
    const tsOrJs = config.typescript ? "ts" : "js";

    // Build extension directive first (needed for Arsenal + code generation)
    const extensionDirective = await buildExtensionDirective(
      config.features,
      config.selectedPacks ?? []
    );

    // ───── PHASE 1: Arsenal PRD Grade Diamond (10 structured documents) ─────
    // Generates 10 PRD documents that guide code generation with surgical precision.
    // Wrapped in try-catch: if Arsenal fails, we still generate the code.
    let arsenal;
    let prd = "";
    try {
      arsenal = await generateArsenal(config, extensionDirective);
      prd =
        arsenal.documents.find((d) => d.id === "vision")?.content ??
        arsenal.documents[0]?.content ??
        "";
    } catch (arsenalErr) {
      console.error("[generate] Arsenal failed, falling back:", arsenalErr);
      arsenal = { documents: [] };
    }

    // Build a condensed arsenal directive for Phase 2 (code generation)
    const arsenalDirective = arsenal.documents
      .map((d) => `### ${d.name}\n${d.content}`)
      .join("\n\n");

    // ───── PHASE 2: Code generation (LLM generates ONLY creative files) ─────
    // The LLM generates only App.tsx, MainComponent.tsx, and (optionally) index.css.
    // All config files (package.json, vite.config, tsconfig, tailwind.config,
    // postcss.config, index.html, main.tsx) are injected deterministically
    // via buildTemplateFiles() to guarantee the project is always runnable.
    const stylingRule =
      config.styling === "tailwind"
        ? "Utilise des classes Tailwind pour TOUT le style. N'utilise PAS @apply avec des classes personnalisées comme border-border — utilise directement les classes Tailwind standards (border, border-slate-200, etc.) ou des couleurs rgb(var(--primary))."
        : config.styling === "css"
          ? "Utilise des classes CSS normales (pas de Tailwind)."
          : "Utilise styled-components.";

    const routingRule =
      config.routing === "router"
        ? "Intègre react-router-dom v6 : utilise HashRouter dans App.tsx avec 2 routes (la route '/' affiche MainComponent, une seconde route '/about' ou similaire)."
        : "Pas de routing. App.tsx affiche directement MainComponent.";

    // Build extension directive (injects specialized PRD contexts for selected features AND manually selected packs)
    // Build feature-specific instructions
    const featureInstructions = buildFeatureInstructions(config.features, tsExt);

    const codePrompt = `Génère UNIQUEMENT 3 fichiers React pour l'application décrite. Réponds UNIQUEMENT avec du JSON valide, AUCUN texte autour, AUCUN markdown.

Application : "${config.name}"
Description : "${config.description}"
${stackDirective}
${featureInstructions}
${extensionDirective}

## ARSENAL PRD GRADE DIAMOND (Documents de référence)
Suis les directives de ces 10 documents PRD pour générer un code de qualité industrielle.
${arsenalDirective}

Génère EXACTEMENT ces 3 fichiers :
1. "src/App.${tsExt}" — composant racine. ${routingRule} Peut contenir un header/navbar avec le nom de l'app. Importe MainComponent.
2. "src/components/MainComponent.${tsExt}" — le composant MÉTIER principal avec VRAIE logique liée à l'app (todo→ajout/suppression/bascule de tâches, recipes→liste+recherche, chat→messages+input, etc.). Doit avoir un état React (useState) et des interactions fonctionnelles. Pas juste un affichage statique. Suis l'Interface Utilisateur et l'Architecture Système de l'Arsenal.
3. "src/index.css" — styles globaux. ${
          config.styling === "tailwind"
            ? "Commence par les 3 directives @tailwind (base, components, utilities). Ajoute ensuite quelques styles globaux simples (body, fonts). NE définis PAS de @apply avec des classes personnalisées."
            : "CSS global simple (reset, body, fonts)."
        }

RÈGLES CRITIQUES :
- ${config.typescript ? "TypeScript : interfaces pour les props et le state, typage explicite." : "JavaScript ES6+."}
- ${stylingRule}
- Composants PascalCase. Imports relatifs sans extension (import MainComponent from './components/MainComponent').
- NE génère PAS package.json, index.html, main.tsx, vite.config, tsconfig, tailwind.config, postcss.config — ils sont fournis automatiquement.
- NE crée PAS de Context/Provider dans App.tsx (gardes App simple — pas de hook de contexte avant le provider).
- Échappe les guillemets dans le JSON (utilise \\" pour les guillemets dans le code).
- Code COMPLET et fonctionnel, concis.
- Si des features sont sélectionnées (darkmode, auth, forms, charts, etc.), IMPLÉMENTE-LES VRAIMENT dans le code — pas juste un commentaire.

Format JSON EXACT :
{"files":[{"path":"src/App.${tsExt}","content":"...","language":"${tsExt}"},{"path":"src/components/MainComponent.${tsExt}","content":"...","language":"${tsExt}"},{"path":"src/index.css","content":"...","language":"css"}]}

Réponds MAINTENANT avec uniquement l'objet JSON.`;

    await ensureZaiConfig();
    const zai = await ZAI.create();
    const codeCompletion = await zai.chat.completions.create({
      messages: [
        {
          role: "assistant",
          content:
            "Tu es un générateur de composants React expert. Tu réponds UNIQUEMENT par du JSON valide, jamais de texte autour, jamais de markdown. Tu ne génères que du code de composants, jamais de fichiers de configuration.",
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

    const llmFiles = parseFiles(parsed.files);

    if (llmFiles.length === 0) {
      await db.project.update({
        where: { id },
        data: { status: "failed", prd },
      });
      return NextResponse.json(
        { success: false, error: "Aucun fichier valide généré.", prd },
        { status: 422 }
      );
    }

    // ───── PHASE 3: Merge LLM files with deterministic template files ─────
    // Template files (config, boilerplate) take precedence for config paths;
    // LLM files take precedence for src/ component files.
    const templateFiles = buildTemplateFiles(config);
    const templatePaths = new Set(templateFiles.map((f) => f.path));

    // Ensure index.css always has @tailwind directives AND CSS variables.
    // If the LLM produced an index.css, merge our safe CSS-variable base
    // with the LLM's custom styles (animations, etc.).
    if (config.styling === "tailwind") {
      const llmCssIdx = llmFiles.findIndex((f) => f.path === "src/index.css");
      const safeBase = buildIndexCss(config);
      if (llmCssIdx === -1) {
        // No LLM CSS — use our safe base
        llmFiles.push({ path: "src/index.css", content: safeBase, language: "css" });
      } else {
        const llmCss = llmFiles[llmCssIdx].content;
        // If the LLM CSS already defines --border, it's complete enough.
        // Otherwise, prepend our safe base (with CSS vars) and append LLM custom styles.
        if (llmCss.includes("--border:")) {
          // Already has CSS variables — keep as is
        } else {
          // Strip any @tailwind directives from LLM CSS (our base already has them)
          // and append the LLM's custom styles after the base
          const llmCustom = llmCss
            .replace(/@tailwind\s+(base|components|utilities);?\s*/g, "")
            .trim();
          llmFiles[llmCssIdx].content = safeBase + "\n" + llmCustom + "\n";
        }
      }
    } else {
      // Non-tailwind: ensure index.css exists
      const hasLlmCss = llmFiles.some((f) => f.path === "src/index.css");
      if (!hasLlmCss) {
        llmFiles.push({
          path: "src/index.css",
          content: buildIndexCss(config),
          language: "css",
        });
      }
    }

    // Merge: start with templates, then add LLM files (skipping any LLM file
    // whose path collides with a template config file — templates win on config).
    let files: GeneratedFile[] = [...templateFiles];
    for (const f of llmFiles) {
      if (!templatePaths.has(f.path)) {
        files.push(f);
      }
    }

    // ───── PHASE 4: Post-generation validation & auto-repair ─────
    // Scans imports, reconciles package.json, ensures utils.ts exists,
    // verifies Tailwind config, checks React architecture.
    const { files: finalFiles, report: validationReport } =
      postProcessProject(files, config);
    files = finalFiles;

    await db.project.update({
      where: { id },
      data: {
        status: "ready",
        prd,
        arsenalJson: JSON.stringify(arsenal),
        filesJson: JSON.stringify(files),
        fileCount: files.length,
        validationJson: JSON.stringify(validationReport),
        installStatus: "pending",
        buildStatus: "pending",
      },
    });

    // ───── PHASE 5: Write files to disk + auto-install dependencies ─────
    // Write the generated project to workspaces/{id}/ and trigger npm install
    // asynchronously. The user can poll /api/projects/[id]/status for progress.
    try {
      await writeProjectFiles(id, files);
      // Fire-and-forget: npm install runs in the background
      runInstall(id);
    } catch (diskErr) {
      console.error("[generate] writeProjectFiles failed:", diskErr);
      // Non-fatal: the project is still in the DB, user can retry install
    }

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
      validation: validationReport,
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
