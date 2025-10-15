// notify.api.js — API functions for notifications
// Purpose: Define HTTP calls to backend for sending email and SMS.

import { api } from '../shared/lib/axios'

// Send email request to backend
export async function sendEmail({ to, subject, body }) {
  const { data } = await api.post('/notifications/email', { to, subject, body })
  return data
}

// Send SMS request to backend
export async function sendSms({ to, message }) {
  const { data } = await api.post('/notifications/sms', { to, message })
  return data
}
