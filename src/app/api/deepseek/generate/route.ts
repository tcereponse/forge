import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 120;

// POST /api/deepseek/generate
// Direct DeepSeek API integration — no iframe, no Cloudflare blocking.
// Uses the DeepSeek API (api.deepseek.com) which is OpenAI-compatible.
// The user provides their DeepSeek API key in the request body.

interface GenerateRequest {
  apiKey: string;
  projectName: string;
  projectDescription: string;
  phase: "prd" | "code";
  prd?: string; // For phase 2, the PRD from phase 1
}

function buildPhase1Prompt(name: string, vision: string): string {
  return `Tu es un Ingénieur Senior. Ta mission : concevoir un PRD technique parfait.

Projet : ${name}
Vision : "${vision}"

📋 FORMAT DU PRD (Markdown uniquement, pas de code) :

## Problem Statement & Solution
Décris le problème et la solution technique.

## User Stories
Liste numérotée exhaustive (ex: "1. En tant que [acteur], je veux [feature], afin de [bénéfice]").

## Implementation Decisions
- Architecture (React+Vite+TS), HashRouter.
- Composants principaux, états, APIs.

## Testing Decisions

## Out of Scope

Stack : React 18 + Vite 5 + TypeScript 5 + Tailwind 3. Router : HashRouter.`;
}

function buildPhase2Prompt(name: string, prd: string): string {
  return `Tu es un générateur de code React expert. Tu réponds UNIQUEMENT par du JSON valide.

Projet : ${name}

Voici le PRD :
---
${prd}
---

Génère TOUT le code source du projet. Stack : React 18 + Vite + TypeScript + Tailwind CSS + HashRouter.

📁 Fichiers obligatoires :
- index.html (id="root", script src="/src/main.tsx")
- vite.config.ts (base:'./', plugins:[react()])
- package.json (type:module, dependencies: react, react-dom, react-router-dom)
- tsconfig.json
- tailwind.config.ts
- postcss.config.js
- src/main.tsx (createRoot)
- src/App.tsx (HashRouter + Routes)
- src/index.css (@tailwind base/components/utilities)
- src/components/MainComponent.tsx (composant métier principal avec VRAIE logique)

RÈGLES :
- Code COMPLET et FONCTIONNEL (pas de stubs)
- TypeScript strict
- Tailwind CSS pour le styling
- HashRouter OBLIGATOIRE
- Mobile-first responsive
- VRAIE logique métier (useState, interactions, navigation)

Format JSON EXACT :
{"files":[{"path":"index.html","content":"...","language":"html"},{"path":"src/App.tsx","content":"...","language":"tsx"},...]}

Réponds MAINTENANT avec uniquement l'objet JSON.`;
}

export async function POST(request: NextRequest) {
  try {
    const body: GenerateRequest = await request.json();
    const { apiKey, projectName, projectDescription, phase, prd } = body;

    if (!apiKey || !apiKey.startsWith("sk-")) {
      return NextResponse.json(
        { success: false, error: "Clé API DeepSeek invalide (doit commencer par sk-)" },
        { status: 400 }
      );
    }

    if (!projectName || !projectDescription) {
      return NextResponse.json(
        { success: false, error: "Nom et description requis" },
        { status: 400 }
      );
    }

    // Build prompt based on phase
    const prompt =
      phase === "prd"
        ? buildPhase1Prompt(projectName, projectDescription)
        : buildPhase2Prompt(projectName, prd || "");

    // Call DeepSeek API (OpenAI-compatible)
    const response = await fetch("https://api.deepseek.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "deepseek-chat",
        messages: [
          {
            role: "system",
            content:
              phase === "prd"
                ? "Tu es un architecte logiciel senior. Tu rédiges des PRD en Markdown."
                : "Tu es un générateur de code React expert. Tu réponds UNIQUEMENT par du JSON valide.",
          },
          { role: "user", content: prompt },
        ],
        temperature: 0.7,
        max_tokens: phase === "prd" ? 4000 : 8000,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json(
        { success: false, error: `DeepSeek API error (${response.status}): ${errorText.slice(0, 200)}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";

    if (phase === "prd") {
      return NextResponse.json({
        success: true,
        phase: "prd",
        prd: content,
      });
    } else {
      // Parse files from JSON response
      let files = [];
      try {
        const parsed = JSON.parse(content);
        if (parsed.files && Array.isArray(parsed.files)) {
          files = parsed.files;
        }
      } catch {
        // Try to extract JSON from text
        const jsonMatch = content.match(/\{[\s\S]*"files"[\s\S]*\}/);
        if (jsonMatch) {
          try {
            const parsed = JSON.parse(jsonMatch[0]);
            if (parsed.files) files = parsed.files;
          } catch {}
        }
      }

      if (files.length === 0) {
        return NextResponse.json(
          { success: false, error: "Aucun fichier trouvé dans la réponse DeepSeek", rawResponse: content.slice(0, 500) },
          { status: 422 }
        );
      }

      return NextResponse.json({
        success: true,
        phase: "code",
        files,
        fileCount: files.length,
      });
    }
  } catch (error) {
    console.error("[/api/deepseek/generate]", error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Erreur" },
      { status: 500 }
    );
  }
}
