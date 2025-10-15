// src/packages/export/xlsx.js
import * as XLSX from 'xlsx'


export function exportXlsx(columns, rows, filename='export.xlsx') {
  const headers = columns.map(c => c.header);
  const keys = columns.map(c => c.key);
  const data = rows.map(r => keys.map(k => r?.[k]));
  const ws = XLSX.utils.aoa_to_sheet([headers, ...data]);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
  XLSX.writeFile(wb, filename);
}
