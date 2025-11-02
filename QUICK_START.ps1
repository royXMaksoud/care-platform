# ═══════════════════════════════════════════════════════════════
# ⚡ QUICK START - تشغيل سريع
# ═══════════════════════════════════════════════════════════════
# Starts ONLY essential services (No Config Server, No Eureka)
# Perfect for development
# ═══════════════════════════════════════════════════════════════

Write-Host ""
Write-Host "╔════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║         ⚡ QUICK START MODE                            ║" -ForegroundColor Cyan
Write-Host "║         وضع التشغيل السريع                            ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""
Write-Host "📝 Starting essential services only:" -ForegroundColor Yellow
Write-Host "   - Gateway Service" -ForegroundColor White
Write-Host "   - Auth Service (standalone)" -ForegroundColor White
Write-Host "   - Access Management Service (standalone)" -ForegroundColor White
Write-Host "   - React Frontend" -ForegroundColor White
Write-Host ""
Write-Host "⚠️  Skipping:" -ForegroundColor Gray
Write-Host "   - Config Server (services use local configs)" -ForegroundColor Gray
Write-Host "   - Service Registry (not needed for dev)" -ForegroundColor Gray
Write-Host ""

# ═══════════════════════════════════════════════════════════════
# STEP 1: Gateway Service (Port 6060)
# ═══════════════════════════════════════════════════════════════
Write-Host "[1/4] 🌐 Starting Gateway Service (Port 6060)..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", @"
cd C:\Java\care\Code\gateway-service
Write-Host '╔══════════════════════════════════════╗' -ForegroundColor Cyan
Write-Host '║   🌐 GATEWAY SERVICE (6060)         ║' -ForegroundColor Cyan
Write-Host '╚══════════════════════════════════════╝' -ForegroundColor Cyan
`$env:SPRING_CLOUD_CONFIG_ENABLED='false'
`$env:EUREKA_CLIENT_ENABLED='false'
mvn spring-boot:run -Dspring-boot.run.arguments='--spring.cloud.config.enabled=false --eureka.client.enabled=false'
"@
Write-Host "      Waiting 15 seconds..." -ForegroundColor Gray
Start-Sleep -Seconds 15

# ═══════════════════════════════════════════════════════════════
# STEP 2: Auth Service (Port 6061) - Standalone
# ═══════════════════════════════════════════════════════════════
Write-Host "[2/4] 🔐 Starting Auth Service (Port 6061)..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", @"
cd C:\Java\care\Code\auth-service\auth-service
Write-Host '╔══════════════════════════════════════╗' -ForegroundColor Cyan
Write-Host '║   🔐 AUTH SERVICE (6061)            ║' -ForegroundColor Cyan
Write-Host '╚══════════════════════════════════════╝' -ForegroundColor Cyan
Write-Host 'ℹ️  Running in STANDALONE mode (no Config Server)' -ForegroundColor Yellow
`$env:SPRING_CLOUD_CONFIG_ENABLED='false'
mvn spring-boot:run -Dspring-boot.run.arguments='--spring.cloud.config.enabled=false'
"@
Write-Host "      Waiting 20 seconds..." -ForegroundColor Gray
Start-Sleep -Seconds 20

# ═══════════════════════════════════════════════════════════════
# STEP 3: Access Management Service (Port 6062) - Standalone
# ═══════════════════════════════════════════════════════════════
Write-Host "[3/4] 👥 Starting Access Management Service (Port 6062)..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", @"
cd C:\Java\care\Code\access-management-service
Write-Host '╔══════════════════════════════════════╗' -ForegroundColor Cyan
Write-Host '║   👥 ACCESS MGMT SERVICE (6062)     ║' -ForegroundColor Cyan
Write-Host '╚══════════════════════════════════════╝' -ForegroundColor Cyan
Write-Host 'ℹ️  Running in STANDALONE mode (no Config Server)' -ForegroundColor Yellow
`$env:SPRING_CLOUD_CONFIG_ENABLED='false'
mvn spring-boot:run -Dspring-boot.run.arguments='--spring.cloud.config.enabled=false'
"@
Write-Host "      Waiting 25 seconds..." -ForegroundColor Gray
Start-Sleep -Seconds 25

# ═══════════════════════════════════════════════════════════════
# STEP 4: React Frontend (Port 5173)
# ═══════════════════════════════════════════════════════════════
Write-Host "[4/4] ⚛️  Starting React Frontend (Port 5173)..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", @"
cd C:\Java\care\Code\web-portal
Write-Host '╔══════════════════════════════════════╗' -ForegroundColor Cyan
Write-Host '║   ⚛️  REACT FRONTEND (5173)         ║' -ForegroundColor Cyan
Write-Host '╚══════════════════════════════════════╝' -ForegroundColor Cyan
npm run dev
"@
Write-Host "      Waiting 10 seconds..." -ForegroundColor Gray
Start-Sleep -Seconds 10

Write-Host ""
Write-Host "╔════════════════════════════════════════════════════════╗" -ForegroundColor Green
Write-Host "║         ✅ QUICK START COMPLETE!                       ║" -ForegroundColor Green
Write-Host "║         اكتمل التشغيل السريع                          ║" -ForegroundColor Green
Write-Host "╚════════════════════════════════════════════════════════╝" -ForegroundColor Green
Write-Host ""

# ═══════════════════════════════════════════════════════════════
# Health Check
# ═══════════════════════════════════════════════════════════════
Write-Host "🏥 Checking Services..." -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray

Start-Sleep -Seconds 5

$services = @(
    @{Name="Gateway           "; Port=6060; Path="/actuator/health"},
    @{Name="Auth Service      "; Port=6061; Path="/actuator/health"},
    @{Name="Access Management "; Port=6062; Path="/actuator/health"},
    @{Name="React Frontend    "; Port=5173; Path="/"}
)

foreach ($svc in $services) {
    try {
        $url = "http://localhost:$($svc.Port)$($svc.Path)"
        $response = Invoke-WebRequest -Uri $url -TimeoutSec 5 -ErrorAction Stop -UseBasicParsing
        if ($response.StatusCode -eq 200) {
            Write-Host "✅ $($svc.Name) → http://localhost:$($svc.Port)" -ForegroundColor Green
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
Write-Host "   🔐 Auth Service:    http://localhost:6061" -ForegroundColor White
Write-Host "   👥 Access Mgmt:     http://localhost:6062" -ForegroundColor White
Write-Host ""
Write-Host "💡 To stop all services, run: .\STOP_ALL.ps1" -ForegroundColor Yellow
Write-Host ""
Write-Host "⚡ QUICK START MODE - Services running standalone" -ForegroundColor Cyan
Write-Host "   For full microservices architecture, use: .\START_ALL.ps1" -ForegroundColor Gray
Write-Host ""
