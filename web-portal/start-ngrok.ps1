# Ngrok Quick Start Script
# يستخدم ngrok لإنشاء tunnel من localhost إلى الإنترنت

Write-Host "🚀 Ngrok Quick Start" -ForegroundColor Cyan
Write-Host "===================" -ForegroundColor Cyan
Write-Host ""

# التحقق من تثبيت ngrok
$ngrokExists = Get-Command ngrok -ErrorAction SilentlyContinue

if (-not $ngrokExists) {
    Write-Host "❌ ngrok غير مثبت!" -ForegroundColor Red
    Write-Host ""
    Write-Host "📥 طرق التثبيت:" -ForegroundColor Yellow
    Write-Host "  1. باستخدام Chocolatey: choco install ngrok" -ForegroundColor White
    Write-Host "  2. أو حمل من: https://ngrok.com/download" -ForegroundColor White
    Write-Host ""
    Write-Host "🔑 بعد التثبيت، سجّل على: https://ngrok.com/signup" -ForegroundColor Yellow
    Write-Host "   ثم ثبت token: ngrok config add-authtoken YOUR_TOKEN" -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ ngrok مثبت" -ForegroundColor Green
Write-Host ""

# سؤال عن البورت
Write-Host "🔌 اختر البورت للخدمة:" -ForegroundColor Yellow
Write-Host "  1. Appointment Service (6064)" -ForegroundColor White
Write-Host "  2. Auth Service (6061)" -ForegroundColor White
Write-Host "  3. Gateway Service (6060)" -ForegroundColor White
Write-Host "  4. مخصص (أدخل البورت يدوياً)" -ForegroundColor White
Write-Host ""

$choice = Read-Host "اختر (1-4)"

$port = switch ($choice) {
    "1" { 6064 }
    "2" { 6061 }
    "3" { 6060 }
    "4" { 
        $customPort = Read-Host "أدخل رقم البورت"
        $customPort 
    }
    default { 
        Write-Host "❌ خيار غير صحيح، استخدم البورت 6064 كافتراضي" -ForegroundColor Red
        6064 
    }
}

Write-Host ""
Write-Host "🌐 جاري إنشاء tunnel للبورت $port..." -ForegroundColor Cyan
Write-Host ""
Write-Host "💡 تأكد أن الخدمة شغالة على localhost:$port" -ForegroundColor Yellow
Write-Host ""

# التحقق من أن الخدمة شغالة
try {
    $response = Invoke-WebRequest -Uri "http://localhost:$port/actuator/health" -TimeoutSec 2 -ErrorAction SilentlyContinue
    if ($response.StatusCode -eq 200) {
        Write-Host "✅ الخدمة شغالة على localhost:$port" -ForegroundColor Green
    }
} catch {
    Write-Host "⚠️  لا يمكن الاتصال بـ localhost:$port" -ForegroundColor Yellow
    Write-Host "   تأكد أن الخدمة شغالة قبل المتابعة" -ForegroundColor Yellow
    Write-Host ""
    $continue = Read-Host "هل تريد المتابعة؟ (y/n)"
    if ($continue -ne "y") {
        exit 0
    }
}

Write-Host ""
Write-Host "🚇 جاري تشغيل ngrok..." -ForegroundColor Cyan
Write-Host ""
Write-Host "📋 بعد ظهور الـ URL، انسخه واستخدمه في:" -ForegroundColor Yellow
Write-Host "  - React App (.env): VITE_API_URL=https://xxxxx.ngrok-free.app" -ForegroundColor White
Write-Host "  - Mobile App (app_constants.dart): appointmentBaseUrl = 'https://xxxxx.ngrok-free.app'" -ForegroundColor White
Write-Host ""
Write-Host "🔍 يمكنك مراقبة الطلبات على: http://127.0.0.1:4040" -ForegroundColor Cyan
Write-Host ""
Write-Host "─────────────────────────────────────" -ForegroundColor Gray
Write-Host ""

# تشغيل ngrok
ngrok http $port

