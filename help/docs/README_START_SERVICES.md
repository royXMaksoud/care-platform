# 🚀 كيفية تشغيل الخدمات | How to Start Services

## الأوامر الصحيحة | Correct Commands

### ❌ أوامر خاطئة | Wrong Commands
```powershell
mvn java-spring:run     # ❌ WRONG - لا يوجد plugin بهذا الاسم
mvn spring:run          # ❌ WRONG
```

### ✅ أوامر صحيحة | Correct Commands
```powershell
mvn spring-boot:run     # ✅ CORRECT - لتشغيل Spring Boot
npm run dev             # ✅ CORRECT - لتشغيل React
```

---

## 🎯 طرق التشغيل | Startup Options

### الطريقة 1️⃣: التشغيل السريع (مُوصى به للتطوير) ⚡
**تشغيل الخدمات الأساسية فقط بدون Config Server و Eureka**

```powershell
.\QUICK_START.ps1
```

**الخدمات التي ستعمل:**
- ✅ Gateway Service (Port 6060)
- ✅ Auth Service (Port 6061) - standalone
- ✅ Access Management Service (Port 6062) - standalone
- ✅ React Frontend (Port 5173)

**المميزات:**
- ⚡ أسرع في التشغيل (دقيقة واحدة)
- 💻 استخدام أقل للموارد
- 🔧 مناسب للتطوير اليومي

---

### الطريقة 2️⃣: التشغيل الكامل (البنية الكاملة) 🏗️
**تشغيل جميع الخدمات بما فيها Config Server و Eureka**

```powershell
.\START_ALL.ps1
```

**الخدمات التي ستعمل:**
- ✅ Config Server (Port 8888)
- ✅ Service Registry - Eureka (Port 8761)
- ✅ Gateway Service (Port 6060)
- ✅ Auth Service (Port 6061)
- ✅ Access Management Service (Port 6062)
- ✅ React Frontend (Port 5173)

**المميزات:**
- 🏗️ البنية الكاملة للـ Microservices
- 📡 Service Discovery مع Eureka
- 🔧 مركزية الإعدادات مع Config Server
- 🎯 مناسب للإنتاج والاختبار الشامل

**الوقت المتوقع:** 2-3 دقائق

---

### الطريقة 3️⃣: التشغيل اليدوي (خطوة بخطوة) 🔧

#### أ. تشغيل Config Server أولاً:
```powershell
cd config-server
mvn spring-boot:run
```
انتظر حتى يظهر: `Started ConfigServerApplication`

#### ب. تشغيل Service Registry:
```powershell
cd service-registry
mvn spring-boot:run
```
انتظر حتى يظهر: `Started ServiceRegistryApplication`

#### ج. تشغيل Gateway:
```powershell
cd gateway-service
mvn spring-boot:run
```

#### د. تشغيل Auth Service:
```powershell
cd auth-service\auth-service
mvn spring-boot:run
```

#### هـ. تشغيل Access Management:
```powershell
cd access-management-service
mvn spring-boot:run
```

#### و. تشغيل Frontend:
```powershell
cd web-portal
npm run dev
```

---

## ❌ إيقاف جميع الخدمات | Stop All Services

```powershell
.\STOP_ALL.ps1
```

يوقف **جميع** الخدمات Java و React تلقائياً.

---

## 🔍 التحقق من الخدمات | Service Health Check

### 1. Eureka Dashboard (إذا كان يعمل):
```
http://localhost:8761
```

### 2. Health Endpoints:
```powershell
# Config Server
curl http://localhost:8888/actuator/health

# Service Registry
curl http://localhost:8761/actuator/health

# Gateway
curl http://localhost:6060/actuator/health

# Auth Service
curl http://localhost:6061/actuator/health

# Access Management
curl http://localhost:6062/actuator/health
```

### 3. Frontend:
```
http://localhost:5173
```

---

## 🗄️ متطلبات التشغيل | Prerequisites

### ✅ يجب أن تكون هذه الخدمات شغالة قبل البدء:

1. **PostgreSQL Database**
   ```
   Host: localhost
   Port: 5432
   Database: cms_db
   Username: postgres
   Password: P@ssw0rd
   ```

   **للتحقق:**
   ```powershell
   psql -U postgres -h localhost -p 5432 -d cms_db
   ```

2. **Java 17**
   ```powershell
   java -version
   # يجب أن يظهر: openjdk version "17"
   ```

3. **Maven**
   ```powershell
   mvn -version
   ```

4. **Node.js & npm**
   ```powershell
   node -version
   npm -version
   ```

---

## 🐛 حل المشاكل الشائعة | Troubleshooting

### المشكلة 1: `Failed to configure a DataSource`

**السبب:** PostgreSQL غير شغال أو إعدادات الاتصال خاطئة

**الحل:**
```powershell
# تحقق من PostgreSQL
netstat -ano | findstr "5432"

# أو شغل PostgreSQL
# على Windows: ابحث عن "Services" وشغل "PostgreSQL"
```

---

### المشكلة 2: `No plugin found for prefix 'java-spring'`

**السبب:** الأمر خطأ

**الحل:**
```powershell
# ❌ خطأ
mvn java-spring:run

# ✅ صح
mvn spring-boot:run
```

---

### المشكلة 3: `Port already in use`

**السبب:** المنفذ مستخدم من خدمة أخرى

**الحل:**
```powershell
# اعرف مين يستخدم المنفذ (مثلاً 6061)
netstat -ano | findstr "6061"

# اوقف العملية
taskkill /PID [رقم_العملية] /F

# أو استخدم
.\STOP_ALL.ps1
```

---

### المشكلة 4: Config Server لا يعمل

**الحل السريع:** استخدم QUICK_START بدلاً من START_ALL
```powershell
.\QUICK_START.ps1
```

أو شغل الخدمات standalone:
```powershell
mvn spring-boot:run -Dspring-boot.run.arguments="--spring.cloud.config.enabled=false"
```

---

## 📊 خريطة المنافذ | Port Map

| الخدمة | المنفذ | الرابط |
|--------|--------|--------|
| 🌐 Frontend | 5173 | http://localhost:5173 |
| 🚪 Gateway | 6060 | http://localhost:6060 |
| 🔐 Auth Service | 6061 | http://localhost:6061 |
| 👥 Access Management | 6062 | http://localhost:6062 |
| 📚 Reference Data | 6063 | http://localhost:6063 |
| 📡 Eureka | 8761 | http://localhost:8761 |
| 🔧 Config Server | 8888 | http://localhost:8888 |
| 🗄️ PostgreSQL | 5432 | localhost:5432 |

---

## 📝 الملخص | Summary

### للتطوير اليومي:
```powershell
.\QUICK_START.ps1    # تشغيل
.\STOP_ALL.ps1       # إيقاف
```

### للبنية الكاملة:
```powershell
.\START_ALL.ps1      # تشغيل
.\STOP_ALL.ps1       # إيقاف
```

### الأمر الصحيح لـ Spring Boot:
```powershell
mvn spring-boot:run  # ✅ دائماً استخدم هذا
```

---

## 🎯 نصائح إضافية | Additional Tips

1. **افتح كل خدمة في نافذة PowerShell منفصلة** للسهولة في المتابعة
2. **راقب logs** في كل نافذة لمعرفة إذا الخدمة بدأت بنجاح
3. **استخدم Eureka Dashboard** للتحقق من تسجيل الخدمات
4. **افحص PostgreSQL أولاً** قبل تشغيل أي خدمة

---

**جاهز للتشغيل! 🚀**
