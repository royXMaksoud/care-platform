import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { QrCode, Copy, Download, Mail, MessageSquare, X, Check } from 'lucide-react'
import { toast } from 'sonner'

/**
 * Modal Component for displaying appointment QR code and verification details
 * Features:
 * - Display QR code
 * - Show verification code (3-digit format)
 * - Copy appointment code to clipboard
 * - Download QR code as PNG
 * - Share via SMS or Email
 */
export default function AppointmentQRModal({ appointment, isOpen, onClose }) {
  const { t } = useTranslation()
  const [copied, setCopied] = useState(false)
  const [shareMethod, setShareMethod] = useState(null)

  if (!isOpen || !appointment) return null

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(appointment.appointmentCode)
      setCopied(true)
      toast.success(t('appointment.qr.codeCopied', { defaultValue: 'Appointment code copied!' }))
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      toast.error(t('appointment.qr.copyFailed', { defaultValue: 'Failed to copy code' }))
    }
  }

  const handleDownloadQR = () => {
    const link = document.createElement('a')
    link.href = appointment.qrCodeUrl
    link.download = `appointment-${appointment.appointmentCode}.png`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    toast.success(t('appointment.qr.downloaded', { defaultValue: 'QR code downloaded!' }))
  }

  const handleShareSMS = () => {
    const smsText = `${t('appointment.qr.smsText', {
      defaultValue: 'Your appointment code: '
    })}${appointment.appointmentCode}\n${t('appointment.qr.verificationText', {
      defaultValue: 'Verification: '
    })}${appointment.verificationCode}`
    const smsUrl = `sms:?body=${encodeURIComponent(smsText)}`
    window.location.href = smsUrl
    setShareMethod('sms')
  }

  const handleShareEmail = () => {
    const subject = t('appointment.qr.emailSubject', { defaultValue: 'Your Appointment Details' })
    const body = `${t('appointment.qr.appointmentCode', { defaultValue: 'Appointment Code: ' })}${appointment.appointmentCode}\n${t('appointment.qr.verification', { defaultValue: 'Verification Code: ' })}${appointment.verificationCode}\n\n${t('appointment.qr.date', { defaultValue: 'Date: ' })}${appointment.appointmentDate}\n${t('appointment.qr.time', { defaultValue: 'Time: ' })}${appointment.appointmentTime}`
    const mailUrl = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
    window.location.href = mailUrl
    setShareMethod('email')
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-2xl max-w-lg w-full mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
              <QrCode className="w-6 h-6 text-blue-600" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900">
              {t('appointment.qr.title', { defaultValue: 'Appointment Details' })}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6">
          {/* QR Code Section */}
          <div className="flex justify-center">
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <img
                src={appointment.qrCodeUrl}
                alt="Appointment QR Code"
                className="w-48 h-48"
              />
            </div>
          </div>

          {/* Appointment Code Section */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              {t('appointment.qr.appointmentCode', { defaultValue: 'Appointment Code' })}
            </label>
            <div className="flex items-center gap-2">
              <div className="flex-1 px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 font-mono text-center font-semibold text-gray-900">
                {appointment.appointmentCode}
              </div>
              <button
                onClick={handleCopyCode}
                className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4" />
                    {t('common.copied', { defaultValue: 'Copied!' })}
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    {t('common.copy', { defaultValue: 'Copy' })}
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Verification Code Section - Simple 3 digits */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              {t('appointment.qr.verificationCode', { defaultValue: 'Verification Code' })}
            </label>
            <div className="p-3 bg-blue-50 border-2 border-blue-300 rounded-lg">
              <p className="text-center text-2xl font-bold text-blue-600 tracking-wider">
                {appointment.verificationCode}
              </p>
              <p className="text-center text-xs text-blue-600 mt-2">
                {t('appointment.qr.verificationHint', {
                  defaultValue: 'Show this code at the reception desk'
                })}
              </p>
            </div>
          </div>

          {/* Appointment Info */}
          <div className="grid grid-cols-2 gap-4 p-3 bg-gray-50 rounded-lg">
            <div>
              <p className="text-xs text-gray-600 font-medium">
                {t('appointment.qr.date', { defaultValue: 'Date' })}
              </p>
              <p className="text-sm font-semibold text-gray-900">
                {appointment.appointmentDate}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-600 font-medium">
                {t('appointment.qr.time', { defaultValue: 'Time' })}
              </p>
              <p className="text-sm font-semibold text-gray-900">
                {appointment.appointmentTime}
              </p>
            </div>
          </div>
        </div>

        {/* Footer - Action Buttons */}
        <div className="flex items-center gap-2 p-4 border-t border-gray-200 bg-gray-50 rounded-b-lg">
          <button
            onClick={handleDownloadQR}
            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Download className="w-4 h-4" />
            {t('appointment.qr.download', { defaultValue: 'Download' })}
          </button>
          <button
            onClick={handleShareSMS}
            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-100 transition-colors"
          >
            <MessageSquare className="w-4 h-4" />
            {t('appointment.qr.sms', { defaultValue: 'SMS' })}
          </button>
          <button
            onClick={handleShareEmail}
            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-100 transition-colors"
          >
            <Mail className="w-4 h-4" />
            {t('appointment.qr.email', { defaultValue: 'Email' })}
          </button>
        </div>
      </div>
    </div>
  )
}
