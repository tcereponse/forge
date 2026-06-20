import { NextRequest, NextResponse } from "next/server";
import ZAI from "z-ai-web-dev-sdk";

export const runtime = "nodejs";
export const maxDuration = 60;

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

const SYSTEM_PROMPT = `Tu es "KIROV Copilote", un expert technique spécialisé dans l'analyse des extensions de navigateur Chrome (Manifest V3) augmentées par l'IA.

Contexte : Tu assistes l'utilisateur dans l'analyse d'une extension réelle nommée "ELITE FORGE GLOBAL — KIROV3" (v13.0). Cette extension est un orchestrateur qui :
- Se connecte à un serveur local (127.0.0.1:5005) via un "bridge"
- Détecte la plateforme d'IA (DeepSeek, ChatGPT, Gemini) via le hostname
- Injecte des prompts ingénierisés (P1: PRD, P2: génération code TDD, P3: audit) dans les textareas des chats IA en utilisant des native setters + reset du React _valueTracker + keypresses simulés
- Capture la sortie de l'IA via un MutationObserver (debounce 500ms), déduplique avec SHA-256
- Valide le code généré (fichiers requis, couleurs bannies purple/indigo/violet, imports ESM)
- Relaye le code validé au serveur local pour matérialisation
- Affiche des toasts + un overlay "Build Monitor" avec logs colorisés
- Implémente un Circuit Breaker (5 échecs → offline), une file d'attente offline, et un polling adaptatif

Architecture modulaire (9 modules) : KirovLogger, EventBus, StateManager, BridgeClient, PlatformDetector, PromptEngine, ValidationOrchestrator, OutputScanner, UIRenderer.

Règles de réponse :
1. Réponds en français, de manière technique et précise.
2. Utilise du Markdown (titres, listes, code inline avec backticks, blocs de code avec langage).
3. Sois concis mais complet. Quand l'utilisateur pose une question sur un concept, relie-le concrètement au code KIROV3 quand c'est pertinent.
4. Tu peux expliquer les 4 piliers : (1) Extension comme Pont/Bridge, (2) Navigation & Recherche AI, (3) Aide Utilisateur/Copilote, (4) Transformation en Application.
5. Si l'utilisateur demande des exemples de code, fournis des snippets JS/TS réalistes.`;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { messages } = body as { messages: ChatMessage[] };

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json(
        { success: false, error: "messages array is required" },
        { status: 400 }
      );
    }

    // Keep conversation manageable: system + last 10 messages
    const recentMessages = messages.slice(-10);

    const zai = await ZAI.create();
    const completion = await zai.chat.completions.create({
      messages: [
        { role: "assistant", content: SYSTEM_PROMPT },
        ...recentMessages.map((m) => ({
          role: m.role,
          content: m.content,
        })),
      ],
      thinking: { type: "disabled" },
    });

    const response = completion.choices[0]?.message?.content;

    if (!response || response.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: "Réponse vide du modèle" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, response });
  } catch (error) {
    console.error("[/api/copilot] error:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "Erreur inconnue du copilote",
      },
      { status: 500 }
    );
  }
}
