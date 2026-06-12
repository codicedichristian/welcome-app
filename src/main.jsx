import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.jsx'
import config from './config.js'

// Apply white-label colors from config.js as CSS custom properties so
// Tailwind utilities (bg-bg, text-primary, text-inactive, etc.) reflect the active brand.
const root = document.documentElement
root.style.setProperty('--color-bg', config.backgroundColor)
root.style.setProperty('--color-primary', config.primaryColor)
root.style.setProperty('--color-accent', config.accentColor)
root.style.setProperty('--color-surface', config.colors.surface)
root.style.setProperty('--color-border', config.colors.border)
root.style.setProperty('--color-inactive', config.colors.inactive)
root.style.setProperty('--color-accent-green', config.colors.accents.green)
root.style.setProperty('--color-accent-blue', config.colors.accents.blue)
root.style.setProperty('--color-accent-purple', config.colors.accents.purple)
root.style.setProperty('--color-accent-orange', config.colors.accents.orange)

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <App />
    </BrowserRouter>
  </StrictMode>,
)
