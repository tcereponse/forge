import { NextRequest, NextResponse } from "next/server";
import { getPreviewFile, getPreviewIndex, getReconciledStatus } from "@/lib/workspace";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/preview/[id]                  → serves dist/index.html (empty path)
// GET /api/preview/[id]/assets/index.js  → serves dist/assets/index.js
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; path?: string[] }> }
) {
  try {
    const { id, path: pathSegments } = await params;

    // Check reconciled build status — must be "built" (checks disk for dist/)
    const status = await getReconciledStatus(id);
    if (status.build !== "built") {
      return new NextResponse(
        `<html><body style="font-family:system-ui;background:#0f172a;color:#94a3b8;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;text-align:center"><div><p style="font-size:14px;margin-bottom:8px">⏳ Aperçu non disponible</p><p style="font-size:12px;color:#64748b">${
          status.build === "building"
            ? "Build en cours…"
            : status.build === "failed"
              ? "Le build a échoué. Consulte les logs."
              : "Lance le build d'abord."
        }</p></div></body></html>`,
        {
          status: 200,
          headers: { "Content-Type": "text/html; charset=utf-8" },
        }
      );
    }

    // No path segments → serve index.html
    if (!pathSegments || pathSegments.length === 0) {
      const result = await getPreviewIndex(id);
      if (!result) {
        return new NextResponse("Not found", { status: 404 });
      }
      return new NextResponse(result.content as unknown as BodyInit, {
        status: 200,
        headers: {
          "Content-Type": result.mime,
          "Cache-Control": "no-cache",
        },
      });
    }

    const relativePath = pathSegments.join("/");
    let result = await getPreviewFile(id, relativePath);

    // If the file doesn't exist AND it's not a static asset (js/css/map/png/svg/etc),
    // fall back to index.html for SPA client-side routing (e.g. /about, /dashboard).
    const assetExtensions = [
      ".js", ".mjs", ".css", ".map", ".json", ".png", ".jpg", ".jpeg",
      ".gif", ".webp", ".svg", ".ico", ".woff", ".woff2", ".ttf", ".eot",
    ];
    const isAsset = assetExtensions.some((ext) => relativePath.endsWith(ext));

    if (!result && !isAsset) {
      // SPA fallback: serve index.html for any non-asset path
      result = await getPreviewIndex(id);
    }

    if (!result) {
      // Final fallback: try index.html anyway
      result = await getPreviewIndex(id);
    }

    if (!result) {
      return new NextResponse("Not found", { status: 404 });
    }

    return new NextResponse(result.content as unknown as BodyInit, {
      status: 200,
      headers: {
        "Content-Type": result.mime,
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch (error) {
    console.error("[preview asset] error:", error);
    return new NextResponse("Preview error", { status: 500 });
  }
}
