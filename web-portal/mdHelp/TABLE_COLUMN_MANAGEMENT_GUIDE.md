# Table Column Management Guide

## Overview

This guide explains how to use the new **Column Management** features in DataTables, including:
- ✅ **Column Reordering**: Drag and drop columns to reorder them
- ✅ **Column Visibility**: Show/hide columns as needed
- ✅ **Persistent Preferences**: All settings are saved in browser localStorage per table

## Features

### 1. Column Reordering (Drag & Drop)

You can reorder columns in two ways:

#### Method A: Drag Table Headers Directly
- Hover over any column header in the table
- Click and hold on the header (you'll see a drag handle icon)
- Drag the column to a new position
- Drop it where you want it
- The new order is saved automatically

#### Method B: Use the Column Controls Dropdown
- Click the **"Columns"** button in the table toolbar
- In the dropdown menu, grab any column by the drag handle icon (☰)
- Drag and drop to reorder
- Changes are saved automatically

### 2. Column Visibility

**Show/Hide Columns:**
- Click the **"Columns"** button in the table toolbar
- Check/uncheck columns to show/hide them
- The number badge shows how many columns are visible
- Settings are saved automatically

**Quick Actions:**
- **Show All**: Click to make all columns visible
- **Reset to Default**: Restores original column order and visibility

### 3. Persistent Storage

All column preferences are stored in browser localStorage with a unique key per table:
- Preferences are remembered across browser sessions
- Each table has its own independent settings
- Settings include: column order, column visibility, and last update timestamp

## Implementation Guide

### For New Pages

To enable column management for a new table, simply add the `tableId` prop to your `CrudPage` component:

```jsx
<CrudPage
  title="My Table"
  service="myservice"
  resourceBase="/api/v1/myresource"
  idKey="myId"
  columns={myColumns}
  tableId="my-table-unique-id" // ✅ Add this!
  // ... other props
/>
```

**Important:** Each table must have a unique `tableId` to prevent conflicts.

### Examples

#### Tenants Table
```jsx
<CrudPage
  title="Tenants"
  tableId="tenants-list"
  // ... other props
/>
```

#### Systems Table
```jsx
<CrudPage
  title="Systems"
  tableId="systems-list"
  // ... other props
/>
```

### Naming Convention

Use descriptive, kebab-case IDs:
- ✅ `tenants-list`
- ✅ `users-management`
- ✅ `code-tables-gender`
- ❌ `table1` (not descriptive)
- ❌ `TenantsTable` (use kebab-case)

## Technical Details

### Files Modified

1. **`src/hooks/useTablePreferences.js`** (NEW)
   - Custom React hook for managing table preferences
   - Handles localStorage persistence
   - Provides methods for reordering and visibility

2. **`src/packages/datatable/DataTable.jsx`** (UPDATED)
   - Added column reordering via drag & drop
   - Added column visibility controls UI
   - Integrated useTablePreferences hook
   - New prop: `tableId` (optional)

3. **`src/features/crud/CrudPage.jsx`** (UPDATED)
   - Passes `tableId` prop to DataTable
   - New prop: `tableId` (optional)

4. **Example Pages Updated:**
   - `src/modules/cms/pages/tenants/TenantList.jsx`
   - `src/modules/cms/pages/systems/SystemList.jsx`

### Storage Format

Preferences are stored in localStorage with this structure:

```javascript
{
  "columnOrder": ["name", "email", "status", "createdAt"],
  "columnVisibility": {
    "name": true,
    "email": true,
    "status": false,
    "createdAt": true
  },
  "updatedAt": "2025-10-10T12:00:00.000Z"
}
```

Storage key format: `table-prefs-{tableId}`

Example: `table-prefs-tenants-list`

### API

#### useTablePreferences Hook

```javascript
const {
  columnOrder,           // Array of column IDs in current order
  columnVisibility,      // Object mapping column ID to visibility (boolean)
  reorderColumn,         // Function(fromIndex, toIndex) to reorder
  toggleColumnVisibility, // Function(columnId) to toggle visibility
  showAllColumns,        // Function() to show all columns
  hideAllColumns,        // Function() to hide all columns
  resetPreferences,      // Function() to reset to defaults
  getOrderedColumns,     // Function() to get ordered column definitions
  setColumnOrder,        // Function(order) to set column order
  setColumnVisibility    // Function(visibility) to set visibility
} = useTablePreferences(tableId, columns)
```

## User Experience

### Visual Indicators

1. **Drag Handle Icon**: Shows on column headers when hovering (☰)
2. **Drop Target**: Blue border appears when dragging over a valid drop zone
3. **Column Count Badge**: Shows number of visible columns on the "Columns" button
4. **Cursor Changes**: 
   - `cursor-move` when hovering over draggable headers
   - Visual feedback during drag operations

### Browser Compatibility

Uses HTML5 Drag and Drop API - compatible with all modern browsers:
- ✅ Chrome/Edge 90+
- ✅ Firefox 88+
- ✅ Safari 14+

### Performance

- Minimal overhead: Only stores preferences when changes occur
- Efficient: Uses React hooks and memoization
- No external dependencies: Native HTML5 drag and drop

## Troubleshooting

### Preferences Not Saving?

1. Check that `tableId` prop is provided
2. Verify localStorage is enabled in browser
3. Check browser console for errors
4. Try clearing preferences and refreshing

### Columns Not Reordering?

1. Ensure you're dragging from the header area
2. Check that `tableId` is set (required for drag & drop)
3. The `rowActions` column cannot be reordered (by design)

### Reset Not Working?

Click "Reset to Default" and confirm the dialog. This will:
- Restore original column order
- Show all columns
- Remove saved preferences from localStorage

## Future Enhancements

Potential features for future versions:
- [ ] Column width adjustment
- [ ] Column pinning (freeze left/right)
- [ ] Export/import column preferences
- [ ] Share column preferences across users
- [ ] Column grouping

## Support

For questions or issues, please contact the development team or create an issue in the project repository.

---

**Last Updated:** October 10, 2025  
**Version:** 1.0.0

