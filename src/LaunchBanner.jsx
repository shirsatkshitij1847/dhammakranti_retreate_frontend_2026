import { useEffect, useState } from 'react'
import App from './App'
import './LaunchBanner.css'

const CAMPAIGN_START = Date.parse('2026-11-03T00:00:00+05:30')
const CAMPAIGN_END = Date.parse('2026-11-08T00:00:00+05:30')
const DISPLAY_DURATION = 10000

function LaunchBanner() {
  const [showBanner, setShowBanner] = useState(() => {
    const now = Date.now()
    return now >= CAMPAIGN_START && now < CAMPAIGN_END
  })
  const [imageError, setImageError] = useState(false)

  useEffect(() => {
    if (!showBanner) return undefined
    const timer = window.setTimeout(
      () => setShowBanner(false),
      Math.max(0, Math.min(DISPLAY_DURATION, CAMPAIGN_END - Date.now())),
    )
    return () => window.clearTimeout(timer)
  }, [showBanner])

  if (!showBanner) return <App />

  return (
    <main className="launch-banner" aria-label="Retreat announcement">
      <section className="launch-banner-card">
        {imageError ? (
          <p role="alert">The retreat banner could not be loaded.</p>
        ) : (
          <img
            src={`${import.meta.env.BASE_URL}retreatBanner.png`}
            alt="Upcoming retreat announcement"
            onError={() => setImageError(true)}
          />
        )}
        <p role="status">Welcome! The app will open automatically in 10 seconds.</p>
        <button type="button" onClick={() => setShowBanner(false)}>Continue to app</button>
      </section>
    </main>
  )
}

export default LaunchBanner
