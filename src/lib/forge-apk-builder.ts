// Direct APK Builder — compiles a real .apk file in the sandbox
// Uses Android SDK build-tools (aapt2, d8, zipalign, apksigner)
// The APK wraps the web build (dist/) in a WebView Android app.

import { promises as fs } from "fs";
import { spawn } from "child_process";
import path from "path";
import type { ProjectConfig } from "./forge-config";

const ANDROID_HOME = "/tmp/android-sdk";
const BUILD_TOOLS = path.join(ANDROID_HOME, "build-tools", "34.0.0");
const PLATFORM_JAR = path.join(ANDROID_HOME, "platforms", "android-34", "android.jar");
const APK_DIR = path.join("/tmp", "react-forge-apk-build");

function run(cmd: string, args: string[], cwd?: string): Promise<{ code: number; stdout: string; stderr: string }> {
  return new Promise((resolve) => {
    const proc = spawn(cmd, args, {
      cwd,
      env: { ...process.env, ANDROID_HOME },
      stdio: ["pipe", "pipe", "pipe"],
    });
    let stdout = "";
    let stderr = "";
    proc.stdout?.on("data", (d) => (stdout += d));
    proc.stderr?.on("data", (d) => (stderr += d));
    proc.on("close", (code) => resolve({ code: code ?? 1, stdout, stderr }));
  });
}

export interface ApkBuildResult {
  success: boolean;
  apkPath?: string;
  error?: string;
  log: string;
}

export interface ApkBuildOptions {
  /** Backend URL baked into the APK (returned by ForgeFileSaver.getBackendUrl()). Empty = not injected. */
  backendUrl?: string;
  /** When true, adds ForgeFileSaver + StealthBridge JavascriptInterfaces (for the React Forge mobile app itself). */
  includeForgeInterfaces?: boolean;
}

