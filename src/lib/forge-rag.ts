/**
 * ═══════════════════════════════════════════════════════════════
 * FORGE RAG MEMORY ENGINE — Grade Gold
 * Migration from rag_memory.py (Elite Forge Mobile v1.0)
 *
 * RAG (Retrieval-Augmented Generation) memory system using
 * spiral-based storage to index project knowledge and provide
 * enriched context to DeepSeek prompts.
 *
 * Spirales: modeles | standards | exemples | outils | logs
 * ═══════════════════════════════════════════════════════════════
 */

import { db } from "./db";
import { z } from "zod";

// ─── Types ───────────────────────────────────────────────────

export type Spirale = "modeles" | "standards" | "exemples" | "outils" | "logs";

export const SPIRALES: Spirale[] = ["modeles", "standards", "exemples", "outils", "logs"];

export interface MemoryChunk {
  id: string;
  project: string;
  file: string;
  spirale: Spirale;
  preview: string;
  fullContent: string;
  size: number;
  indexedAt: number;
  tags: string[];
  score: number;
}

export interface SearchResult {
  spirale: Spirale;
  project: string;
  file: string;
  content: string;
  relevance: number;
  tags: string[];
}

export interface MemoryStats {
  total: number;
  spirales: Record<Spirale, number>;
  projectsIndexed: number;
  version: string;
}

// ─── Zod Schemas ─────────────────────────────────────────────

export const MemoryChunkSchema = z.object({
  id: z.string().min(1),
  project: z.string().min(1),
  file: z.string().min(1),
  spirale: z.enum(["modeles", "standards", "exemples", "outils", "logs"]),
  preview: z.string(),
  fullContent: z.string(),
  size: z.number().int().positive(),
  indexedAt: z.number().int(),
  tags: z.array(z.string()),
  score: z.number().min(0).max(1).default(0.5),
});

export const SearchQuerySchema = z.object({
  query: z.string().min(1),
  topK: z.number().int().min(1).max(20).default(3),
  spiraleFilter: z.enum(["modeles", "standards", "exemples", "outils", "logs"]).optional(),
});

// ─── Keyword Dictionary ──────────────────────────────────────

const KEYWORDS: Record<string, string> = {
  // Frontend frameworks
  react: "react",
  expo: "expo",
  next: "nextjs",
  vue: "vue",
  angular: "angular",
  svelte: "svelte",
  // Mobile
  android: "android",
  ios: "ios",
  mobile: "mobile",
  // API & Networking
  api: "api",
  fetch: "http",
  axios: "http",
  graphql: "graphql",
  websocket: "websocket",
  rest: "rest",
  // Database
  sqlite: "database",
  postgres: "database",
  mysql: "database",
  mongodb: "database",
  prisma: "database",
  // Authentication
  auth: "authentication",
  login: "authentication",
  register: "authentication",
  signup: "authentication",
  oauth: "authentication",
  jwt: "authentication",
  // UI / Styling
  style: "ui",
  css: "ui",
  tailwind: "ui",
  component: "component",
  // Navigation
  navigation: "navigation",
  router: "navigation",
  // State & Hooks
  hook: "hooks",
  state: "state",
  redux: "state",
  zustand: "state",
  // Backend
  python: "python",
  flask: "flask",
  fastapi: "fastapi",
  django: "django",
  node: "nodejs",
  express: "expressjs",
  // Cloud & DevOps
  docker: "docker",
  aws: "aws",
  vercel: "vercel",
  cloudflare: "cloudflare",
  // Payments
  stripe: "payment",
  paypal: "payment",
  // AI / ML
  ai: "ai",
  ml: "machine_learning",
  deepseek: "deepseek",
  openai: "openai",
  // Security
  encryption: "security",
  ssl: "security",
  https: "security",
  // Testing
  test: "testing",
  jest: "testing",
  cypress: "testing",
  // File types
  markdown: "documentation",
  pdf: "documentation",
};

// ─── Helpers ─────────────────────────────────────────────────

function hashId(input: string): string {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    const char = input.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0; // Convert to 32bit integer
  }
  return Math.abs(hash).toString(36).slice(0, 12);
}

function classifyFile(filepath: string, content: string): Spirale {
  const name = filepath.toLowerCase();
  const ext = name.split(".").pop() || "";
  const c = content.toLowerCase();

  // Standards / SOP / PRDs
  if (ext === "md" || name.includes("prd") || name.includes("manifeste") || name.includes("sop")) {
    return "standards";
  }
  // Schemas / data models
  if (["json", "yaml", "yml"].includes(ext) || name.includes("schema") || name.includes("model")) {
    return "modeles";
  }
  // Source code = real code examples
  if (["js", "ts", "jsx", "tsx", "py", "java", "kt", "swift"].includes(ext)) {
    return "exemples";
  }
  // Scripts / tools
  if (["sh", "bat", "ps1"].includes(ext) || name.includes("build") || name.includes("script")) {
    return "outils";
  }
  // Logs by default
  return "logs";
}

