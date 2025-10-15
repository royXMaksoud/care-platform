# DataTable Edit/Delete Buttons Fix

## المشكلة
عند الضغط على سطر في DataTable، لا تظهر أزرار Edit و Delete.

## السبب

### 1. المشكلة الأولى: useMemo في CrudPage
```javascript
// ❌ الخطأ - useMemo يحفظ نسخة قديمة من cell renderer
const cols = useMemo(
  () => [
    ...columns,
    {
      id: 'rowActions',
      cell: ({ row }) => {
        const isSelected = selected && selected[idKey] === row.original[idKey]
        // هنا selected هي القيمة القديمة المحفوظة في closure!
        if (!isSelected) return null
        return <div>Edit/Delete buttons</div>
      }
    }
  ],
  [columns, selected, idKey, enableEdit, enableDelete]
)
```

**المشكلة:** حتى لو كان `selected` في dependency array، `useMemo` يُنشئ cell renderer مرة واحدة ويحفظه. الـ cell renderer يحتوي على closure للقيمة القديمة من `selected`.

### 2. المشكلة الثانية: Column Visibility
```javascript
// ❌ المشكلة - rowActions كان مخفي في localStorage
columnVisibility: tablePrefs.columnVisibility
// tablePrefs.columnVisibility = { code: true, name: true, rowActions: false }
```

## الحل

### 1. إزالة useMemo من cols
```javascript
// ✅ الحل - إعادة إنشاء columns في كل render
const cols = [
  ...columns.map(col => ({
    ...col,
    enableSorting: col.enableSorting !== false,
  })),
  {
    id: 'rowActions',
    header: '',
    enableSorting: false,
    enableHiding: false,
    size: 200,
    cell: ({ row }) => {
      const r = row.original
      const isSelected = selected && selected[idKey] === r[idKey]
      if (!isSelected) return null
      
      return (
        <div className="flex items-center gap-2 justify-end">
          {enableEdit && (
            <button onClick={(e) => { e.stopPropagation(); setShowEdit(true) }}>
              Edit
            </button>
          )}
          {enableDelete && (
            <button onClick={(e) => { e.stopPropagation(); setConfirmDel(...) }}>
              Delete
            </button>
          )}
        </div>
      )
    },
  },
]
```

### 2. إجبار rowActions على الظهور
في `DataTable.jsx`:
```javascript
// ✅ إجبار rowActions يكون visible دائماً
const columnVisibility = { ...tablePrefs.columnVisibility, rowActions: true }

const table = useReactTable({
  data: filteredRows,
  columns: safeCols,
  state: { 
    pagination: { pageIndex, pageSize: pageSz }, 
    sorting,
    columnVisibility, // بدلاً من tablePrefs.columnVisibility مباشرة
  },
  // ...
})
```

## الملفات المعدلة

### 1. `web-portal/src/features/crud/CrudPage.jsx`
- ✅ تم إزالة `useMemo` من `cols`
- ✅ تم إضافة `enableHiding: false` لعمود rowActions

### 2. `web-portal/src/packages/datatable/DataTable.jsx`
- ✅ تم استخدام `columns` مباشرة بدون cache في `safeCols`
- ✅ تم إجبار `rowActions: true` في columnVisibility

## كيفية التطبيق على جداول أخرى

إذا حدثت نفس المشكلة في جداول أخرى:

1. **تأكد من عدم استخدام useMemo للأعمدة التي تحتوي على cell renderers تعتمد على state**
2. **تأكد من أن rowActions column لديه `enableHiding: false`**
3. **تأكد من إجبار rowActions على الظهور في columnVisibility**

## الاختبار

للتأكد من أن الحل يعمل:

1. افتح المتصفح على صفحة الجدول
2. اضغط F12 للـ Developer Tools
3. اضغط على أي سطر في الجدول
4. يجب أن تظهر أزرار Edit و Delete في نفس السطر
5. اضغط Edit → يجب أن يفتح نموذج التعديل
6. اضغط Delete → يجب أن يفتح تأكيد الحذف

## ملاحظات هامة

- ⚠️ **لا تستخدم useMemo للأعمدة** إذا كان cell renderer يعتمد على state متغير
- ✅ **استخدم useMemo فقط للبيانات الثابتة** أو التي لا تؤثر على rendering
- 🔍 **استخدام console.log مفيد للتشخيص** لكن تذكر إزالته في production

