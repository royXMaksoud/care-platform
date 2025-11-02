# Script to start all Backend Services

Write-Host "Starting Backend Services..." -ForegroundColor Green
Write-Host ""

# Service 1: Service Registry
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd 'C:\Java\care\Code\service-registry'; Write-Host 'Starting Service Registry...' -ForegroundColor Cyan; mvn spring-boot:run"

# Wait 15 seconds
Write-Host "Waiting for Service Registry to start..." -ForegroundColor Yellow
Start-Sleep -Seconds 15

# Service 2: Auth Service
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd 'C:\Java\care\Code\auth-service\auth-service'; Write-Host 'Starting Auth Service...' -ForegroundColor Cyan; mvn spring-boot:run"

# Service 3: Access Management
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd 'C:\Java\care\Code\access-management-service'; Write-Host 'Starting Access Management...' -ForegroundColor Cyan; mvn spring-boot:run"

# Service 4: Appointment Service  
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd 'C:\Java\care\Code\appointment-service'; Write-Host 'Starting Appointment Service...' -ForegroundColor Cyan; mvn spring-boot:run"

Write-Host ""
Write-Host "All services starting..." -ForegroundColor Green
Write-Host "Wait 2-3 minutes for all services to be ready" -ForegroundColor Yellow
Write-Host "Check status: http://localhost:8761" -ForegroundColor Cyan
Write-Host ""
Write-Host "Press any key to exit this window..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