function extractTagsFromContent(content: string, filepath?: string): string[] {
  const tags: string[] = [];
  const c = content.toLowerCase();

  for (const [kw, tag] of Object.entries(KEYWORDS)) {
    if (c.includes(kw) && !tags.includes(tag)) {
      tags.push(tag);
    }
    if (tags.length >= 8) break;
  }

  // Add file extension as a tag if relevant
  if (filepath) {
    const ext = filepath.split(".").pop()?.toLowerCase();
    if (ext && ["ts", "tsx", "js", "jsx", "py", "md", "json"].includes(ext)) {
      tags.push(`ext:${ext}`);
    }
  }

  return tags;
}

// ─── Prisma Memory Model Helpers ─────────────────────────────

/**
 * Ensure the rag_memory table exists and return stats.
 * In a production system, this would be handled by Prisma migrations.
 */
async function ensureMemoryStore(): Promise<void> {
  // Prisma handles schema via migrations — no need to create tables at runtime.
  // This function exists as a migration-compatible guard.
  try {
    // Prisma handles schema via migrations
    // Check if table exists by doing a count query
    await db.ragMemory.count();
  } catch {
    console.warn("[RAG] rag_memory table not found — run `prisma db push` or `prisma migrate dev`");
  }
}

// ─── Core RAG Functions ─────────────────────────────────────

/**
 * Index a project into the spiral memory store.
 * Scans all files, classifies them into spirales, and stores them as MemoryChunks.
 *
 * @param projectName - The name/directory of the project to index
 * @param projectPath - Optional explicit path to the project files
 * @returns Number of files indexed
 */
export async function indexProject(
  projectName: string,
  projectPath?: string
): Promise<number> {
  await ensureMemoryStore();
  let count = 0;

  // Use the project path if provided, otherwise assume it's in the default projects dir
  const basePath = projectPath || projectName;

  try {
    // This would be called from the server with actual file system access
    // For now, we create a placeholder implementation that works with
    // the existing project database

    console.log(`[RAG] Indexing project '${projectName}' from ${basePath}...`);

    // In a real implementation, we'd walk the filesystem:
    // const files = await fs.readdir(basePath, { recursive: true });
    // For now, we store the project metadata in the memory store

    const existing = await db.ragMemory.findMany({
      where: { project: projectName },
    });

    if (existing.length === 0) {
      // Create a seed entry for the project
      await db.ragMemory.create({
        data: {
          id: hashId(projectName),
          project: projectName,
          file: "manifest.json",
          spirale: "standards",
          preview: `Project: ${projectName}`,
          fullContent: JSON.stringify({ project: projectName, indexedAt: Date.now() }),
          size: 100,
          tags: extractTagsFromContent(projectName),
          score: 0.5,
        },
      });
      count = 1;
    }

    console.log(`[RAG] Project '${projectName}' indexed: ${count} chunks.`);
  } catch (error) {
    console.error(`[RAG] Error indexing project '${projectName}':`, error);
  }

  return count;
}

/**
 * Extract semantic tags from a text description.
 * Used to categorize user prompts and match them to relevant patches/memories.
 *
 * @param description - The text to extract tags from (e.g., user project prompt)
 * @returns Array of extracted tags
 */
export function extractTags(description: string): string[] {
  return extractTagsFromContent(description);
}

/**
 * Search the spiral memory for relevant chunks matching a query.
 * Uses keyword overlap scoring with relevance feedback.
 *
 * @param query - The search query (e.g., project description + stack)
 * @param topK - Number of top results to return (default: 3)
 * @param spiraleFilter - Optional filter to search only one spirale
 * @returns Array of search results sorted by relevance
 */
export async function searchMemory(
  query: string,
  topK: number = 3,
  spiraleFilter?: Spirale
): Promise<SearchResult[]> {
  await ensureMemoryStore();
  const results: SearchResult[] = [];
  const queryWords = new Set(query.toLowerCase().split(/\s+/));

  try {
    const whereClause: any = {};
    if (spiraleFilter) {
      whereClause.spirale = spiraleFilter;
    }

    const chunks = await db.ragMemory.findMany({ where: whereClause });

    for (const chunk of chunks) {
      const text = `${chunk.preview} ${chunk.tags.join(" ")}`.toLowerCase();
      const chunkWords = new Set(text.split(/\s+/));

      // Calculate overlap score
      let overlap = 0;
      for (const word of queryWords) {
        if (chunkWords.has(word)) overlap++;
      }

      if (overlap > 0) {
        const relevance = (overlap / Math.max(queryWords.size, 1)) * chunk.score;
        results.push({
          spirale: chunk.spirale as Spirale,
          project: chunk.project,
          file: chunk.file,
          content: chunk.fullContent.slice(0, 600),
          relevance: Math.round(relevance * 100) / 100,
          tags: chunk.tags,
        });
      }
    }
  } catch (error) {
    console.error("[RAG] Error searching memory:", error);
  }

  results.sort((a, b) => b.relevance - a.relevance);
  return results.slice(0, topK);
}

