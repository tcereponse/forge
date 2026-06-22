@echo off
setlocal enabledelayedexpansion
TITLE 🔨 FORGE QODMAX SOUVERAINE - GOLD EDITION v12.3

color 0B
echo.
echo   ==================================================
echo   [+] FORGE QODMAX G8 - DIAMOND GOLD EDITION v12.3
echo   [+] COMPILATEUR SOUVERAIN (GRADE GOLD)
echo   ==================================================
echo   [+] PROTOCOLE : MATÉRIALISATION MASTER FORGE QODMAX
echo.

cd /d "%~dp0"

:: INSPECTION
echo [*] Inspection des prerequis...
if not exist "E:\qodmaxv2\apkbuilder\android_sdk" (
    echo [!] ERREUR : SDK Android absent sur E:.
    pause
    exit /b 1
)

:: NETTOYAGE
echo [*] Purge des anciens flux et caches...
for /d %%i in (*_android) do (
    echo     - Nettoyage : %%i
    rmdir /s /q "%%i" >nul 2>&1
)
echo [+] Zone de forge prete.

echo.
echo [*] LANCEMENT DE LA FORGE SOUVERAINE...
echo     (Injection Radar, PRD, Methodologies et Memoire)
echo.

python apk_builder.py --src "E:\qodmaxv2\bridge\ui" --name "Qodmax_Sovereign_v12" --package "com.qodmax.souverain" --build

if %ERRORLEVEL% NEQ 0 (
    echo.
    color 0C
    echo [!!!] ERREUR LORS DU BUILD SOUVERAIN.
    pause
    exit /b 1
)

echo.
echo   ==================================================
echo   [OK] MISSION REUSSIE : APK DIAMOND OPERATIONNEL
echo   [+] CHEMIN : E:\qodmaxv2\output\Qodmax_Sovereign_v12_diamond.apk
echo   ==================================================
echo.
pause
