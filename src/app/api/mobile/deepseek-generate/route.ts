import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 120;

// POST /api/mobile/deepseek-generate
// Mobile app calls this to generate PRD/Code via DeepSeek API or GLM-4.6.
// If apiKey provided → DeepSeek API. Otherwise → GLM-4.6 (z-ai-web-dev-sdk).

interface GenerateRequest {
  projectName: string;
  projectDescription: string;
  phase: "prd" | "code";
  prd?: string;
  apiKey?: string;
}

function buildPhase1Prompt(name: string, vision: string): string {
  return `Tu es un Ingénieur Senior. Ta mission : concevoir un PRD technique parfait.

Projet : ${name}
Vision : "${vision}"

FORMAT DU PRD (Markdown uniquement, pas de code) :

## Problem Statement & Solution
## User Stories (liste numérotée exhaustive)
## Implementation Decisions (React+Vite+TS, HashRouter)
## Testing Decisions
## Out of Scope

Stack : React 18 + Vite 5 + TypeScript 5 + Tailwind 3.`;
}

function buildPhase2Prompt(name: string, prd: string): string {
  return `Tu es un générateur de code React expert. Tu réponds UNIQUEMENT par du JSON valide.

Projet : ${name}

Voici le PRD :
---
${prd}
---

Génère TOUT le code source. Stack : React 18 + Vite + TypeScript + Tailwind + HashRouter.

Fichiers : index.html, vite.config.ts, package.json, tsconfig.json, tailwind.config.ts, postcss.config.js, src/main.tsx, src/App.tsx, src/index.css, src/components/MainComponent.tsx

Code COMPLET, TypeScript strict, Tailwind, HashRouter, mobile-first.

Format : {"files":[{"path":"...","content":"...","language":"..."}]}
Uniquement le JSON.`;
}

export async function POST(request: NextRequest) {
  try {
    const body: GenerateRequest = await request.json();
    const { projectName, projectDescription, phase, prd, apiKey } = body;

    if (!projectName || !projectDescription) {
      return NextResponse.json(
        { success: false, error: "Nom et description requis" },
        { status: 400 }
      );
    }

    const useDeepSeek = apiKey && apiKey.startsWith("sk-");
    const prompt = phase === "prd"
      ? buildPhase1Prompt(projectName, projectDescription)
      : buildPhase2Prompt(projectName, prd || "");

    if (useDeepSeek) {
      // ── DeepSeek API ─────────────────────────────────────────────────
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
              content: phase === "prd"
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
        return NextResponse.json({ success: true, phase: "prd", prd: content, ai: "deepseek" });
      } else {
        let files = [];
        try {
          const parsed = JSON.parse(content);
          if (parsed.files) files = parsed.files;
        } catch {
          const m = content.match(/\{[\s\S]*"files"[\s\S]*\}/);
          if (m) { try { const p = JSON.parse(m[0]); if (p.files) files = p.files; } catch {} }
        }
        return NextResponse.json({ success: true, phase: "code", files, fileCount: files.length, ai: "deepseek" });
      }
    } else {
      // ── GLM-4.6 (z-ai-web-dev-sdk) ───────────────────────────────────
      const ZAI = (await import("z-ai-web-dev-sdk")).default;
      const zai = await ZAI.create();

      const completion = await zai.chat.completions.create({
        messages: [
          {
            role: "assistant",
            content: phase === "prd"
              ? "Tu es un architecte logiciel senior. Tu rédiges des PRD en Markdown. Réponds uniquement avec le document Markdown."
              : "Tu es un générateur de code React expert. Tu réponds UNIQUEMENT par du JSON valide, aucun texte autour.",
          },
          { role: "user", content: prompt },
        ],
        thinking: { type: "disabled" },
      });

      const content = completion.choices?.[0]?.message?.content || "";

      if (phase === "prd") {
        return NextResponse.json({ success: true, phase: "prd", prd: content, ai: "glm-4.6" });
      } else {
        let files = [];
        try {
          const parsed = JSON.parse(content);
          if (parsed.files) files = parsed.files;
        } catch {
          const m = content.match(/\{[\s\S]*"files"[\s\S]*\}/);
          if (m) { try { const p = JSON.parse(m[0]); if (p.files) files = p.files; } catch {} }
        }
        
        if (files.length === 0) {
          return NextResponse.json(
            { success: false, error: "Aucun fichier trouvé", rawResponse: content.slice(0, 500) },
            { status: 422 }
          );
        }
        
        return NextResponse.json({ success: true, phase: "code", files, fileCount: files.length, ai: "glm-4.6" });
      }
    }
  } catch (error) {
    console.error("[/api/mobile/deepseek-generate]", error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Erreur" },
      { status: 500 }
    );
  }
}
