import React, { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Html5QrcodeScanner } from 'html5-qrcode'
import { AlertCircle, CheckCircle, Loader, QrCode, X } from 'lucide-react'
import { toast } from 'sonner'

/**
 * Professional QR Code Scanner Component using html5-qrcode
 * Features:
 * - Real-time webcam scanning
 * - Multiple QR code formats support
 * - Automatic result parsing
 * - Error handling and fallback
 * - Audio/visual feedback
 */
export default function QRCodeScanner({ isOpen, onClose, onScanSuccess, onScanError }) {
  const { t } = useTranslation()
  const [scanning, setScanning] = useState(false)
  const [scanResult, setScanResult] = useState(null)
  const [error, setError] = useState(null)
  const [isScanning, setIsScanning] = useState(false)
  const qrScannerRef = useRef(null)
  const scannerId = 'qr-code-scanner'

  if (!isOpen) return null

  // Initialize scanner
  useEffect(() => {
    if (!isOpen || scanning) return

    try {
      setScanning(true)
      setError(null)
      setScanResult(null)

      // Create scanner instance
      const scanner = new Html5QrcodeScanner(
        scannerId,
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1,
          showTorchButtonIfSupported: true,
          rememberLastUsedCamera: true,
        },
        false
      )

      qrScannerRef.current = scanner

      // Success callback
      const handleScanSuccess = (decodedText, decodedResult) => {
        console.log('QR Code scanned:', decodedText)

        try {
          // Parse QR content (format: APPT:CODE|ID:UUID)
          const parsedData = parseQRContent(decodedText)

          if (parsedData.appt && parsedData.id) {
            setScanResult({
              appointmentCode: parsedData.appt,
              appointmentId: parsedData.id,
              rawQRContent: decodedText,
            })

            // Play success sound
            playSuccessSound()

            // Stop scanning
            scanner.clear().catch(err => console.error('Error clearing scanner:', err))
            setScanning(false)

            // Call callback
            if (onScanSuccess) {
              onScanSuccess(parsedData.appt)
            }

            toast.success(
              t('appointment.qr.scanSuccess', {
                defaultValue: 'QR code scanned successfully!'
              })
            )
          } else {
            throw new Error('Invalid QR code format')
          }
        } catch (err) {
          setError(err.message)
          console.error('Error parsing QR code:', err)
          // Continue scanning on error
        }
      }

      // Error callback
      const handleScanError = (error) => {
        // Don't log camera permission errors as they're spam
        if (!error.includes('Camera permission') && !error.includes('NotAllowedError')) {
          console.debug('Scanner error:', error)
        }
      }

      // Start scanning
      scanner
        .render(handleScanSuccess, handleScanError)
        .then(() => {
          setIsScanning(true)
          log.info('QR Code scanner initialized')
        })
        .catch(err => {
          console.error('Failed to initialize QR scanner:', err)
          setError(err.message)
          setScanning(false)

          if (err.name === 'NotAllowedError') {
            setError(
              t('appointment.qr.cameraPermissionDenied', {
                defaultValue:
                  'Camera permission denied. Please enable camera access in settings.'
              })
            )
          }
        })
    } catch (err) {
      console.error('Error setting up scanner:', err)
      setError(err.message)
      setScanning(false)
    }

    // Cleanup
    return () => {
      if (qrScannerRef.current) {
        qrScannerRef.current
          .clear()
          .catch(err => console.error('Error clearing scanner on cleanup:', err))
      }
    }
  }, [isOpen, scanning, onScanSuccess])

  // Parse QR content
  const parseQRContent = (qrContent) => {
    const parts = qrContent.split('|')
    const result = {}

    parts.forEach(part => {
      const [key, value] = part.split(':')
      if (key && value) {
        result[key.toLowerCase()] = value.trim()
      }
    })

    return result
  }

  // Play success sound
  const playSuccessSound = () => {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)()
    const oscillator = audioContext.createOscillator()
    const gainNode = audioContext.createGain()

    oscillator.connect(gainNode)
    gainNode.connect(audioContext.destination)

    oscillator.frequency.value = 800
    oscillator.type = 'sine'

    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime)
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5)

    oscillator.start(audioContext.currentTime)
    oscillator.stop(audioContext.currentTime + 0.5)
  }

  // Handle manual verification
  const handleManualVerify = () => {
    if (scanResult) {
      // Close scanner and return to manual entry
      handleClose()
    }
  }

  // Handle close
  const handleClose = () => {
    if (qrScannerRef.current) {
      qrScannerRef.current
        .clear()
        .catch(err => console.error('Error clearing scanner:', err))
    }
    setScanning(false)
    setScanResult(null)
    setError(null)
    setIsScanning(false)
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 sticky top-0 bg-white rounded-t-lg">
          <div className="flex items-center gap-2">
            <QrCode className="w-5 h-5 text-blue-600" />
            <h2 className="text-lg font-semibold text-gray-900">
              {t('appointment.qr.scanQRCode', { defaultValue: 'Scan QR Code' })}
            </h2>
          </div>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Body */}
        <div className="p-4 space-y-4">
          {/* Scanner Container */}
          <div className="relative bg-black rounded-lg overflow-hidden">
            {scanning ? (
              <>
                <div id={scannerId} className="w-full" />
                {isScanning && (
                  <div className="absolute top-4 right-4 flex items-center gap-2 bg-green-500 text-white px-3 py-1 rounded-full text-sm">
                    <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                    {t('appointment.qr.scanningActive', { defaultValue: 'Scanning...' })}
                  </div>
                )}
              </>
            ) : (
              <div className="w-full h-64 flex items-center justify-center text-white">
                <Loader className="w-8 h-8 animate-spin" />
              </div>
            )}
          </div>

          {/* Status Messages */}
          {error && (
            <div className="flex items-start gap-3 p-3 bg-red-50 border border-red-200 rounded-lg">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-red-900">
                  {t('appointment.qr.scanError', { defaultValue: 'Scan Error' })}
                </p>
                <p className="text-xs text-red-700 mt-1">{error}</p>
              </div>
            </div>
          )}

          {scanResult && (
            <div className="flex items-start gap-3 p-3 bg-green-50 border border-green-200 rounded-lg">
              <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-green-900">
                  {t('appointment.qr.scanSuccess', { defaultValue: 'Scan Successful!' })}
                </p>
                <p className="text-xs text-green-700 mt-1">
                  {t('appointment.qr.appointmentCode', { defaultValue: 'Code' })}: {scanResult.appointmentCode}
                </p>
              </div>
            </div>
          )}

          {/* Instructions */}
          {scanning && !scanResult && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-xs text-blue-700 text-center">
                {t('appointment.qr.pointCamera', {
                  defaultValue: 'Point your camera at the QR code'
                })}
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-2 p-4 border-t border-gray-200 bg-gray-50 rounded-b-lg">
          <button
            onClick={handleClose}
            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-100 transition-colors"
          >
            {t('common.cancel', { defaultValue: 'Cancel' })}
          </button>
          {scanResult && (
            <button
              onClick={handleManualVerify}
              className="flex-1 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
            >
              {t('common.continue', { defaultValue: 'Continue' })}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
