#!/bin/bash
# Compile the React Forge mobile APK with the latest web app (10 tabs).
# Uses Android SDK build-tools 34.0.0 + OpenJDK 17.

set -e

ANDROID_HOME=/tmp/android-sdk
BUILD_TOOLS=$ANDROID_HOME/build-tools/34.0.0
PLATFORM_JAR=$ANDROID_HOME/platforms/android-34/android.jar
JDK=/tmp/jdk-17.0.13+11
PROJECT=/home/z/my-project
MOBILE_SRC=$PROJECT/mobile-app
BUILD_DIR=/tmp/react-forge-apk-build
WWW_DIR=$BUILD_DIR/assets/www
PackageName="com.reactforge.mobile"
PackagePath="com/reactforge/mobile"

echo "=== 1. Build mobile web app (Vite) ==="
cd "$MOBILE_SRC" && npx vite build 2>&1 | tail -5

echo "=== 2. Prepare build directory ==="
rm -rf "$BUILD_DIR"
mkdir -p "$WWW_DIR" "$BUILD_DIR/res/values" "$BUILD_DIR/res/drawable" "$BUILD_DIR/manifest" "$BUILD_DIR/src/$PackagePath" "$BUILD_DIR/gen" "$BUILD_DIR/obj" "$BUILD_DIR/bin"

echo "=== 3. Copy web build to assets/www/ ==="
cp -r "$PROJECT/public/mobile/"* "$WWW_DIR/"
ls "$WWW_DIR/" | head -5

echo "=== 4. Create AndroidManifest.xml ==="
cat > "$BUILD_DIR/manifest/AndroidManifest.xml" << 'MANIFEST'
<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    package="com.reactforge.mobile"
    android:versionCode="2"
    android:versionName="2.0">
    <uses-sdk android:minSdkVersion="21" android:targetSdkVersion="34" />
    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" android:maxSdkVersion="28" />
    <uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" android:maxSdkVersion="28" />
    <application
        android:label="React Forge"
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
</manifest>
MANIFEST

echo "=== 5. Create resources ==="
cat > "$BUILD_DIR/res/values/strings.xml" << 'STR'
<?xml version="1.0" encoding="utf-8"?>
<resources>
    <string name="app_name">React Forge</string>
</resources>
STR

cat > "$BUILD_DIR/res/values/styles.xml" << 'STYLE'
<?xml version="1.0" encoding="utf-8"?>
<resources>
    <style name="AppTheme" parent="android:Theme.Material.NoActionBar">
        <item name="android:colorPrimary">#06b6d4</item>
        <item name="android:colorPrimaryDark">#0891b2</item>
        <item name="android:statusBarColor">#0f172a</item>
    </style>
</resources>
STYLE

cat > "$BUILD_DIR/res/drawable/icon.xml" << 'ICON'
<?xml version="1.0" encoding="utf-8"?>
<vector xmlns:android="http://schemas.android.com/apk/res/android"
    android:width="48dp" android:height="48dp"
    android:viewportWidth="48" android:viewportHeight="48">
    <path android:fillColor="#06b6d4" android:pathData="M0,0h48v48h-48z"/>
    <path android:fillColor="#FFFFFF" android:pathData="M24,12L24,36M12,24L36,24" android:strokeWidth="4" android:strokeColor="#FFFFFF"/>
</vector>
ICON

