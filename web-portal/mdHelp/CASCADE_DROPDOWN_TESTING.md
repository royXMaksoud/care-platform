# 🧪 اختبار Cascade Dropdowns

## ✅ التعديلات المنجزة

### تم إصلاح المشكلة!
**CrudFormModal** الآن يدعم جلب options من API تلقائياً عند فتح الـ modal.

**التغييرات:**
1. ✅ إضافة `import { api } from '@/lib/axios'`
2. ✅ إضافة state للـ options: `selectOptions` و `loadingFields`
3. ✅ إضافة `useEffect` لجلب options من API
4. ✅ دعم `email` و `date` field types
5. ✅ عرض "Loading..." أثناء جلب البيانات

---

## 📋 خطوات الاختبار

### الخطوة 1: تأكد من تشغيل Backend

```bash
# في terminal
cd C:\Java\care\Code\access-management-system\access-management-service\accessmanagement
mvn spring-boot:run
```

انتظر حتى ترى:
```
Started AccessmanagementApplication in X seconds
```

---

### الخطوة 2: تأكد من تشغيل Frontend

```bash
# في terminal آخر
cd C:\Java\care\Code\web-portal
npm run dev
```

افتح المتصفح: http://localhost:5173

---

### الخطوة 3: اختبر الـ Dropdown

1. **اذهب إلى Tenants:**
   - انقر على القائمة → CMS → Tenants
   - أو اذهب مباشرة: http://localhost:5173/cms/tenants

2. **افتح نموذج إضافة tenant:**
   - انقر على زر **"Add New"** (أزرق في الأعلى)

3. **تحقق من dropdown "Billing Currency":**
   - ✅ يجب أن ترى "Loading..." أول شيء
   - ✅ ثم يجب أن تظهر قائمة بالعملات
   - ✅ مثل: USD, EUR, إلخ...

4. **إذا لم تظهر القيم:**
   - افتح **Console** (F12)
   - ابحث عن أخطاء باللون الأحمر
   - أرسل لي screenshot من الأخطاء

---

## 🔍 التشخيص السريع

### اختبار 1: هل الـ API يعمل؟

افتح في المتصفح مباشرة:
```
http://localhost:8080/api/cascade-dropdowns/access.code-table-values-by-table?codeTableId=0e351629-526f-44d6-8912-737be0466c88
```

**النتيجة المتوقعة:**
```json
[
  {
    "id": "uuid-xxxx",
    "name": "US Dollar"
  },
  {
    "id": "uuid-yyyy",
    "name": "Euro"
  }
]
```

**إذا ظهر خطأ:**
- ❌ 404 → Backend غير شغال أو endpoint خاطئ
- ❌ 500 → مشكلة في قاعدة البيانات
- ❌ Empty array `[]` → لا توجد بيانات في الجدول

---

### اختبار 2: فحص قاعدة البيانات

```sql
-- تحقق من وجود Code Table للعملات
SELECT * FROM code_tables 
WHERE code_table_id = '0e351629-526f-44d6-8912-737be0466c88';

-- تحقق من وجود قيم
SELECT * FROM code_table_values 
WHERE code_table_id = '0e351629-526f-44d6-8912-737be0466c88'
AND is_active = true 
AND is_deleted = false;

-- تحقق من الترجمات
SELECT 
    ctv.code,
    ctv.name as english_name,
    ctvl.language,
    ctvl.name as translated_name
FROM code_table_values ctv
LEFT JOIN code_table_value_languages ctvl 
    ON ctv.code_table_value_id = ctvl.code_table_value_id
WHERE ctv.code_table_id = '0e351629-526f-44d6-8912-737be0466c88'
ORDER BY ctv.sort_order, ctvl.language;
```

---

### اختبار 3: فحص الـ Network في المتصفح

1. افتح **Developer Tools** (F12)
2. اذهب إلى تبويب **Network**
3. افتح modal "Add New"
4. ابحث عن طلب:
   - URL: `cascade-dropdowns/access.code-table-values-by-table`
   - Method: `GET`
   - Status: يجب أن يكون **200**

**انظر إلى:**
- ✅ Request URL - هل صحيح؟
- ✅ Response - هل يحتوي على بيانات؟
- ❌ إذا كان Status = 404 → Backend غير شغال
- ❌ إذا كان Status = 500 → خطأ في Server

