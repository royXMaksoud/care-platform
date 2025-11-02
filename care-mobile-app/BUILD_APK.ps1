# Script to build APK

Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "     Build APK for Samsung           " -ForegroundColor Green
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""

# 1. Show IP info
Write-Host "1. Network Information:" -ForegroundColor Yellow
Write-Host ""
ipconfig | Select-String "IPv4"
Write-Host ""
Write-Host "IMPORTANT: Update IP in this file:" -ForegroundColor Red
Write-Host "lib\app\core\utils\app_constants.dart" -ForegroundColor Cyan
Write-Host ""

# 2. Check if Backend is running
Write-Host "2. Is Backend running?" -ForegroundColor Yellow
Write-Host "   (If no, run: .\start-backend.ps1)" -ForegroundColor Gray
$backendReady = Read-Host "Backend running? (y/n)"

if ($backendReady -ne "y") {
    Write-Host ""
    Write-Host "Start Backend first!" -ForegroundColor Red
    Write-Host "Open new PowerShell and run: .\start-backend.ps1" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Press any key to exit..."
    $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
    exit
}

# 3. Build APK
Write-Host ""
Write-Host "3. Building APK..." -ForegroundColor Yellow
Write-Host "   (Takes 5-10 minutes first time)" -ForegroundColor Gray
Write-Host ""

flutter build apk --release

# 4. Check success
if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "=====================================" -ForegroundColor Green
    Write-Host "     APK Ready!" -ForegroundColor Green
    Write-Host "=====================================" -ForegroundColor Green
    Write-Host ""
    
    $apkPath = "build\app\outputs\flutter-apk\app-release.apk"
    $fullPath = (Get-Item $apkPath).FullName
    
    Write-Host "APK Location:" -ForegroundColor Cyan
    Write-Host $fullPath -ForegroundColor Yellow
    Write-Host ""
    
    # File size
    $fileSize = [Math]::Round((Get-Item $apkPath).Length / 1MB, 2)
    Write-Host "File Size: $fileSize MB" -ForegroundColor Cyan
    Write-Host ""
    
    Write-Host "=====================================" -ForegroundColor Green
    Write-Host "     Next Steps:" -ForegroundColor Yellow
    Write-Host "=====================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "1. Transfer APK to phone:" -ForegroundColor White
    Write-Host "   - USB Cable" -ForegroundColor Gray
    Write-Host "   - WhatsApp (send to yourself)" -ForegroundColor Gray
    Write-Host "   - Google Drive" -ForegroundColor Gray
    Write-Host "   - Bluetooth" -ForegroundColor Gray
    Write-Host ""
    Write-Host "2. On phone:" -ForegroundColor White
    Write-Host "   - Open My Files" -ForegroundColor Gray
    Write-Host "   - Go to Downloads" -ForegroundColor Gray
    Write-Host "   - Tap app-release.apk" -ForegroundColor Gray
    Write-Host "   - Tap Install" -ForegroundColor Gray
    Write-Host ""
    Write-Host "3. Allow installation from unknown sources when asked" -ForegroundColor White
    Write-Host ""
    Write-Host "=====================================" -ForegroundColor Green
    Write-Host ""
    
    # Open APK folder
    Write-Host "Open APK folder? (y/n)" -ForegroundColor Yellow
    $openFolder = Read-Host
    
    if ($openFolder -eq "y") {
        explorer.exe (Split-Path $fullPath)
    }
    
} else {
    Write-Host ""
    Write-Host "Build failed!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Try:" -ForegroundColor Yellow
    Write-Host "flutter clean" -ForegroundColor Cyan
    Write-Host "flutter pub get" -ForegroundColor Cyan
    Write-Host "flutter build apk --release" -ForegroundColor Cyan
    Write-Host ""
}

Write-Host ""
Write-Host "Press any key to exit..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
