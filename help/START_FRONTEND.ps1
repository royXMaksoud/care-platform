# Start Frontend with Clean Cache

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   STARTING FRONTEND" -ForegroundColor Yellow
Write-Host "   (Port 5173)" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

cd C:\Java\care\Code\web-portal

Write-Host "Cleaning Vite cache..." -ForegroundColor Yellow
Remove-Item -Path "node_modules\.vite" -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item -Path "dist" -Recurse -Force -ErrorAction SilentlyContinue

Write-Host "Cache cleaned!" -ForegroundColor Green
Write-Host "Starting Frontend..." -ForegroundColor Green
Write-Host ""

npm run dev

