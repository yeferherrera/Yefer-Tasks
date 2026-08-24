@echo off
title YeferTasks - Build APK
echo ============================================
echo    YeferTasks - Compilar APK Release
echo ============================================
echo.

echo [1/3] Verificando errores de TypeScript...
cd /d C:\YeferTask
call npx tsc --noEmit
if %errorlevel% neq 0 (
    echo.
    echo ERROR: Hay errores de TypeScript. Corrigelos antes de compilar.
    pause
    exit /b 1
)
echo TypeScript: OK
echo.

echo [2/3] Compilando APK release...
cd /d C:\YeferTask\android
call .\gradlew.bat assembleRelease
if %errorlevel% neq 0 (
    echo.
    echo ERROR: Fallo la compilacion. Revisa los errores arriba.
    pause
    exit /b 1
)
echo.
echo Compilacion: OK
echo.

echo [3/3] Copiando APK al Escritorio...
copy /Y "C:\YeferTask\android\app\build\outputs\apk\release\app-release.apk" "%USERPROFILE%\Desktop\YeferTasks.apk"
if %errorlevel% neq 0 (
    echo ERROR: No se pudo copiar el APK.
    pause
    exit /b 1
)

echo.
echo ============================================
echo    APK listo en el Escritorio
echo    Archivo: YeferTasks.apk
echo ============================================
echo.
pause
