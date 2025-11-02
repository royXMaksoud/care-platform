# سكريبت لتشغيل تطبيق Flutter

Write-Host "📱 Care Mobile App - Flutter" -ForegroundColor Green
Write-Host ""

# تحقق من الأجهزة المتصلة
Write-Host "🔍 Checking connected devices..." -ForegroundColor Cyan
flutter devices

Write-Host ""
Write-Host "Select an option:" -ForegroundColor Yellow
Write-Host "1. Run on connected device/emulator" -ForegroundColor White
Write-Host "2. Build APK (release)" -ForegroundColor White
Write-Host "3. Build APK (debug)" -ForegroundColor White
Write-Host "4. Clean and rebuild" -ForegroundColor White
Write-Host "5. Exit" -ForegroundColor White
Write-Host ""

$choice = Read-Host "Enter your choice (1-5)"

switch ($choice) {
    "1" {
        Write-Host "🚀 Running app..." -ForegroundColor Green
        flutter run
    }
    "2" {
        Write-Host "📦 Building Release APK..." -ForegroundColor Green
        flutter build apk --release
        Write-Host ""
        Write-Host "✅ APK Location:" -ForegroundColor Green
        Write-Host "build\app\outputs\flutter-apk\app-release.apk" -ForegroundColor Cyan
    }
    "3" {
        Write-Host "📦 Building Debug APK..." -ForegroundColor Green
        flutter build apk --debug
        Write-Host ""
        Write-Host "✅ APK Location:" -ForegroundColor Green
        Write-Host "build\app\outputs\flutter-apk\app-debug.apk" -ForegroundColor Cyan
    }
    "4" {
        Write-Host "🧹 Cleaning project..." -ForegroundColor Yellow
        flutter clean
        Write-Host "📥 Getting dependencies..." -ForegroundColor Yellow
        flutter pub get
        Write-Host "🚀 Running app..." -ForegroundColor Green
        flutter run
    }
    "5" {
        Write-Host "👋 Goodbye!" -ForegroundColor Cyan
        exit
    }
    default {
        Write-Host "❌ Invalid choice!" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "Press any key to exit..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")

