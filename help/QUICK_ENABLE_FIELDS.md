# 🚀 تفعيل الحقول المخفية - خطوة واحدة!

## المشكلة:
الحقول التالية لا تظهر في TenantDetails:
- ❌ Industry Type
- ❌ Subscription Plan
- ❌ Billing Cycle
- ❌ Country

## السبب:
معطلين مؤقتاً لأن UUIDs غير موجودة في codeTableIds.js

---

## ✅ الحل السريع (دقيقتين):

### الخطوة 1️⃣: نفّذ هذا SQL في قاعدة البيانات

افتح **pgAdmin** أو **DBeaver** ونفّذ:

```sql
-- 📋 انسخ النتائج
SELECT 
    code,
    code_table_id,
    CONCAT('  ', code, ': ''', code_table_id, ''',') as "📋 COPY THIS"
FROM code_tables
WHERE code IN ('INDUSTRY_TYPE', 'SUBSCRIPTION_PLAN', 'BILLING_CYCLE', 'COUNTRY')
AND is_active = true
ORDER BY code;
```

**النتيجة ستكون مثل:**
```
  BILLING_CYCLE: 'abc-123-456-789',
  COUNTRY: 'def-456-789-012',
  INDUSTRY_TYPE: 'ghi-789-012-345',
  SUBSCRIPTION_PLAN: 'jkl-012-345-678',
```

**📋 انسخ من عمود "COPY THIS"!**

---

### الخطوة 2️⃣: حدّث codeTableIds.js

**افتح:**
```
web-portal/src/config/codeTableIds.js
```

**ابحث عن السطر 13:**
```javascript
export const CODE_TABLE_IDS = {
  CURRENCY: '0e351629-526f-44d6-8912-737be0466c88',
  
  // 👇 استبدل هنا
  INDUSTRY_TYPE: 'REPLACE_WITH_INDUSTRY_TYPE_UUID',
  SUBSCRIPTION_PLAN: 'REPLACE_WITH_SUBSCRIPTION_PLAN_UUID',
  BILLING_CYCLE: 'REPLACE_WITH_BILLING_CYCLE_UUID',
  COUNTRY: 'REPLACE_WITH_COUNTRY_UUID',
}
```

**استبدل بالقيم من Step 1:**
```javascript
export const CODE_TABLE_IDS = {
  CURRENCY: '0e351629-526f-44d6-8912-737be0466c88',
  
  // ✅ ضع القيم الحقيقية هنا
  BILLING_CYCLE: 'abc-123-456-789',
  COUNTRY: 'def-456-789-012',
  INDUSTRY_TYPE: 'ghi-789-012-345',
  SUBSCRIPTION_PLAN: 'jkl-012-345-678',
}
```

**💾 احفظ (Ctrl+S)**

---

### الخطوة 3️⃣: فعّل الحقول في TenantDetails.jsx

**افتح:**
```
web-portal/src/modules/cms/pages/tenants/TenantDetails.jsx
```

**ابحث عن السطر 268 وحذف التعليقات:**

#### Before (السطر 268):
```javascript
{/* ⚠️ TODO: Uncomment after getting real UUIDs */}
{/* <SelectField 
  label="Industry Type" 
  value={tenant.industryTypeName}
  editing={editing}
  onChange={(val) => setFormData({...formData, industryTypeId: val})}
  editValue={formData.industryTypeId}
  codeTableId={CODE_TABLE_IDS.INDUSTRY_TYPE}
/> */}
<InfoField 
  label="Industry Type" 
  value={tenant.industryTypeName}
  editing={false}
  fullWidth={false}
/>
```

#### After (احذف التعليق واحذف InfoField):
```javascript
<SelectField 
  label="Industry Type" 
  value={tenant.industryTypeName}
  editing={editing}
  onChange={(val) => setFormData({...formData, industryTypeId: val})}
  editValue={formData.industryTypeId}
  codeTableId={CODE_TABLE_IDS.INDUSTRY_TYPE}
/>
```

**كرر نفس الشيء لـ:**
- ✅ Subscription Plan (السطر 284)
- ✅ Billing Cycle (السطر 308)
- ✅ Country (السطر 323)

**💾 احفظ (Ctrl+S)**

---

### الخطوة 4️⃣: حدّث المتصفح

```
Ctrl + R
```

---

## 🎉 النتيجة:

بعد هذه الخطوات سترى جميع الحقول:

```
✅ Tenant Name
✅ Email
✅ Industry Type       ← يظهر الآن!
✅ Subscription Plan   ← يظهر الآن!
✅ Billing Currency    ← يشتغل أصلاً
✅ Billing Cycle       ← يظهر الآن!
✅ Country             ← يظهر الآن!
✅ Focal Point Name
✅ Focal Point Phone
✅ Address
✅ Comments
```

---

## ⚠️ إذا لم تكن الجداول موجودة في Database:

نفّذ هذا لإنشائها:

```sql
-- إنشاء Code Tables إذا لم تكن موجودة
INSERT INTO code_tables (code_table_id, code, name, is_active, is_deleted, created_at)
SELECT gen_random_uuid(), 'INDUSTRY_TYPE', 'Industry Type', true, false, NOW()
WHERE NOT EXISTS (SELECT 1 FROM code_tables WHERE code = 'INDUSTRY_TYPE');

INSERT INTO code_tables (code_table_id, code, name, is_active, is_deleted, created_at)
SELECT gen_random_uuid(), 'SUBSCRIPTION_PLAN', 'Subscription Plan', true, false, NOW()
WHERE NOT EXISTS (SELECT 1 FROM code_tables WHERE code = 'SUBSCRIPTION_PLAN');

INSERT INTO code_tables (code_table_id, code, name, is_active, is_deleted, created_at)
SELECT gen_random_uuid(), 'BILLING_CYCLE', 'Billing Cycle', true, false, NOW()
WHERE NOT EXISTS (SELECT 1 FROM code_tables WHERE code = 'BILLING_CYCLE');

INSERT INTO code_tables (code_table_id, code, name, is_active, is_deleted, created_at)
SELECT gen_random_uuid(), 'COUNTRY', 'Country', true, false, NOW()
WHERE NOT EXISTS (SELECT 1 FROM code_tables WHERE code = 'COUNTRY');
```

ثم ارجع لـ Step 1 واحصل على UUIDs.

---

**⏱️ الوقت الكلي: دقيقتين فقط!**

**🚀 ابدأ الآن!**