echo "=== 6. Create MainActivity.java (with NativeHttp + ForgeFileSaver + StealthBridge) ==="
cat > "$BUILD_DIR/src/$PackagePath/MainActivity.java" << 'JAVA'
package com.reactforge.mobile;

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
        webView.addJavascriptInterface(new NativeHttp(), "NativeHttp");
        webView.addJavascriptInterface(new ForgeFileSaver(this), "AndroidFileSaver");
        webView.addJavascriptInterface(new StealthBridge(this), "AndroidBridge");
        webView.loadUrl("file:///android_asset/www/index.html");
    }

    // NativeHttp: native HTTP POST bridge — bypasses CORS by using HttpURLConnection.
    // The JS side calls NativeHttp.post(url, headersJson, body) and gets a JSON string back.
    // This is the key to making the APK sovereign: GLM-4.6 API calls go native, no PC server.
    public static class NativeHttp {
        @android.webkit.JavascriptInterface
        public String post(String url, String headersJson, String body) {
            try {
                java.net.URL u = new java.net.URL(url);
                java.net.HttpURLConnection conn = (java.net.HttpURLConnection) u.openConnection();
                conn.setRequestMethod("POST");
                conn.setConnectTimeout(30000);
                conn.setReadTimeout(120000);
                conn.setDoInput(true);
                conn.setDoOutput(true);
                conn.setRequestProperty("Content-Type", "application/json");
                // Parse headers JSON (simple key-value object)
                if (headersJson != null && headersJson.length() > 2) {
                    try {
                        org.json.JSONObject hdrs = new org.json.JSONObject(headersJson);
                        java.util.Iterator<String> keys = hdrs.keys();
                        while (keys.hasNext()) {
                            String k = keys.next();
                            String v = hdrs.getString(k);
                            conn.setRequestProperty(k, v);
                        }
                    } catch (Exception e) { /* ignore bad headers JSON */ }
                }
                // Write body
                if (body != null && body.length() > 0) {
                    byte[] bodyBytes = body.getBytes("UTF-8");
                    java.io.OutputStream os = conn.getOutputStream();
                    os.write(bodyBytes);
                    os.close();
                }
                int code = conn.getResponseCode();
                java.io.InputStream is;
                if (code >= 200 && code < 300) is = conn.getInputStream();
                else is = conn.getErrorStream();
                if (is == null) is = new java.io.ByteArrayInputStream(new byte[0]);
                java.io.ByteArrayOutputStream baos = new java.io.ByteArrayOutputStream();
                byte[] buf = new byte[8192];
                int n;
                while ((n = is.read(buf)) != -1) baos.write(buf, 0, n);
                is.close();
                String responseBody = new String(baos.toByteArray(), "UTF-8");
                // Return a JSON envelope: {"status":code,"body":"..."}
                org.json.JSONObject result = new org.json.JSONObject();
                result.put("status", code);
                result.put("body", responseBody);
                return result.toString();
            } catch (Exception e) {
                try {
                    org.json.JSONObject err = new org.json.JSONObject();
                    err.put("status", 0);
                    err.put("body", "");
                    err.put("error", e.getMessage() != null ? e.getMessage() : e.toString());
                    return err.toString();
                } catch (Exception e2) { return "{\"status\":0,\"body\":\"\",\"error\":\"unknown\"}"; }
            }
        }

        @android.webkit.JavascriptInterface
        public String get(String url, String headersJson) {
            try {
                java.net.URL u = new java.net.URL(url);
                java.net.HttpURLConnection conn = (java.net.HttpURLConnection) u.openConnection();
                conn.setRequestMethod("GET");
                conn.setConnectTimeout(15000);
                conn.setReadTimeout(30000);
                if (headersJson != null && headersJson.length() > 2) {
                    try {
                        org.json.JSONObject hdrs = new org.json.JSONObject(headersJson);
                        java.util.Iterator<String> keys = hdrs.keys();
                        while (keys.hasNext()) {
                            String k = keys.next();
                            String v = hdrs.getString(k);
                            conn.setRequestProperty(k, v);
                        }
                    } catch (Exception e) { /* ignore */ }
                }
                int code = conn.getResponseCode();
                java.io.InputStream is;
                if (code >= 200 && code < 300) is = conn.getInputStream();
                else is = conn.getErrorStream();
                if (is == null) is = new java.io.ByteArrayInputStream(new byte[0]);
                java.io.ByteArrayOutputStream baos = new java.io.ByteArrayOutputStream();
                byte[] buf = new byte[8192];
                int n;
                while ((n = is.read(buf)) != -1) baos.write(buf, 0, n);
                is.close();
                String responseBody = new String(baos.toByteArray(), "UTF-8");
                org.json.JSONObject result = new org.json.JSONObject();
                result.put("status", code);
                result.put("body", responseBody);
                return result.toString();
            } catch (Exception e) {
                try {
                    org.json.JSONObject err = new org.json.JSONObject();
                    err.put("status", 0);
                    err.put("body", "");
                    err.put("error", e.getMessage() != null ? e.getMessage() : e.toString());
                    return err.toString();
                } catch (Exception e2) { return "{\"status\":0,\"body\":\"\",\"error\":\"unknown\"}"; }
            }
        }
    }

    // ForgeFileSaver: saves files to Downloads/ReactForge/
    public static class ForgeFileSaver {
        private final Activity activity;
        public ForgeFileSaver(Activity a) { activity = a; }
        @android.webkit.JavascriptInterface
        public String getBackendUrl() { return ""; }
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
                    sb.append("{\"name\":\"").append(files[i].getName()).append("\",\"size\":").append(files[i].length()).append("}");
                }
                sb.append("]");
                return sb.toString();
            } catch (Exception e) { return "[]"; }
        }
    }

    // StealthBridge: native clipboard
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
    }

    @Override
    public boolean onKeyDown(int keyCode, KeyEvent event) {
        if (keyCode == KeyEvent.KEYCODE_BACK && webView != null && webView.canGoBack()) { webView.goBack(); return true; }
        return super.onKeyDown(keyCode, event);
    }
}
JAVA

