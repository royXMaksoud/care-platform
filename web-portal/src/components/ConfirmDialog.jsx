import React from 'react'

export default function ConfirmDialog({
  open,
  title = 'Confirm',
  message,
  onCancel,
  onConfirm,
  busy = false,
}) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-lg shadow-lg w-[420px] p-5">
        <div className="text-lg font-semibold mb-2">{title}</div>
        <div className="text-sm text-gray-700 mb-5">{message}</div>
        <div className="flex justify-end gap-2">
          <button type="button" className="border rounded px-3 py-1" onClick={onCancel} disabled={busy}>
            Cancel
          </button>
          <button
            type="button"
            className="border rounded px-3 py-1 bg-red-600 text-white disabled:opacity-60"
            onClick={onConfirm}
            disabled={busy}
          >
            {busy ? 'Deleting…' : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  )
}
