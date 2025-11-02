# 🚀 دليل النشر المجاني - Java Spring + React + Mobile App

## 🎯 الحل السريع: Ngrok (للاختبار فقط - مجاني)

**Ngrok** ينشئ نفق (tunnel) من localhost إلى إنترنت عام - مثالي للاختبار!

### الخطوات:

#### 1. ثبت Ngrok:
```powershell
# Windows - باستخدام Chocolatey
choco install ngrok

# أو حمل من: https://ngrok.com/download
```

#### 2. سجّل حساب مجاني:
- اذهب إلى: https://ngrok.com/signup
- احصل على Token المجاني

#### 3. ثبت Token:
```powershell
ngrok config add-authtoken YOUR_TOKEN_HERE
```

#### 4. شغل الباك اند:
```powershell
cd appointment-service
mvn spring-boot:run
# يعمل على: localhost:6064
```

#### 5. أنشئ Tunnel:
```powershell
# Terminal جديد
ngrok http 6064
```

**ستحصل على URL مثل:**
```
Forwarding: https://abc123.ngrok-free.app -> http://localhost:6064
```

#### 6. حدث React App:
في `web-portal/.env`:
```env
VITE_API_URL=https://abc123.ngrok-free.app
```

#### 7. حدث Mobile App:
في `care-mobile-app/lib/app/core/utils/app_constants.dart`:
```dart
static const String appointmentBaseUrl = 'https://abc123.ngrok-free.app';
```

#### 8. شغل React:
```powershell
cd web-portal
npm run dev
```

✅ **الآن يمكنك الوصول من أي مكان!**

**ملاحظات:**
- ⚠️ URL يتغير في كل مرة (في الخطة المجانية)
- ⚠️ محدود بـ 2 tunnels في وقت واحد
- ⚠️ مناسب للاختبار فقط

---

## 🌐 الحل الدائم: Render.com (مجاني)

### ما هو Render؟
- ✅ استضافة مجانية للـ Java Spring Boot
- ✅ استضافة مجانية للـ React (Static Site)
- ✅ قاعدة بيانات PostgreSQL مجانية
- ✅ SSL/HTTPS مجاني
- ✅ Custom domain مجاني

---

## 📋 الخطوة 1: إعداد PostgreSQL على Render

### 1. سجّل على Render:
https://render.com (مجاني)

### 2. أنشئ PostgreSQL Database:
1. Dashboard → New → PostgreSQL
2. Name: `care-db`
3. Database: `care_db`
4. User: `care_user`
5. Region: اختر الأقرب
6. Plan: **Free**
7. Create Database

### 3. احفظ معلومات الاتصال:
```
PostgreSQL Internal Host: xxxxxx
PostgreSQL Port: 5432
PostgreSQL Database: care_db
PostgreSQL User: care_user
PostgreSQL Password: xxxxxx
```

---

## ☕ الخطوة 2: نشر Java Spring Boot Services

### أ) إعداد Service واحد كمثال: Appointment Service

### 1. أنشئ `render.yaml` في كل خدمة:

**في `appointment-service/render.yaml`:**
```yaml
services:
  - type: web
    name: appointment-service
    env: java
    buildCommand: ./mvnw clean package -DskipTests
    startCommand: java -jar target/appointment-service-*.jar
    envVars:
      - key: SPRING_PROFILES_ACTIVE
        value: prod
      - key: DB_HOST
        fromDatabase:
          name: care-db
          property: host
      - key: DB_PORT
        fromDatabase:
          name: care-db
          property: port
      - key: DB_NAME
        fromDatabase:
          name: care-db
          property: database
      - key: DB_USER
        fromDatabase:
          name: care-db
          property: user
      - key: DB_PASSWORD
        fromDatabase:
          name: care-db
          property: password
      - key: EUREKA_SERVER
        value: http://eureka-service:8761/eureka
      - key: SERVER_PORT
        value: 6064
```

### 2. رفع الكود إلى GitHub:

```powershell
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/YOUR_USERNAME/appointment-service.git
git push -u origin main
```

### 3. نشر على Render:

1. Dashboard → New → Web Service
2. Connect GitHub repository
3. اختر `appointment-service`
4. Settings:
   - **Name:** appointment-service
   - **Environment:** Java
   - **Build Command:** `./mvnw clean package -DskipTests`
   - **Start Command:** `java -jar target/appointment-service-*.jar`
5. Environment Variables: (أضف من render.yaml)
6. Create Web Service

**ستحصل على URL مثل:**
```
https://appointment-service.onrender.com
```

---

## ⚛️ الخطوة 3: نشر React App

