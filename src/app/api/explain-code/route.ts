import { NextRequest, NextResponse } from "next/server";
import { ensureZaiConfig } from "@/lib/zai-config";
import ZAI from "z-ai-web-dev-sdk";
import { getKirovFiles } from "@/lib/kirov-data";

export const runtime = "nodejs";
export const maxDuration = 60;

interface ExplainRequest {
  fileName?: string;
  question?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as ExplainRequest;
    const fileName = body.fileName?.trim();
    const question = body.question?.trim() || "Explique le rôle de ce fichier et ses points clés.";

    if (!fileName) {
      return NextResponse.json(
        { success: false, error: "fileName est requis" },
        { status: 400 }
      );
    }

    const files = await getKirovFiles();
    const file = files.find((f) => f.name === fileName);
    if (!file) {
      return NextResponse.json(
        { success: false, error: `Fichier '${fileName}' introuvable` },
        { status: 404 }
      );
    }

    // Cap the code we send to the LLM (content.js is ~45KB)
    const codeExcerpt =
      file.content.length > 16000
        ? `${file.content.slice(0, 16000)}\n\n// ... [tronqué, ${file.content.length} caractères au total]`
        : file.content;

    await ensureZaiConfig();
    const zai = await ZAI.create();
    const completion = await zai.chat.completions.create({
      messages: [
        {
          role: "assistant",
          content: `Tu es un ingénieur senior qui analyse le code source d'une extension Chrome Manifest V3 nommée "KIROV3". Réponds en français, en Markdown structuré et concis. Utilise des titres, des listes et du code inline. Contexte du fichier analysé : ${file.description}`,
        },
        {
          role: "user",
          content: `Fichier: ${file.name} (${file.language})\n\nQuestion: ${question}\n\nCode source:\n\`\`\`${file.language}\n${codeExcerpt}\n\`\`\``,
        },
      ],
      thinking: { type: "disabled" },
    });

    const explanation = completion.choices[0]?.message?.content ?? "";
    return NextResponse.json({ success: true, fileName, question, explanation });
  } catch (error) {
    console.error("[/api/explain-code] error:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "Erreur d'explication du code",
      },
      { status: 500 }
    );
  }
}