echo "=== 7. Compile resources (aapt2) ==="
cd "$BUILD_DIR"
"$BUILD_TOOLS/aapt2" compile --dir res -o resources.zip 2>&1 | tail -3

echo "=== 8. Link resources (aapt2 link) ==="
"$BUILD_TOOLS/aapt2" link \
  -I "$PLATFORM_JAR" \
  --manifest manifest/AndroidManifest.xml \
  -o app-unsigned.apk \
  --java gen \
  -A assets \
  --auto-add-overlay \
  resources.zip 2>&1 | tail -3

echo "=== 9. Compile Java (javac) ==="
"$JDK/bin/javac" \
  -source 8 -target 8 \
  -bootclasspath "$PLATFORM_JAR" \
  -classpath "$PLATFORM_JAR" \
  -d obj \
  -sourcepath "gen:src" \
  "src/$PackagePath/MainActivity.java" 2>&1 | tail -3

echo "=== 10. Convert to DEX (d8) ==="
CLASS_FILES=$(find obj -name "*.class" | tr '\n' ' ')
"$BUILD_TOOLS/d8" --release --output . --lib "$PLATFORM_JAR" $CLASS_FILES 2>&1 | tail -3

echo "=== 11. Add classes.dex to APK ==="
"$BUILD_TOOLS/aapt" add app-unsigned.apk classes.dex 2>&1 | tail -2

echo "=== 12. Zipalign ==="
"$BUILD_TOOLS/zipalign" -f 4 app-unsigned.apk app-aligned.apk 2>&1 | tail -2

echo "=== 13. Generate debug keystore (if needed) ==="
KEYSTORE=/home/z/debug.keystore
if [ ! -f "$KEYSTORE" ]; then
  "$JDK/bin/keytool" -genkeypair \
    -alias androiddebugkey \
    -keypass android \
    -keystore "$KEYSTORE" \
    -storepass android \
    -keyalg RSA -keysize 2048 -validity 10000 \
    -dname "CN=Android Debug,O=Android,C=US" 2>&1 | tail -2
fi

echo "=== 14. Sign APK (apksigner) ==="
"$BUILD_TOOLS/apksigner" sign \
  --ks "$KEYSTORE" \
  --ks-key-alias androiddebugkey \
  --ks-pass pass:android \
  --key-pass pass:android \
  --out react-forge-mobile.apk \
  app-aligned.apk 2>&1 | tail -3

echo "=== 15. Copy APK to public/ ==="
cp react-forge-mobile.apk "$PROJECT/public/react-forge-mobile.apk"
ls -la "$PROJECT/public/react-forge-mobile.apk"

echo ""
echo "=== SUCCESS ==="
echo "APK: $(du -h $PROJECT/public/react-forge-mobile.apk | cut -f1)"
echo "Bundle: $(ls $WWW_DIR/ | wc -l) files in assets/www/"
