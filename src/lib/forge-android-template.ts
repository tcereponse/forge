// Android WebView APK Template Generator
// Generates Android project files compatible with forge_apk_builder.py
// Uses {{ package_id }} and {{ app_name }} placeholders for template substitution

import type { ProjectConfig, GeneratedFile } from "./forge-config";

export function generateAndroidTemplate(config: ProjectConfig): GeneratedFile[] {
  const files: GeneratedFile[] = [];
  const appName = config.name;
  const packageName = `com.reactforge.${appName.toLowerCase().replace(/[^a-z0-9]/g, "")}`;

  // AndroidManifest.xml — pre-substituted version
  files.push({
    path: `android/app/src/main/AndroidManifest.xml`,
    content: `<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    package="${packageName}">

    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />

    <application
        android:allowBackup="true"
        android:icon="@mipmap/ic_launcher"
        android:label="${appName}"
        android:roundIcon="@mipmap/ic_launcher_round"
        android:supportsRtl="true"
        android:theme="@style/AppTheme"
        android:usesCleartextTraffic="true">
        <activity
            android:name=".MainActivity"
            android:exported="true"
            android:configChanges="orientation|screenSize|keyboard|keyboardHidden"
            android:screenOrientation="portrait">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity>
    </application>
</manifest>
`,
    language: "xml",
  });

  // .j2 template versions for forge_apk_builder.py compatibility
  files.push({
    path: `android/src/AndroidManifest.xml.j2`,
    content: `<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    package="{{ package_id }}">

    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />

    <application
        android:allowBackup="true"
        android:icon="@mipmap/ic_launcher"
        android:label="{{ app_name }}"
        android:roundIcon="@mipmap/ic_launcher_round"
        android:supportsRtl="true"
        android:theme="@style/AppTheme"
        android:usesCleartextTraffic="true">
        <activity
            android:name=".MainActivity"
            android:exported="true"
            android:configChanges="orientation|screenSize|keyboard|keyboardHidden"
            android:screenOrientation="portrait">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity>
    </application>
</manifest>
`,
    language: "xml",
  });

  // MainActivity.java.j2 template
  files.push({
    path: `android/src/MainActivity.java.j2`,
    content: `package {{ package_id }};

import android.app.Activity;
import android.os.Bundle;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.webkit.WebSettings;

public class MainActivity extends Activity {
    private WebView webView;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        webView = new WebView(this);
        setContentView(webView);

        WebSettings settings = webView.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setAllowFileAccess(true);
        settings.setUseWideViewPort(true);
        settings.setLoadWithOverviewMode(true);

        webView.setWebViewClient(new WebViewClient());
        webView.loadUrl("file:///android_asset/www/index.html");
    }

    @Override
    public void onBackPressed() {
        if (webView != null && webView.canGoBack()) {
            webView.goBack();
        } else {
            super.onBackPressed();
        }
    }
}
`,
    language: "java",
  });

  // Pre-substituted MainActivity.java
  const packagePath = packageName.replace(/\./g, "/");
  files.push({
    path: `android/app/src/main/java/${packagePath}/MainActivity.java`,
    content: `package ${packageName};

import android.app.Activity;
import android.os.Bundle;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.webkit.WebSettings;

public class MainActivity extends Activity {
    private WebView webView;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        webView = new WebView(this);
        setContentView(webView);

        WebSettings settings = webView.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setAllowFileAccess(true);
        settings.setUseWideViewPort(true);
        settings.setLoadWithOverviewMode(true);

        webView.setWebViewClient(new WebViewClient());
        webView.loadUrl("file:///android_asset/www/index.html");
    }

    @Override
    public void onBackPressed() {
        if (webView != null && webView.canGoBack()) {
            webView.goBack();
        } else {
            super.onBackPressed();
        }
    }
}
`,
    language: "java",
  });

  // build.gradle (app level)
  files.push({
    path: `android/app/build.gradle`,
    content: `plugins {
    id 'com.android.application'
}

android {
    namespace '${packageName}'
    compileSdk 34

    defaultConfig {
        applicationId "${packageName}"
        minSdk 24
        targetSdk 34
        versionCode 1
        versionName "1.0.0"
    }

    buildTypes {
        release {
            minifyEnabled false
            proguardFiles getDefaultProguardFile('proguard-android-optimize.txt'), 'proguard-rules.pro'
        }
        debug {
            debuggable true
        }
    }

    compileOptions {
        sourceCompatibility JavaVersion.VERSION_17
        targetCompatibility JavaVersion.VERSION_17
    }

    sourceSets {
        main {
            assets.srcDirs += ['src/main/assets']
        }
    }
}

dependencies {
    implementation 'androidx.appcompat:appcompat:1.7.0'
}
`,
    language: "groovy",
  });

  // build.gradle (project level)
  files.push({
    path: `android/build.gradle`,
    content: `plugins {
    id 'com.android.application' version '8.2.0' apply false
}
`,
    language: "groovy",
  });

  // settings.gradle
  files.push({
    path: `android/settings.gradle`,
    content: `pluginManagement {
    repositories {
        google()
        mavenCentral()
        gradlePluginPortal()
    }
}
dependencyResolutionManagement {
    repositoriesMode.set(RepositoriesMode.FAIL_ON_PROJECT_REPOS)
    repositories {
        google()
        mavenCentral()
    }
}
rootProject.name = "${appName}"
include ':app'
`,
    language: "groovy",
  });

  // gradle.properties
  files.push({
    path: `android/gradle.properties`,
    content: `org.gradle.jvmargs=-Xmx2048m -Dfile.encoding=UTF-8
android.useAndroidX=true
android.nonTransitiveRClass=true
`,
    language: "properties",
  });

  // styles.xml
  files.push({
    path: `android/app/src/main/res/values/styles.xml`,
    content: `<?xml version="1.0" encoding="utf-8"?>
<resources>
    <style name="AppTheme" parent="Theme.AppCompat.NoActionBar">
        <item name="colorPrimary">#06b6d4</item>
        <item name="colorPrimaryDark">#0891b2</item>
        <item name="colorAccent">#06b6d4</item>
    </style>
</resources>
`,
    language: "xml",
  });

  // colors.xml
  files.push({
    path: `android/app/src/main/res/values/colors.xml`,
    content: `<?xml version="1.0" encoding="utf-8"?>
<resources>
    <color name="ic_launcher_background">#0f172a</color>
    <color name="colorPrimary">#06b6d4</color>
</resources>
`,
    language: "xml",
  });

  // strings.xml
  files.push({
    path: `android/app/src/main/res/values/strings.xml`,
    content: `<?xml version="1.0" encoding="utf-8"?>
<resources>
    <string name="app_name">${appName}</string>
</resources>
`,
    language: "xml",
  });

  // Adaptive icon
  files.push({
    path: `android/app/src/main/res/mipmap-anydpi-v26/ic_launcher.xml`,
    content: `<?xml version="1.0" encoding="utf-8"?>
<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">
    <background android:drawable="@color/ic_launcher_background"/>
    <foreground android:drawable="@drawable/ic_launcher_foreground"/>
</adaptive-icon>
`,
    language: "xml",
  });

  files.push({
    path: `android/app/src/main/res/mipmap-anydpi-v26/ic_launcher_round.xml`,
    content: `<?xml version="1.0" encoding="utf-8"?>
<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">
    <background android:drawable="@color/ic_launcher_background"/>
    <foreground android:drawable="@drawable/ic_launcher_foreground"/>
</adaptive-icon>
`,
    language: "xml",
  });

  // Vector icon
  files.push({
    path: `android/app/src/main/res/drawable/ic_launcher_foreground.xml`,
    content: `<vector xmlns:android="http://schemas.android.com/apk/res/android"
    android:width="108dp"
    android:height="108dp"
    android:viewportWidth="108"
    android:viewportHeight="108">
    <path
        android:fillColor="#06b6d4"
        android:pathData="M54,30 L54,78 M30,54 L78,54"
        android:strokeWidth="6"
        android:strokeColor="#06b6d4"/>
</vector>
`,
    language: "xml",
  });

  // proguard-rules.pro
  files.push({
    path: `android/app/proguard-rules.pro`,
    content: `-keep class android.webkit.** { *; }
`,
    language: "text",
  });

  // BUILD_APK.md
  files.push({
    path: `BUILD_APK.md`,
    content: `# Build APK — ${appName}

## 📱 Build avec le script forge_apk_builder.py

\`\`\`bash
python forge_apk_builder.py --src dist --name "${appName}" --package "${packageName}" --build
\`\`\`

## 📱 Build manuel (Android Studio)

1. \`npm install && npm run build\`
2. Copie \`dist/\` vers \`android/app/src/main/assets/www/\`
3. Ouvre \`android/\` dans Android Studio
4. Build → Build APK(s)

## 📱 Build ligne de commande

\`\`\`bash
cd android
./gradlew assembleDebug
\`\`\`

APK: \`app/build/outputs/apk/debug/app-debug.apk\`

## ⚙️ Configuration
- Package: \`${packageName}\`
- Min SDK: 24 (Android 7.0)
- Target SDK: 34 (Android 14)
`,
    language: "markdown",
  });

  // build-apk.sh
  files.push({
    path: `build-apk.sh`,
    content: `#!/bin/bash
echo "📦 Building web app..."
npm install && npm run build

echo "📱 Copying dist to Android assets..."
mkdir -p android/app/src/main/assets/www
cp -r dist/* android/app/src/main/assets/www/

echo "🔨 Building APK..."
cd android
chmod +x gradlew 2>/dev/null
./gradlew assembleDebug

APK="app/build/outputs/apk/debug/app-debug.apk"
if [ -f "$APK" ]; then
    echo "✅ APK: $APK"
    cp "$APK" "../${appName}.apk"
else
    echo "❌ Build failed"
fi
`,
    language: "text",
  });

  // build-apk.bat
  files.push({
    path: `build-apk.bat`,
    content: `@echo off
echo Building web app...
call npm install
call npm run build

echo Copying dist to Android assets...
mkdir android\\app\\src\\main\\assets\\www 2>nul
xcopy /E /I /Y dist android\\app\\src\\main\\assets\\www

echo Building APK...
cd android
call gradlew.bat assembleDebug

set APK=app\\build\\outputs\\apk\\debug\\app-debug.apk
if exist "%APK%" (
    echo APK generated: %APK%
    copy "%APK%" "..\\..\\${appName}.apk"
) else (
    echo APK build failed.
)
pause
`,
    language: "text",
  });

  return files;
}
