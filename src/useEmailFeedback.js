import { useEffect, useState } from 'react'

export default function useEmailFeedback() {
  const [feedback, setFeedback] = useState(null)

  useEffect(() => {
    if (!feedback || feedback.warning) return undefined
    const timer = window.setTimeout(() => setFeedback(null), 6000)
    return () => window.clearTimeout(timer)
  }, [feedback])

  return [feedback, setFeedback]
}
