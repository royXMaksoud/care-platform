# Clean Restart of Auth Service with OAuth

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "   CLEAN AUTH SERVICE RESTART" -ForegroundColor Yellow  
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Stop all Java processes
Write-Host "[1] Stopping ALL Java processes..." -ForegroundColor White
Stop-Process -Name java -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 5
Write-Host "    All Java stopped!" -ForegroundColor Green
Write-Host ""

# Navigate to Auth Service
Write-Host "[2] Starting Auth Service..." -ForegroundColor White
cd C:\Java\care\Code\auth-service\auth-service

# Set OAuth credentials
Write-Host "    Setting OAuth environment variables..." -ForegroundColor Gray
$env:OAUTH_GOOGLE_CLIENT_ID="22284906705-cafqh1pedp9oro7vfoid1eb8flpstrbm.apps.googleusercontent.com"
$env:OAUTH_GOOGLE_CLIENT_SECRET="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"

Write-Host "    Google Client ID: $($env:OAUTH_GOOGLE_CLIENT_ID.Substring(0,40))..." -ForegroundColor Green
Write-Host "    Google Secret: SET" -ForegroundColor Green
Write-Host ""

# Start Auth Service
Write-Host "    Building and starting (skip tests)..." -ForegroundColor Yellow
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   WATCH FOR STARTUP COMPLETION" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

./mvnw spring-boot:run -DskipTests

