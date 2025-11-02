# Quick OAuth Test
# Tests if OAuth is properly configured

Write-Host ""
Write-Host "======= QUICK OAUTH TEST =======" -ForegroundColor Cyan
Write-Host ""

# Test 1: Gateway
Write-Host "[1] Gateway (6060)..." -NoNewline
try {
    $null = Invoke-WebRequest -Uri "http://localhost:6060/actuator/health" -Method GET -TimeoutSec 2 -UseBasicParsing
    Write-Host " UP" -ForegroundColor Green
} catch {
    Write-Host " DOWN" -ForegroundColor Red
    Write-Host "    Run: .\START_ALL_FOR_OAUTH.ps1" -ForegroundColor Yellow
    exit
}

# Test 2: Auth Service
Write-Host "[2] Auth Service (6061)..." -NoNewline
try {
    $null = Invoke-WebRequest -Uri "http://localhost:6061/actuator/health" -Method GET -TimeoutSec 2 -UseBasicParsing
    Write-Host " UP" -ForegroundColor Green
} catch {
    Write-Host " DOWN" -ForegroundColor Red
    Write-Host "    Run: .\START_ALL_FOR_OAUTH.ps1" -ForegroundColor Yellow
    exit
}

# Test 3: OAuth Config (Direct - Auth Service)
Write-Host "[3] OAuth Config (Direct 6061)..." -NoNewline
try {
    $config = Invoke-RestMethod -Uri "http://localhost:6061/auth/oauth/config" -Method GET -TimeoutSec 2
    if ($config.googleClientId -ne "NOT_CONFIGURED") {
        Write-Host " CONFIGURED" -ForegroundColor Green
    } else {
        Write-Host " NOT CONFIGURED" -ForegroundColor Red
    }
} catch {
    Write-Host " FAILED" -ForegroundColor Red
}

# Test 4: OAuth Config (Through Gateway)
Write-Host "[4] OAuth Config (Gateway 6060)..." -NoNewline
try {
    $config = Invoke-RestMethod -Uri "http://localhost:6060/auth/oauth/config" -Method GET -TimeoutSec 2
    if ($config.googleClientId -ne "NOT_CONFIGURED") {
        Write-Host " ACCESSIBLE" -ForegroundColor Green
        Write-Host ""
        Write-Host "    Status: $($config.status)" -ForegroundColor Green
        Write-Host "    Google Client ID: $($config.googleClientId.Substring(0,20))..." -ForegroundColor Green
    } else {
        Write-Host " NOT CONFIGURED" -ForegroundColor Red
    }
} catch {
    Write-Host " BLOCKED!" -ForegroundColor Red
    Write-Host ""
    Write-Host "    ERROR: OAuth endpoints not whitelisted in Gateway!" -ForegroundColor Red
    Write-Host "    FIX: Check gateway-service/src/main/resources/application.yml" -ForegroundColor Yellow
    Write-Host "         Whitelist should include: /auth/oauth/**" -ForegroundColor Yellow
}

# Test 5: Frontend
Write-Host "[5] Frontend (5173)..." -NoNewline
try {
    $null = Invoke-WebRequest -Uri "http://localhost:5173" -Method GET -TimeoutSec 2 -UseBasicParsing
    Write-Host " UP" -ForegroundColor Green
} catch {
    Write-Host " DOWN" -ForegroundColor Red
    Write-Host "    Start with: cd web-portal; npm run dev" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "======= TEST COMPLETE =======" -ForegroundColor Cyan
Write-Host ""
Write-Host "If all tests are GREEN, try OAuth login:" -ForegroundColor White
Write-Host "  http://localhost:5173/login" -ForegroundColor Cyan
Write-Host ""