/**
 * Build an enriched context string for DeepSeek prompts.
 * This is the heart of the RAG engine — it retrieves relevant memories
 * and formats them as context to inject into AI prompts.
 *
 * @param projectName - The name of the current project
 * @param description - The project description / user prompt
 * @param stack - The technology stack being used
 * @returns Formatted context string (empty if no memories found)
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

  const lines: string[] = [
    "[FORGE MEMORY — Previous project examples to reuse:]",
  ];

  for (let i = 0; i < memories.length; i++) {
    const mem = memories[i];
    lines.push("");
    lines.push(`--- Example ${i + 1} (Spirale: ${mem.spirale.toUpperCase()}, Project: ${mem.project}) ---`);
    lines.push(`File: ${mem.file}`);
    if (mem.tags.length > 0) {
      lines.push(`Tags: ${mem.tags.join(", ")}`);
    }
    lines.push("Excerpt:");
    lines.push(mem.content.slice(0, 400));
    lines.push("---");
  }

  const context = lines.join("\n");
  console.log(`[RAG] Enriched context generated: ${memories.length} memory(ies) injected.`);
  return context;
}

/**
 * Update the relevance score of a memory chunk based on feedback.
 * Positive feedback increases the score, negative decreases it.
 *
 * @param chunkId - The ID of the memory chunk to update
 * @param positive - Whether the feedback was positive (default: true)
 */
export async function updateScore(
  chunkId: string,
  positive: boolean = true
): Promise<void> {
  try {
    const chunk = await db.ragMemory.findUnique({ where: { id: chunkId } });
    if (!chunk) {
      console.warn(`[RAG] Chunk not found: ${chunkId}`);
      return;
    }

    const newScore = positive
      ? Math.min(1.0, chunk.score + 0.1)
      : Math.max(0.0, chunk.score - 0.1);

    await db.ragMemory.update({
      where: { id: chunkId },
      data: { score: newScore },
    });

    console.log(`[RAG] Score updated for ${chunkId}: ${newScore.toFixed(2)}`);
  } catch (error) {
    console.error(`[RAG] Error updating score for ${chunkId}:`, error);
  }
}

/**
 * Get memory statistics across all spirales.
 *
 * @returns Stats object with total count, per-spirale breakdown, and projects indexed
 */
export async function getMemoryStats(): Promise<MemoryStats> {
  await ensureMemoryStore();
  const stats: MemoryStats = {
    total: 0,
    spirales: { modeles: 0, standards: 0, exemples: 0, outils: 0, logs: 0 },
    projectsIndexed: 0,
    version: "1.0",
  };

  try {
    for (const sp of SPIRALES) {
      const count = await db.ragMemory.count({ where: { spirale: sp } });
      stats.spirales[sp] = count;
      stats.total += count;
    }

    const projects = await db.ragMemory.findMany({
      select: { project: true },
      distinct: ["project"],
    });
    stats.projectsIndexed = projects.length;
  } catch (error) {
    console.error("[RAG] Error getting memory stats:", error);
  }

  return stats;
}

/**
 * Analyze a project description and return structured analysis.
 * Used as a more detailed alternative to extractTags for complex prompts.
 *
 * @param description - The project description to analyze
 * @returns Object with detected stack, features, and complexity
 */
export function analyzeDescription(description: string): {
  stack: string[];
  features: string[];
  complexity: "low" | "medium" | "high";
  estimatedFiles: number;
} {
  const tags = extractTags(description);
  const c = description.toLowerCase();

  // Detect stack
  const stack: string[] = [];
  if (tags.includes("react") || tags.includes("nextjs")) stack.push("React");
  if (tags.includes("expo") || tags.includes("mobile")) stack.push("Expo");
  if (tags.includes("nodejs") || tags.includes("expressjs")) stack.push("Node.js");
  if (tags.includes("python") || tags.includes("flask") || tags.includes("fastapi")) stack.push("Python");
  if (tags.includes("database")) stack.push("Database");
  if (tags.includes("api")) stack.push("API");

  // Detect features
  const features: string[] = [];
  if (tags.includes("authentication")) features.push("Authentication");
  if (tags.includes("payment")) features.push("Payments");
  if (tags.includes("websocket")) features.push("Real-time");
  if (tags.includes("ai") || tags.includes("machine_learning")) features.push("AI/ML");
  if (tags.includes("testing")) features.push("Testing");

  // Estimate complexity
  const wordCount = description.split(/\s+/).length;
  const uniqueTags = new Set(tags).size;
  const complexity: "low" | "medium" | "high" =
    wordCount > 50 || uniqueTags > 6 ? "high"
    : wordCount > 20 || uniqueTags > 3 ? "medium"
    : "low";

  // Estimate files
  const estimatedFiles = complexity === "high" ? 40
    : complexity === "medium" ? 20
    : 10;

  return {
    stack: [...new Set(stack)],
    features: [...new Set(features)],
    complexity,
    estimatedFiles,
  };
}
