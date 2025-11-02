# Test Permissions Connectivity

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   TESTING PERMISSIONS" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Test 1: Check if AMS is running
Write-Host "[1] Checking if Access Management Service is running..." -ForegroundColor White
try {
    $amsHealth = Invoke-WebRequest -Uri "http://localhost:6062/actuator/health" -Method GET -TimeoutSec 3 -UseBasicParsing
    Write-Host "    AMS is UP! Status: $($amsHealth.StatusCode)" -ForegroundColor Green
} catch {
    Write-Host "    AMS is DOWN or not accessible!" -ForegroundColor Red
    Write-Host "    Error: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""

# Test 2: Check if Auth Service can reach AMS
Write-Host "[2] Testing Auth Service connection..." -ForegroundColor White
try {
    $authHealth = Invoke-WebRequest -Uri "http://localhost:6061/actuator/health" -Method GET -TimeoutSec 3 -UseBasicParsing
    Write-Host "    Auth Service is UP! Status: $($authHealth.StatusCode)" -ForegroundColor Green
} catch {
    Write-Host "    Auth Service is DOWN or not accessible!" -ForegroundColor Red
    Write-Host "    Error: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""

# Test 3: Try to fetch permissions directly from AMS
Write-Host "[3] Testing AMS permissions endpoint directly..." -ForegroundColor White
Write-Host "    URL: http://localhost:6062/api/permissions/users/fd470f4e-abeb-4563-8cdb-07bf7b69c65c" -ForegroundColor Gray

try {
    $headers = @{
        "X-Internal-Key" = "dev-internal-key"
        "Accept" = "application/json"
    }
    
    $response = Invoke-WebRequest -Uri "http://localhost:6062/api/permissions/users/fd470f4e-abeb-4563-8cdb-07bf7b69c65c?page=0&size=10" -Method GET -Headers $headers -TimeoutSec 5 -UseBasicParsing
    
    Write-Host "    Status: $($response.StatusCode)" -ForegroundColor Green
    Write-Host "    Content Length: $($response.Content.Length) bytes" -ForegroundColor Green
    
    $data = $response.Content | ConvertFrom-Json
    Write-Host "    Total Elements: $($data.totalElements)" -ForegroundColor Green
    Write-Host "    Content Items: $($data.content.Count)" -ForegroundColor Green
    
    if ($data.totalElements -gt 0) {
        Write-Host "    PERMISSIONS FOUND!" -ForegroundColor Green
    } else {
        Write-Host "    NO PERMISSIONS FOUND!" -ForegroundColor Yellow
    }
    
} catch {
    Write-Host "    FAILED to fetch permissions from AMS!" -ForegroundColor Red
    Write-Host "    Error: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

