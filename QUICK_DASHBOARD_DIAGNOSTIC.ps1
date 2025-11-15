# Quick Dashboard Diagnostic Script
# Run this to identify why dashboard shows blank

Write-Host "`n========== DASHBOARD QUICK DIAGNOSTIC ==========" -ForegroundColor Cyan
Write-Host "This script will check the most common causes of blank dashboard`n" -ForegroundColor Gray

# 1. Check if backend service is running
Write-Host "1️⃣  Checking if Appointment Service is running on port 6064..." -ForegroundColor Yellow
$serviceRunning = $false
try {
    $response = Invoke-WebRequest -Uri "http://localhost:6064/actuator/health" -ErrorAction SilentlyContinue
    if ($response.StatusCode -eq 200) {
        Write-Host "✅ Appointment Service is RUNNING" -ForegroundColor Green
        $serviceRunning = $true
    }
} catch {
    Write-Host "❌ Appointment Service is NOT RUNNING on port 6064" -ForegroundColor Red
    Write-Host "   Fix: Start the service with: cd c:\Java\care\Code\appointment-service && mvn spring-boot:run" -ForegroundColor Yellow
}

# 2. Check if backend files exist
Write-Host "`n2️⃣  Checking if backend files exist..." -ForegroundColor Yellow
$controllerPath = "c:\Java\care\Code\appointment-service\src\main\java\com\care\appointment\web\controller\admin\GeneralDashboardController.java"
if (Test-Path $controllerPath) {
    Write-Host "✅ GeneralDashboardController.java EXISTS" -ForegroundColor Green
} else {
    Write-Host "❌ GeneralDashboardController.java NOT FOUND" -ForegroundColor Red
    Write-Host "   Location checked: $controllerPath" -ForegroundColor Gray
    Write-Host "   Fix: Backend files may not have been created" -ForegroundColor Yellow
}

# 3. Check if compiled
Write-Host "`n3️⃣  Checking if backend is compiled..." -ForegroundColor Yellow
$compiledPath = "c:\Java\care\Code\appointment-service\target\classes\com\care\appointment\web\controller\admin\GeneralDashboardController.class"
if (Test-Path $compiledPath) {
    Write-Host "✅ GeneralDashboardController.class COMPILED" -ForegroundColor Green
} else {
    Write-Host "❌ GeneralDashboardController.class NOT COMPILED" -ForegroundColor Red
    Write-Host "   Fix: Run: cd c:\Java\care\Code\appointment-service && mvn clean compile" -ForegroundColor Yellow
}

# 4. Test API endpoint
if ($serviceRunning) {
    Write-Host "`n4️⃣  Testing API endpoint..." -ForegroundColor Yellow

    $today = [DateTime]::Now.ToString("yyyy-MM-dd")
    $from = [DateTime]::Now.AddDays(-30).ToString("yyyy-MM-dd")

    $request = @{
        dateFrom = $from
        dateTo = $today
        period = "DAILY"
    } | ConvertTo-Json

    try {
        $response = Invoke-WebRequest `
            -Uri "http://localhost:6064/api/admin/appointments/dashboard/metrics" `
            -Method POST `
            -ContentType "application/json" `
            -Body $request `
            -ErrorAction Stop

        Write-Host "✅ API Endpoint is RESPONDING (Status: $($response.StatusCode))" -ForegroundColor Green

        # Check response data
        $data = $response.Content | ConvertFrom-Json
        Write-Host "   Total Appointments: $($data.totalAppointments)" -ForegroundColor Gray
        Write-Host "   Response size: $($response.Content.Length) bytes" -ForegroundColor Gray

        if ($data.totalAppointments -eq 0) {
            Write-Host "`n⚠️  WARNING: No appointment data in response" -ForegroundColor Yellow
            Write-Host "   This could mean:" -ForegroundColor Gray
            Write-Host "   - No appointments exist in database for this date range" -ForegroundColor Gray
            Write-Host "   - Database query returned no results" -ForegroundColor Gray
        }
    } catch {
        Write-Host "❌ API Endpoint ERROR" -ForegroundColor Red
        Write-Host "   Error: $($_.Exception.Response.StatusCode)" -ForegroundColor Gray

        if ($_.Exception.Response.StatusCode -eq 404) {
            Write-Host "   Status: 404 NOT FOUND" -ForegroundColor Red
            Write-Host "   Fix: Backend endpoint not found. Check if service was rebuilt/restarted." -ForegroundColor Yellow
        } elseif ($_.Exception.Response.StatusCode -eq 500) {
            Write-Host "   Status: 500 INTERNAL SERVER ERROR" -ForegroundColor Red
            Write-Host "   Fix: Backend threw error. Check appointment-service logs." -ForegroundColor Yellow
        } else {
            Write-Host "   Full error: $($_ | Out-String)" -ForegroundColor Gray
        }
    }
}

# 5. Check database
Write-Host "`n5️⃣  Checking database..." -ForegroundColor Yellow
Write-Host "   (Requires PostgreSQL client or GUI)" -ForegroundColor Gray
Write-Host "   Run in PostgreSQL:" -ForegroundColor Gray
Write-Host "   SELECT COUNT(*) FROM appointments;" -ForegroundColor Cyan

# Summary
Write-Host "`n========== DIAGNOSTIC SUMMARY ==========" -ForegroundColor Cyan
Write-Host "`nNext steps:" -ForegroundColor Yellow

if (-not $serviceRunning) {
    Write-Host "1. Start Appointment Service (Port 6064)" -ForegroundColor Cyan
    Write-Host "   cd c:\Java\care\Code\appointment-service" -ForegroundColor Gray
    Write-Host "   mvn spring-boot:run" -ForegroundColor Gray
} elseif (!(Test-Path $controllerPath)) {
    Write-Host "1. Backend files not found - need to recreate them" -ForegroundColor Cyan
} elseif (!(Test-Path $compiledPath)) {
    Write-Host "1. Backend not compiled - run:" -ForegroundColor Cyan
    Write-Host "   cd c:\Java\care\Code\appointment-service" -ForegroundColor Gray
    Write-Host "   mvn clean compile" -ForegroundColor Gray
    Write-Host "2. Restart the service" -ForegroundColor Cyan
} else {
    Write-Host "1. Service is running and code is compiled" -ForegroundColor Green
    Write-Host "2. Check browser console for errors (F12)" -ForegroundColor Cyan
    Write-Host "3. Check Network tab to see API response" -ForegroundColor Cyan
    Write-Host "4. Verify database has appointment data" -ForegroundColor Cyan
}

Write-Host "`nFor more help, see: DASHBOARD_DEBUGGING_GUIDE.md`n" -ForegroundColor Gray
