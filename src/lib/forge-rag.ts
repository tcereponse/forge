// forge-rag.ts — RAG Memory Engine pour Vercel
//
// Pépite #1 migrée depuis rag_memory.py
// Stocke les connaissances de chaque projet forgé et fournit
// un contexte enrichi à DeepSeek avant chaque nouvelle forge.
//
// Architecture:
//   - extractTags(): catégorise le prompt utilisateur
//   - selectPatches(): map les tags vers les patchs pertinents
//   - searchMemory(): recherche dans les projets précédents
//   - buildContextForDeepSeek(): construit le contexte enrichi
//
// Stockage: PostgreSQL via Prisma (table RagMemory)
// Au lieu de fichiers JSON sur disque (Python), on utilise la DB.

import { db } from "./db";

// ─── Types ─────────────────────────────────────────────────────────────────

export interface MemoryEntry {
  id: string;
  project: string;
  file: string;
  spirale: string;       // "modeles" | "standards" | "exemples" | "outils" | "logs"
  preview: string;       // First 500 chars
  fullContent: string;   // Full content (capped at 3000 chars)
  tags: string[];
  score: number;         // Relevance score (0-1, evolves with feedback)
  createdAt: number;
}

export interface SearchResult {
  spirale: string;
  project: string;
  file: string;
  content: string;
  relevance: number;
  tags: string[];
}

// ─── Tag Extraction ────────────────────────────────────────────────────────

const KEYWORD_MAP: Record<string, string> = {
  // Auth
  "login": "authentication",
  "auth": "authentication",
  "inscription": "authentication",
  "connexion": "authentication",
  "mot de passe": "authentication",
  "password": "authentication",
  // E-commerce
  "panier": "ecommerce",
  "cart": "ecommerce",
  "stripe": "payment",
  "paiement": "payment",
  "achat": "ecommerce",
  "commande": "ecommerce",
  "produit": "ecommerce",
  // Social
  "chat": "messaging",
  "message": "messaging",
  "commentaire": "messaging",
  "like": "social",
  "feed": "social",
  "amis": "social",
  // Data
  "sqlite": "database",
  "database": "database",
  "base de donnees": "database",
  "api": "api",
  "fetch": "api",
  "crud": "api",
  // UI
  "chart": "charts",
  "graphique": "charts",
  "statistique": "stats",
  "dashboard": "dashboard",
  "tableau": "table",
  "formulaire": "forms",
  "form": "forms",
  // Media
  "image": "media",
  "video": "media",
  "audio": "media",
  "musique": "media",
  // Navigation
  "navigation": "navigation",
  "menu": "navigation",
  "router": "navigation",
  "route": "navigation",
  // Mobile
  "android": "mobile",
  "apk": "mobile",
  "pwa": "mobile",
  // AI
  "ia": "ai",
  "intelligence": "ai",
  "machine learning": "ai",
  // Productivity
  "todo": "productivity",
  "tache": "productivity",
  "task": "productivity",
  "calendar": "productivity",
  "calendrier": "productivity",
  "timer": "productivity",
  "pomodoro": "productivity",
};

/**
 * Extrait des tags à partir du contenu (description du projet).
 * Migration de rag_memory.py extract_tags()
 */
export function extractTags(content: string): string[] {
  const tags: string[] = [];
  const lower = content.toLowerCase();

  for (const [keyword, tag] of Object.entries(KEYWORD_MAP)) {
    if (lower.includes(keyword) && !tags.includes(tag)) {
      tags.push(tag);
    }
  }

  // Cap at 8 tags
  return tags.slice(0, 8);
}

// ─── Patch Auto-Selection ──────────────────────────────────────────────────

const TAG_TO_PATCH: Record<string, string[]> = {
  "authentication": ["auth_mobile_pack"],
  "payment": ["commerce_paiement_pack", "e_commerce_pack"],
  "ecommerce": ["e_commerce_pack", "commerce_paiement_pack"],
  "messaging": ["chat_comms_pack"],
  "social": ["feed_social_pack"],
  "database": ["fichiers_base_pack"],
  "charts": ["interface_pack"],
  "dashboard": ["interface_pack"],
  "table": ["interface_pack"],
  "forms": ["formulaire_pack"],
  "media": ["image_pack", "video_pack", "audio_pack"],
  "navigation": ["landing_pack"],
  "mobile": ["mobile_pack", "mobile_shell_pack"],
  "ai": ["ia_pack"],
  "productivity": ["productivity_pack"],
};

