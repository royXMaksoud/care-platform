# ⚡ Ngrok - اختبار سريع في 5 دقائق

## 🎯 الهدف:
جعل الباك اند المحلي متاحاً على الإنترنت للاختبار السريع.

---

## 📥 التثبيت:

### Windows:
```powershell
# باستخدام Chocolatey
choco install ngrok

# أو حمل من:
# https://ngrok.com/download
# انزل ngrok.exe وضعه في أي مكان
```

### Mac/Linux:
```bash
brew install ngrok/ngrok/ngrok
```

---

## 🔑 الإعداد:

### 1. سجّل حساب مجاني:
https://ngrok.com/signup

### 2. احصل على Authtoken:
بعد التسجيل، اذهب إلى:
https://dashboard.ngrok.com/get-started/your-authtoken

### 3. ثبت Token:
```powershell
ngrok config add-authtoken YOUR_TOKEN_HERE
```

---

## 🚀 الاستخدام:

### 1. شغل الباك اند:
```powershell
cd appointment-service
mvn spring-boot:run
# يعمل على: localhost:6064
```

### 2. Terminal جديد - أنشئ Tunnel:
```powershell
ngrok http 6064
```

### 3. انسخ الـ URL:

ستظهر شاشة مثل:
```
Session Status                online
Account                       your-email@example.com
Version                       3.x.x
Region                        United States (us)
Latency                       -
Web Interface                 http://127.0.0.1:4040
Forwarding                    https://abc123def456.ngrok-free.app -> http://localhost:6064
```

**انسخ هذا:** `https://abc123def456.ngrok-free.app`

---

## ⚛️ تحديث React App:

### في `web-portal/.env`:
```env
VITE_API_URL=https://abc123def456.ngrok-free.app
VITE_AUTH_URL=https://abc123def456.ngrok-free.app
```

### أعد تشغيل React:
```powershell
cd web-portal
npm run dev
```

---

## 📱 تحديث Mobile App:

### في `care-mobile-app/lib/app/core/utils/app_constants.dart`:
```dart
static const String appointmentBaseUrl = 'https://abc123def456.ngrok-free.app';
static const String authBaseUrl = 'https://abc123def456.ngrok-free.app';
```

### أعد بناء APK:
```powershell
cd care-mobile-app
flutter build apk --release
```

---

## ✅ الآن جرب:

1. افتح React App على الهاتف: `http://YOUR_PC_IP:5173`
2. أو افتح Mobile App
3. **يجب أن يعمل مع الباك اند عبر Ngrok!** 🎉

---

## 📊 Monitoring:

افتح في المتصفح:
```
http://127.0.0.1:4040
```

ستشاهد:
- جميع الطلبات (Requests)
- الاستجابات (Responses)
- الأخطاء (Errors)

---

## ⚠️ ملاحظات:

1. **URL يتغير:** في الخطة المجانية، URL يتغير في كل مرة
2. **محدود:** 2 tunnels في وقت واحد (مجاني)
3. **للاستخدام التجاري:** تحتاج خطة مدفوعة

---

## 🔄 Multiple Services:

إذا لديك خدمات متعددة:

### Terminal 1:
```powershell
ngrok http 6061  # Auth Service
```

### Terminal 2:
```powershell
ngrok http 6064  # Appointment Service
```

**ستحصل على URLs مختلفة لكل خدمة!**

---

## 🎁 Bonus: Static Domain (مجاني محدود):

1. Dashboard → Domains → Add Domain
2. أدخل subdomain (مثل: `care-app`)
3. استخدم هذا في كل مرة بدلاً من URL العشوائي

---

**وقت الإعداد:** 5 دقائق ⏱️  
**كلفة:** مجاني تماماً ✅

