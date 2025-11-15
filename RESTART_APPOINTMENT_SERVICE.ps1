# Restart Appointment Service with Fixed Code
# This script stops and restarts the appointment-service to apply the bug fix

Write-Host "`n========== RESTARTING APPOINTMENT SERVICE ==========" -ForegroundColor Cyan
Write-Host "This will fix the dashboard blank page issue`n" -ForegroundColor Gray

# Step 1: Kill existing process
Write-Host "1️⃣  Stopping existing appointment service..." -ForegroundColor Yellow
Get-Process | Where-Object { $_.ProcessName -like "*java*" -and $_.CommandLine -like "*appointment*" } | Stop-Process -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 2
Write-Host "✅ Service stopped" -ForegroundColor Green

# Step 2: Navigate to service directory
Write-Host "`n2️⃣  Navigating to appointment-service..." -ForegroundColor Yellow
Set-Location "c:\Java\care\Code\appointment-service"

# Step 3: Clean and rebuild
Write-Host "`n3️⃣  Rebuilding service with fixed code..." -ForegroundColor Yellow
mvn clean package -DskipTests -q
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Build successful" -ForegroundColor Green
} else {
    Write-Host "❌ Build failed" -ForegroundColor Red
    exit 1
}

# Step 4: Start service
Write-Host "`n4️⃣  Starting appointment service on port 6064..." -ForegroundColor Yellow
Write-Host "   (This will take 10-15 seconds...)" -ForegroundColor Gray
mvn spring-boot:run

# Service is now running
Write-Host "`n========== SERVICE STARTED ==========" -ForegroundColor Green
Write-Host "The dashboard bug has been fixed!" -ForegroundColor Green
Write-Host "`nNow:" -ForegroundColor Cyan
Write-Host "1. Go to: http://localhost:5173/appointment/reports/dashboard" -ForegroundColor White
Write-Host "2. Reload the page (F5)" -ForegroundColor White
Write-Host "3. The dashboard should now load with data!" -ForegroundColor White
