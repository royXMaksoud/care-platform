// Small helper to open a print-friendly window
function escapeHtml(s) {
  return String(s ?? '').replace(/[&<>"']/g, m => ({
    '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
  }[m]));
}
function fmt(v) {
  if (v === null || v === undefined) return '';
  if (v === true) return 'True';
  if (v === false) return 'False';
  if (v instanceof Date) return v.toLocaleString();
  return Array.isArray(v) ? v.join(', ') : String(v);
}

export function printTable(columns, rows, title='Table') {
  const ths = columns
    .map(c => `<th style="text-align:left;padding:8px;border:1px solid #ddd;background:#f7f7f7">${escapeHtml(c.header)}</th>`)
    .join('');
  const trs = rows
    .map(r => `<tr>${
      columns.map(c => `<td style="padding:8px;border:1px solid #ddd">${escapeHtml(fmt(r?.[c.key]))}</td>`).join('')
    }</tr>`).join('');

  const html = `<!doctype html>
  <html><head><meta charset="utf-8"/>
  <title>${escapeHtml(title)}</title>
  <style>
    body{font:12px system-ui;margin:20px}
    table{border-collapse:collapse;width:100%}
    h3{margin:0 0 12px}
  </style>
  </head><body>
    <h3>${escapeHtml(title)}</h3>
    <table><thead><tr>${ths}</tr></thead><tbody>${trs}</tbody></table>
  </body></html>`;

  const w = window.open('', '_blank');
  w.document.write(html);
  w.document.close();
  w.focus();
  w.print();
  w.close();
}
