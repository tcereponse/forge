import { NextRequest, NextResponse } from "next/server";
import ZAI from "z-ai-web-dev-sdk";

export const runtime = "nodejs";
export const maxDuration = 60;

interface SearchRequest {
  query: string;
  num?: number;
}

interface SearchResultItem {
  url: string;
  name: string;
  snippet: string;
  host_name: string;
  rank: number;
  date: string;
  favicon: string;
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as SearchRequest;
    const query = body.query?.trim();
    if (!query) {
      return NextResponse.json(
        { success: false, error: "Le paramètre 'query' est requis" },
        { status: 400 }
      );
    }

    const num = Math.min(Math.max(body.num ?? 6, 1), 10);

    const zai = await ZAI.create();
    const results = (await zai.functions.invoke("web_search", {
      query,
      num,
    })) as SearchResultItem[];

    const items = Array.isArray(results) ? results : [];

    return NextResponse.json({
      success: true,
      query,
      count: items.length,
      results: items.map((item, index) => ({
        position: index + 1,
        title: item.name,
        url: item.url,
        snippet: item.snippet,
        domain: item.host_name,
        date: item.date,
        favicon: item.favicon,
      })),
    });
  } catch (error) {
    console.error("[/api/ai-search] error:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "Erreur de recherche IA",
      },
      { status: 500 }
    );
  }
}
