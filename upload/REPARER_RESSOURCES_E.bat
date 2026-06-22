@echo off
setlocal
echo ==================================================
echo 🎨 SYNCHRONISATION DES RESSOURCES (E:)
echo ==================================================

echo [*] Copie des icones et styles graphiques depuis C:...
if not exist "E:\qodmaxv2\apkbuilder\templates\src\main\res" mkdir "E:\qodmaxv2\apkbuilder\templates\src\main\res"
robocopy "C:\Eliteqod\apkbuilder\templates\src\main\res" "E:\qodmaxv2\apkbuilder\templates\src\main\res" /E /NFL /NDL >nul

if %ERRORLEVEL% LEQ 8 (
    echo.
    echo ✅ SUCCES : Les icones (mipmap) sont maintenant sur E:.
    echo [i] Le build pourra maintenant se terminer sans erreur de ressources.
) else (
    echo.
    echo ❌ ERREUR : Echec de la synchronisation.
)

echo ==================================================
pause
