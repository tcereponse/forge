import { NextResponse } from "next/server";
import { withCORS, handlePreflight } from "@/lib/cors";
import { bridgeState } from "@/lib/bridge-state";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function OPTIONS() { return handlePreflight(); }

export async function GET() {
  const m = await bridgeState.getMission();
  if (!m || m.files.length === 0) {
    return withCORS(NextResponse.json({ error: "No files captured yet" }, { status: 404 }));
  }

  // Dynamically import JSZip
  const JSZip = (await import("jszip")).default;
  const zip = new JSZip();

  for (const file of m.files) {
    zip.file(file.path, file.content);
  }

  const buffer = await zip.generateAsync({
    type: "nodebuffer",
    compression: "DEFLATE",
    compressionOptions: { level: 6 },
  });

  const safeName = (m.name || "project").toLowerCase().replace(/[^a-z0-9-]/g, "-");
  return withCORS(new NextResponse(buffer, {
    status: 200,
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="${safeName}.zip"`,
      "Content-Length": String(buffer.length),
    },
  }));
}
