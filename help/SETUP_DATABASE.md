# 🔧 DATABASE SETUP - خطوات إضافة البيانات

**التاريخ:** 3 نوفمبر 2025
**الحالة:** جاهز للتنفيذ

---

## 📋 **الخطوات:**

### **الخطوة 1: افتح PostgreSQL**

في PowerShell أو Command Prompt:
```bash
psql -U appointment_user -d appointment_db
```

---

### **الخطوة 2: اختر أحد السكريبتات:**

#### **Option A: استخدم الـ Simple Script (سهل)** ✅ RECOMMENDED

الملف بسيط وسهل:
```bash
psql -U appointment_user -d appointment_db -f seed-data-SIMPLE.sql
```

يضيف:
- ✅ 5 service types
- ✅ 3 beneficiaries (مستفيدين للاختبار)

---

#### **Option B: استخدم الـ Full Script (أكثر تفاصيل)**

```bash
psql -U appointment_user -d appointment_db -f seed-data.sql
```

يضيف:
- ✅ 5 service types
- ✅ 3 health centers
- ✅ 5 providers
- ✅ 3 beneficiaries
- ✅ 3 appointments
- ✅ Provider specializations
- ✅ Center services

---

## ✅ **التحقق من البيانات:**

بعد تشغيل السكريبت، شغّل هذه الـ queries:

```sql
-- 1. تحقق من أنواع الخدمات
SELECT COUNT(*) as "Service Types" FROM service_types WHERE is_deleted = false;
-- يجب يكون: 5

-- 2. تحقق من المستفيدين
SELECT COUNT(*) as "Beneficiaries" FROM beneficiaries WHERE is_deleted = false;
-- يجب يكون: 3

-- 3. شوف بيانات المستفيدين
SELECT id, first_name, last_name, mobile_number, date_of_birth
FROM beneficiaries
WHERE is_deleted = false;

-- 4. شوف أنواع الخدمات
SELECT id, name, code
FROM service_types
WHERE is_deleted = false;
```

---

## 🧪 **اختبر الـ API بعد إضافة البيانات:**

### **Test 1: Service Types**
```bash
curl -X GET http://localhost:6064/api/mobile/service-types/lookup \
  -H "Content-Type: application/json"

# يجب ترجع JSON بـ 5 service types
```

### **Test 2: Login**
```bash
curl -X POST http://localhost:6064/api/mobile/beneficiaries/auth/verify \
  -H "Content-Type: application/json" \
  -d '{
    "mobileNumber": "07701234567",
    "dateOfBirth": "1985-05-15"
  }'

# يجب ترجع beneficiary data
```

---

## 📁 **ملفات البيانات:**

| الملف | الحجم | المحتوى |
|------|------|--------|
| **seed-data-SIMPLE.sql** | صغير | Service types + Beneficiaries فقط |
| **seed-data.sql** | كبير | كل شي (centers, doctors, appointments) |

---

## ⚠️ **ملاحظات:**

1. **جدول الأسماء الصحيحة:**
   - `service_types` ✅ (ليس `appt_service_types`)
   - `beneficiaries` ✅ (ليس `appt_beneficiaries`)
   - `family_members` ✅
   - `appointments` ✅

2. **بيانات الاختبار:**
   ```
   Mobile: 07701234567
   DOB: 1985-05-15
   ```
   هذا حساب اختبار يمكنك استخدامه للـ login

3. **إذا حصلت خطأ:**
   ```
   ERROR: relation "appt_..." does not exist
   ```
   معناه الـ script قديم. استخدم **seed-data-SIMPLE.sql**

---

## 🚀 **Quick Start:**

```bash
# 1. اتصل بـ PostgreSQL
psql -U appointment_user -d appointment_db

# 2. شغّل الـ script
\i seed-data-SIMPLE.sql

# 3. تحقق
SELECT COUNT(*) FROM service_types WHERE is_deleted = false;

# 4. اخرج
\q
```

---

**Status: ✅ Ready to run**

