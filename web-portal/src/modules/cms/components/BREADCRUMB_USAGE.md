# استخدام CMS Breadcrumb

## كيفية إضافة Breadcrumb إلى صفحة CMS

### 1. للصفحات الرئيسية (List Pages):

```jsx
import CMSBreadcrumb from '../../components/CMSBreadcrumb'
import { useTranslation } from 'react-i18next'

export default function MyListPage() {
  const { t } = useTranslation()
  
  return (
    <div>
      <div className="mb-4">
        <CMSBreadcrumb />
      </div>
      {/* باقي المحتوى */}
    </div>
  )
}
```

### 2. للصفحات التفصيلية (Detail Pages):

```jsx
import CMSBreadcrumb from '../../components/CMSBreadcrumb'
import { useTranslation } from 'react-i18next'

export default function MyDetailPage() {
  const { t } = useTranslation()
  const { id } = useParams()
  const [item, setItem] = useState(null)
  
  return (
    <div>
      <div className="mb-4">
        <CMSBreadcrumb currentPageLabel={item?.name || t('cms.myItem')} />
      </div>
      {/* باقي المحتوى */}
    </div>
  )
}
```

## أمثلة على المسارات:

- `/cms` - لا يظهر breadcrumb (Home فقط)
- `/cms/systems` - Home > Content Management > Systems
- `/cms/organizations` - Home > Content Management > Organizations
- `/cms/organizations/123` - Home > Content Management > Organizations > [اسم المنظمة]
- `/cms/organization-branches` - Home > Content Management > Organization Branches

## المميزات:

- ✅ يعمل تلقائياً مع الترجمات
- ✅ الروابط قابلة للنقر للعودة للصفحات السابقة
- ✅ يدعم الصفحات التفصيلية مع custom labels
- ✅ لا يظهر في صفحة Home الخاصة بـ CMS

