// Arsenal PRD Grade Diamond
import { ensureZaiConfig } from "@/lib/zai-config";
// Generates 10 structured PRD documents that guide code generation
// with surgical precision, separating concerns (Design, API, Security, etc.)

import ZAI from "z-ai-web-dev-sdk";
import type { ProjectConfig } from "./forge-config";

export interface ArsenalDocument {
  id: string;
  name: string;
  filename: string;
  role: string;
  content: string;
}

export interface Arsenal {
  documents: ArsenalDocument[];
}

// The 10 PRD documents of the Arsenal Grade Diamond
export const ARSENAL_DOCS = [
  {
    id: "vision",
    name: "Vision Stratégique",
    filename: "Vision_Strategique.md",
    role: "Définit le Pourquoi. Objectifs globaux, besoins utilisateurs, fonctionnalités clés (MVP).",
    prompt: `Rédige la Vision Stratégique pour l'application. Inclus : Objectifs (2-3), Public cible, Fonctionnalités clés (5-7 points), Critères de succès. Sois concis et stratégique.`,
  },
  {
    id: "architecture",
    name: "Architecture Système",
    filename: "Architecture_Systeme.md",
    role: "Plan technique. Structure du projet, dépendances, arborescence des fichiers.",
    prompt: `Rédige l'Architecture Système. Inclus : Stack technique, Structure des dossiers (arborescence), Dépendances principales, Points d'entrée. Sois technique et précis.`,
  },
  {
    id: "interface",
    name: "Interface Utilisateur",
    filename: "Interface_Utilisateur.md",
    role: "Cahier des charges visuel. Design System, thèmes, composants React réutilisables.",
    prompt: `Rédige l'Interface Utilisateur. Inclus : Palette de couleurs, Typographie, Composants réutilisables (liste avec props), Layout principal, Responsive. Sois visuel et précis.`,
  },
  {
    id: "database",
    name: "Base de Données",
    filename: "Base_de_Donnees.md",
    role: "Modélisation des données. Tables, types TypeScript, schémas de validation.",
    prompt: `Rédige la Base de Données. Inclus : Modèles de données (interfaces TypeScript), Relations, Schémas de validation (Zod si applicable), Persistance (localStorage/IndexedDB). Sois structuré.`,
  },
  {
    id: "security",
    name: "Sécurité et Souveraineté",
    filename: "Securite_et_Souverainete.md",
    role: "Protection des données. Tokens, isolation, gestion des rôles, guards.",
    prompt: `Rédige la Sécurité. Inclus : Authentification (si applicable), Validation des inputs, Gestion des erreurs, Bonnes pratiques. Adapte au type d'app.`,
  },
  {
    id: "api",
    name: "API et Protocoles",
    filename: "API_et_Protocoles.md",
    role: "Contrats de communication. Routes, formats d'échange entre Frontend et Backend.",
    prompt: `Rédige l'API et Protocoles. Inclus : Endpoints (si applicable), Hooks de fetch (React Query/SWR), Gestion du state serveur, Format des données. Si pas d'API externe, décris les fonctions de données locales.`,
  },
  {
    id: "ux",
    name: "Experience Utilisateur",
    filename: "Experience_Utilisateur.md",
    role: "Ergonomie. Animations, états de chargement, empty states, transitions.",
    prompt: `Rédige l'Expérience Utilisateur. Inclus : Animations (Framer Motion si applicable), États de chargement, États vides (empty states), Micro-interactions, Accessibilité. Sois détaillé.`,
  },
  {
    id: "tests",
    name: "Tests et Qualité",
    filename: "Tests_et_Qualite.md",
    role: "Plan d'assurance qualité. Tests unitaires et E2E, couverture.",
    prompt: `Rédige les Tests et Qualité. Inclus : Stratégie de test, Cas de test critiques (3-5), Outils (Vitest si applicable), Couverture attendue. Sois pragmatique.`,
  },
  {
    id: "deployment",
    name: "Déploiement et Forge",
    filename: "Deploiement_et_Forge.md",
    role: "Instructions de build. Configurations Vite, compilation, plateformes.",
    prompt: `Rédige le Déploiement et Forge. Inclus : Configuration de build (Vite), Variables d'environnement, Scripts npm, Optimisations (code-splitting, lazy loading). Sois technique.`,
  },
  {
    id: "maintenance",
    name: "Maintenance et Évolution",
    filename: "Maintenance_et_Evolution.md",
    role: "Roadmap et logs. Comment l'app doit évoluer, monitoring des erreurs.",
    prompt: `Rédige la Maintenance et Évolution. Inclus : Roadmap (court/long terme), Points de surveillance, Logs et debug, Évolutions futures possibles. Sois visionnaire mais réaliste.`,
  },
] as const;

