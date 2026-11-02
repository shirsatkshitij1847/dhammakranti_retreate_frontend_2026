import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import LaunchBanner from './LaunchBanner.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <LaunchBanner />
  </StrictMode>,
)
