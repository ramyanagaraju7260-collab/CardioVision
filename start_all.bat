@echo off
title CardioVision AI - System Launcher
echo =========================================================
echo   Starting CardioVision AI Full System...
echo =========================================================
echo.
echo [1/3] Launching FastAPI Backend Server (Port 8000)...
start "CardioVision Backend" "%~dp0start_backend.bat"

echo.
echo [2/3] Launching React Vite Frontend (Port 5173)...
start "CardioVision Frontend" "%~dp0start_frontend.bat"

echo.
echo [3/3] Waiting for servers to initialize...
timeout /t 5 /nobreak >nul

echo.
echo Launching Web Browser at http://localhost:5173 ...
start http://localhost:5173

echo.
echo =========================================================
echo   CardioVision AI is RUNNING!
echo   - Backend API:  http://localhost:8000
echo   - Web App UI:   http://localhost:5173
echo =========================================================
echo.
echo KEEP THIS WINDOW OPEN while using the application.
echo (To stop the application, simply close this window).
echo.
pause
