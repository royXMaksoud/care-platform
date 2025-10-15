# Check Services Status Script
Write-Host "=====================================================" -ForegroundColor Cyan
Write-Host "Checking Services Status" -ForegroundColor Cyan
Write-Host "=====================================================" -ForegroundColor Cyan

# Wait for services to start
Write-Host ""
Write-Host "Waiting 40 seconds for services to start..." -ForegroundColor Yellow
Start-Sleep -Seconds 40

# Check running Java processes
Write-Host ""
Write-Host "Running Java Processes:" -ForegroundColor Yellow
Get-Process java -ErrorAction SilentlyContinue | 
    Select-Object Id, @{Name='Memory(MB)';Expression={[math]::Round($_.WS/1MB,2)}}, StartTime |
    Format-Table -AutoSize

# Check ports
Write-Host ""
Write-Host "Port Status:" -ForegroundColor Yellow
Write-Host "------------------------------------------------------" -ForegroundColor Gray

# Port 6060 - Gateway
Write-Host ""
Write-Host "Gateway (6060):" -ForegroundColor White
try {
    $response = Invoke-WebRequest -Uri "http://localhost:6060/actuator/health" -UseBasicParsing -TimeoutSec 5 -ErrorAction Stop
    Write-Host "  Status: $($response.StatusCode) - UP" -ForegroundColor Green
    Write-Host "  Response: $($response.Content)" -ForegroundColor Gray
} catch {
    Write-Host "  Status: DOWN or NOT RESPONDING" -ForegroundColor Red
    Write-Host "  Error: $($_.Exception.Message)" -ForegroundColor Red
}

# Port 6061 - Auth Service
Write-Host ""
Write-Host "Auth Service (6061):" -ForegroundColor White
try {
    $response = Invoke-WebRequest -Uri "http://localhost:6061/actuator/health" -UseBasicParsing -TimeoutSec 5 -ErrorAction Stop
    Write-Host "  Status: $($response.StatusCode) - UP" -ForegroundColor Green
    Write-Host "  Response: $($response.Content)" -ForegroundColor Gray
} catch {
    Write-Host "  Status: DOWN or NOT RESPONDING" -ForegroundColor Red
    Write-Host "  Error: $($_.Exception.Message)" -ForegroundColor Red
}

# Port 6062 - Access Management
Write-Host ""
Write-Host "Access Management (6062):" -ForegroundColor White
try {
    $response = Invoke-WebRequest -Uri "http://localhost:6062/actuator/health" -UseBasicParsing -TimeoutSec 5 -ErrorAction Stop
    Write-Host "  Status: $($response.StatusCode) - UP" -ForegroundColor Green
    Write-Host "  Response: $($response.Content)" -ForegroundColor Gray
} catch {
    Write-Host "  Status: DOWN or NOT RESPONDING" -ForegroundColor Red
    Write-Host "  Error: $($_.Exception.Message)" -ForegroundColor Red
}

# Netstat check
Write-Host ""
Write-Host "Listening Ports (6060, 6061, 6062):" -ForegroundColor Yellow
Write-Host "------------------------------------------------------" -ForegroundColor Gray
netstat -ano | Select-String -Pattern ":6060|:6061|:6062" | Select-String "LISTENING"

Write-Host ""
Write-Host "=====================================================" -ForegroundColor Cyan
Write-Host "Check Complete!" -ForegroundColor Cyan
Write-Host "=====================================================" -ForegroundColor Cyan

Write-Host ""
Write-Host "Summary:" -ForegroundColor Yellow
Write-Host "  - If all services show UP you are good to go" -ForegroundColor White
Write-Host "  - If any service shows DOWN check the console logs" -ForegroundColor White
Write-Host "  - Services take 30-60 seconds to fully start" -ForegroundColor White

Write-Host ""
Write-Host "Troubleshooting:" -ForegroundColor Yellow
Write-Host "  - Check logs in each service console window" -ForegroundColor White
Write-Host "  - Look for Started Application message in logs" -ForegroundColor White
Write-Host "  - Check for port conflicts or database connection errors" -ForegroundColor White

Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Yellow
Write-Host "  1. Test auth-service swagger UI" -ForegroundColor White
Write-Host "  2. Test access-mgmt swagger UI" -ForegroundColor White
Write-Host "  3. Test gateway health endpoint" -ForegroundColor White
