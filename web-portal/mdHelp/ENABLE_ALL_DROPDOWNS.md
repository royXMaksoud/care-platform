# 🎯 تفعيل جميع Dropdowns للـ Tenant

## ✅ الوضع الحالي:

```
✅ Billing Currency  → يشتغل 100%
⏸️ Industry Type     → جاهز للتفعيل
⏸️ Subscription Plan → جاهز للتفعيل
⏸️ Billing Cycle     → جاهز للتفعيل
⏸️ Country           → جاهز للتفعيل
```

---

## 📋 خطوات التفعيل (5 دقائق):

### الخطوة 1️⃣: احصل على UUIDs من Database

**افتح SQL Tool** (pgAdmin, DBeaver, إلخ) ونفّذ:

```sql
SELECT 
    code,
    code_table_id,
    CONCAT('  ', code, ': ''', code_table_id, ''',') as result
FROM code_tables
WHERE code IN ('INDUSTRY_TYPE', 'SUBSCRIPTION_PLAN', 'BILLING_CYCLE', 'COUNTRY')
AND is_active = true
ORDER BY code;
```

**النتيجة ستكون مثل:**
```
BILLING_CYCLE: 'abc-123-456-...',
COUNTRY: 'def-456-789-...',
INDUSTRY_TYPE: 'ghi-789-012-...',
SUBSCRIPTION_PLAN: 'jkl-012-345-...',
```

**📋 انسخ هذه النتائج!**

---

### الخطوة 2️⃣: حدّث codeTableIds.js

**افتح الملف:**
```
web-portal/src/config/codeTableIds.js
```

**ابحث عن:**
```javascript
export const CODE_TABLE_IDS = {
  CURRENCY: '0e351629-526f-44d6-8912-737be0466c88',
  
  INDUSTRY_TYPE: 'REPLACE_WITH_INDUSTRY_TYPE_UUID',     // 👈 
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
  BILLING_CYCLE: 'abc-123-456-...',
  COUNTRY: 'def-456-789-...',
  INDUSTRY_TYPE: 'ghi-789-012-...',
  SUBSCRIPTION_PLAN: 'jkl-012-345-...',
}
```

**💾 احفظ الملف** (Ctrl+S)

---

### الخطوة 3️⃣: فعّل الحقول في TENANT_CASCADE_FIELDS

**في نفس الملف** (`codeTableIds.js`)، ابحث عن:

```javascript
export const TENANT_CASCADE_FIELDS = [
  // ✅ Only include fields with valid UUIDs
  createCascadeField(
    'billingCurrencyId',
    'Billing Currency',
    CODE_TABLE_IDS.CURRENCY,
    true
  ),
  // ⚠️ TODO: Uncomment these after getting real UUIDs from database
  // createCascadeField(
  //   'industryTypeId',
  // ...
```

**احذف التعليقات `//`** لتصبح:

```javascript
export const TENANT_CASCADE_FIELDS = [
  createCascadeField(
    'industryTypeId',
    'Industry Type',
    CODE_TABLE_IDS.INDUSTRY_TYPE,
    false
  ),
  createCascadeField(
    'subscriptionPlanId',
    'Subscription Plan',
    CODE_TABLE_IDS.SUBSCRIPTION_PLAN,
    false
  ),
  createCascadeField(
    'billingCurrencyId',
    'Billing Currency',
    CODE_TABLE_IDS.CURRENCY,
    true
  ),
  createCascadeField(
    'billingCycleId',
    'Billing Cycle',
    CODE_TABLE_IDS.BILLING_CYCLE,
    false
  ),
  createCascadeField(
    'countryId',
    'Country',
    CODE_TABLE_IDS.COUNTRY,
    true
  ),
]
```

**💾 احفظ الملف** (Ctrl+S)

---

### الخطوة 4️⃣: فعّل SelectFields في TenantDetails.jsx

**افتح الملف:**
```
web-portal/src/modules/cms/pages/tenants/TenantDetails.jsx
```

**ابحث عن السطر 268 تقريباً:**

```javascript
{/* ⚠️ TODO: Uncomment after getting real UUIDs */}
{/* <SelectField 
  label="Industry Type" 
  ...
/> */}
<InfoField 
  label="Industry Type" 
  ...
/>
```

**استبدل كل `InfoField` بالـ `SelectField` المعلّق:**

#### Industry Type (حوالي السطر 268):
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

#### Subscription Plan (حوالي السطر 284):
```javascript
<SelectField 
  label="Subscription Plan" 
  value={tenant.subscriptionPlanName}
  editing={editing}
  onChange={(val) => setFormData({...formData, subscriptionPlanId: val})}
  editValue={formData.subscriptionPlanId}
  codeTableId={CODE_TABLE_IDS.SUBSCRIPTION_PLAN}
/>
```

