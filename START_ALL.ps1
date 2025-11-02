# ═══════════════════════════════════════════════════════════════
# 🚀 START ALL SERVICES - تشغيل كل الخدمات
# ═══════════════════════════════════════════════════════════════
# Date: October 28, 2025
# This script starts all microservices and frontend in correct order
# ═══════════════════════════════════════════════════════════════

Write-Host ""
Write-Host "╔════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║         🚀 STARTING ALL SERVICES                       ║" -ForegroundColor Cyan
Write-Host "║         تشغيل جميع الخدمات                            ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

# ═══════════════════════════════════════════════════════════════
# STEP 1: Config Server (Port 8888)
# ═══════════════════════════════════════════════════════════════
Write-Host "[1/6] 🔧 Starting Config Server (Port 8888)..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd C:\Java\care\Code\config-server; Write-Host '🔧 CONFIG SERVER' -ForegroundColor Cyan; mvn spring-boot:run"
Write-Host "      Waiting 15 seconds..." -ForegroundColor Gray
Start-Sleep -Seconds 15

# ═══════════════════════════════════════════════════════════════
# STEP 2: Service Registry - Eureka (Port 8761)
# ═══════════════════════════════════════════════════════════════
Write-Host "[2/6] 📡 Starting Service Registry - Eureka (Port 8761)..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd C:\Java\care\Code\service-registry; Write-Host '📡 SERVICE REGISTRY' -ForegroundColor Cyan; mvn spring-boot:run"
Write-Host "      Waiting 20 seconds..." -ForegroundColor Gray
Start-Sleep -Seconds 20

# ═══════════════════════════════════════════════════════════════
# STEP 3: Gateway Service (Port 6060)
# ═══════════════════════════════════════════════════════════════
Write-Host "[3/6] 🌐 Starting Gateway Service (Port 6060)..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd C:\Java\care\Code\gateway-service; Write-Host '🌐 GATEWAY SERVICE' -ForegroundColor Cyan; mvn spring-boot:run"
Write-Host "      Waiting 20 seconds..." -ForegroundColor Gray
Start-Sleep -Seconds 20

# ═══════════════════════════════════════════════════════════════
# STEP 4: Auth Service (Port 6061)
# ═══════════════════════════════════════════════════════════════
Write-Host "[4/6] 🔐 Starting Auth Service (Port 6061)..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd C:\Java\care\Code\auth-service\auth-service; Write-Host '🔐 AUTH SERVICE' -ForegroundColor Cyan; mvn spring-boot:run"
Write-Host "      Waiting 25 seconds..." -ForegroundColor Gray
Start-Sleep -Seconds 25

# ═══════════════════════════════════════════════════════════════
# STEP 5: Access Management Service (Port 6062)
# ═══════════════════════════════════════════════════════════════
Write-Host "[5/6] 👥 Starting Access Management Service (Port 6062)..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd C:\Java\care\Code\access-management-service; Write-Host '👥 ACCESS MANAGEMENT SERVICE' -ForegroundColor Cyan; mvn spring-boot:run"
Write-Host "      Waiting 30 seconds..." -ForegroundColor Gray
Start-Sleep -Seconds 30

# ═══════════════════════════════════════════════════════════════
# STEP 6: React Frontend (Port 5173)
# ═══════════════════════════════════════════════════════════════
Write-Host "[6/6] ⚛️  Starting React Frontend (Port 5173)..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd C:\Java\care\Code\web-portal; Write-Host '⚛️  REACT FRONTEND' -ForegroundColor Cyan; npm run dev"
Write-Host "      Waiting 10 seconds..." -ForegroundColor Gray
Start-Sleep -Seconds 10

Write-Host ""
Write-Host "╔════════════════════════════════════════════════════════╗" -ForegroundColor Green
Write-Host "║         ✅ ALL SERVICES STARTED!                       ║" -ForegroundColor Green
Write-Host "║         تم تشغيل جميع الخدمات بنجاح                   ║" -ForegroundColor Green
Write-Host "╚════════════════════════════════════════════════════════╝" -ForegroundColor Green
Write-Host ""

# ═══════════════════════════════════════════════════════════════
# Health Check
# ═══════════════════════════════════════════════════════════════
Write-Host "🏥 Checking Services Health..." -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray

$services = @(
    @{Name="Config Server       "; Port=8888; Path="/actuator/health"},
    @{Name="Service Registry    "; Port=8761; Path="/actuator/health"},
    @{Name="Gateway Service     "; Port=6060; Path="/actuator/health"},
    @{Name="Auth Service        "; Port=6061; Path="/actuator/health"},
    @{Name="Access Management   "; Port=6062; Path="/actuator/health"},
    @{Name="React Frontend      "; Port=5173; Path="/"}
)

Start-Sleep -Seconds 5

foreach ($svc in $services) {
    try {
        $url = "http://localhost:$($svc.Port)$($svc.Path)"
        $response = Invoke-WebRequest -Uri $url -TimeoutSec 5 -ErrorAction Stop -UseBasicParsing
        if ($response.StatusCode -eq 200) {
            Write-Host "✅ $($svc.Name) → http://localhost:$($svc.Port) " -ForegroundColor Green
        }
    } catch {
        Write-Host "⏳ $($svc.Name) → http://localhost:$($svc.Port) (Still starting...)" -ForegroundColor Yellow
    }
}

Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
Write-Host ""
Write-Host "📊 SERVICE URLS:" -ForegroundColor Cyan
Write-Host "   🌐 Frontend:        http://localhost:5173" -ForegroundColor White
Write-Host "   🚪 Gateway:         http://localhost:6060" -ForegroundColor White
Write-Host "   📡 Eureka:          http://localhost:8761" -ForegroundColor White
Write-Host "   🔧 Config Server:   http://localhost:8888" -ForegroundColor White
Write-Host "   🔐 Auth Service:    http://localhost:6061" -ForegroundColor White
Write-Host "   👥 Access Mgmt:     http://localhost:6062" -ForegroundColor White
Write-Host ""
Write-Host "💡 To stop all services, run: .\STOP_ALL.ps1" -ForegroundColor Yellow
Write-Host ""
