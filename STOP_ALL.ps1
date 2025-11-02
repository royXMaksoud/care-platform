# ═══════════════════════════════════════════════════════════════
# ❌ STOP ALL SERVICES - إيقاف كل الخدمات
# ═══════════════════════════════════════════════════════════════
# Date: October 28, 2025
# This script stops all running microservices and frontend
# ═══════════════════════════════════════════════════════════════

Write-Host ""
Write-Host "╔════════════════════════════════════════════════════════╗" -ForegroundColor Red
Write-Host "║         ❌ STOPPING ALL SERVICES                       ║" -ForegroundColor Red
Write-Host "║         إيقاف جميع الخدمات                            ║" -ForegroundColor Red
Write-Host "╚════════════════════════════════════════════════════════╝" -ForegroundColor Red
Write-Host ""

# ═══════════════════════════════════════════════════════════════
# Stop all Java processes (Spring Boot services)
# ═══════════════════════════════════════════════════════════════
Write-Host "🛑 Stopping all Spring Boot services..." -ForegroundColor Yellow

$javaPorts = @(6062, 6061, 6060, 8761, 8888)  # Reverse order
$javaServices = @(
    @{Name="Access Management Service"; Port=6062},
    @{Name="Auth Service"; Port=6061},
    @{Name="Gateway Service"; Port=6060},
    @{Name="Service Registry"; Port=8761},
    @{Name="Config Server"; Port=8888}
)

foreach ($svc in $javaServices) {
    Write-Host "   → Stopping $($svc.Name) (Port $($svc.Port))..." -ForegroundColor Gray

    # Find process by port
    $netstat = netstat -ano | Select-String ":$($svc.Port)\s" | Select-String "LISTENING"
    if ($netstat) {
        $processId = ($netstat -split '\s+')[-1]
        if ($processId) {
            try {
                Stop-Process -Id $processId -Force -ErrorAction Stop
                Write-Host "      ✅ Stopped (PID: $processId)" -ForegroundColor Green
            } catch {
                Write-Host "      ⚠️  Could not stop (PID: $processId)" -ForegroundColor Yellow
            }
        }
    } else {
        Write-Host "      ℹ️  Not running" -ForegroundColor Gray
    }
}

# ═══════════════════════════════════════════════════════════════
# Stop React Frontend (Node.js process)
# ═══════════════════════════════════════════════════════════════
Write-Host ""
Write-Host "🛑 Stopping React Frontend..." -ForegroundColor Yellow

# Find process by port 5173
$netstat = netstat -ano | Select-String ":5173\s" | Select-String "LISTENING"
if ($netstat) {
    $processId = ($netstat -split '\s+')[-1]
    if ($processId) {
        try {
            Stop-Process -Id $processId -Force -ErrorAction Stop
            Write-Host "   ✅ React Frontend stopped (PID: $processId)" -ForegroundColor Green
        } catch {
            Write-Host "   ⚠️  Could not stop React Frontend (PID: $processId)" -ForegroundColor Yellow
        }
    }
} else {
    Write-Host "   ℹ️  React Frontend not running" -ForegroundColor Gray
}

# ═══════════════════════════════════════════════════════════════
# Kill any remaining Maven processes
# ═══════════════════════════════════════════════════════════════
Write-Host ""
Write-Host "🛑 Cleaning up any remaining Maven processes..." -ForegroundColor Yellow

$mavenProcesses = Get-Process -Name "java" -ErrorAction SilentlyContinue | Where-Object {
    $_.CommandLine -like "*maven*" -or $_.CommandLine -like "*spring-boot*"
}

if ($mavenProcesses) {
    foreach ($proc in $mavenProcesses) {
        try {
            Stop-Process -Id $proc.Id -Force -ErrorAction Stop
            Write-Host "   ✅ Stopped Maven process (PID: $($proc.Id))" -ForegroundColor Green
        } catch {
            Write-Host "   ⚠️  Could not stop process (PID: $($proc.Id))" -ForegroundColor Yellow
        }
    }
} else {
    Write-Host "   ℹ️  No Maven processes found" -ForegroundColor Gray
}

# ═══════════════════════════════════════════════════════════════
# Kill any remaining Node.js processes on port 5173
# ═══════════════════════════════════════════════════════════════
Write-Host ""
Write-Host "🛑 Cleaning up Node.js processes..." -ForegroundColor Yellow

$nodeProcesses = Get-Process -Name "node" -ErrorAction SilentlyContinue

if ($nodeProcesses) {
    foreach ($proc in $nodeProcesses) {
        # Check if it's using port 5173
        $connections = netstat -ano | Select-String ":5173" | Select-String $proc.Id
        if ($connections) {
            try {
                Stop-Process -Id $proc.Id -Force -ErrorAction Stop
                Write-Host "   ✅ Stopped Node.js process (PID: $($proc.Id))" -ForegroundColor Green
            } catch {
                Write-Host "   ⚠️  Could not stop process (PID: $($proc.Id))" -ForegroundColor Yellow
            }
        }
    }
}

# ═══════════════════════════════════════════════════════════════
# Final Verification
# ═══════════════════════════════════════════════════════════════
Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
Write-Host "🔍 Verifying all ports are free..." -ForegroundColor Cyan
Write-Host ""

$allPorts = @(8888, 8761, 6060, 6061, 6062, 5173)
$allClear = $true

foreach ($port in $allPorts) {
    $isUsed = netstat -ano | Select-String ":$port\s" | Select-String "LISTENING"
    if ($isUsed) {
        Write-Host "   ⚠️  Port $port is still in use!" -ForegroundColor Yellow
        $allClear = $false
    } else {
        Write-Host "   ✅ Port $port is free" -ForegroundColor Green
    }
}

Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
Write-Host ""

if ($allClear) {
    Write-Host "╔════════════════════════════════════════════════════════╗" -ForegroundColor Green
    Write-Host "║         ✅ ALL SERVICES STOPPED!                       ║" -ForegroundColor Green
    Write-Host "║         تم إيقاف جميع الخدمات بنجاح                   ║" -ForegroundColor Green
    Write-Host "╚════════════════════════════════════════════════════════╝" -ForegroundColor Green
} else {
    Write-Host "╔════════════════════════════════════════════════════════╗" -ForegroundColor Yellow
    Write-Host "║         ⚠️  Some services may still be running         ║" -ForegroundColor Yellow
    Write-Host "║         بعض الخدمات قد تكون لا تزال تعمل              ║" -ForegroundColor Yellow
    Write-Host "╚════════════════════════════════════════════════════════╝" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "💡 You may need to manually close some PowerShell windows" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "💡 To start all services again, run: .\START_ALL.ps1" -ForegroundColor Cyan
Write-Host ""
