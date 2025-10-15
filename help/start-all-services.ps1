# =====================================================
# Start All Services in Correct Order
# =====================================================

Write-Host "=====================================================" -ForegroundColor Cyan
Write-Host "🚀 Starting All Services" -ForegroundColor Cyan
Write-Host "=====================================================" -ForegroundColor Cyan

# Paths
$AUTH_SERVICE = "C:\Java\care\Code\auth-service\auth-service"
$ACCESS_MGMT = "C:\Java\care\Code\access-management-system\access-management-service\accessmanagement"
$GATEWAY = "C:\Java\care\Code\gateway-service"

# Function to start a service
function Start-Service-Window {
    param(
        [string]$Name,
        [string]$Path,
        [int]$ExpectedPort,
        [int]$DelaySeconds = 15
    )
    
    Write-Host "`n🔄 Starting $Name..." -ForegroundColor Yellow
    Write-Host "   Path: $Path" -ForegroundColor Gray
    Write-Host "   Port: $ExpectedPort" -ForegroundColor Gray
    
    # Start in new window
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$Path'; Write-Host 'Starting $Name...' -ForegroundColor Green; mvn spring-boot:run"
    
    Write-Host "   Waiting $DelaySeconds seconds for startup..." -ForegroundColor Gray
    Start-Sleep -Seconds $DelaySeconds
    
    Write-Host "   ✅ $Name window opened" -ForegroundColor Green
}

# Stop any existing Java processes first
Write-Host "`n🛑 Stopping any existing Java processes..." -ForegroundColor Yellow
$existing = Get-Process java -ErrorAction SilentlyContinue
if ($existing) {
    $existing | Stop-Process -Force
    Start-Sleep -Seconds 2
    Write-Host "   ✅ Stopped $($existing.Count) process(es)" -ForegroundColor Green
} else {
    Write-Host "   ✅ No existing processes" -ForegroundColor Green
}

Write-Host "`n=====================================================" -ForegroundColor Cyan
Write-Host "Starting services in order..." -ForegroundColor Cyan
Write-Host "=====================================================" -ForegroundColor Cyan

# Start services in order
# 1. Auth Service (6061)
Start-Service-Window -Name "Auth Service" -Path $AUTH_SERVICE -ExpectedPort 6061 -DelaySeconds 20

# 2. Access Management (6062)
Start-Service-Window -Name "Access Management" -Path $ACCESS_MGMT -ExpectedPort 6062 -DelaySeconds 20

# 3. Gateway (6060)
Start-Service-Window -Name "Gateway" -Path $GATEWAY -ExpectedPort 6060 -DelaySeconds 15

Write-Host "`n=====================================================" -ForegroundColor Cyan
Write-Host "✅ All Services Started!" -ForegroundColor Cyan
Write-Host "=====================================================" -ForegroundColor Cyan

Write-Host "`n📊 Status:" -ForegroundColor Yellow
Write-Host "  - 3 PowerShell windows should be open" -ForegroundColor White
Write-Host "  - Each window shows the service logs" -ForegroundColor White
Write-Host "  - Wait ~60 seconds for full startup" -ForegroundColor White

Write-Host "`n🔍 To check if services are up:" -ForegroundColor Yellow
Write-Host "  Run: .\check-services.ps1" -ForegroundColor White

Write-Host "`n📝 Service URLs:" -ForegroundColor Yellow
Write-Host "  - Gateway:    http://localhost:6060" -ForegroundColor White
Write-Host "  - Auth:       http://localhost:6061/swagger-ui.html" -ForegroundColor White
Write-Host "  - Access:     http://localhost:6062/swagger-ui.html" -ForegroundColor White

Write-Host "`n⚠️  Important:" -ForegroundColor Yellow
Write-Host "  - Don't close the PowerShell windows!" -ForegroundColor White
Write-Host "  - Watch for 'Started ...Application' in logs" -ForegroundColor White
Write-Host "  - If any service fails, check its window for errors" -ForegroundColor White

Write-Host "`n🛑 To stop all services:" -ForegroundColor Yellow
Write-Host "  Run: .\stop-all-services.ps1" -ForegroundColor White
Write-Host "  Or:  Close all PowerShell windows manually" -ForegroundColor White

Write-Host "`n=====================================================" -ForegroundColor Cyan

