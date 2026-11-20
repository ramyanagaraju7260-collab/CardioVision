@echo off
title CardioVision AI - Frontend (React + Vite)
echo ===================================================
echo   Starting CardioVision AI Frontend...
echo ===================================================
cd /d "%~dp0"
if exist "Cardiovascular\frontend" (
    cd "Cardiovascular\frontend"
) else if exist "frontend" (
    cd "frontend"
)

npm run dev
pause
