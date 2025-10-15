# 🚀 Quick Start - ابدأ الآن!

## ✨ في دقيقتين فقط!

---

## 1️⃣ استخدم المكونات الجاهزة

### نسخ والصق:

```jsx
import { 
  PageContainer, 
  PageHeader, 
  PageCard,
  ActionButton 
} from '@/components/PageHeader'
import DataTable from '@/packages/datatable/DataTable'

export default function MyPage() {
  return (
    <PageContainer>
      <PageHeader
        title="صفحتي"
        description="وصف قصير للصفحة"
        badge="CMS"
        actions={
          <ActionButton variant="primary">
            إضافة جديد
          </ActionButton>
        }
      />
      
      <PageCard>
        <DataTable
          columns={columns}
          resourceBase="/api/my-data"
          service="access"
        />
      </PageCard>
    </PageContainer>
  )
}
```

---

## 2️⃣ الأزرار

```jsx
// زر رئيسي (Primary)
<ActionButton variant="primary">حفظ</ActionButton>

// زر ثانوي (Secondary)
<ActionButton variant="secondary">تعديل</ActionButton>

// زر حذف (Destructive)
<ActionButton variant="destructive">حذف</ActionButton>

// زر عادي (Outline)
<ActionButton variant="outline">تصدير</ActionButton>
```

---

## 3️⃣ حالات فارغة

```jsx
import { EmptyState } from '@/components/PageHeader'

<EmptyState
  title="لا يوجد بيانات"
  description="ابدأ بإضافة أول عنصر"
  action={() => create()}
  actionLabel="إضافة"
/>
```

---

## 4️⃣ حالة التحميل

```jsx
import { LoadingState } from '@/components/PageHeader'

{isLoading ? <LoadingState /> : <Content />}
```

---

## 5️⃣ Badge للحالات

```jsx
import { StatusBadge } from '@/components/PageHeader'

<StatusBadge status="success" label="نشط" />
<StatusBadge status="warning" label="معلق" />
<StatusBadge status="error" label="خطأ" />
```

---

## 📁 ملفات مهمة

| ملف | وصف |
|-----|-----|
| `PageHeader.jsx` | المكونات الأساسية |
| `DataTable.jsx` | الجدول الجديد |
| `index.css` | الألوان |
| `CMS_DESIGN_SYSTEM.md` | الدليل الكامل |

---

## ✅ That's it!

**3 خطوات فقط:**
1. ✅ نسخ Template
2. ✅ تعديل البيانات
3. ✅ جاهز! 🎉

---

**للتفاصيل:** `CMS_DESIGN_SYSTEM.md`

