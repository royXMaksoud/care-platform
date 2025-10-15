# 📚 دليل النظام الشامل - Service Guide

## نظرة عامة على المشروع

هذا مشروع متعدد الخدمات (Microservices) يتكون من:
- **auth-service** (Spring Boot) - خدمة المصادقة والصلاحيات
- **access-management** (Spring Boot) - إدارة الوصول والأنظمة
- **gateway-service** (Spring Boot Cloud Gateway) - بوابة API
- **web-portal** (React + Vite) - الواجهة الأمامية

---

## 🔧 الخدمات والمنافذ

### 1. auth-service
- **المنفذ**: `8081`
- **الوظيفة**: المصادقة، تسجيل الدخول، إدارة المستخدمين، الصلاحيات
- **قاعدة البيانات**: PostgreSQL
- **المجلد**: `auth-service/auth-service/`

**API Endpoints المهمة:**
```
POST   /auth/login                    # تسجيل الدخول
POST   /auth/register                 # تسجيل مستخدم جديد
GET    /auth/me                       # بيانات المستخدم الحالي
GET    /auth/me/permissions           # صلاحيات المستخدم (جديد - نظام v2)
GET    /api/users                     # قائمة المستخدمين
POST   /api/users                     # إنشاء مستخدم
PUT    /api/users/{id}                # تحديث مستخدم
DELETE /api/users/{id}                # حذف مستخدم
```

**تشغيل الخدمة:**
```bash
cd C:\Java\care\Code\auth-service\auth-service
mvn clean install
mvn spring-boot:run
```

---

### 2. access-management
- **المنفذ**: `8082`
- **الوظيفة**: إدارة الأنظمة، الأقسام، الإجراءات، الصلاحيات
- **قاعدة البيانات**: PostgreSQL
- **المجلد**: `access-management-system/access-management-service/accessmanagement/`

**API Endpoints المهمة:**
```
# الأنظمة
GET    /api/systems                   # قائمة الأنظمة
POST   /api/systems                   # إنشاء نظام
PUT    /api/systems/{id}              # تحديث نظام
DELETE /api/systems/{id}              # حذف نظام

# الأقسام
GET    /api/system-sections           # قائمة الأقسام
POST   /api/system-sections           # إنشاء قسم
PUT    /api/system-sections/{id}      # تحديث قسم

# الإجراءات
GET    /api/system-section-actions    # قائمة الإجراءات
POST   /api/system-section-actions    # إنشاء إجراء
PUT    /api/system-section-actions/{id}  # تحديث إجراء

# الصلاحيات
GET    /api/user-permissions          # صلاحيات المستخدمين
POST   /api/user-permissions/bulk     # حفظ صلاحيات متعددة
GET    /api/systems/{systemId}/tree?userId={userId}&tenantId={tenantId}  # شجرة النظام مع الصلاحيات

# Code Tables
GET    /api/code-tables               # جداول الأكواد
POST   /api/code-tables               # إنشاء جدول
```

**تشغيل الخدمة:**
```bash
cd C:\Java\care\Code\access-management-system\access-management-service\accessmanagement
mvn clean install
mvn spring-boot:run
```

---

### 3. gateway-service
- **المنفذ**: `8080`
- **الوظيفة**: بوابة موحدة لجميع الخدمات، توجيه الطلبات
- **المجلد**: `gateway-service/`

**Routes:**
```yaml
/auth/**     -> auth-service:8081
/access/**   -> access-management:8082
```

**تشغيل الخدمة:**
```bash
cd C:\Java\care\Code\gateway-service
mvn clean install
mvn spring-boot:run
```

---

### 4. web-portal (React)
- **المنفذ**: `5173` (dev)
- **الوظيفة**: الواجهة الأمامية الرئيسية
- **التقنيات**: React 18, Vite, TailwindCSS, TanStack Query, i18next
- **المجلد**: `web-portal/`

**تشغيل الخدمة:**
```bash
cd C:\Java\care\Code\web-portal
npm install
npm run dev
```

---

## 🌍 نظام الترجمة (i18n)

### اللغات المدعومة:
- 🇬🇧 English
- 🇸🇦 العربية (مع دعم RTL)
- 🇫🇷 Français
- 🇩🇪 Deutsch

### ملفات الترجمة:
```
web-portal/src/locales/
├── en/translation.json
├── ar/translation.json
├── fr/translation.json
└── de/translation.json
```

### الاستخدام في الكود:
```jsx
import { useTranslation } from 'react-i18next'

function MyComponent() {
  const { t } = useTranslation()
  return <h1>{t('cms.title')}</h1>
}
```

### تغيير اللغة:
- من الواجهة: أيقونة 🌍 في شريط التنقل
- يتم الحفظ تلقائياً في localStorage
- يدعم RTL تلقائياً للعربية

---

## 🎨 نظام المظهر والخطوط