/**
 * Sélectionne automatiquement les patchs pertinents basés sur les tags.
 */
export function selectPatches(tags: string[]): string[] {
  const patches = new Set<string>();
  for (const tag of tags) {
    const patchList = TAG_TO_PATCH[tag];
    if (patchList) {
      patchList.forEach(p => patches.add(p));
    }
  }
  return Array.from(patches);
}

/**
 * Sélectionne les patchs directement depuis la description du projet.
 * Convenience function: description → tags → patches.
 */
export function selectPatchesFromDescription(description: string): string[] {
  return selectPatches(extractTags(description));
}

// ─── Memory Search ─────────────────────────────────────────────────────────

/**
 * Recherche dans la mémoire RAG (projets précédents).
 * Utilise la base PostgreSQL au lieu de fichiers JSON.
 *
 * Migration de rag_memory.py search_memory()
 */
export async function searchMemory(query: string, topK = 3): Promise<SearchResult[]> {
  try {
    const queryWords = query.toLowerCase().split(/\s+/).filter(w => w.length > 2);
    if (queryWords.length === 0) return [];

    // Query: find memory entries that share words with the query
    // Use ILIKE for case-insensitive search on preview and tags
    const results: SearchResult[] = [];

    // Try to query the RagMemory table
    try {
      const entries = await db.ragMemory.findMany({
        where: {
          OR: queryWords.map(word => ({
            OR: [
              { preview: { contains: word, mode: "insensitive" as const } },
              { tags: { contains: word, mode: "insensitive" as const } },
            ],
          })),
        },
        orderBy: { score: "desc" },
        take: topK * 3, // Get more than needed, then sort
      });

      for (const entry of entries) {
        const text = (entry.preview + " " + entry.tags).toLowerCase();
        const overlap = queryWords.filter(w => text.includes(w)).length;
        if (overlap > 0) {
          const relevance = (overlap / Math.max(queryWords.length, 1)) * entry.score;
          results.push({
            spirale: entry.spirale,
            project: entry.projectName,
            file: entry.filePath,
            content: entry.fullContent.slice(0, 600),
            relevance,
            tags: entry.tags.split(",").filter(Boolean),
          });
        }
      }
    } catch {
      // Table might not exist yet — return empty
      return [];
    }

    results.sort((a, b) => b.relevance - a.relevance);
    return results.slice(0, topK);
  } catch {
    return [];
  }
}

// ─── Context Builder ───────────────────────────────────────────────────────

/**
 * Construit le contexte enrichi à injecter dans le prompt DeepSeek.
 * C'est le cœur du moteur RAG.
 *
 * Migration de rag_memory.py build_context_for_deepseek()
 */
export async function buildContextForDeepSeek(
  projectName: string,
  description: string,
  stack: string
): Promise<string> {
  const query = `${projectName} ${description} ${stack}`;
  const memories = await searchMemory(query, 3);

  if (memories.length === 0) {
    return "";
  }

  const lines = ["[MÉMOIRE FORGE — Exemples de projets précédents à réutiliser :]"];
  for (let i = 0; i < memories.length; i++) {
    const mem = memories[i];
    lines.push(`\n--- Exemple ${i + 1} (Spirale: ${mem.spirale.toUpperCase()}, Projet: ${mem.project}) ---`);
    lines.push(`Fichier : ${mem.file}`);
    if (mem.tags.length > 0) {
      lines.push(`Tags : ${mem.tags.join(", ")}`);
    }
    lines.push("Extrait :");
    lines.push(mem.content.slice(0, 400));
    lines.push("---");
  }

  const context = lines.join("\n");
  console.log(`[RAG] Contexte enrichi généré : ${memories.length} souvenir(s) injecté(s).`);
  return context;
}