export async function buildApk(
  projectId: string,
  config: ProjectConfig,
  distDir: string,
  options?: ApkBuildOptions
): Promise<ApkBuildResult> {
  const log: string[] = [];
  const appName = config.name;
  const packageName = `com.reactforge.${appName.toLowerCase().replace(/[^a-z0-9]/g, "")}`;
  const packagePath = packageName.replace(/\./g, "/");
  const buildDir = path.join(APK_DIR, projectId);
  const backendUrl = (options?.backendUrl || "").trim();
  const includeForge = options?.includeForgeInterfaces ?? false;

  try {
    // Clean and create build directory
    await fs.rm(buildDir, { recursive: true, force: true });
    await fs.mkdir(buildDir, { recursive: true });

    // Step 1: Create Android resource directory structure
    log.push("📁 Création de la structure Android...");
    const resDir = path.join(buildDir, "res");
    const valuesDir = path.join(resDir, "values");
    const drawableDir = path.join(resDir, "drawable");
    const mipmapDir = path.join(resDir, "mipmap-anydpi-v26");
    const manifestDir = path.join(buildDir, "manifest");
    const assetsDir = path.join(buildDir, "assets");
    const wwwDir = path.join(assetsDir, "www");
    const srcDir = path.join(buildDir, "src", ...packagePath.split("/"));
    const genDir = path.join(buildDir, "gen");

    await fs.mkdir(valuesDir, { recursive: true });
    await fs.mkdir(drawableDir, { recursive: true });
    await fs.mkdir(mipmapDir, { recursive: true });
    await fs.mkdir(manifestDir, { recursive: true });
    await fs.mkdir(wwwDir, { recursive: true });
    await fs.mkdir(srcDir, { recursive: true });
    await fs.mkdir(genDir, { recursive: true });
    await fs.mkdir(path.join(buildDir, "bin"), { recursive: true });
    await fs.mkdir(path.join(buildDir, "obj"), { recursive: true });

    // Step 2: Create AndroidManifest.xml
    log.push("📄 Création de AndroidManifest.xml...");
    const manifest = `<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    package="${packageName}"
    android:versionCode="1"
    android:versionName="1.0">
    <uses-sdk android:minSdkVersion="21" android:targetSdkVersion="34" />
    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" android:maxSdkVersion="28" />
    <uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" android:maxSdkVersion="28" />
    <application
        android:label="${appName}"
        android:icon="@drawable/icon"
        android:theme="@style/AppTheme"
        android:hardwareAccelerated="true"
        android:usesCleartextTraffic="true"
        android:requestLegacyExternalStorage="true">
        <activity android:name=".MainActivity" android:exported="true" android:configChanges="orientation|screenSize|keyboardHidden|screenLayout">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity>
    </application>
</manifest>`;
    const manifestPath = path.join(manifestDir, "AndroidManifest.xml");
    await fs.writeFile(manifestPath, manifest);

    // Step 3: Create resource files
    log.push("🎨 Création des ressources...");
    await fs.writeFile(
      path.join(valuesDir, "strings.xml"),
      `<?xml version="1.0" encoding="utf-8"?>
<resources>
    <string name="app_name">${appName}</string>
</resources>`
    );
    await fs.writeFile(
      path.join(valuesDir, "styles.xml"),
      `<?xml version="1.0" encoding="utf-8"?>
<resources>
    <style name="AppTheme" parent="android:Theme.Material.NoActionBar">
        <item name="android:colorPrimary">#06b6d4</item>
        <item name="android:colorPrimaryDark">#0891b2</item>
        <item name="android:statusBarColor">#0f172a</item>
    </style>
</resources>`
    );
    await fs.writeFile(
      path.join(valuesDir, "colors.xml"),
      `<?xml version="1.0" encoding="utf-8"?>
<resources>
    <color name="icon_bg">#0f172a</color>
</resources>`
    );
    // Simple vector icon
    await fs.writeFile(
      path.join(drawableDir, "icon.xml"),
      `<?xml version="1.0" encoding="utf-8"?>
<vector xmlns:android="http://schemas.android.com/apk/res/android"
    android:width="48dp" android:height="48dp"
    android:viewportWidth="48" android:viewportHeight="48">
    <path android:fillColor="#06b6d4" android:pathData="M0,0h48v48h-48z"/>
    <path android:fillColor="#FFFFFF" android:pathData="M24,12L24,36M12,24L36,24" android:strokeWidth="4" android:strokeColor="#FFFFFF"/>
</vector>`
    );

    // Step 4: Copy web build (dist/) to assets/www/
    log.push("📦 Copie du build web vers assets/www/...");
    try {
      const distEntries = await fs.readdir(distDir);
      for (const entry of distEntries) {
        const srcPath = path.join(distDir, entry);
        const dstPath = path.join(wwwDir, entry);
        await fs.cp(srcPath, dstPath, { recursive: true });
      }
      log.push(`  ✓ ${distEntries.length} fichiers copiés`);
    } catch (e) {
      log.push(`  ⚠ dist/ non trouvé: ${e instanceof Error ? e.message : "erreur"}`);
    }

    // Step 5: Create MainActivity.java + ForgeFileSaver + StealthBridge (JavascriptInterfaces)
    log.push("⚙️ Création de MainActivity.java...");
    const backendUrlLiteral = backendUrl.replace(/"/g, '\\"');
    // ForgeFileSaver: saves files to Downloads/ReactForge/, exposes getBackendUrl() to JS.
    // StealthBridge: native clipboard access.
    // Both are registered as JavascriptInterfaces so the WebView JS can call them directly.
    const forgeInterfacesBlock = includeForge
      ? `
    // ── ForgeFileSaver: native file saving + backend URL injection ──
    public static class ForgeFileSaver {
        private final Activity activity;
        private final String backendUrl;
        public ForgeFileSaver(Activity a, String url) { activity = a; backendUrl = url; }
        @android.webkit.JavascriptInterface
        public String getBackendUrl() { return backendUrl; }
        @android.webkit.JavascriptInterface
        public String getForgePath() {
            java.io.File dir = new java.io.File(android.os.Environment.getExternalStoragePublicDirectory(android.os.Environment.DIRECTORY_DOWNLOADS), "ReactForge");
            if (!dir.exists()) dir.mkdirs();
            return dir.getAbsolutePath();
        }
        @android.webkit.JavascriptInterface
        public String saveFile(String filename, String base64) {
            try {
                java.io.File dir = new java.io.File(android.os.Environment.getExternalStoragePublicDirectory(android.os.Environment.DIRECTORY_DOWNLOADS), "ReactForge");
                if (!dir.exists()) dir.mkdirs();
                java.io.File out = new java.io.File(dir, filename);
                byte[] data = android.util.Base64.decode(base64, android.util.Base64.DEFAULT);
                java.io.FileOutputStream fos = new java.io.FileOutputStream(out);
                fos.write(data); fos.close();
                return out.getAbsolutePath();
            } catch (Exception e) { return "ERROR:" + e.getMessage(); }
        }
        @android.webkit.JavascriptInterface
        public String listForgeFiles() {
            try {
                java.io.File dir = new java.io.File(android.os.Environment.getExternalStoragePublicDirectory(android.os.Environment.DIRECTORY_DOWNLOADS), "ReactForge");
                if (!dir.exists()) return "[]";
                java.io.File[] files = dir.listFiles();
                if (files == null) return "[]";
                StringBuilder sb = new StringBuilder("[");
                for (int i = 0; i < files.length; i++) {
                    if (i > 0) sb.append(",");
                    sb.append("{\\"name\\":\\"").append(files[i].getName()).append("\\",\\"size\\":").append(files[i].length()).append("}");
                }
                sb.append("]");
                return sb.toString();
            } catch (Exception e) { return "[]"; }
        }
    }
    // ── StealthBridge: native clipboard ──
    public static class StealthBridge {
        private final Activity activity;
        public StealthBridge(Activity a) { activity = a; }
        @android.webkit.JavascriptInterface
        public boolean copyToClipboard(String text) {
            try {
                android.content.ClipboardManager cm = (android.content.ClipboardManager) activity.getSystemService(android.content.Context.CLIPBOARD_SERVICE);
                cm.setPrimaryClip(android.content.ClipData.newPlainText("forge", text));
                return true;
            } catch (Exception e) { return false; }
        }
        @android.webkit.JavascriptInterface
        public String getClipboard() {
            try {
                android.content.ClipboardManager cm = (android.content.ClipboardManager) activity.getSystemService(android.content.Context.CLIPBOARD_SERVICE);
                if (cm.hasPrimaryClip() && cm.getPrimaryClip().getItemCount() > 0)
                    return String.valueOf(cm.getPrimaryClip().getItemAt(0).getText());
            } catch (Exception e) {}
            return "";
        }
    }`
      : "";

    const addJavascriptInterfaces = includeForge
      ? `        webView.addJavascriptInterface(new ForgeFileSaver(this, "${backendUrlLiteral}"), "AndroidFileSaver");
        webView.addJavascriptInterface(new StealthBridge(this), "AndroidBridge");`
      : "";

    const javaCode = `package ${packageName};

import android.app.Activity;
import android.os.Bundle;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.webkit.WebSettings;
import android.webkit.WebChromeClient;
import android.view.KeyEvent;
import android.view.View;

public class MainActivity extends Activity {
    private WebView webView;
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        // Edge-to-edge fullscreen
        getWindow().getDecorView().setSystemUiVisibility(View.SYSTEM_UI_FLAG_LAYOUT_STABLE | View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN);
        webView = new WebView(this);
        setContentView(webView);
        WebSettings settings = webView.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setDatabaseEnabled(true);
        settings.setAllowFileAccess(true);
        settings.setAllowContentAccess(true);
        settings.setAllowFileAccessFromFileURLs(true);
        settings.setAllowUniversalAccessFromFileURLs(true);
        settings.setUseWideViewPort(true);
        settings.setLoadWithOverviewMode(true);
        settings.setSupportZoom(false);
        settings.setMediaPlaybackRequiresUserGesture(false);
        settings.setJavaScriptCanOpenWindowsAutomatically(true);
        webView.setWebViewClient(new WebViewClient());
        webView.setWebChromeClient(new WebChromeClient());
        webView.setInitialScale(1);
${addJavascriptInterfaces}
        webView.loadUrl("file:///android_asset/www/index.html");
    }
${forgeInterfacesBlock}
    @Override
    public boolean onKeyDown(int keyCode, KeyEvent event) {
        if (keyCode == KeyEvent.KEYCODE_BACK && webView != null && webView.canGoBack()) { webView.goBack(); return true; }
        return super.onKeyDown(keyCode, event);
    }
}`;
    const javaFile = path.join(srcDir, "MainActivity.java");
    await fs.writeFile(javaFile, javaCode);

    // Step 6: Compile resources with aapt2
    log.push("🔨 Compilation des ressources (aapt2)...");
    const resourcesZ = path.join(buildDir, "resources.zip");
    const r1 = await run(path.join(BUILD_TOOLS, "aapt2"), [
      "compile",
      "--dir", resDir,
      "-o", resourcesZ,
    ], buildDir);
    log.push(`  aapt2 compile: code ${r1.code}`);
    if (r1.stderr) log.push(`  ${r1.stderr.slice(0, 200)}`);

    // Step 7: Link resources with aapt2
    log.push("🔗 Link des ressources (aapt2 link)...");
    const outputApk = path.join(buildDir, "app-unsigned.apk");
    const r2 = await run(path.join(BUILD_TOOLS, "aapt2"), [
      "link",
      "-I", PLATFORM_JAR,
      "--manifest", manifestPath,
      "-o", outputApk,
      "--java", genDir,
      "-A", assetsDir,
      "--auto-add-overlay",
      resourcesZ,
    ], buildDir);
    log.push(`  aapt2 link: code ${r2.code}`);
    if (r2.stderr) log.push(`  ${r2.stderr.slice(0, 300)}`);

    if (r2.code !== 0) {
      return { success: false, error: "Échec du link aapt2", log: log.join("\n") };
    }

    // Step 8: Compile Java with javac
    log.push("☕ Compilation Java (javac)...");
    const classesDir = path.join(buildDir, "obj");
    const javacPath = "/tmp/jdk-21.0.11/bin/javac";
    const r3 = await run(javacPath, [
      "-source", "8",
      "-target", "8",
      "-bootclasspath", PLATFORM_JAR,
      "-classpath", PLATFORM_JAR,
      "-d", classesDir,
      "-sourcepath", `${genDir}:${path.join(buildDir, "src")}`,
      javaFile,
    ], buildDir);
    log.push(`  javac: code ${r3.code}`);
    if (r3.stderr) log.push(`  ${r3.stderr.slice(0, 300)}`);

    if (r3.code !== 0) {
      return { success: false, error: "Échec de la compilation Java", log: log.join("\n") };
    }

    // Step 9: Convert to DEX with d8
    log.push("📦 Conversion en DEX (d8)...");
    const classesDex = path.join(buildDir, "classes.dex");
    const r4 = await run(path.join(BUILD_TOOLS, "d8"), [
      "--release",
      "--output", buildDir,
      "--lib", PLATFORM_JAR,
      ...await findClassFiles(classesDir),
    ], buildDir);
    log.push(`  d8: code ${r4.code}`);
    if (r4.stderr) log.push(`  ${r4.stderr.slice(0, 300)}`);

    if (r4.code !== 0) {
      return { success: false, error: "Échec de la conversion DEX", log: log.join("\n") };
    }

    // Step 10: Add classes.dex to APK
    log.push("📎 Ajout de classes.dex à l'APK...");
    const r5 = await run(path.join(BUILD_TOOLS, "aapt"), [
      "add", outputApk, "classes.dex",
    ], buildDir);
    log.push(`  aapt add: code ${r5.code}`);

    // Step 11: Zipalign
    log.push("📏 Zipalign...");
    const alignedApk = path.join(buildDir, "app-aligned.apk");
    const r6 = await run(path.join(BUILD_TOOLS, "zipalign"), [
      "-f", "4", outputApk, alignedApk,
    ], buildDir);
    log.push(`  zipalign: code ${r6.code}`);

    // Step 12: Sign with apksigner (debug key)
    log.push("🔐 Signature de l'APK...");
    // Generate a debug keystore if it doesn't exist
    const keystorePath = path.join(process.env.HOME || "/tmp", "debug.keystore");
    try {
      await fs.access(keystorePath);
    } catch {
      log.push("  Génération du keystore debug...");
      const rKs = await run("keytool", [
        "-genkeypair",
        "-alias", "androiddebugkey",
        "-keypass", "android",
        "-keystore", keystorePath,
        "-storepass", "android",
        "-keyalg", "RSA",
        "-keysize", "2048",
        "-validity", "10000",
        "-dname", "CN=Android Debug,O=Android,C=US",
      ]);
      log.push(`  keytool: code ${rKs.code}`);
    }

    const finalApk = path.join(buildDir, `${config.name.toLowerCase().replace(/[^a-z0-9]/g, "")}.apk`);
    const r7 = await run(path.join(BUILD_TOOLS, "apksigner"), [
      "sign",
      "--ks", keystorePath,
      "--ks-key-alias", "androiddebugkey",
      "--ks-pass", "pass:android",
      "--key-pass", "pass:android",
      "--out", finalApk,
      alignedApk,
    ], buildDir);
    log.push(`  apksigner: code ${r7.code}`);

    if (r7.code !== 0) {
      return { success: false, error: "Échec de la signature", log: log.join("\n") };
    }

    // Verify APK exists
    try {
      const stat = await fs.stat(finalApk);
      log.push(`✅ APK généré: ${(stat.size / 1024 / 1024).toFixed(1)} Mo`);
      return { success: true, apkPath: finalApk, log: log.join("\n") };
    } catch {
      return { success: false, error: "APK non trouvé après build", log: log.join("\n") };
    }
  } catch (error) {
    log.push(`❌ Erreur: ${error instanceof Error ? error.message : "inconnue"}`);
    return { success: false, error: error instanceof Error ? error.message : "Erreur", log: log.join("\n") };
  }
}

async function findClassFiles(dir: string): Promise<string[]> {
  const files: string[] = [];
  async function scan(d: string) {
    const entries = await fs.readdir(d, { withFileTypes: true });
    for (const e of entries) {
      const full = path.join(d, e.name);
      if (e.isDirectory()) await scan(full);
      else if (e.name.endsWith(".class")) files.push(full);
    }
  }
  await scan(dir);
  return files;
}
