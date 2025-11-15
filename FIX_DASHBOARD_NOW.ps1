# Fix Dashboard - Complete Solution Script
# This will rebuild and test everything

Write-Host "`n╔════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║     FIXING DASHBOARD - COMPLETE REBUILD            ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════╝`n" -ForegroundColor Cyan

# Step 1: Kill all Java processes
Write-Host "1️⃣  Stopping all Java services..." -ForegroundColor Yellow
Get-Process | Where-Object { $_.ProcessName -like "*java*" } | ForEach-Object {
    Write-Host ("   Stopping {0} (PID: {1})" -f $_.ProcessName, $_.Id) -ForegroundColor Gray
    $_ | Stop-Process -Force -ErrorAction SilentlyContinue
}
Start-Sleep -Seconds 3
Write-Host "✅ All services stopped`n" -ForegroundColor Green

# Step 2: Build
Write-Host "2️⃣  Building appointment-service..." -ForegroundColor Yellow
Set-Location "c:\Java\care\Code\appointment-service"
mvn clean compile -q
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Compilation failed!" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Compilation successful`n" -ForegroundColor Green

# Step 3: Start service
Write-Host "3️⃣  Starting appointment-service on port 6064..." -ForegroundColor Yellow
Write-Host '   Waiting for startup (30 seconds)...' -ForegroundColor Gray

# Run in background with 30 second timeout
$startTime = Get-Date
mvn spring-boot:run -q &

# Wait for service to be ready
$ready = $false
$timeout = 0
while (-not $ready -and $timeout -lt 30) {
    Start-Sleep -Seconds 2
    $timeout += 2
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:6064/actuator/health" -ErrorAction SilentlyContinue
        if ($response.StatusCode -eq 200) {
            $ready = $true
        }
    } catch {
        # Service not ready yet
    }
}

if ($ready) {
    Write-Host "✅ Service started successfully`n" -ForegroundColor Green
} else {
    Write-Host "⚠️  Service startup timeout. May still be initializing...`n" -ForegroundColor Yellow
}

# Step 4: Test API
Write-Host "4️⃣  Testing Dashboard API..." -ForegroundColor Yellow

$testPayload = @{
    dateFrom = "2024-09-14"
    dateTo = "2024-11-13"
    period = "DAILY"
} | ConvertTo-Json

try {
    $response = Invoke-WebRequest `
        -Uri "http://localhost:6064/api/admin/appointments/dashboard/metrics" `
        -Method POST `
        -ContentType "application/json" `
        -Body $testPayload `
        -ErrorAction Stop

    $data = $response.Content | ConvertFrom-Json

    Write-Host "   ✅ API Response Status: $($response.StatusCode)" -ForegroundColor Green
    Write-Host "   ✅ Total Appointments: $($data.totalAppointments)" -ForegroundColor Green

    if ($data.totalAppointments -eq 0) {
        Write-Host "`n⚠️  WARNING: No appointment data in response!" -ForegroundColor Yellow
        Write-Host "    This could mean:" -ForegroundColor Gray
        Write-Host "    - Database is empty" -ForegroundColor Gray
        Write-Host "    - No appointments match this date range" -ForegroundColor Gray
        Write-Host "`n    Add test data to see charts:" -ForegroundColor Yellow
        Write-Host "    See: ADD_TEST_DATA.sql" -ForegroundColor Cyan
    }
} catch {
    Write-Host "❌ API Test Failed!" -ForegroundColor Red
    Write-Host "   Error: $($_.Exception.Response.StatusCode)" -ForegroundColor Red
    Write-Host "   Make sure service is still running..." -ForegroundColor Yellow
}

# Step 5: Next steps
Write-Host "`n╔════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║              READY TO TEST DASHBOARD                ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════╝`n" -ForegroundColor Cyan

Write-Host "✅ SERVICE IS RUNNING on port 6064" -ForegroundColor Green
Write-Host "`nNext steps:" -ForegroundColor Cyan
Write-Host "1. Go to: http://localhost:5173/appointment/reports/dashboard" -ForegroundColor White
Write-Host "2. Press F5 to reload" -ForegroundColor White
Write-Host "3. Dashboard should now load with data!" -ForegroundColor White

Write-Host "`nIf dashboard is still blank:" -ForegroundColor Yellow
Write-Host "1. Check browser console (F12)" -ForegroundColor White
Write-Host "2. Check for errors" -ForegroundColor White
Write-Host "3. Run: QUICK_DASHBOARD_DIAGNOSTIC.ps1" -ForegroundColor White

Write-Host "`nKeep this window open - the service is running here.`n" -ForegroundColor Gray
