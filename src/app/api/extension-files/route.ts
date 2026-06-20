import { NextResponse } from "next/server";
import { getKirovFiles, getKirovAnalysis } from "@/lib/kirov-data";

export async function GET() {
  try {
    const [files, analysis] = await Promise.all([
      getKirovFiles(),
      getKirovAnalysis(),
    ]);
    return NextResponse.json({
      success: true,
      extension: {
        name: "ELITE FORGE GLOBAL — KIROV3",
        version: "13.0",
        manifestVersion: 3,
        description:
          "Extension Maîtresse : Cycle complet P1-P5 One-Shot — Grade Diamond",
      },
      analysis,
      files: files.map((f) => ({
        name: f.name,
        path: f.path,
        language: f.language,
        size: f.size,
        description: f.description,
        content: f.content,
      })),
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
