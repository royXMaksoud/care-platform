import { useCallback, useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'

const WARNING_LEAD_TIME_MS = 60_000
const MIN_WARNING_WINDOW_MS = 15_000
const FALLBACK_TOTAL_MS = 30 * 60_000
const ACTIVITY_EVENTS = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart']

export default function SessionTimeoutWatcher({ timeoutMinutes, onExpire }) {
  const { t } = useTranslation()
  const timersRef = useRef({ warning: null, logout: null })
  const warningToastIdRef = useRef(null)
  const warningShownRef = useRef(false)

  console.log('⏱️ SessionTimeoutWatcher initialized', {
    timeoutMinutes,
    isValid: timeoutMinutes && Number(timeoutMinutes) > 0,
  })

  const dismissWarning = useCallback(() => {
    if (warningToastIdRef.current) {
      toast.dismiss(warningToastIdRef.current)
      warningToastIdRef.current = null
    }
  }, [])

  const clearTimers = useCallback(() => {
    Object.values(timersRef.current).forEach((id) => {
      if (id) {
        clearTimeout(id)
      }
    })
    timersRef.current = { warning: null, logout: null }
  }, [])

  useEffect(() => {
    clearTimers()
    dismissWarning()
    warningShownRef.current = false

    const minutes = Number(timeoutMinutes)
    if (!minutes || minutes <= 0) {
      return
    }

    const totalMsCandidate = minutes * 60_000
    const totalMs = Number.isFinite(totalMsCandidate) && totalMsCandidate > 0 ? totalMsCandidate : FALLBACK_TOTAL_MS

    const warningDelay =
      totalMs > WARNING_LEAD_TIME_MS
        ? totalMs - WARNING_LEAD_TIME_MS
        : Math.max(totalMs * 0.5, MIN_WARNING_WINDOW_MS)

    const leadWindowMs = Math.max(totalMs - warningDelay, MIN_WARNING_WINDOW_MS)
    const leadMinutes = Math.max(1, Math.round(leadWindowMs / 60_000))

    function scheduleTimers() {
      clearTimers()
      dismissWarning()
      warningShownRef.current = false

      timersRef.current.warning = window.setTimeout(() => {
        warningShownRef.current = true
        dismissWarning()
        warningToastIdRef.current = toast.warning(t('session.warning', { minutes: leadMinutes }), {
          duration: leadWindowMs,
          action: {
            label: t('session.extend'),
            onClick: () => scheduleTimers(),
          },
        })
      }, warningDelay)

      timersRef.current.logout = window.setTimeout(() => {
        dismissWarning()
        toast.error(t('session.timeout'))
        onExpire?.()
      }, totalMs)
    }

    scheduleTimers()

    const handleActivity = () => {
      if (document.hidden) {
        return
      }
      scheduleTimers()
    }

    const handleVisibility = () => {
      if (!document.hidden) {
        scheduleTimers()
      }
    }

    const eventOptions = { passive: true }
    ACTIVITY_EVENTS.forEach((event) => window.addEventListener(event, handleActivity, eventOptions))
    window.addEventListener('focus', handleActivity)
    document.addEventListener('visibilitychange', handleVisibility)

    return () => {
      ACTIVITY_EVENTS.forEach((event) => window.removeEventListener(event, handleActivity, eventOptions))
      window.removeEventListener('focus', handleActivity)
      document.removeEventListener('visibilitychange', handleVisibility)
      clearTimers()
      dismissWarning()
    }
  }, [timeoutMinutes, onExpire, clearTimers, dismissWarning, t])

  return null
}

