# 🚀 كيف تشغل الـ Services

## ✅ الحل السريع (استخدم هذا!)

### 1️⃣ **افتح PowerShell هنا:**
```powershell
cd C:\Java\care\Code
```

### 2️⃣ **أوقف أي services قديمة:**
```powershell
.\stop-all-services.ps1
```

### 3️⃣ **شغل الـ Services يدوياً (الطريقة الصحيحة):**

#### Terminal 1: Auth Service
```powershell
cd C:\Java\care\Code\auth-service\auth-service
mvn clean spring-boot:run
```
**انتظر حتى تشوف:** `Started AuthServiceApplication`

---

#### Terminal 2: Access Management
```powershell
cd C:\Java\care\Code\access-management-system\access-management-service\accessmanagement
mvn clean spring-boot:run
```
**انتظر حتى تشوف:** `Started AccessmanagementApplication`

---

#### Terminal 3: Gateway (اختياري)
```powershell
cd C:\Java\care\Code\gateway-service
mvn spring-boot:run
```
**انتظر حتى تشوف:** `Started GatewayServiceApplication`

---

### 4️⃣ **اختبر الـ Services:**

في terminal رابع:
```powershell
cd C:\Java\care\Code

# انتظر 30 ثانية
Start-Sleep -Seconds 30

# اختبر auth-service
curl http://localhost:6061/actuator/health

# اختبر access-management
curl http://localhost:6062/actuator/health
```

---

## 🎯 النتيجة المتوقعة

### Auth Service (6061):
```json
{"status":"UP"}
```

### Access Management (6062):
```json
{"status":"UP"}
```

---

## 🔧 إذا في مشاكل

### Problem 1: "Port already in use"
```powershell
.\stop-all-services.ps1
# ثم ابدأ من جديد
```

### Problem 2: "ClassNotFoundException: CodeTable"
```powershell
cd C:\Java\care\Code\access-management-system\access-management-service\accessmanagement
mvn clean compile -DskipTests
mvn spring-boot:run
```

### Problem 3: "Failed to configure DataSource"
1. تأكد PostgreSQL شغال
2. تحقق من `application.yml` فيه database config صحيح

---

## 📊 URLs المفيدة

| Service | Health | Swagger |
|---------|--------|---------|
| Auth | http://localhost:6061/actuator/health | http://localhost:6061/swagger-ui.html |
| Access | http://localhost:6062/actuator/health | http://localhost:6062/swagger-ui.html |
| Gateway | http://localhost:6060/actuator/health | - |

---

## ✅ Success Checklist

- [ ] Auth service شغال على 6061
- [ ] Access management شغال على 6062
- [ ] كل service يرجع `{"status":"UP"}`
- [ ] ما في errors في console logs
- [ ] تقدر تفتح Swagger UI

---

**إذا كل شي تمام، روح اختبر الـ Data Integrity Fix:**

```powershell
# Test the duplicate code validation
curl -X PUT "http://localhost:6060/access/api/system-section-actions/679e04f1-8858-4d32-8786-35b213704739" `
  -H "Content-Type: application/json" `
  -H "Authorization: Bearer YOUR_TOKEN" `
  -d '{
    "code": "CMS_CONTENT_CREATE",
    "name": "List Content"
  }'
```

**المتوقع:** 400 Bad Request مع رسالة validation واضحة ✅

