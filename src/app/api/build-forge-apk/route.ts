import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "fs";
import { spawn } from "child_process";
import path from "path";

export const runtime = "nodejs";
export const maxDuration = 300;
export const dynamic = "force-dynamic";

/** Run a command and return its output. */
function runCmd(cmd: string, args: string[], cwd?: string): Promise<{ code: number; stdout: string; stderr: string }> {
  return new Promise((resolve) => {
    const child = spawn(cmd, args, { cwd, shell: false });
    let stdout = "";
    let stderr = "";
    child.stdout?.on("data", (d) => (stdout += d));
    child.stderr?.on("data", (d) => (stderr += d));
    child.on("close", (code) => resolve({ code: code ?? 1, stdout, stderr }));
    child.on("error", (err) => resolve({ code: 1, stdout, stderr: stderr + err.message }));
  });
}

/**
 * Builds the React Forge mobile APK with the current server URL automatically injected.
 * The user downloads this APK and it already knows the server URL — no manual configuration needed.
 */
export async function POST(request: NextRequest) {
  try {
    // Get the server URL from the request
    const host = request.headers.get("host") || "";
    const protocol = request.headers.get("x-forwarded-proto") || "https";
    const serverUrl = `${protocol}://${host}`;

    if (!host) {
      return NextResponse.json(
        { success: false, error: "Impossible de déterminer l URL du serveur" },
        { status: 400 }
      );
    }

    // Build the APK with the server URL injected
    const scriptPath = path.join(process.cwd(), "build-mobile-apk.sh");
    const apkPath = path.join(process.cwd(), "public", "react-forge-mobile.apk");

    // Run the build script with the server URL as argument
    const result = await runCmd("bash", [scriptPath, serverUrl], process.cwd());

    if (result.code !== 0) {
      return NextResponse.json({
        success: false,
        error: "Échec de la compilation APK",
        log: result.stdout + result.stderr,
      }, { status: 500 });
    }

    // Read the APK
    try {
      const apkBuffer = await fs.readFile(apkPath);
      return new NextResponse(apkBuffer, {
        status: 200,
        headers: {
          "Content-Type": "application/vnd.android.package-archive",
          "Content-Disposition": `attachment; filename="react-forge-mobile.apk"`,
          "X-Server-Url": encodeURIComponent(serverUrl),
        },
      });
    } catch {
      return NextResponse.json({
        success: false,
        error: "APK non trouvé après build",
      }, { status: 500 });
    }
  } catch (error) {
    console.error("[/api/build-forge-apk]", error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : "Erreur",
    }, { status: 500 });
  }
}
