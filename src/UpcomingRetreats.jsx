import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { requestApi } from './retreatApi'
import './UpcomingRetreats.css'

function formatDate(value) {
  return new Intl.DateTimeFormat('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC',
  }).format(new Date(`${value}T00:00:00Z`))
}

function RetreatCard({ retreat }) {
  return (
    <li className="upcoming-mail-card">
      <span className="upcoming-envelope" aria-hidden="true">☸</span>
      <div>
        <div className="upcoming-message-label">RETREAT UPDATE <span>●</span></div>
        <h3>{retreat.name} <span>· {retreat.year}</span></h3>
        <p><time dateTime={retreat.startDate}>{formatDate(retreat.startDate)}</time> – <time dateTime={retreat.endDate}>{formatDate(retreat.endDate)}</time></p>
        <p className="upcoming-venue">{retreat.venue || 'Venue to be confirmed'}</p>
      </div>
    </li>
  )
}

export default function UpcomingRetreats() {
  const [retreats, setRetreats] = useState([])
  const [error, setError] = useState('')
  const [reload, setReload] = useState(0)
  const [index, setIndex] = useState(0)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (!retreats.length) return undefined
    let hideTimer
    const show = () => {
      setVisible(true)
      window.clearTimeout(hideTimer)
      hideTimer = window.setTimeout(() => {
        setVisible(false)
        setIndex((current) => (current + 1) % retreats.length)
      }, 4000)
    }
    show()
    const repeatTimer = window.setInterval(show, 30000)
    return () => {
      window.clearTimeout(hideTimer)
      window.clearInterval(repeatTimer)
    }
  }, [retreats.length])

  useEffect(() => {
    const controller = new AbortController()
    async function load() {
      try {
        const data = await requestApi('/api/retreats/upcoming', { signal: controller.signal })
        if (!Array.isArray(data) || data.some((row) =>
          typeof row._id !== 'string' || typeof row.name !== 'string' ||
          !/^\d{4}-\d{2}-\d{2}$/.test(row.startDate) || !/^\d{4}-\d{2}-\d{2}$/.test(row.endDate) ||
          !Number.isFinite(Date.parse(row.startDate)) || !Number.isFinite(Date.parse(row.endDate)))) {
          throw new Error('Invalid upcoming retreat details returned by the API.')
        }
        setRetreats(data)
        setError('')
      } catch (failure) {
        if (failure.name !== 'AbortError') {
          console.error('Unable to load upcoming retreats.', failure)
          setError('Retreats unavailable')
        }
      }
    }
    load()
    const refresh = window.setInterval(load, 60_000)
    return () => { controller.abort(); window.clearInterval(refresh) }
  }, [reload])

  const currentIndex = retreats.length ? index % retreats.length : 0

  return visible || error ? createPortal(
    <aside className="upcoming-retreats retreat-reminder-popup" aria-label="Retreat reminder">
      <button type="button" className="retreat-reminder-close" onClick={() => { setVisible(false); setError('') }} aria-label="Dismiss retreat reminder">&times;</button>
      <div className="upcoming-window">
        {error && <p className="upcoming-error" role="alert">{error} <button type="button" onClick={() => setReload(reload + 1)}>Retry</button></p>}
        {!error && !!retreats.length && <ul className="upcoming-track">
          <RetreatCard retreat={retreats[currentIndex]} />
        </ul>}
      </div>
    </aside>,
    document.body,
  ) : null
}
