// useNotify.js — Email/SMS notification hook using React Query
// Purpose: Provide reusable functions to send email and SMS with success toasts.

import { useMutation } from '@tanstack/react-query'
import { sendEmail, sendSms } from '../api/notify.api'  // <-- make sure this file exists
import { toast } from 'sonner'
import { useTranslation } from 'react-i18next'

export function useNotify() {
  const { t } = useTranslation()

  // Mutation to send email
  const email = useMutation({
    mutationFn: sendEmail,
    onSuccess: () => toast.success(t('notify.email.sent')),
  })

  // Mutation to send SMS
  const sms = useMutation({
    mutationFn: sendSms,
    onSuccess: () => toast.success(t('notify.sms.sent')),
  })

  return {
    sendEmail: email.mutateAsync,           // call this to send email
    sendSms: sms.mutateAsync,               // call this to send sms
    loading: email.isPending || sms.isPending, // loading state for UI
  }
}
