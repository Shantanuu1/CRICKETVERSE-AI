@echo off
setlocal enabledelayedexpansion

title CRICKETVERSE AI - Launcher

echo ====================================================================
echo        CRICKETVERSE AI - STARTUP SYSTEM (Windows 11)
echo   "Play with your hands. Analyse with AI. Improve your game."
echo ====================================================================
echo.

:: 1. Check Node.js
echo [1/7] Checking Node.js installation...
where node >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Node.js is NOT installed or not in PATH!
    echo Please install Node.js 18+ from https://nodejs.org/
    pause
    exit /b 1
)
for /f "tokens=*" %%i in ('node -v') do set NODE_VER=%%i
echo   - Found Node.js: %NODE_VER%

:: 2. Check Python
echo [2/7] Checking Python installation...
where python >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Python is NOT installed or not in PATH!
    echo Please install Python 3.10+ from https://python.org/
    pause
    exit /b 1
)
for /f "tokens=*" %%i in ('python --version') do set PY_VER=%%i
echo   - Found Python: %PY_VER%

:: Check current directory and set project root
set PROJECT_ROOT=%~dp0..
cd /d "%PROJECT_ROOT%"
echo   - Project root: %CD%

:: 3. Check / Install frontend dependencies
echo [3/7] Checking Frontend dependencies (client/node_modules)...
if not exist "client\node_modules" (
    echo   - client\node_modules not found. Installing client packages...
    cd client
    call npm install
    cd ..
) else (
    echo   - Frontend dependencies verified.
)

:: 4. Check / Install backend dependencies
echo [4/7] Checking Backend dependencies (server/node_modules)...
if not exist "server\node_modules" (
    echo   - server\node_modules not found. Installing server packages...
    cd server
    call npm install
    cd ..
) else (
    echo   - Backend dependencies verified.
)

:: Check Python AI orchestrator packages
echo [5/7] Verifying Python AI Orchestrator requirements...
python -c "import fastapi, uvicorn, pydantic" >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo   - Installing Python packages: fastapi, uvicorn, pydantic...
    python -m pip install -r services\ai-orchestrator\requirements.txt
) else (
    echo   - Python AI packages verified.
)

:: Ollama guidance (manual start)
echo.
echo ====================================================================
echo [OLLAMA & GEMMA 4 AI NOTICE]
echo CRICKETVERSE AI connects to local Gemma 4 via Ollama at:
echo   URL:   http://127.0.0.1:11434
echo   MODEL: gemma4:e2b
echo.
echo If Ollama is running, CricketVerse AI connects seamlessly.
echo If Ollama is NOT running, CricketVerse AI operates in robust
echo fallback mode with fully labelled smart tactical feedback.
echo To start Ollama manually:
echo   1. Open a new terminal and run: ollama run gemma4:e2b
echo ====================================================================
echo.

:: 6. Launch services in separate windows
echo [6/7] Launching Python AI Orchestrator (Port 8000)...
start "CricketVerse AI - Python Orchestrator" cmd /k "cd /d "%PROJECT_ROOT%\services\ai-orchestrator" && python app\main.py"

echo [7/7] Launching Node.js Server & Socket.IO (Port 5000)...
start "CricketVerse AI - Node Server" cmd /k "cd /d "%PROJECT_ROOT%\server" && npm start"

echo.
echo Launching React Frontend (Port 5173)...
start "CricketVerse AI - Vite Frontend" cmd /k "cd /d "%PROJECT_ROOT%\client" && npm run dev"

echo.
echo ====================================================================
echo All services are launching!
echo.
echo Frontend:   http://localhost:5173
echo Server:     http://localhost:5000
echo AI Service: http://localhost:8000
echo ====================================================================
echo.
pause