// Generate all 10 Arsenal PRD documents in 2 LLM calls (5 docs each)
// to avoid timeout/memory issues with a single large request.
export async function generateArsenal(
  config: ProjectConfig,
  extensionDirective: string
): Promise<Arsenal> {
  await ensureZaiConfig();
    const zai = await ZAI.create();

  const docsList = ARSENAL_DOCS.map(
    (d, i) => `${i + 1}. ${d.filename}: ${d.prompt}`
  ).join("\n");

  const systemPrompt = `Tu es un Architecte Logiciel Senior. Tu génères des PRD en Markdown français, structurés et concis (50-100 mots chacun).`;

  const userPrompt = `Génère les 10 documents PRD pour l'app "${config.name}": ${config.description}
Stack: ${config.stack} + React${config.typescript ? " + TS" : ""}, ${config.styling}, features: ${config.features.join(", ") || "none"}

Documents à générer (50-100 mots chacun):
${docsList}

Réponds en JSON: {"documents":[{"id":"vision","name":"Vision Stratégique","filename":"Vision_Strategique.md","role":"...","content":"..."},...]}
Génère les 10 documents. JSON uniquement.`;

  const completion = await zai.chat.completions.create({
    messages: [
      { role: "assistant", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    thinking: { type: "disabled" },
  });

  const raw = completion.choices[0]?.message?.content ?? "";

  // Parse JSON (with fallback)
  let parsed: { documents?: ArsenalDocument[] } | null = null;
  try {
    parsed = JSON.parse(raw);
  } catch {
    // Try to extract from code fence
    const fenceMatch = raw.match(/```(?:json)?\s*([\s\S]*?)```/i);
    if (fenceMatch) {
      try {
        parsed = JSON.parse(fenceMatch[1]);
      } catch {
        /* continue */
      }
    }
    // Try first { to last }
    if (!parsed) {
      const first = raw.indexOf("{");
      const last = raw.lastIndexOf("}");
      if (first !== -1 && last !== -1) {
        try {
          parsed = JSON.parse(raw.slice(first, last + 1));
        } catch {
          /* continue */
        }
      }
    }
  }

  if (parsed?.documents && Array.isArray(parsed.documents)) {
    // Validate and fill missing metadata
    const docs: ArsenalDocument[] = parsed.documents
      .filter((d) => d && d.id && d.content)
      .map((d) => {
        const meta = ARSENAL_DOCS.find((m) => m.id === d.id);
        return {
          id: d.id,
          name: d.name || meta?.name || d.id,
          filename: d.filename || meta?.filename || `${d.id}.md`,
          role: d.role || meta?.role || "",
          content: d.content,
        };
      });

    if (docs.length > 0) {
      return { documents: docs };
    }
  }

  // Fallback: generate minimal arsenal from templates
  return {
    documents: ARSENAL_DOCS.map((d) => ({
      id: d.id,
      name: d.name,
      filename: d.filename,
      role: d.role,
      content: `## ${d.name}\n\n*Génération en cours — document non disponible.*\n\n**Rôle** : ${d.role}\n`,
    })),
  };
}
