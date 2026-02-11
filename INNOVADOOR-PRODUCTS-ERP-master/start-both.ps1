# PowerShell script to start both frontend and backend servers
# This opens two separate PowerShell windows

Write-Host "Starting Backend and Frontend Servers..." -ForegroundColor Cyan
Write-Host ""

# Start Backend Server in new window
Write-Host "Starting Backend Server..." -ForegroundColor Yellow
$backendScript = @"
cd '$PSScriptRoot\backend'
if (Test-Path 'venv\Scripts\Activate.ps1') {
    & 'venv\Scripts\Activate.ps1'
    Write-Host 'Backend server starting on http://localhost:8000' -ForegroundColor Green
    uvicorn app.main:app --reload --port 8000
} else {
    Write-Host 'ERROR: Backend virtual environment not found!' -ForegroundColor Red
    Write-Host 'Please run: cd backend && python -m venv venv' -ForegroundColor Yellow
    pause
}
"@

Start-Process powershell -ArgumentList "-NoExit", "-Command", $backendScript

# Wait a moment for backend to start
Start-Sleep -Seconds 3

# Start Frontend Server in new window
Write-Host "Starting Frontend Server..." -ForegroundColor Yellow
$frontendScript = @"
cd '$PSScriptRoot\frontend'
Write-Host 'Frontend server starting on http://localhost:3000' -ForegroundColor Green
npm run dev
"@

Start-Process powershell -ArgumentList "-NoExit", "-Command", $frontendScript

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "Both servers are starting!" -ForegroundColor Green
Write-Host "Backend:  http://localhost:8000" -ForegroundColor Cyan
Write-Host "Frontend: http://localhost:3000" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Two PowerShell windows have been opened." -ForegroundColor Yellow
Write-Host "Close them to stop the servers." -ForegroundColor Yellow
