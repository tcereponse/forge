@echo off
setlocal
echo ==================================================
echo 💎 MIGRATION VERS SOUVERAINETE TOTALE (E:)
echo ==================================================

echo [*] Transfert du SDK Android (C: -> E:)...
robocopy "C:\Eliteqod\apkbuilder\android_sdk" "E:\qodmaxv2\apkbuilder\android_sdk" /E /MT:8 /R:3 /W:5 /NFL /NDL

echo [*] Transfert du JDK Java (C: -> E:)...
robocopy "C:\Eliteqod\apkbuilder\java_jdk" "E:\qodmaxv2\apkbuilder\java_jdk" /E /MT:8 /R:3 /W:5 /NFL /NDL

if %ERRORLEVEL% LEQ 8 (
    echo.
    echo ✅ SUCCES : SDK et JDK sont maintenant sur E:.
    echo [i] Vous pouvez maintenant debrancher le disque C: pour vos builds.
) else (
    echo.
    echo ❌ ERREUR : La migration a echoue (Code: %ERRORLEVEL%).
)

echo ==================================================
pause
