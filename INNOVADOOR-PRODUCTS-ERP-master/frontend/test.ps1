Write-Host "=== Frontend Diagnostic Test ===" -ForegroundColor Cyan
Write-Host ""

# Test 1: Check Node.js
Write-Host "1. Checking Node.js..." -ForegroundColor Yellow
try {
    $nodeVersion = node --version 2>&1
    Write-Host "   ✓ Node.js found: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "   ✗ Node.js NOT found!" -ForegroundColor Red
    exit 1
}

# Test 2: Check npm
Write-Host "2. Checking npm..." -ForegroundColor Yellow
try {
    $npmVersion = npm --version 2>&1
    Write-Host "   ✓ npm found: $npmVersion" -ForegroundColor Green
} catch {
    Write-Host "   ✗ npm NOT found!" -ForegroundColor Red
    exit 1
}

# Test 3: Check if node_modules exists
Write-Host "3. Checking node_modules..." -ForegroundColor Yellow
if (Test-Path "node_modules") {
    Write-Host "   ✓ node_modules exists" -ForegroundColor Green
} else {
    Write-Host "   ⚠ node_modules does NOT exist (will be installed)" -ForegroundColor Yellow
}

# Test 4: Check if package.json exists
Write-Host "4. Checking package.json..." -ForegroundColor Yellow
if (Test-Path "package.json") {
    Write-Host "   ✓ package.json exists" -ForegroundColor Green
} else {
    Write-Host "   ✗ package.json NOT found!" -ForegroundColor Red
    exit 1
}

# Test 5: Check if vite.config.ts exists
Write-Host "5. Checking vite.config.ts..." -ForegroundColor Yellow
if (Test-Path "vite.config.ts") {
    Write-Host "   ✓ vite.config.ts exists" -ForegroundColor Green
} else {
    Write-Host "   ✗ vite.config.ts NOT found!" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "=== All checks passed! ===" -ForegroundColor Green
Write-Host "You can now run: .\start.ps1" -ForegroundColor Cyan