### 1. أنشئ `render.yaml` في web-portal:

```yaml
services:
  - type: web
    name: care-web-portal
    env: static
    buildCommand: npm install && npm run build
    staticPublishPath: dist
    envVars:
      - key: VITE_API_URL
        value: https://appointment-service.onrender.com
      - key: VITE_AUTH_URL
        value: https://auth-service.onrender.com
```

### 2. أضف `_redirects` في `public/`:

**`web-portal/public/_redirects`:**
```
/*    /index.html   200
```

### 3. رفع ونشر:
1. Push to GitHub
2. Dashboard → New → Static Site
3. Connect repository
4. Settings:
   - **Build Command:** `npm install && npm run build`
   - **Publish Directory:** `dist`
5. Environment Variables:
   ```
   VITE_API_URL=https://appointment-service.onrender.com
   ```
6. Create Static Site

**ستحصل على URL مثل:**
```
https://care-web-portal.onrender.com
```

---

## 📱 الخطوة 4: تحديث Mobile App

### في `care-mobile-app/lib/app/core/utils/app_constants.dart`:

```dart
class AppConstants {
  // للإنتاج على Render
  static const String appointmentBaseUrl = 'https://appointment-service.onrender.com';
  static const String authBaseUrl = 'https://auth-service.onrender.com';
  static const String gatewayBaseUrl = 'https://gateway-service.onrender.com';
  
  // للمحلي (للاختبار)
  // static const String appointmentBaseUrl = 'http://10.0.2.2:6064';
}
```

### بناء APK جديد:
```powershell
cd care-mobile-app
flutter build apk --release
```

---

## 🔧 الحل المختلط: Ngrok + Render

**أفضل مزيج للاختبار:**
1. استخدم **Ngrok** للخدمات المحلية (سريع)
2. استخدم **Render** للخدمات الأساسية (دائم)

---

## 📝 خطوات سريعة لـ Ngrok:

```powershell
# 1. ثبت ngrok
# 2. سجّل واحصل على token
ngrok config add-authtoken YOUR_TOKEN

# 3. شغل الباك اند
cd appointment-service
mvn spring-boot:run

# 4. Terminal جديد - أنشئ tunnel
ngrok http 6064

# 5. انسخ الـ URL (مثل: https://abc123.ngrok-free.app)

# 6. حدث التطبيقات:
# - React: VITE_API_URL=https://abc123.ngrok-free.app
# - Mobile: appointmentBaseUrl = 'https://abc123.ngrok-free.app'

# 7. جرب من أي مكان! ✅
```

---

## ⚙️ إعدادات مهمة للـ Spring Boot على Render:

### في `application-prod.yml`:
```yaml
server:
  port: ${PORT:6064}  # Render يستخدم PORT

spring:
  datasource:
    url: jdbc:postgresql://${DB_HOST}:${DB_PORT}/${DB_NAME}
    username: ${DB_USER}
    password: ${DB_PASSWORD}

  jpa:
    hibernate:
      ddl-auto: update  # أو validate للإنتاج
```

---

## ✅ Checklist للنشر:

### قبل النشر:
- [ ] اختبار جميع الخدمات محلياً
- [ ] إعداد قاعدة البيانات
- [ ] تحديث Environment Variables
- [ ] اختبار APIs من Swagger

### بعد النشر:
- [ ] فحص Health Checks
- [ ] اختبار React App من الهاتف
- [ ] اختبار Mobile App مع الـ URLs الجديدة
- [ ] فحص Logs على Render

---

## 🆓 خيارات أخرى مجانية:

### 1. **Railway.app**
- مجاني لفترة محدودة
- سهل الإعداد
- https://railway.app

### 2. **Fly.io**
- مجاني للخدمات الصغيرة
- https://fly.io

### 3. **Supabase** (للداتابيس فقط)
- PostgreSQL مجاني
- https://supabase.com

---

## 🔒 ملاحظات الأمان:

1. **HTTPS:** Render يوفر SSL مجاناً ✅
2. **Environment Variables:** لا تضع secrets في الكود
3. **CORS:** تأكد من إعدادات CORS في Gateway
4. **API Keys:** استخدم Environment Variables

---

## 📞 المساعدة:

- **Render Docs:** https://render.com/docs
- **Ngrok Docs:** https://ngrok.com/docs
- **Swagger:** بعد النشر، افتح `/swagger-ui.html`

---

**أسرع حل للاختبار:** Ngrok (5 دقائق) ⚡  
**أفضل حل للنشر:** Render.com (دائم ومجاني) 🌐

