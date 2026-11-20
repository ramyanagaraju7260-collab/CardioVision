@echo off
title CardioVision AI - Backend Server (Port 8000)
echo =========================================================
echo   Starting CardioVision AI Backend (FastAPI)...
echo =========================================================
cd /d "%~dp0"
if exist "Cardiovascular\backend" (
    cd "Cardiovascular\backend"
) else if exist "backend" (
    cd "backend"
)

echo Current directory: %cd%

if exist "venv\Scripts\python.exe" (
    echo Using Virtual Environment Python...
    venv\Scripts\python.exe main.py
) else (
    echo Using System Python...
    python main.py
)

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo Backend encountered an error. Press any key to exit...
)
pause
