import { useQuery, useMutation } from '@tanstack/react-query'
import { api } from '@/lib/axios'

/**
 * Custom hook for appointment QR code operations
 */
export function useAppointmentQR() {
  /**
   * Fetch QR code data for an appointment
   */
  const fetchQRData = useQuery({
    queryKey: ['appointmentQR'],
    queryFn: async (appointmentId) => {
      const response = await api.get(`/appointments/verify/${appointmentId}`)
      return response.data
    },
    enabled: false, // Only fetch when explicitly triggered
  })

  /**
   * Verify appointment by code
   */
  const verifyByCodeMutation = useMutation({
    mutationFn: async (appointmentCode) => {
      const response = await api.post('/appointments/verify/by-code', {
        appointment_code_or_id: appointmentCode,
        method: 'CODE',
      })
      return response.data
    },
  })

  /**
   * Verify appointment by verification code
   */
  const verifyByVerificationMutation = useMutation({
    mutationFn: async ({ appointmentCode, verificationCode }) => {
      const response = await api.post('/appointments/verify/by-verification-code', {
        appointment_code_or_id: appointmentCode,
        verification_code: verificationCode,
        method: 'VERIFICATION_CODE',
      })
      return response.data
    },
  })

  /**
   * Verify appointment by QR content
   */
  const verifyByQRMutation = useMutation({
    mutationFn: async (qrContent) => {
      const response = await api.post('/appointments/verify/by-qr', {
        appointment_code_or_id: qrContent,
        method: 'QR',
      })
      return response.data
    },
  })

  /**
   * Get QR code image
   */
  const fetchQRImageMutation = useMutation({
    mutationFn: async (appointmentId) => {
      const response = await api.get(`/appointments/verify/${appointmentId}/qr-image`, {
        responseType: 'blob',
      })
      return response.data
    },
  })

  /**
   * Resend QR code via SMS/Email/Push
   */
  const resendQRMutation = useMutation({
    mutationFn: async ({ appointmentId, method }) => {
      const response = await api.post(
        `/appointments/verify/${appointmentId}/resend-qr?method=${method}`
      )
      return response.data
    },
  })

  return {
    fetchQRData,
    verifyByCode: verifyByCodeMutation.mutateAsync,
    verifyByCodeLoading: verifyByCodeMutation.isPending,
    verifyByCodeError: verifyByCodeMutation.error,
    verifyByVerification: verifyByVerificationMutation.mutateAsync,
    verifyByVerificationLoading: verifyByVerificationMutation.isPending,
    verifyByQR: verifyByQRMutation.mutateAsync,
    verifyByQRLoading: verifyByQRMutation.isPending,
    fetchQRImage: fetchQRImageMutation.mutateAsync,
    resendQR: resendQRMutation.mutateAsync,
    resendQRLoading: resendQRMutation.isPending,
  }
}

/**
 * Utility function to download QR code as image
 */
export function downloadQRCode(dataUrl, appointmentCode) {
  const link = document.createElement('a')
  link.href = dataUrl
  link.download = `appointment-${appointmentCode}.png`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

/**
 * Utility function to share via SMS
 */
export function shareViaSMS(appointmentCode, verificationCode) {
  const text = `Your appointment code: ${appointmentCode}\nVerification: ${verificationCode}`
  const smsUrl = `sms:?body=${encodeURIComponent(text)}`
  window.location.href = smsUrl
}

/**
 * Utility function to share via Email
 */
export function shareViaEmail(appointmentCode, verificationCode, appointmentDetails) {
  const subject = 'Your Appointment Details'
  const body = `
Appointment Code: ${appointmentCode}
Verification Code: ${verificationCode}

Date: ${appointmentDetails.appointmentDate}
Time: ${appointmentDetails.appointmentTime}
${appointmentDetails.centerName ? `Center: ${appointmentDetails.centerName}` : ''}
${appointmentDetails.serviceType ? `Service: ${appointmentDetails.serviceType}` : ''}

Please keep this information safe and bring the QR code or verification code when you visit.
  `.trim()

  const mailUrl = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
  window.location.href = mailUrl
}

/**
 * Format verification code for display (e.g., "4-2-7")
 */
export function formatVerificationCode(code) {
  if (!code) return ''
  return code.split('').join('-')
}

/**
 * Parse QR content (format: APPT:CODE|ID:UUID)
 */
export function parseQRContent(qrContent) {
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
