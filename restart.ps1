Write-Host "Killing processes on ports 3000 and 5000..." -ForegroundColor Cyan

# Kill process on port 3000 (Frontend)
$frontPid = (Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue).OwningProcess
if ($frontPid) {
    Write-Host "Found process on port 3000 (PID: $frontPid). Killing..." -ForegroundColor Yellow
    Stop-Process -Id $frontPid -Force -ErrorAction SilentlyContinue
}

# Kill process on port 5000 (Backend)
$backPid = (Get-NetTCPConnection -LocalPort 5000 -ErrorAction SilentlyContinue).OwningProcess
if ($backPid) {
    Write-Host "Found process on port 5000 (PID: $backPid). Killing..." -ForegroundColor Yellow
    Stop-Process -Id $backPid -Force -ErrorAction SilentlyContinue
}

Write-Host "Cleaning up Next.js cache to fix Turbopack error..." -ForegroundColor Cyan
if (Test-Path ".\frontend\.next") {
    Remove-Item -Recurse -Force ".\frontend\.next"
    Write-Host ".next cache deleted." -ForegroundColor Green
}

Write-Host "Starting Backend..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd backend; npm run dev"

Write-Host "Starting Frontend..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd frontend; npm run dev"

Write-Host "Servers are starting in new windows. Done!" -ForegroundColor Green
