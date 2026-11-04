import { useRef, useState } from 'react'
import { requestApi } from './retreatApi'
import { getEmailFeedback } from './emailNotification'
import useEmailFeedback from './useEmailFeedback'

export default function EmailAction({ resource, id, email, token, onLogout, onRefreshAccount, disabled = false, onSendingChange }) {
  const pending = useRef(false)
  const [sending, setSending] = useState(false)
  const [feedback, setFeedback] = useEmailFeedback()

  const send = async () => {
    if (pending.current || disabled) return
    pending.current = true
    setSending(true)
    onSendingChange?.(true)
    setFeedback(null)
    const context = resource === 'accounts' ? 'account-email' : 'registration-email'
    try {
      const result = await requestApi(`/api/${resource}/${encodeURIComponent(id)}/email`, { method: 'POST' }, token)
      setFeedback(getEmailFeedback(result.emailNotification || { status: 'unknown' }, context))
    } catch (error) {
      setFeedback(error.emailNotification
        ? getEmailFeedback(error.emailNotification, context)
        : { warning: true, message: error.message })
      if (error.status === 401) onLogout()
      if (error.status === 403) {
        try {
          await onRefreshAccount()
        } catch (refreshError) {
          setFeedback({ warning: true, message: refreshError.message })
        }
      }
    } finally {
      pending.current = false
      setSending(false)
      onSendingChange?.(false)
    }
  }

  return (
    <div className="email-action">
      <button type="button" className="retreat-secondary-button" disabled={disabled || sending || !email} onClick={send} title={!email ? 'ईमेल पत्ता उपलब्ध नाही' : undefined}>
        {sending ? 'ईमेल पाठवत आहे…' : 'ईमेल पाठवा'}
      </button>
      {feedback && <p className={`retreat-feedback ${feedback.warning ? 'is-warning' : 'is-success'}`} role={feedback.warning ? 'alert' : 'status'}>{feedback.message}</p>}
    </div>
  )
}
