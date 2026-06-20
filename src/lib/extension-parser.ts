// Extension Pack Parser
// Scans the extensions data folder, extracts PRD contexts from inject_*.js files,
// and maps them to React Forge features for enhanced code generation.

import { promises as fs } from "fs";
import path from "path";

export interface PRDContext {
  id: string; // e.g. "prd_mobile_form_wizard"
  text: string; // The full PRD context text
  pack: string; // Pack name (e.g. "forms_inputs_pack")
}

export interface ExtensionPack {
  id: string; // folder name
  name: string; // from manifest.json
  description: string;
  prdContexts: PRDContext[];
  injectFile: string; // path to inject_*.js
}

// ── Feature → Pack mapping ─────────────────────────────────────────────────
// Maps React Forge features to the extension packs that enhance them.
export const FEATURE_PACK_MAP: Record<string, string[]> = {
  darkmode: ["interface_pack", "layout_pack"],
  auth: ["saas_pack", "auth_mobile_pack"],
  api: ["saas_pack", "ia_pack"],
  forms: ["forms_inputs_pack", "formulaire_pack"],
  charts: ["productivity_pack", "interface_pack"],
  tables: ["productivity_pack", "interface_pack"],
  pwa: ["mobile_pack", "mobile_web_pack"],
  i18n: ["texte_pack"],
  tests: ["productivity_pack"],
  animations: ["interface_pack", "widget_pack"],
};

// ── Parse inject_*.js to extract PRD contexts ──────────────────────────────
// The inject files define a PRDS object like:
//   const PRDS = {
//     prd_key_name: `[CONTEXTE CACHÉ - PRD PRD_KEY_NAME]\nMISSION: ...\n[FIN DU CONTEXTE CACHÉ]`,
//     ...
//   };
// We extract each key → text mapping.
function parseInjectFile(content: string, packId: string): PRDContext[] {
  const contexts: PRDContext[] = [];

  // Match: prd_key_name: `...template string...`
  // The template strings use backticks and may contain \n escapes
  const regex = /(\w+):\s*`([\s\S]*?)`/g;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(content)) !== null) {
    const id = match[1];
    const text = match[2];
    // Only keep entries that look like PRD contexts (contain CONTEXTE or MISSION)
    if (id.startsWith("prd_") || text.includes("CONTEXTE") || text.includes("MISSION")) {
      contexts.push({
        id,
        text: text.trim(),
        pack: packId,
      });
    }
  }

  return contexts;
}

// ── Scan all extension packs ───────────────────────────────────────────────
let cache: ExtensionPack[] | null = null;

export async function getExtensionPacks(): Promise<ExtensionPack[]> {
  if (cache) return cache;

  const extensionsDir = path.join(process.cwd(), "src", "data", "extensions");
  const packs: ExtensionPack[] = [];

  let entries: string[];
  try {
    entries = await fs.readdir(extensionsDir);
  } catch {
    return [];
  }

  for (const entry of entries) {
    const packDir = path.join(extensionsDir, entry);
    const stat = await fs.stat(packDir);
    if (!stat.isDirectory()) continue;
    if (!entry.endsWith("_pack") && entry !== "interface_pack") continue;

    // Read manifest.json
    const manifestPath = path.join(packDir, "manifest.json");
    let name = entry;
    let description = "";
    try {
      const manifestContent = await fs.readFile(manifestPath, "utf-8");
      const manifest = JSON.parse(manifestContent);
      name = manifest.name ?? entry;
      description = manifest.description ?? "";
    } catch {
      // Skip packs without manifest
      continue;
    }

    // Find inject_*.js file
    const injectFiles = (await fs.readdir(packDir)).filter((f) =>
      f.startsWith("inject_") && f.endsWith(".js")
    );
    if (injectFiles.length === 0) continue;

    const injectPath = path.join(packDir, injectFiles[0]);
    const injectContent = await fs.readFile(injectPath, "utf-8");
    const prdContexts = parseInjectFile(injectContent, entry);

    if (prdContexts.length > 0) {
      packs.push({
        id: entry,
        name,
        description,
        prdContexts,
        injectFile: injectPath,
      });
    }
  }

  cache = packs;
  return packs;
}

// ── Get PRD contexts for a list of features ────────────────────────────────
export async function getPRDContextsForFeatures(
  features: string[]
): Promise<{ feature: string; contexts: PRDContext[] }[]> {
  const packs = await getExtensionPacks();
  const packMap = new Map(packs.map((p) => [p.id, p]));

  const result: { feature: string; contexts: PRDContext[] }[] = [];

  for (const feature of features) {
    const packIds = FEATURE_PACK_MAP[feature] ?? [];
    const contexts: PRDContext[] = [];

    for (const packId of packIds) {
      const pack = packMap.get(packId);
      if (pack) {
        // Take up to 5 PRD contexts per pack to keep the prompt manageable
        contexts.push(...pack.prdContexts.slice(0, 5));
      }
    }

    if (contexts.length > 0) {
      result.push({ feature, contexts });
    }
  }

  return result;
}

// ── Build the extension directive for the LLM prompt ───────────────────────
export async function buildExtensionDirective(
  features: string[]
): Promise<string> {
  if (features.length === 0) return "";

  const featureContexts = await getPRDContextsForFeatures(features);
  if (featureContexts.length === 0) return "";

  const sections = featureContexts.map(({ feature, contexts }) => {
    const contextTexts = contexts
      .map((c) => `  ── ${c.id} ──\n  ${c.text.replace(/\n/g, "\n  ")}`)
      .join("\n\n");
    return `### Feature: ${feature}\n${contextTexts}`;
  });

  return `\n\n## CONTEXTES PRD SPÉCIALISÉS (Extensions)\nUtilise ces contextes PRD pour guider la génération du code pour chaque feature. Le code doit respecter l'architecture et les composants décrits.\n\n${sections.join("\n\n")}\n`;
}

// ── Get summary of available packs (for UI) ────────────────────────────────
export async function getExtensionPacksSummary(): Promise<
  { id: string; name: string; description: string; prdCount: number }[]
> {
  const packs = await getExtensionPacks();
  return packs.map((p) => ({
    id: p.id,
    name: p.name,
    description: p.description,
    prdCount: p.prdContexts.length,
  }));
}
