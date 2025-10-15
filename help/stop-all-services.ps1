# Stop All Java Services Script
Write-Host "=====================================================" -ForegroundColor Cyan
Write-Host "Stopping All Java Services" -ForegroundColor Cyan
Write-Host "=====================================================" -ForegroundColor Cyan

# Get all Java processes
$javaProcesses = Get-Process java -ErrorAction SilentlyContinue

if ($javaProcesses) {
    Write-Host ""
    Write-Host "Found $($javaProcesses.Count) Java process(es):" -ForegroundColor Yellow
    $javaProcesses | Select-Object Id, @{Name='Memory(MB)';Expression={[math]::Round($_.WS/1MB,2)}}, StartTime | Format-Table -AutoSize
    
    Write-Host "Stopping all Java processes..." -ForegroundColor Yellow
    $javaProcesses | Stop-Process -Force
    
    Start-Sleep -Seconds 2
    
    $remaining = Get-Process java -ErrorAction SilentlyContinue
    if ($remaining) {
        Write-Host "Warning: Some processes still running forcing kill..." -ForegroundColor Red
        $remaining | Stop-Process -Force
    }
    
    Write-Host "All Java processes stopped!" -ForegroundColor Green
} else {
    Write-Host "No Java processes found - already stopped" -ForegroundColor Green
}

# Check ports are free
Write-Host ""
Write-Host "Checking if ports are free..." -ForegroundColor Yellow
$ports = @(6060, 6061, 6062)
foreach ($port in $ports) {
    $listening = netstat -ano | Select-String -Pattern ":$port " | Select-String "LISTENING"
    if ($listening) {
        Write-Host "  Port $port is still in use!" -ForegroundColor Red
        Write-Host "     $listening" -ForegroundColor Gray
    } else {
        Write-Host "  Port $port is free" -ForegroundColor Green
    }
}

Write-Host ""
Write-Host "=====================================================" -ForegroundColor Cyan
Write-Host "Cleanup Complete!" -ForegroundColor Cyan
Write-Host "=====================================================" -ForegroundColor Cyan
