@echo off
title VERCEL SOVEREIGN BUILD WORKER v3.0
color 0B

echo ========================================================
echo 🚀 VERCEL SOVEREIGN BUILD WORKER v3.0
echo 🏢 Application Independante - Ne fermez pas cette fenetre
echo 📱 Avec generation APK automatique (QODMAX)
echo ========================================================

REM Cherche VERCEL_BUILD_WORKER.py dans le dossier courant et les parents
set "WORKER_SCRIPT=%~dp0VERCEL_BUILD_WORKER.py"

if not exist "%WORKER_SCRIPT%" (
    echo [INFO] Script non trouve dans %~dp0
    echo [INFO] Recherche dans le dossier parent...
    set "WORKER_SCRIPT=%~dp0..\VERCEL_BUILD_WORKER.py"
)

if not exist "%WORKER_SCRIPT%" (
    echo [INFO] Recherche dans le grand-parent...
    set "WORKER_SCRIPT=%~dp0..\..\VERCEL_BUILD_WORKER.py"
)

if not exist "%WORKER_SCRIPT%" (
    echo [ERREUR] VERCEL_BUILD_WORKER.py introuvable!
    echo [INFO] Place ce .bat dans le meme dossier que VERCEL_BUILD_WORKER.py
    pause
    exit /b 1
)

echo [INFO] Script trouve: %WORKER_SCRIPT%
echo ========================================================

python "%WORKER_SCRIPT%"

pause
