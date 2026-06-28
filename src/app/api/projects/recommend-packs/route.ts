import { NextRequest, NextResponse } from "next/server";
import { findRelevantPacks } from "@/lib/pack-embeddings";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { prompt, maxResults = 5 } = body as { prompt: string; maxResults?: number };

    if (!prompt || prompt.trim().length < 3) {
      return NextResponse.json(
        { success: false, error: "Prompt trop court (3 caractères min.)" },
        { status: 400 }
      );
    }

    const recommendations = await findRelevantPacks(prompt, maxResults);

    return NextResponse.json({
      success: true,
      prompt,
      recommendations,
      count: recommendations.length,
    });
  } catch (error) {
    console.error("[/api/projects/recommend-packs]", error);
    return NextResponse.json(
      { success: false, error: "Impossible de recommander des packs" },
      { status: 500 }
    );
  }
}