### أحجام الخطوط المتاحة:
1. **Small** - صغير
2. **Medium** - متوسط
3. **Large** - كبير (افتراضي)
4. **Extra Large** - كبير جداً

### الألوان المتاحة:
1. **Default** - أزرق بنفسجي
2. **Ocean Blue** - أزرق هادئ
3. **Forest Green** - أخضر طبيعي
4. **Royal Purple** - بنفسجي ملكي
5. **Sunset Orange** - برتقالي دافئ

### الاستخدام في الكود:
```jsx
import { useAppearance } from '@/contexts/AppearanceContext'

function MyComponent() {
  const { fontClasses, theme } = useAppearance()
  
  return (
    <div>
      <h1 className={fontClasses['3xl']}>عنوان</h1>
      <p className={fontClasses.base}>نص عادي</p>
      <table>
        <th className={fontClasses.tableHeader}>عنوان جدول</th>
        <td className={fontClasses.table}>محتوى جدول</td>
      </table>
    </div>
  )
}
```

### تغيير المظهر:
- من الواجهة: أيقونة ⚙️ **Appearance** في شريط التنقل
- يحفظ تلقائياً ويطبق على جميع الصفحات

---

## 🔐 نظام الصلاحيات (Permissions System v2)

### البنية:
```
System (نظام)
  └── Section (قسم)
       └── Action (إجراء)
            └── Scopes (نطاقات - اختياري)
```

### أنواع الصلاحيات:
- **ALLOW** - مسموح
- **DENY** - ممنوع
- **NONE** - لا يوجد صلاحية

### الصلاحيات على مستويين:
1. **Action-level** - صلاحية على الإجراء بدون نطاقات
2. **Scope-level** - صلاحية على نطاقات محددة (مثل: فرع معين، منطقة معينة)

### قاعدة البيانات:
```sql
-- الجداول الرئيسية
- systems                          # الأنظمة
- system_sections                  # الأقسام
- system_section_actions           # الإجراءات
- action_scope_hierarchy           # هيكلية النطاقات
- user_action_permissions          # صلاحيات المستخدمين (parent)
- user_action_permission_nodes     # نطاقات الصلاحيات (child)

-- View مهم
- v_user_permissions_v2            # عرض يجمع كل الصلاحيات
```

### التحقق من الصلاحيات في Frontend:
```jsx
import { usePermissionCheck } from '@/contexts/PermissionsContext'

function MyComponent() {
  const { getSectionPermissions } = usePermissionCheck()
  
  const permissions = getSectionPermissions('Systems', 'CMS')
  
  if (permissions.canCreate) {
    // يمكن الإنشاء
  }
  if (permissions.canUpdate) {
    // يمكن التعديل
  }
  if (permissions.canDelete) {
    // يمكن الحذف
  }
  if (permissions.canList) {
    // يمكن عرض القائمة
  }
}
```

---

## 📊 الجداول (DataTable)

### الميزات:
- ✅ بحث client-side (يبحث في البيانات المعروضة)
- ✅ pagination (server-side أو client-side)
- ✅ تحكم في عدد الصفوف (10, 25, 50, 100, 500, 1000, 5000)
- ✅ Export إلى Excel
- ✅ طباعة
- ✅ Pivot table
- ✅ تحديث تلقائي
- ✅ دعم كامل لأحجام الخطوط الديناميكية

### الاستخدام:
```jsx
import DataTable from '@/packages/datatable/DataTable'

function MyList() {
  const columns = [
    { id: 'name', accessorKey: 'name', header: 'Name' },
    { id: 'email', accessorKey: 'email', header: 'Email' }
  ]
  
  return (
    <DataTable
      columns={columns}
      service="access"
      resourceBase="/api/systems"
      pageSize={10}
      title="Systems"
    />
  )
}
```

---

## 🗂️ هيكل المشروع

### Backend (Spring Boot):
```
src/
├── main/
│   ├── java/
│   │   └── com/[package]/
│   │       ├── application/       # Use Cases & Services
│   │       ├── domain/           # Entities & Ports
│   │       ├── infrastructure/   # DB Adapters & Repositories
│   │       └── web/             # Controllers & DTOs
│   └── resources/
│       ├── application.yml       # الإعدادات
│       └── db/migration/        # Flyway migrations
```

### Frontend (React):
```
src/
├── api/                  # API calls
├── auth/                 # Authentication
├── components/           # Shared components
├── contexts/            # React contexts
├── features/            # Features (CRUD, etc.)
├── i18n/               # i18n configuration
├── layout/             # Layout components
├── locales/            # Translation files
├── modules/            # CMS modules
├── packages/           # Reusable packages (datatable, pivot)
├── pages/              # Pages
└── utils/              # Utilities
```

---

## 🔑 المتغيرات المهمة

