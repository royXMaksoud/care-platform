# Start Gateway Service with CORS Fix

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   STARTING GATEWAY SERVICE" -ForegroundColor Yellow
Write-Host "   (Port 6060 with CORS Fix)" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

cd C:\Java\care\Code\gateway-service

Write-Host "Starting Gateway Service..." -ForegroundColor Green
Write-Host "Please wait for 'Started GatewayServiceApplication' message..." -ForegroundColor Yellow
Write-Host ""

./mvnw spring-boot:run

