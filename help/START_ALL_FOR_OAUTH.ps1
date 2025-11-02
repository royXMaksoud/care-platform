# ==================================================
# START ALL SERVICES FOR OAUTH
# ==================================================
# This script starts all required services for OAuth to work:
# 1. Gateway Service (with OAuth whitelist)
# 2. Auth Service (with OAuth credentials)
# 3. Access Management Service (for permissions)
# ==================================================

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   STARTING ALL SERVICES FOR OAUTH" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Stop all existing Java processes
Write-Host "[1/4] Stopping all Java processes..." -ForegroundColor White
Stop-Process -Name java -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 3
Write-Host "      All Java processes stopped!" -ForegroundColor Green
Write-Host ""

# Start Gateway Service
Write-Host "[2/4] Starting Gateway Service..." -ForegroundColor White
Write-Host "      Port: 6060" -ForegroundColor Gray
Write-Host "      OAuth endpoints NOW WHITELISTED: /auth/oauth/**" -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd C:\Java\care\Code\gateway-service; Write-Host 'Starting Gateway Service...' -ForegroundColor Cyan; ./mvnw spring-boot:run"
Write-Host "      Gateway started in new window!" -ForegroundColor Green
Write-Host ""

# Start Auth Service with OAuth credentials
Write-Host "[3/4] Starting Auth Service with OAuth..." -ForegroundColor White
Write-Host "      Port: 6061" -ForegroundColor Gray
Write-Host "      OAuth Provider: Google" -ForegroundColor Green
Write-Host "      Client ID: 22284906705-cafqh1pedp...apps.googleusercontent.com" -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", @"
cd C:\Java\care\Code\auth-service\auth-service
Write-Host 'Setting OAuth Environment Variables...' -ForegroundColor Cyan
`$env:OAUTH_GOOGLE_CLIENT_ID='22284906705-cafqh1pedp9oro7vfoid1eb8flpstrbm.apps.googleusercontent.com'
`$env:OAUTH_GOOGLE_CLIENT_SECRET='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'
Write-Host 'OAuth Credentials Set!' -ForegroundColor Green
Write-Host 'Starting Auth Service...' -ForegroundColor Cyan
./mvnw spring-boot:run
"@
Write-Host "      Auth Service started in new window!" -ForegroundColor Green
Write-Host ""

# Start Access Management Service (for permissions)
Write-Host "[4/4] Starting Access Management Service..." -ForegroundColor White
Write-Host "      Port: 6062" -ForegroundColor Gray
Write-Host "      Required for: User permissions" -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd C:\Java\care\Code\access-management-service; Write-Host 'Starting Access Management Service...' -ForegroundColor Cyan; ./mvnw spring-boot:run"
Write-Host "      AMS started in new window!" -ForegroundColor Green
Write-Host ""

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   ALL SERVICES STARTING..." -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "IMPORTANT: Wait for all services to fully start!" -ForegroundColor Yellow
Write-Host ""
Write-Host "Expected startup times:" -ForegroundColor White
Write-Host "  - Gateway:  30-40 seconds" -ForegroundColor Gray
Write-Host "  - Auth:     30-40 seconds" -ForegroundColor Gray
Write-Host "  - AMS:      40-50 seconds" -ForegroundColor Gray
Write-Host ""
Write-Host "Watch for: 'Started [Service]Application in X seconds'" -ForegroundColor Cyan
Write-Host ""

# Wait and test services
Write-Host "Waiting 60 seconds for services to start..." -ForegroundColor Yellow
for ($i = 60; $i -gt 0; $i--) {
    Write-Host "`r  Countdown: $i seconds remaining..." -NoNewline -ForegroundColor Gray
    Start-Sleep -Seconds 1
}
Write-Host ""
Write-Host ""

# Test Gateway
Write-Host "Testing Gateway (6060)..." -ForegroundColor Cyan
try {
    $gateway = Invoke-WebRequest -Uri "http://localhost:6060/actuator/health" -Method GET -TimeoutSec 3 -UseBasicParsing
    Write-Host "  Gateway: UP!" -ForegroundColor Green
} catch {
    Write-Host "  Gateway: NOT READY (may need more time)" -ForegroundColor Yellow
}

# Test Auth Service
Write-Host "Testing Auth Service (6061)..." -ForegroundColor Cyan
try {
    $auth = Invoke-WebRequest -Uri "http://localhost:6061/actuator/health" -Method GET -TimeoutSec 3 -UseBasicParsing
    Write-Host "  Auth Service: UP!" -ForegroundColor Green
} catch {
    Write-Host "  Auth Service: NOT READY (may need more time)" -ForegroundColor Yellow
}

# Test AMS
Write-Host "Testing AMS (6062)..." -ForegroundColor Cyan
try {
    $ams = Invoke-WebRequest -Uri "http://localhost:6062/actuator/health" -Method GET -TimeoutSec 3 -UseBasicParsing
    Write-Host "  AMS: UP!" -ForegroundColor Green
} catch {
    Write-Host "  AMS: NOT READY (may need more time)" -ForegroundColor Yellow
}

# Test OAuth config endpoint
Write-Host ""
Write-Host "Testing OAuth Configuration..." -ForegroundColor Cyan
try {
    $oauthConfig = Invoke-RestMethod -Uri "http://localhost:6061/auth/oauth/config" -Method GET -TimeoutSec 3
    Write-Host "  OAuth Config: $($oauthConfig | ConvertTo-Json -Compress)" -ForegroundColor $(if ($oauthConfig.status -eq "ready") { "Green" } else { "Yellow" })
} catch {
    Write-Host "  OAuth Config: FAILED - $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   SERVICES STATUS CHECK COMPLETE" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "NEXT STEPS:" -ForegroundColor Yellow
Write-Host "1. If any service is NOT READY, wait 30 more seconds" -ForegroundColor Gray
Write-Host "2. Open Frontend: http://localhost:5173/login" -ForegroundColor Gray
Write-Host "3. Click 'Continue with Google'" -ForegroundColor Gray
Write-Host "4. If it fails, check the Auth Service window for errors" -ForegroundColor Gray
Write-Host ""

Write-Host "Press any key to exit this window..." -ForegroundColor White
$null = $Host.UI.RawUI.ReadKey('NoEcho,IncludeKeyDown')

