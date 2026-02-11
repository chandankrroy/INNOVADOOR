# PowerShell script to start both backend and frontend servers
# This opens backend in a new window and frontend in current window

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Starting Backend and Frontend Servers" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Get the current directory
$projectRoot = $PWD

# Check if backend directory exists
if (-not (Test-Path "backend")) {
    Write-Host "ERROR: 'backend' directory not found!" -ForegroundColor Red
    Write-Host "Please run this script from the project root directory." -ForegroundColor Yellow
    exit 1
}

# Check if frontend directory exists
if (-not (Test-Path "frontend")) {
    Write-Host "ERROR: 'frontend' directory not found!" -ForegroundColor Red
    Write-Host "Please run this script from the project root directory." -ForegroundColor Yellow
    exit 1
}

# Start backend in a new PowerShell window
Write-Host "Starting backend server in new window..." -ForegroundColor Green
$backendScript = @"
cd '$projectRoot\backend'
if (Test-Path 'venv\Scripts\Activate.ps1') {
    .\venv\Scripts\Activate.ps1
    Write-Host 'Backend server starting on http://localhost:8000' -ForegroundColor Green
    uvicorn app.main:app --reload --port 8000
} else {
    Write-Host 'ERROR: Backend virtual environment not found!' -ForegroundColor Red
    Write-Host 'Please run: cd backend; python -m venv venv; .\venv\Scripts\Activate.ps1; pip install -r requirements.txt' -ForegroundColor Yellow
    pause
}
"@

Start-Process powershell -ArgumentList "-NoExit", "-Command", $backendScript

# Wait a moment for backend to start
Write-Host "Waiting for backend to initialize..." -ForegroundColor Yellow
Start-Sleep -Seconds 3

# Start frontend in current window
Write-Host ""
Write-Host "Starting frontend server in this window..." -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

cd frontend

# Check if node_modules exists
if (-not (Test-Path "node_modules")) {
    Write-Host "Installing frontend dependencies..." -ForegroundColor Yellow
    npm install
}

Write-Host "Frontend server starting on http://localhost:3000" -ForegroundColor Green
Write-Host "Backend server should be running on http://localhost:8000" -ForegroundColor Green
Write-Host ""
Write-Host "Press Ctrl+C to stop the frontend server" -ForegroundColor Yellow
Write-Host "Close the backend window to stop the backend server" -ForegroundColor Yellow
Write-Host ""

npm run dev
