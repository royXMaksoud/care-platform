# Start All Microservices in Correct Order
# Date: October 25, 2025

Write-Host "`n🚀 Starting All Microservices..." -ForegroundColor Cyan
Write-Host "=" * 60 -ForegroundColor Cyan

# 1. Config Server (Port 8888)
Write-Host "`n[1/6] Starting Config Server..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd C:\Java\care\Code\config-server; mvn spring-boot:run" -WindowStyle Minimized
Start-Sleep -Seconds 15

# 2. Service Registry (Port 8761)
Write-Host "[2/6] Starting Service Registry..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd C:\Java\care\Code\service-registry; mvn spring-boot:run" -WindowStyle Minimized
Start-Sleep -Seconds 20

# 3. Gateway (Port 6060)
Write-Host "[3/6] Starting Gateway..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd C:\Java\care\Code\gateway-service; mvn spring-boot:run" -WindowStyle Minimized
Start-Sleep -Seconds 20

# 4. Auth Service (Port 6061)
Write-Host "[4/6] Starting Auth Service..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd C:\Java\care\Code\auth-service\auth-service; mvn spring-boot:run" -WindowStyle Minimized
Start-Sleep -Seconds 25

# 5. Access Management Service (Port 6062) - WITH NEW CODE!
Write-Host "[5/6] Starting Access Management Service (WITH EntityManager.flush FIX)..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd C:\Java\care\Code\access-management-service; mvn clean spring-boot:run" -WindowStyle Minimized
Start-Sleep -Seconds 35

Write-Host "`n✅ All services started!" -ForegroundColor Green
Write-Host "=" * 60 -ForegroundColor Cyan

Write-Host "`n📊 Checking services health..." -ForegroundColor Cyan

# Check each service
$services = @(
    @{Name="Config Server"; Port=8888},
    @{Name="Service Registry"; Port=8761},
    @{Name="Gateway"; Port=6060},
    @{Name="Auth Service"; Port=6061},
    @{Name="Access Management"; Port=6062}
)

foreach ($svc in $services) {
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:$($svc.Port)/actuator/health" -TimeoutSec 5 -ErrorAction Stop
        if ($response.StatusCode -eq 200) {
            Write-Host "✅ $($svc.Name) (Port $($svc.Port)): UP" -ForegroundColor Green
        }
    } catch {
        Write-Host "❌ $($svc.Name) (Port $($svc.Port)): DOWN" -ForegroundColor Red
    }
}

Write-Host "`n🎉 Startup Complete!" -ForegroundColor Cyan
Write-Host "=" * 60 -ForegroundColor Cyan
Write-Host "`nFrontend: http://localhost:5173" -ForegroundColor White
Write-Host "Gateway:  http://localhost:6060" -ForegroundColor White
Write-Host "`n💡 Access Management Service is running with EntityManager.flush() fix!" -ForegroundColor Yellow

