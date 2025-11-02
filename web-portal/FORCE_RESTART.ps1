# FORCE RESTART Frontend - Clear Everything!

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   FORCE RESTART FRONTEND" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Kill ALL node processes
Write-Host "[1] Killing ALL Node processes..." -ForegroundColor Red
Get-Process -Name node -ErrorAction SilentlyContinue | Stop-Process -Force
Start-Sleep -Seconds 2

# Step 2: Clear Vite cache
Write-Host "[2] Clearing Vite cache..." -ForegroundColor Yellow
Remove-Item -Path "node_modules\.vite" -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item -Path "dist" -Recurse -Force -ErrorAction SilentlyContinue

# Step 3: Clear npm cache (optional but thorough)
Write-Host "[3] Clearing npm cache..." -ForegroundColor Yellow
npm cache clean --force 2>$null

Write-Host ""
Write-Host "All caches cleared!" -ForegroundColor Green
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   CONFIGURATION DETAILS" -ForegroundColor White
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "  Frontend URL:  http://localhost:5173" -ForegroundColor Cyan
Write-Host "  Gateway URL:   http://localhost:6060" -ForegroundColor Green
Write-Host "  Auth Service:  http://localhost:6061" -ForegroundColor Gray
Write-Host "  AMS:           http://localhost:6062" -ForegroundColor Gray
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   IMPORTANT BROWSER STEPS" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "  After frontend starts:" -ForegroundColor White
Write-Host "  1. Press Ctrl+Shift+Delete in browser" -ForegroundColor Gray
Write-Host "  2. Clear 'Cached images and files'" -ForegroundColor Gray
Write-Host "  3. Hard reload: Ctrl+Shift+R" -ForegroundColor Gray
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Step 4: Start frontend
Write-Host "[4] Starting Frontend..." -ForegroundColor Green
Write-Host ""
npm run dev
