# Restart Frontend Script
# This script stops frontend, clears Vite cache, and restarts

Write-Host "🛑 Stopping Frontend processes..." -ForegroundColor Yellow
Get-Process -Name node -ErrorAction SilentlyContinue | Where-Object {$_.Path -like "*web-portal*"} | Stop-Process -Force

Write-Host "🧹 Clearing Vite cache..." -ForegroundColor Cyan
Remove-Item -Path "node_modules\.vite" -Recurse -Force -ErrorAction SilentlyContinue

Write-Host ""
Write-Host "✅ Cache cleared!" -ForegroundColor Green
Write-Host ""
Write-Host "🚀 Starting Frontend..." -ForegroundColor Green
Write-Host "   URL: http://localhost:5173" -ForegroundColor Cyan
Write-Host "   API: http://localhost:6060 (Gateway Service)" -ForegroundColor Cyan
Write-Host ""
Write-Host "⚠️  Make sure to:" -ForegroundColor Yellow
Write-Host "   1. Clear browser cache (Ctrl+Shift+Delete)" -ForegroundColor Gray
Write-Host "   2. Hard reload page (Ctrl+Shift+R)" -ForegroundColor Gray
Write-Host ""

# Start frontend
npm run dev

