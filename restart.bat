@echo off
setlocal EnableDelayedExpansion
echo ===============================================================================
echo            DISASTER MANAGEMENT SYSTEM (DMS) - STARTUP MANAGER
echo ===============================================================================
echo.

echo [1/4] Killing existing Node.js processes...
taskkill /IM node.exe /F >nul 2>&1
echo [OK] Processes terminated.
echo [OK] Ports are free.
echo.

echo [2/4] Cleaning up Next.js cache...
IF EXIST "frontend\.next" (
    rmdir /S /Q "frontend\.next" >nul 2>&1
    if !ERRORLEVEL! neq 0 (
        echo [X] Warning: Could not delete frontend\.next cache. It might be locked.
    ) else (
        echo [OK] .next cache deleted.
    )
) else (
    echo [OK] No cache found.
)
echo.

echo [3/4] Checking Oracle Database Listener...
sc query OracleXETNSListener >nul 2>&1
if !ERRORLEVEL! equ 0 (
    sc start OracleXETNSListener >nul 2>&1
    echo [OK] Oracle Listener service started or already running.
) else (
    echo [!] Notice: Default Oracle service not found. If your DB is remote or uses a different service, ignore this.
)
echo.

echo [4/4] Starting Servers...
echo Starting Backend on Port 5000...
start "DMS Backend" cmd /k "cd backend && npm run dev"

echo Starting Frontend on Port 3000...
start "DMS Frontend" cmd /k "cd frontend && npm run dev"

echo.
echo ===============================================================================
echo Servers are starting in new windows.
echo Frontend URL: http://localhost:3000
echo Backend URL: http://localhost:5000/api/dashboard
echo ===============================================================================
pause
