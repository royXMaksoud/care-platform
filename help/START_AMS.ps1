# Start Access Management Service

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   STARTING ACCESS MANAGEMENT SERVICE" -ForegroundColor Yellow
Write-Host "   (Port 6062)" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

cd C:\Java\care\Code\access-management-service

Write-Host "Starting Access Management Service..." -ForegroundColor Green
Write-Host "Please wait for 'Started AccessManagementServiceApplication' message..." -ForegroundColor Yellow
Write-Host ""

./mvnw spring-boot:run

