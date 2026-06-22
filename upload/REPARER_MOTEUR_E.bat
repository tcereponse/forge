@echo off
setlocal
echo ==================================================
echo 🛠️ REPARATION DU MOTEUR DE FORGE SOUVERAIN (E:)
echo ==================================================

echo [*] Creation de la structure binaire...
if not exist "E:\qodmaxv2\apkbuilder\templates\gradle\wrapper" mkdir "E:\qodmaxv2\apkbuilder\templates\gradle\wrapper"

echo [*] Copie des composants vitaux depuis C: (Source de confiance)...
copy /Y "C:\Eliteqod\apkbuilder\templates\gradle\wrapper\gradle-wrapper.jar" "E:\qodmaxv2\apkbuilder\templates\gradle\wrapper\"
copy /Y "C:\Eliteqod\apkbuilder\templates\gradle\wrapper\gradle-wrapper.properties" "E:\qodmaxv2\apkbuilder\templates\gradle\wrapper\"

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ✅ SUCCES : Le moteur Gradle est maintenant present sur E:.
    echo [i] Vous pouvez maintenant relancer BUILD_QODMAX_SOUVERAIN.bat
) else (
    echo.
    echo ❌ ERREUR : Impossible de copier les binaires. 
    echo [!] Verifiez que le dossier C:\Eliteqod existe toujours.
)

echo ==================================================
pause
