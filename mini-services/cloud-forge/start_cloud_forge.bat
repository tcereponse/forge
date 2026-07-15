@echo off
title CLOUD FORGE — Mobile Bridge Server
color 0B

echo ========================================================
echo   CLOUD FORGE — Mobile Bridge Server v15.0
echo   Zero-Touch APK Deployment via GitHub Actions
echo ========================================================
echo.

REM Set GitHub token here or via environment variable
if "%GITHUB_TOKEN%"=="" (
    echo ATTENTION: GITHUB_TOKEN non configure!
    echo   set GITHUB_TOKEN=ghp_xxxxxxxxxxxx
    echo.
    echo Ou edite mobile_bridge_server.py directement.
    echo.
)

python mobile_bridge_server.py

pause
