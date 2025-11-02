# Stop all services

Write-Host "Stopping all Java processes..." -ForegroundColor Red
Get-Process -Name java -ErrorAction SilentlyContinue | Stop-Process -Force

Write-Host "Stopping all Node processes..." -ForegroundColor Red
Get-Process -Name node -ErrorAction SilentlyContinue | Stop-Process -Force

Start-Sleep -Seconds 2

Write-Host ""
Write-Host "All services stopped!" -ForegroundColor Green
Write-Host ""
Write-Host "Now start each service in a SEPARATE PowerShell window:"
Write-Host ""
Write-Host "WINDOW 1 - Gateway:"
Write-Host "  cd C:\Java\care\Code\gateway-service"
Write-Host "  ./mvnw spring-boot:run"
Write-Host ""
Write-Host "WINDOW 2 - Auth Service:"
Write-Host '  cd C:\Java\care\Code\auth-service\auth-service'
Write-Host '  $env:OAUTH_GOOGLE_CLIENT_ID="22284906705-cafqh1pedp9oro7vfoid1eb8flpstrbm.apps.googleusercontent.com"'
Write-Host '  $env:OAUTH_GOOGLE_CLIENT_SECRET="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"'
Write-Host '  ./mvnw spring-boot:run'
Write-Host ""
Write-Host "WINDOW 3 - Access Management:"
Write-Host "  cd C:\Java\care\Code\access-management-service"
Write-Host "  ./mvnw spring-boot:run"
Write-Host ""
Write-Host "WINDOW 4 - Frontend:"
Write-Host "  cd C:\Java\care\Code\web-portal"
Write-Host "  npm run dev"
Write-Host ""
Write-Host "CORS FIX APPLIED TO GATEWAY!" -ForegroundColor Green