#### Billing Cycle (حوالي السطر 308):
```javascript
<SelectField 
  label="Billing Cycle" 
  value={tenant.billingCycleName}
  editing={editing}
  onChange={(val) => setFormData({...formData, billingCycleId: val})}
  editValue={formData.billingCycleId}
  codeTableId={CODE_TABLE_IDS.BILLING_CYCLE}
/>
```

#### Country (حوالي السطر 323):
```javascript
<SelectField 
  label="Country" 
  value={tenant.countryName}
  editing={editing}
  onChange={(val) => setFormData({...formData, countryId: val})}
  editValue={formData.countryId}
  codeTableId={CODE_TABLE_IDS.COUNTRY}
/>
```

**💾 احفظ الملف** (Ctrl+S)

---

### الخطوة 5️⃣: اختبر!

1. **حدّث الصفحة في المتصفح:**
   ```
   Ctrl + R
   ```

2. **اذهب إلى Tenants:**
   ```
   http://localhost:5173/cms/tenants
   ```

3. **اضغط "Add New"**

4. **تحقق من جميع Dropdowns:**
   - ✅ Industry Type → يجب أن يعرض قيم
   - ✅ Subscription Plan → يجب أن يعرض قيم
   - ✅ Billing Currency → يجب أن يعرض قيم
   - ✅ Billing Cycle → يجب أن يعرض قيم
   - ✅ Country → يجب أن يعرض قيم

5. **افتح Console (F12):**
   ```
   🔍 Fetching options for industryTypeId...
   ✅ Received X options for industryTypeId
   🔍 Fetching options for subscriptionPlanId...
   ✅ Received X options for subscriptionPlanId
   ... إلخ
   ```

---

## ⚠️ إذا لم تظهر قيم في dropdown معين:

### السبب المحتمل: لا توجد بيانات في الجدول

**تحقق من القيم:**
```sql
-- مثال: تحقق من Industry Type
SELECT 
    ctv.code,
    ctv.name
FROM code_table_values ctv
WHERE ctv.code_table_id = 'REPLACE_WITH_INDUSTRY_TYPE_UUID'
AND ctv.is_active = true 
AND ctv.is_deleted = false
ORDER BY ctv.sort_order;
```

**إذا كان فارغاً، أضف قيم تجريبية:**
```sql
-- مثال: إضافة Industry Types
INSERT INTO code_table_values (
    code_table_value_id, 
    code_table_id, 
    code, 
    name, 
    sort_order, 
    is_active, 
    is_deleted
) VALUES 
    (gen_random_uuid(), 'YOUR_INDUSTRY_TYPE_UUID', 'TECH', 'Technology', 1, true, false),
    (gen_random_uuid(), 'YOUR_INDUSTRY_TYPE_UUID', 'HEALTH', 'Healthcare', 2, true, false),
    (gen_random_uuid(), 'YOUR_INDUSTRY_TYPE_UUID', 'EDU', 'Education', 3, true, false),
    (gen_random_uuid(), 'YOUR_INDUSTRY_TYPE_UUID', 'FIN', 'Finance', 4, true, false);
```

---

## 🎯 ملخص الخطوات:

```
1. نفّذ SQL → احصل على UUIDs
2. افتح codeTableIds.js → استبدل القيم
3. في نفس الملف → احذف التعليقات من TENANT_CASCADE_FIELDS
4. افتح TenantDetails.jsx → استبدل InfoField بـ SelectField
5. حدّث المتصفح → اختبر!
```

---

## ✅ النتيجة النهائية:

بعد التفعيل، في modal "Add New Tenant" سترى:

```
Tenant Name:       [________________]
Email:             [________________]
Industry Type:     [▼ Select...     ] ← قائمة كاملة
Subscription Plan: [▼ Select...     ] ← قائمة كاملة
Billing Currency:  [▼ Dollar        ] ← يشتغل أصلاً ✅
Billing Cycle:     [▼ Select...     ] ← قائمة كاملة
Country:           [▼ Select...     ] ← قائمة كاملة
Focal Point Name:  [________________]
... إلخ
```

**🎉 جميع Dropdowns ستشتغل ديناميكياً من قاعدة البيانات!**

---

## 💡 نصائح:

1. **ابدأ بـ SQL أولاً** - تأكد أن عندك UUIDs قبل أي شيء
2. **استبدل في codeTableIds.js** - مرة واحدة فقط
3. **احذف التعليقات** - في الملفين
4. **حدّث المتصفح** - دائماً بعد تعديل الكود
5. **شوف Console** - للتأكد من عدم وجود أخطاء

---

**🚀 ابدأ الآن! الوقت المتوقع: 5 دقائق فقط!**