// ─── Memory Indexing ───────────────────────────────────────────────────────

const SPIRALES = ["modeles", "standards", "exemples", "outils", "logs"] as const;
type Spirale = typeof SPIRALES[number];

/**
 * Classifie un fichier dans une spirale selon son type et contenu.
 * Migration de rag_memory.py classify_file()
 */
function classifyFile(filepath: string, content: string): Spirale {
  const name = filepath.split("/").pop()?.toLowerCase() || "";
  const ext = name.split(".").pop() || "";
  const c = content.toLowerCase();

  // Standards / SOP / PRDs
  if (ext === "md" || name.includes("prd") || name.includes("manifeste") || name.includes("sop")) {
    return "standards";
  }
  // Schémas de données / modèles
  if (["json", "yaml", "yml"].includes(ext) || name.includes("schema") || name.includes("model")) {
    return "modeles";
  }
  // Code source = exemples de code réel
  if (["js", "ts", "jsx", "tsx", "py", "java", "kt"].includes(ext)) {
    return "exemples";
  }
  // Scripts / outils
  if (["sh", "bat", "ps1"].includes(ext) || name.includes("build") || name.includes("script")) {
    return "outils";
  }
  // Logs par défaut
  return "logs";
}

/**
 * Indexe un projet forgé dans la mémoire RAG.
 * Stocke les fichiers dans PostgreSQL pour réutilisation future.
 *
 * Migration de rag_memory.py index_project()
 */
export async function indexProject(
  projectName: string,
  files: Array<{ path: string; content: string }>
): Promise<number> {
  let count = 0;

  for (const file of files) {
    try {
      const content = file.content;
      if (content.length < 20) continue;

      const spirale = classifyFile(file.path, content);
      const tags = extractTags(content);
      const id = `${projectName}/${file.path}`.slice(0, 100);

      // Upsert into RagMemory table
      try {
        await db.ragMemory.upsert({
          where: { id },
          create: {
            id,
            projectName,
            filePath: file.path,
            spirale,
            preview: content.slice(0, 500),
            fullContent: content.slice(0, 3000),
            tags: tags.join(","),
            score: 0.5,
          },
          update: {
            preview: content.slice(0, 500),
            fullContent: content.slice(0, 3000),
            tags: tags.join(","),
          },
        });
        count++;
      } catch {
        // Table might not exist — skip silently
      }
    } catch {
      // Skip individual file errors
    }
  }

  console.log(`[RAG] Projet '${projectName}' indexé : ${count} fichiers dans ${SPIRALES.length} spirales.`);
  return count;
}

// ─── Score Update ──────────────────────────────────────────────────────────

/**
 * Met à jour le score de pertinence d'un chunk après feedback.
 * Migration de rag_memory.py update_score()
 */
export async function updateScore(chunkId: string, positive = true): Promise<void> {
  try {
    const entry = await db.ragMemory.findUnique({ where: { id: chunkId } });
    if (!entry) return;

    const newScore = positive
      ? Math.min(1.0, entry.score + 0.1)
      : Math.max(0.0, entry.score - 0.1);

    await db.ragMemory.update({
      where: { id: chunkId },
      data: { score: newScore },
    });

    console.log(`[RAG] Score mis à jour pour ${chunkId}: ${newScore.toFixed(2)}`);
  } catch {
    // Table might not exist
  }
}

// ─── Stats ─────────────────────────────────────────────────────────────────

export async function getMemoryStats(): Promise<{
  total: number;
  spirales: Record<string, number>;
  projects: number;
}> {
  const stats = { total: 0, spirales: {} as Record<string, number>, projects: 0 };

  try {
    for (const sp of SPIRALES) {
      const count = await db.ragMemory.count({ where: { spirale: sp } });
      stats.spirales[sp] = count;
      stats.total += count;
    }

    const projects = await db.ragMemory.findMany({
      select: { projectName: true },
      distinct: ["projectName"],
    });
    stats.projects = projects.length;
  } catch {
    // Table might not exist
  }

  return stats;
}
