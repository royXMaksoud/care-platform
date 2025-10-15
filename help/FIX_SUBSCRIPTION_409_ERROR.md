# 🐛 إصلاح خطأ "Data integrity violation" (409) في Subscriptions

## ❌ المشكلة:

عند إضافة subscription جديد، يظهر الخطأ:
```json
{
  "code": "error.data.integrity",
  "message": "Data integrity violation",
  "status": 409
}
```

---

## 🔍 الأسباب المحتملة:

### 1. **Foreign Key Constraint** على `tenantId`
الـ tenantId في الـ payload قد لا يكون موجود في جدول `tenants`.

**الحل:**
```sql
-- تحقق من وجود الـ tenant
SELECT * FROM tenants 
WHERE tenant_id = '0bf65997-ac37-40e2-b54d-1fe71d3dcb40';
```

إذا لم يكن موجود، هذا هو السبب!

---

### 2. **Unique Constraint** على (tenantId + systemCode)
قد يكون هناك constraint يمنع إضافة نفس الـ systemCode لنفس الـ tenant.

**الحل:**
```sql
-- تحقق من وجود subscription بنفس الـ systemCode
SELECT * FROM tenant_subscriptions 
WHERE tenant_id = '0bf65997-ac37-40e2-b54d-1fe71d3dcb40'
AND system_code = 'fdd';
```

إذا موجود، **غيّر الـ systemCode** لشي ثاني (مثلاً "fdd2" أو "HR-SYSTEM").

---

### 3. **Missing Required Fields**
قد تكون في حقول required مش عم ترسل.

**تحقق من الـ Database Schema:**
```sql
-- شوف الـ constraints على الجدول
SELECT 
    tc.constraint_name,
    tc.constraint_type,
    kcu.column_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
    ON tc.constraint_name = kcu.constraint_name
WHERE tc.table_name = 'tenant_subscriptions'
AND tc.constraint_type IN ('UNIQUE', 'FOREIGN KEY');
```

---

## ✅ الحلول السريعة:

### الحل 1: استخدم systemCode مختلف
```javascript
// بدل:
systemCode: "fdd"

// جرّب:
systemCode: "HR-SYSTEM"
systemCode: "CRM-SYSTEM"
systemCode: "fdd-001"
```

### الحل 2: تأكد أن الـ tenant موجود
```javascript
// في Console، شوف الـ tenantId اللي عم ترسله
console.log('Tenant ID:', tenantId)

// تحقق في database:
SELECT * FROM tenants WHERE tenant_id = 'paste-uuid-here';
```

### الحل 3: احذف الـ subscription القديم (إذا موجود)
```sql
-- إذا كان في subscription قديم بنفس الـ systemCode
DELETE FROM tenant_subscriptions 
WHERE tenant_id = '0bf65997-ac37-40e2-b54d-1fe71d3dcb40'
AND system_code = 'fdd';
```

---

## 🧪 خطوات التشخيص:

### 1. تحقق من الـ Payload في Console:
```javascript
📦 Creating subscription with payload: {
  tenantId: "0bf65997-ac37-40e2-b54d-1fe71d3dcb40",
  systemCode: "fdd",
  startDate: "2025-10-03",
  endDate: "2025-10-31",
  price: 44887,
  notes: null
}
```

### 2. تحقق من الـ tenant في Database:
```sql
SELECT * FROM tenants 
WHERE tenant_id = '0bf65997-ac37-40e2-b54d-1fe71d3dcb40';
```

**النتيجة يجب تكون:**
- ✅ موجود → المشكلة في Unique Constraint
- ❌ مش موجود → المشكلة في Foreign Key

### 3. تحقق من Subscriptions الموجودة:
```sql
SELECT * FROM tenant_subscriptions 
WHERE tenant_id = '0bf65997-ac37-40e2-b54d-1fe71d3dcb40';
```

إذا في subscription بنفس الـ systemCode → **غيّره!**

---

## 🎯 الحل الأسرع (الأكثر احتمالاً):

**المشكلة:** في unique constraint على (tenantId + systemCode)

**الحل:** استخدم systemCode مختلف!

```
بدل:     "fdd"
جرّب:    "HR-SYSTEM"
أو:      "CRM-SYSTEM"
أو:      "fdd-2024"
```

---

## 📊 التعديلات اللي عملتها:

### 1. ✅ Frontend (TenantDetails.jsx):
```javascript
// صلّحنا idKey:
idKey="tenantSubscriptionId"  // ✅ (كان "id")

// صلّحنا toUpdatePayload:
tenantSubscriptionId: row.tenantSubscriptionId  // ✅ (كان row.id)

// أضفنا logging:
console.log('📦 Creating subscription with payload:', payload)
```

---

## 🚀 جرّب الآن:

1. **حدّث المتصفح:** `Ctrl + R`
2. **روح على Subscriptions tab**
3. **اضغط "Add New"**
4. **املأ البيانات لكن استخدم systemCode مختلف:**
   - ❌ لا تستخدم: "fdd" (قد يكون موجود)
   - ✅ استخدم: "HR-SYSTEM" أو "CRM-001"
5. **اضغط Save**

---

## 📝 ملاحظات:

- الـ **409 error** دائماً يعني conflict في البيانات
- عادة بسبب **unique constraint** أو **foreign key**
- استخدم systemCodes واضحة مثل:
  - "HR-SYSTEM"
  - "CRM-SYSTEM"
  - "FINANCE-SYSTEM"
  - "PROJECT-MANAGEMENT"

---

**🎉 إذا غيّرت الـ systemCode، يجب يشتغل بدون مشاكل!**

