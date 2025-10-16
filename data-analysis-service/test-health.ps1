# PowerShell script to test the Data Analysis Service health endpoint

Write-Host "Testing Data Analysis Service Health Endpoint..." -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

$baseUrl = "http://localhost:6072"

# Test root endpoint
Write-Host "Testing root endpoint (/)..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/" -Method Get
    Write-Host "✓ Root endpoint is accessible" -ForegroundColor Green
    Write-Host "Response:" -ForegroundColor Gray
    $response | ConvertTo-Json -Depth 3
    Write-Host ""
} catch {
    Write-Host "✗ Root endpoint failed: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host ""
}

# Test actuator health endpoint
Write-Host "Testing health endpoint (/actuator/health)..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/actuator/health" -Method Get
    Write-Host "✓ Health endpoint is accessible" -ForegroundColor Green
    Write-Host "Response:" -ForegroundColor Gray
    $response | ConvertTo-Json -Depth 5
    Write-Host ""
    
    if ($response.status -eq "UP") {
        Write-Host "✓ Service is UP and healthy!" -ForegroundColor Green
    } else {
        Write-Host "⚠ Service status: $($response.status)" -ForegroundColor Yellow
    }
} catch {
    Write-Host "✗ Health endpoint failed: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host ""
}

# Test actuator info endpoint
Write-Host "Testing info endpoint (/actuator/info)..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/actuator/info" -Method Get
    Write-Host "✓ Info endpoint is accessible" -ForegroundColor Green
    Write-Host "Response:" -ForegroundColor Gray
    $response | ConvertTo-Json -Depth 3
    Write-Host ""
} catch {
    Write-Host "✗ Info endpoint failed: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host ""
}

Write-Host ""
Write-Host "================================================" -ForegroundColor Cyan
Write-Host "Test complete!" -ForegroundColor Cyan