---

## 🐛 الأخطاء الشائعة والحلول

### المشكلة 1: Dropdown فارغ دائماً

**الأسباب المحتملة:**
1. ❌ Backend غير شغال
2. ❌ لا توجد بيانات في قاعدة البيانات
3. ❌ codeTableId خاطئ
4. ❌ CORS issue

**الحل:**
```bash
# 1. تحقق من Backend
# في terminal backend، شوف آخر سطر:
# يجب أن يكون: "Started AccessmanagementApplication"

# 2. اختبر الـ API يدوياً
# افتح في المتصفح:
http://localhost:8080/api/cascade-dropdowns/access.code-table-values-by-table?codeTableId=0e351629-526f-44d6-8912-737be0466c88
```

---

### المشكلة 2: Loading... ما بتروح

**السبب:** الطلب عالق أو فشل

**الحل:**
1. افتح Console (F12)
2. شوف الـ error message
3. تحقق من Network tab - هل الطلب completed؟

---

### المشكلة 3: Error in Console

**أمثلة على الأخطاء:**

#### `Failed to fetch options for billingCurrencyId`
```javascript
// السبب: مشكلة في الـ API call
// الحل: تحقق من:
// 1. Backend شغال؟
// 2. URL صحيح؟
// 3. codeTableId موجود؟
```

#### `Network Error / ERR_CONNECTION_REFUSED`
```javascript
// السبب: Backend غير شغال
// الحل: شغل Backend:
mvn spring-boot:run
```

#### `404 Not Found`
```javascript
// السبب: endpoint غير موجود
// الحل: تأكد من:
// 1. Backend compiled بدون أخطاء
// 2. CascadeDropdownController موجود
```

---

## 📸 Screenshots المطلوبة للتشخيص

إذا ما اشتغل، أرسل لي screenshots لـ:

1. **Console Tab** (F12)
   - أي أخطاء باللون الأحمر

2. **Network Tab** (F12)
   - الطلب cascade-dropdowns
   - Response tab

3. **Backend Terminal**
   - آخر 20 سطر

4. **Frontend في المتصفح**
   - الـ dropdown المفتوح

---

## ✅ إذا اشتغل صح

يجب أن ترى:

### في الـ modal "Add New Tenant":
```
Tenant Name: [_____________]
Email:       [_____________]
Industry Type: [▼ Select...]  ← هذا يجب أن يكون فيه options
Subscription Plan: [▼ Select...]
Billing Currency: [▼ US Dollar ▼]  ← **هذا الأهم! يجب أن يشتغل**
Billing Cycle: [▼ Select...]
Country: [▼ Select...]
```

### في Console (F12):
```
✅ لا توجد أخطاء باللون الأحمر
✅ قد ترى: "Loading tenant form..."
```

### في Network Tab:
```
✅ GET cascade-dropdowns/... → Status: 200
✅ Response: [{"id":"...","name":"US Dollar"}, ...]
```

---

## 🎯 الخطوة التالية

بعد ما تتأكد أن **billingCurrency** يشتغل:

1. احصل على باقي الـ UUIDs من قاعدة البيانات:
   ```sql
   SELECT code, code_table_id 
   FROM code_tables
   WHERE code IN ('INDUSTRY_TYPE', 'SUBSCRIPTION_PLAN', 'BILLING_CYCLE', 'COUNTRY');
   ```

2. حدّث الملف:
   ```javascript
   // web-portal/src/config/codeTableIds.js
   export const CODE_TABLE_IDS = {
     CURRENCY: '0e351629-526f-44d6-8912-737be0466c88',
     INDUSTRY_TYPE: 'xxx-xxx-xxx-xxx',  // 👈 استبدل هنا
     // ... إلخ
   }
   ```

3. اختبر كل الـ dropdowns واحد واحد

---

## 💡 نصائح

1. **Backend يجب أن يكون شغال دائماً** عند اختبار Frontend
2. استخدم **F12** دائماً لفحص الأخطاء
3. لا تنسى **تحديث الصفحة** (Ctrl+R) بعد التعديلات
4. إذا غيرت Java code، لازم تعمل **mvn clean compile** وتعيد تشغيل

---

**جرّب الآن وأخبرني بالنتيجة!** 🚀

