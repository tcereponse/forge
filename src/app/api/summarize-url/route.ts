import { NextRequest, NextResponse } from "next/server";
import ZAI from "z-ai-web-dev-sdk";

export const runtime = "nodejs";
export const maxDuration = 60;

interface SummarizeRequest {
  url: string;
}

interface PageReaderResponse {
  data?: {
    title?: string;
    html?: string;
    url?: string;
    publishedTime?: string;
    usage?: { tokens?: number };
  };
  title?: string;
  html?: string;
  text?: string;
  url?: string;
  publish_time?: string;
}

function htmlToText(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as SummarizeRequest;
    const url = body.url?.trim();
    if (!url || !/^https?:\/\//i.test(url)) {
      return NextResponse.json(
        {
          success: false,
          error: "Une URL valide (http/https) est requise",
        },
        { status: 400 }
      );
    }

    const zai = await ZAI.create();
    const raw = (await zai.functions.invoke("page_reader", {
      url,
    })) as PageReaderResponse;

    const data = raw?.data ?? raw;
    const title = data?.title ?? "Sans titre";
    const html = data?.html ?? "";
    const pageUrl = data?.url ?? url;
    const publishedTime = data?.publishedTime ?? data?.publish_time;
    const tokens = data?.usage?.tokens;

    const plainText = htmlToText(html);

    if (!plainText || plainText.length < 50) {
      return NextResponse.json({
        success: true,
        url: pageUrl,
        title,
        publishedTime,
        summary:
          "Le contenu extractible de cette page est trop limité pour générer un résumé pertinent (page dynamique, paywall, ou contenu protégé).",
        extractedText: plainText,
        tokens,
        aiPowered: false,
      });
    }

    // Summarize with LLM, capped input
    const truncated = plainText.slice(0, 12000);
    const completion = await zai.chat.completions.create({
      messages: [
        {
          role: "assistant",
          content:
            "Tu es un assistant expert en synthèse de pages web. À partir du texte extract d'une page, tu produis un résumé structuré en Markdown en français : un paragraphe de synthèse (2-3 phrases), puis 3 à 5 points clés en liste à puces, puis 'Mots-clés : ...'. Sois factuel et concis.",
        },
        {
          role: "user",
          content: `URL: ${pageUrl}\nTitre: ${title}\n\nContenu de la page:\n${truncated}`,
        },
      ],
      thinking: { type: "disabled" },
    });

    const summary = completion.choices[0]?.message?.content ?? "";

    return NextResponse.json({
      success: true,
      url: pageUrl,
      title,
      publishedTime,
      summary,
      extractedText: plainText.slice(0, 4000),
      extractedLength: plainText.length,
      tokens,
      aiPowered: true,
    });
  } catch (error) {
    console.error("[/api/summarize-url] error:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Erreur lors de la lecture/résumé de l'URL",
      },
      { status: 500 }
    );
  }
}
