@echo off
echo ==================================================
echo 🌐 SYNCHRONISATION UI SOUVERAINE (E:)
echo ==================================================

echo [*] Copie de l'interface Cockpit vers E:...
robocopy "C:\Eliteqod\app_ui" "E:\qodmaxv2\bridge\ui" /E /NFL /NDL >nul

if %ERRORLEVEL% LEQ 8 (
    echo ✅ UI synchronisée dans E:\qodmaxv2\bridge\ui
) else (
    echo ❌ Échec de la synchronisation de l'UI.
)

pause
