# Start Auth Service with OAuth

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   STARTING AUTH SERVICE" -ForegroundColor Yellow
Write-Host "   (Port 6061 with OAuth)" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

cd C:\Java\care\Code\auth-service\auth-service

# Set OAuth environment variables
$env:OAUTH_GOOGLE_CLIENT_ID="22284906705-cafqh1pedp9oro7vfoid1eb8flpstrbm.apps.googleusercontent.com"
$env:OAUTH_GOOGLE_CLIENT_SECRET="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"

Write-Host "OAuth environment variables set!" -ForegroundColor Green
Write-Host "Starting Auth Service..." -ForegroundColor Green
Write-Host "Please wait for 'Started AuthServiceApplication' message..." -ForegroundColor Yellow
Write-Host ""

./mvnw spring-boot:run

