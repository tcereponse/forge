// Pack Embeddings — Intelligent pack matching via text similarity
// Instead of static FEATURE_PACK_MAP, uses cosine similarity on pack descriptions
// to find the most relevant packs for a given prompt/description.

import { getExtensionPacks, type ExtensionPack } from "./extension-parser";

// Simple TF-IDF style text vectorization (no external ML needed)
// Each pack is vectorized based on its keywords, and the user prompt
// is matched against all packs using cosine similarity.

interface PackVector {
  packId: string;
  packName: string;
  description: string;
  keywords: Map<string, number>; // term → weight
  prdCount: number;
}

let vectorCache: PackVector[] | null = null;

// Extract meaningful keywords from text (French + English)
function extractKeywords(text: string): Map<string, number> {
  const stopWords = new Set([
    "le", "la", "les", "de", "du", "des", "un", "une", "des", "et", "ou", "mais",
    "pour", "par", "avec", "sans", "dans", "sur", "sous", "vers", "chez", "entre",
    "the", "a", "an", "and", "or", "but", "for", "with", "without", "in", "on",
    "at", "to", "from", "by", "of", "is", "are", "was", "were", "be", "been",
    "pack", "prd", "extensions", "categorie", "category", "pour", "avec",
    "ce", "cette", "ces", "son", "sa", "ses", "mon", "ma", "mes", "notre",
    "qui", "que", "quoi", "comment", "pourquoi", "quand", "où",
  ]);

  const keywords = new Map<string, number>();
  const words = text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .split(/[\s,;.!?:/()\-_'"]+/)
    .filter((w) => w.length > 2 && !stopWords.has(w));

  for (const word of words) {
    keywords.set(word, (keywords.get(word) ?? 0) + 1);
  }

  return keywords;
}

// Compute cosine similarity between two keyword maps
function cosineSimilarity(a: Map<string, number>, b: Map<string, number>): number {
  let dotProduct = 0;
  let magA = 0;
  let magB = 0;

  for (const [key, val] of a) {
    magA += val * val;
    if (b.has(key)) {
      dotProduct += val * b.get(key)!;
    }
  }

  for (const [, val] of b) {
    magB += val * val;
  }

  if (magA === 0 || magB === 0) return 0;
  return dotProduct / (Math.sqrt(magA) * Math.sqrt(magB));
}

// Build pack vectors from all 49 packs
async function buildPackVectors(): Promise<PackVector[]> {
  if (vectorCache) return vectorCache;

  const packs = await getExtensionPacks();
  const vectors: PackVector[] = [];

  for (const pack of packs) {
    // Combine name + description + PRD context keywords
    const fullText = `${pack.name} ${pack.description} ${pack.prdContexts
      .slice(0, 3)
      .map((c) => c.text.slice(0, 200))
      .join(" ")}`;

    vectors.push({
      packId: pack.id,
      packName: pack.name,
      description: pack.description,
      keywords: extractKeywords(fullText),
      prdCount: pack.prdContexts.length,
    });
  }

  vectorCache = vectors;
  return vectors;
}

export interface PackRecommendation {
  packId: string;
  packName: string;
  description: string;
  score: number; // 0-1 similarity score
  prdCount: number;
}

// Find the most relevant packs for a given prompt/description
export async function findRelevantPacks(
  prompt: string,
  maxResults: number = 5,
  minScore: number = 0.05
): Promise<PackRecommendation[]> {
  const vectors = await buildPackVectors();
  const promptKeywords = extractKeywords(prompt);

  const scored = vectors.map((v) => ({
    packId: v.packId,
    packName: v.packName,
    description: v.description,
    prdCount: v.prdCount,
    score: cosineSimilarity(promptKeywords, v.keywords),
  }));

  return scored
    .filter((s) => s.score >= minScore)
    .sort((a, b) => b.score - a.score)
    .slice(0, maxResults);
}

// Get all pack vectors (for UI display)
export async function getPackVectors(): Promise<
  { packId: string; packName: string; description: string; prdCount: number }[]
> {
  const vectors = await buildPackVectors();
  return vectors.map((v) => ({
    packId: v.packId,
    packName: v.packName,
    description: v.description,
    prdCount: v.prdCount,
  }));
}
