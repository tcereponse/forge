import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import { spawn } from "child_process";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const COQUILLE_PATH = "/home/z/my-project/upload/coquille_vide.apk";
const BUILD_TOOLS = "/tmp/android-sdk/build-tools/34.0.0";
const KEYSTORE = path.join(process.env.HOME || "/tmp", "debug.keystore");

// POST /api/mobile/coquille-apk
// Receives { name, description, html } and returns a signed APK built from
// the empty shell (coquille_vide.apk) with the custom HTML injected.
// This is the 100% autonomous approach: the shell already has the WebView
// code (classes.dex), we just replace index.html and re-sign.
export async function POST(request: NextRequest) {
  const tmpDir = `/tmp/coquille-build-${Date.now()}`;
  
  try {
    const body = await request.json();
    const { name, description, html } = body as { name: string; description: string; html: string };
    
    if (!name || !html) {
      return NextResponse.json(
        { success: false, error: "Nom et HTML requis" },
        { status: 400 }
      );
    }

    await fs.mkdir(tmpDir, { recursive: true });
    
    // Step 1: Copy the coquille APK
    const apkPath = path.join(tmpDir, "app.apk");
    await fs.copyFile(COQUILLE_PATH, apkPath);
    
    // Step 2: Remove old index.html from the APK
    await runCmd("zip", ["-d", apkPath, "assets/www/index.html"], tmpDir);
    
    // Step 3: Create the custom index.html
    const customHtml = generateAppHtml(name, description, html);
    const assetsDir = path.join(tmpDir, "assets", "www");
    await fs.mkdir(assetsDir, { recursive: true });
    await fs.writeFile(path.join(assetsDir, "index.html"), customHtml);
    
    // Step 4: Add the custom index.html to the APK
    await runCmd("zip", ["-u", apkPath, "assets/www/index.html"], tmpDir);
    
    // Step 5: Zipalign
    const alignedPath = path.join(tmpDir, "app-aligned.apk");
    await runCmd(path.join(BUILD_TOOLS, "zipalign"), ["-f", "4", apkPath, alignedPath], tmpDir);
    
    // Step 6: Generate debug keystore if it doesn't exist
    try {
      await fs.access(KEYSTORE);
    } catch {
      await runCmd("keytool", [
        "-genkeypair", "-alias", "androiddebugkey",
        "-keypass", "android", "-keystore", KEYSTORE,
        "-storepass", "android", "-keyalg", "RSA",
        "-keysize", "2048", "-validity", "10000",
        "-dname", "CN=Android Debug,O=Android,C=US",
      ]);
    }
    
    // Step 7: Sign the APK
    const signedPath = path.join(tmpDir, `${name.toLowerCase().replace(/\s+/g, "-")}.apk`);
    await runCmd(path.join(BUILD_TOOLS, "apksigner"), [
      "sign",
      "--ks", KEYSTORE,
      "--ks-key-alias", "androiddebugkey",
      "--ks-pass", "pass:android",
      "--key-pass", "pass:android",
      "--out", signedPath,
      alignedPath,
    ], tmpDir);
    
    // Step 8: Read and return the signed APK
    const apkBuffer = await fs.readFile(signedPath);
    const apkName = `${name.toLowerCase().replace(/\s+/g, "-")}.apk`;
    
    return new NextResponse(apkBuffer as unknown as BodyInit, {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.android.package-archive",
        "Content-Disposition": `attachment; filename="${apkName}"`,
        "Content-Length": String(apkBuffer.length),
      },
    });
  } catch (error) {
    console.error("[/api/mobile/coquille-apk]", error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Erreur" },
      { status: 500 }
    );
  } finally {
    try { await fs.rm(tmpDir, { recursive: true, force: true }); } catch {}
  }
}

function runCmd(cmd: string, args: string[], cwd?: string): Promise<{ code: number; stdout: string; stderr: string }> {
  return new Promise((resolve) => {
    const proc = spawn(cmd, args, { cwd, stdio: ["pipe", "pipe", "pipe"] });
    let stdout = "", stderr = "";
    proc.stdout?.on("data", (d) => stdout += d);
    proc.stderr?.on("data", (d) => stderr += d);
    proc.on("close", (code) => resolve({ code: code ?? 1, stdout, stderr }));
  });
}

function generateAppHtml(name: string, description: string, projectHtml: string): string {
  // If the caller provided full HTML, use it directly.
  // Otherwise, generate a simple app page from name + description.
  if (projectHtml && projectHtml.includes("<html")) {
    return projectHtml;
  }
  
  return `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1.0,maximum-scale=1.0,user-scalable=no,viewport-fit=cover">
<meta name="theme-color" content="#0f172a">
<meta name="mobile-web-app-capable" content="yes">
<title>${name}</title>
<style>
*{margin:0;padding:0;box-sizing:border-box;-webkit-tap-highlight-color:transparent}
body{font-family:system-ui,-apple-system,sans-serif;background:#0f172a;color:#f1f5f9;min-height:100vh;padding:16px}
.header{background:linear-gradient(135deg,#06b6d4,#14b8a6);padding:24px 16px;border-radius:12px;margin-bottom:16px}
.header h1{color:#0f172a;font-size:24px;font-weight:800;margin:0}
.header p{color:#0f172a;opacity:0.8;font-size:13px;margin-top:4px}
.card{background:#1e293b;border:1px solid #334155;border-radius:12px;padding:20px;margin-bottom:12px}
.card h2{color:#06b6d4;font-size:16px;margin:0 0 12px}
.card p{color:#94a3b8;font-size:14px;line-height:1.6}
.badge{background:rgba(6,182,212,0.15);border:1px solid rgba(6,182,212,0.3);color:#67e8f9;padding:4px 10px;border-radius:12px;font-size:11px;display:inline-block;margin:2px}
</style>
</head>
<body>
<div class="header">
  <h1>${name}</h1>
  <p>${description}</p>
</div>
<div class="card">
  <h2>📱 Application mobile</h2>
  <p>Apk généré par React Forge — 100% autonome, sans PC.</p>
  <div style="margin-top:12px">
    <span class="badge">React</span>
    <span class="badge">WebView Android</span>
    <span class="badge">Offline</span>
  </div>
</div>
</body>
</html>`;
}
