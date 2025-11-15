import React, { useState, useRef, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { QrCode, X, AlertCircle, CheckCircle, Loader } from 'lucide-react'
import { toast } from 'sonner'
import { api } from '@/lib/axios'

/**
 * Modal Component for scanning appointment QR codes
 * Features:
 * - Webcam QR code scanning
 * - Manual code entry fallback
 * - Display appointment details after successful scan
 */
export default function QRScannerModal({ isOpen, onClose, onAppointmentFound }) {
  const { t } = useTranslation()
  const [scannerActive, setScannerActive] = useState(false)
  const [manualCode, setManualCode] = useState('')
  const [verificationCode, setVerificationCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [scannedResult, setScannedResult] = useState(null)
  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const scannerRef = useRef(null)

  if (!isOpen) return null

  // Initialize webcam for QR scanning
  const initWebcam = async () => {
    try {
      setScannerActive(true)
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      })
      if (videoRef.current) {
        videoRef.current.srcObject = stream
      }
    } catch (err) {
      toast.error(
        t('appointment.qr.cameraError', {
          defaultValue: 'Unable to access camera. Please check permissions.'
        })
      )
      setScannerActive(false)
    }
  }

  const stopWebcam = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = videoRef.current.srcObject.getTracks()
      tracks.forEach(track => track.stop())
    }
    setScannerActive(false)
  }

  // Scan QR code from canvas
  const scanQRCode = async () => {
    if (!videoRef.current || !canvasRef.current) return

    const canvas = canvasRef.current
    const context = canvas.getContext('2d')
    canvas.width = videoRef.current.videoWidth
    canvas.height = videoRef.current.videoHeight

    context.drawImage(videoRef.current, 0, 0)

    // TODO: Use jsQR library to decode QR codes
    // For now, we'll use manual entry as fallback
  }

  // Handle manual appointment code entry
  const handleManualVerify = async () => {
    if (!manualCode.trim()) {
      toast.error(
        t('appointment.qr.codeRequired', { defaultValue: 'Please enter appointment code' })
      )
      return
    }

    setLoading(true)
    try {
      const response = await api.post('/appointments/verify/by-code', {
        appointment_code_or_id: manualCode.trim(),
        method: 'CODE'
      })

      if (response.data.success) {
        setScannedResult(response.data.appointment)
        onAppointmentFound(response.data.appointment)
        toast.success(
          t('appointment.qr.verificationSuccess', {
            defaultValue: 'Appointment verified successfully!'
          })
        )
      } else {
        toast.error(response.data.message || 'Verification failed')
      }
    } catch (error) {
      toast.error(
        t('appointment.qr.verificationError', {
          defaultValue: 'Failed to verify appointment'
        })
      )
      console.error('Verification error:', error)
    } finally {
      setLoading(false)
    }
  }

  // Verify using verification code (for accessibility)
  const handleVerificationCodeVerify = async () => {
    if (!manualCode.trim() || !verificationCode.trim()) {
      toast.error(
        t('appointment.qr.codeAndVerificationRequired', {
          defaultValue: 'Please enter both code and verification code'
        })
      )
      return
    }

    setLoading(true)
    try {
      const response = await api.post('/appointments/verify/by-verification-code', {
        appointment_code_or_id: manualCode.trim(),
        verification_code: verificationCode.trim(),
        method: 'VERIFICATION_CODE'
      })

      if (response.data.success) {
        setScannedResult(response.data.appointment)
        onAppointmentFound(response.data.appointment)
        toast.success(
          t('appointment.qr.verificationSuccess', {
            defaultValue: 'Appointment verified successfully!'
          })
        )
      } else {
        toast.error(response.data.message || 'Verification failed')
      }
    } catch (error) {
      toast.error(
        t('appointment.qr.verificationError', {
          defaultValue: 'Failed to verify appointment'
        })
      )
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    stopWebcam()
    setManualCode('')
    setVerificationCode('')
    setScannedResult(null)
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-2xl max-w-2xl w-full mx-4 max-h-96 overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 sticky top-0 bg-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
              <QrCode className="w-6 h-6 text-blue-600" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900">
              {t('appointment.qr.scannerTitle', {
                defaultValue: 'Verify Appointment'
              })}
            </h2>
          </div>
          <button onClick={handleClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6">
          {scannedResult ? (
            // Display verified appointment
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-lg">
                <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0" />
                <div>
                  <p className="font-semibold text-green-900">
                    {t('appointment.qr.verified', { defaultValue: 'Appointment Verified' })}
                  </p>
                  <p className="text-sm text-green-700">
                    {t('appointment.qr.verifiedAt', {
                      defaultValue: 'Verified at: {time}'
                    }).replace(
                      '{time}',
                      new Date().toLocaleTimeString()
                    )}
                  </p>
                </div>
              </div>

              {/* Appointment Details */}
              <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                <div>
                  <p className="text-xs text-gray-600 font-medium">
                    {t('appointment.qr.appointmentCode', { defaultValue: 'Code' })}
                  </p>
                  <p className="text-sm font-semibold text-gray-900">
                    {scannedResult.appointmentCode}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-600 font-medium">
                    {t('appointment.qr.date', { defaultValue: 'Date' })}
                  </p>
                  <p className="text-sm font-semibold text-gray-900">
                    {scannedResult.appointmentDate}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-600 font-medium">
                    {t('appointment.qr.time', { defaultValue: 'Time' })}
                  </p>
                  <p className="text-sm font-semibold text-gray-900">
                    {scannedResult.appointmentTime}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-600 font-medium">
                    {t('appointment.qr.service', { defaultValue: 'Service' })}
                  </p>
                  <p className="text-sm font-semibold text-gray-900">
                    {scannedResult.serviceType}
                  </p>
                </div>
              </div>

              <button
                onClick={handleClose}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                {t('common.close', { defaultValue: 'Close' })}
              </button>
            </div>
          ) : (
            // Scanner/Manual Entry Form
            <div className="space-y-6">
              {/* Tab Selection */}
              <div className="flex gap-2 border-b border-gray-200">
                <button
                  onClick={() => {
                    if (!scannerActive) initWebcam()
                  }}
                  className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
                    scannerActive
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-gray-600 hover:text-gray-900'
                  }`}
                >
                  {t('appointment.qr.scanQR', { defaultValue: 'Scan QR Code' })}
                </button>
                <button
                  onClick={() => {
                    stopWebcam()
                  }}
                  className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
                    !scannerActive
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-gray-600 hover:text-gray-900'
                  }`}
                >
                  {t('appointment.qr.manualEntry', { defaultValue: 'Manual Entry' })}
                </button>
              </div>

              {scannerActive ? (
                // Webcam Scanner
                <div className="space-y-4">
                  <div className="relative bg-black rounded-lg overflow-hidden">
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      className="w-full h-64 object-cover"
                    />
                    <canvas ref={canvasRef} className="hidden" />
                    {/* QR frame overlay */}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-48 h-48 border-2 border-green-500 rounded-lg opacity-50" />
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 text-center">
                    {t('appointment.qr.pointCamera', {
                      defaultValue: 'Point your camera at the QR code'
                    })}
                  </p>
                </div>
              ) : (
                // Manual Entry Form
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t('appointment.qr.appointmentCode', { defaultValue: 'Appointment Code' })}
                    </label>
                    <input
                      type="text"
                      value={manualCode}
                      onChange={e => setManualCode(e.target.value.toUpperCase())}
                      placeholder="e.g., HQ-2025-0001"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div className="border-t border-gray-200 pt-4">
                    <p className="text-sm font-medium text-gray-700 mb-4">
                      {t('appointment.qr.alternateVerification', {
                        defaultValue:
                          'Or verify using the 3-digit code from the card (for illiterate users)'
                      })}
                    </p>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {t('appointment.qr.verificationCode', {
                          defaultValue: 'Verification Code (3 digits)'
                        })}
                      </label>
                      <input
                        type="text"
                        value={verificationCode}
                        onChange={e => setVerificationCode(e.target.value)}
                        placeholder="e.g., 4-2-7"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        {t('appointment.qr.verificationHint', {
                          defaultValue:
                            'Ask the beneficiary for the 3 digits shown on their card'
                        })}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        {!scannedResult && (
          <div className="flex gap-2 p-4 border-t border-gray-200 bg-gray-50 rounded-b-lg">
            <button
              onClick={handleClose}
              className="px-4 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-100 transition-colors"
            >
              {t('common.cancel', { defaultValue: 'Cancel' })}
            </button>
            <button
              onClick={
                verificationCode ? handleVerificationCodeVerify : handleManualVerify
              }
              disabled={loading}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {loading && <Loader className="w-4 h-4 animate-spin" />}
              {t('appointment.qr.verify', { defaultValue: 'Verify' })}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