### Backend (application.yml):
```yaml
server:
  port: 8081  # auth-service

spring:
  datasource:
    url: jdbc:postgresql://localhost:5432/auth_db
    username: postgres
    password: your_password
    
  jpa:
    hibernate:
      ddl-auto: validate  # مهم: استخدم Flyway للـ migrations
    show-sql: true
```

### Frontend (.env):
```bash
# لا يوجد .env حالياً، الإعدادات في:
# src/config/services.ts
```

**في `src/config/services.ts`:**
```typescript
export const SERVICES = {
  AUTH: 'http://localhost:8080/auth',
  ACCESS: 'http://localhost:8080/access'
}
```

---

## 🚀 تشغيل المشروع كاملاً

### 1. تشغيل قاعدة البيانات:
```bash
# تأكد من تشغيل PostgreSQL
# يجب أن يكون لديك قاعدتي بيانات:
# - auth_db (للـ auth-service)
# - access_db (للـ access-management)
```

### 2. تشغيل الخدمات الخلفية:
```powershell
# Terminal 1 - Auth Service
cd C:\Java\care\Code\auth-service\auth-service
mvn spring-boot:run

# Terminal 2 - Access Management
cd C:\Java\care\Code\access-management-system\access-management-service\accessmanagement
mvn spring-boot:run

# Terminal 3 - Gateway
cd C:\Java\care\Code\gateway-service
mvn spring-boot:run
```

### 3. تشغيل الواجهة الأمامية:
```powershell
cd C:\Java\care\Code\web-portal
npm run dev
```

### 4. الوصول للنظام:
- الواجهة: http://localhost:5173
- Gateway: http://localhost:8080
- Auth Service: http://localhost:8081
- Access Management: http://localhost:8082

---

## 🐛 حل المشاكل الشائعة

### المشكلة: Port already in use
```powershell
# إيقاف العمليات على المنفذ
Get-Process -Id (Get-NetTCPConnection -LocalPort 8081).OwningProcess | Stop-Process -Force
```

### المشكلة: Database connection failed
- تأكد من تشغيل PostgreSQL
- تحقق من اسم المستخدم وكلمة المرور في `application.yml`
- تأكد من وجود قاعدة البيانات

### المشكلة: CORS errors في Frontend
- تأكد من تشغيل Gateway على المنفذ 8080
- Frontend يتواصل مع Gateway وليس الخدمات مباشرة

### المشكلة: الترجمة لا تعمل
- تأكد من وجود ملفات الترجمة في `src/locales/`
- تحقق من `localStorage` في المتصفح
- امسح cache المتصفح

---

## 📝 ملاحظات مهمة

### للمطورين:
1. **استخدم Flyway** للـ database migrations - لا تعدل `ddl-auto`
2. **استخدم `fontClasses`** من `useAppearance` - لا تستخدم أحجام ثابتة
3. **استخدم `t()`** من `useTranslation` - لا تضع نصوص ثابتة
4. **اتبع Clean Architecture** في Backend
5. **استخدم React Query** للـ API calls

### الأمان:
- JWT token يخزن في localStorage
- يتم إرساله في header: `Authorization: Bearer {token}`
- Gateway يتحقق من الـ token قبل توجيه الطلبات

### الأداء:
- React Query تخزن البيانات (caching)
- Server-side pagination للجداول الكبيرة
- Lazy loading للمكونات

---

## 📚 التقنيات المستخدمة

### Backend:
- **Spring Boot 3.2.5**
- **Spring Cloud Gateway**
- **PostgreSQL**
- **Flyway** (Database Migrations)
- **MapStruct** (Object Mapping)
- **Lombok** (Boilerplate Reduction)
- **JWT** (Authentication)

### Frontend:
- **React 18**
- **Vite** (Build Tool)
- **TailwindCSS** (Styling)
- **TanStack Query** (Server State)
- **TanStack Table** (Tables)
- **i18next** (Internationalization)
- **React Router** (Routing)
- **Axios** (HTTP Client)
- **Lucide React** (Icons)

---

## 🎯 الصفحات الرئيسية

### Portal:
- `/` - Home (قائمة الأنظمة المتاحة)
- `/auth/login` - تسجيل الدخول

### CMS:
- `/cms` - CMS Dashboard
- `/cms/systems` - إدارة الأنظمة
- `/cms/sections` - إدارة الأقسام
- `/cms/actions` - إدارة الإجراءات
- `/cms/users` - إدارة المستخدمين
- `/cms/users/{id}` - تفاصيل المستخدم
- `/cms/tenants` - إدارة المستأجرين
- `/cms/subscriptions` - إدارة الاشتراكات
- `/cms/codeTable` - إدارة جداول الأكواد

---

## 📞 للمساعدة

- راجع هذا الملف عند الحاجة لفهم بنية النظام
- تحقق من console.log في المتصفح للأخطاء
- راجع logs الخدمات الخلفية في Terminal

---

**تاريخ آخر تحديث**: 2025  
**الإصدار**: 2.0.0  
**الحالة**: Production Ready ✅

