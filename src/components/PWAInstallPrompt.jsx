import { useState } from 'react'
import { Plus } from 'lucide-react'

const ua = navigator.userAgent
const isIOS = /iPhone|iPad|iPod/.test(ua)
const isSafari = /Safari/.test(ua) && !/Chrome|CriOS|FxiOS/.test(ua)
const isInstalled = window.navigator.standalone === true
const isDismissed = localStorage.getItem('welcome_pwa_dismissed') === 'true'
export const shouldShowPWAPrompt = isIOS && isSafari && !isInstalled && !isDismissed

function NumberCircle({ n }) {
  return (
    <div style={{
      width: 28, height: 28, borderRadius: 14, flexShrink: 0,
      background: '#1a1a1a', border: '0.5px solid #2e2e2e',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: 13, fontWeight: 700, color: '#fff',
    }}>
      {n}
    </div>
  )
}

function ShareIcon() {
  return (
    <svg
      width="20" height="20" viewBox="0 0 24 24" fill="none"
      style={{ marginTop: 6, display: 'block' }}
    >
      <path d="M12 15V3M12 3L8 7M12 3L16 7" stroke="#5b8cff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M5 11V19C5 20.1046 5.89543 21 7 21H17C18.1046 21 19 20.1046 19 19V11" stroke="#5b8cff" strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}

export default function PWAInstallPrompt({ onDismiss }) {
  const [tapped, setTapped] = useState(false)

  const handleDismiss = () => {
    localStorage.setItem('welcome_pwa_dismissed', 'true')
    onDismiss()
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: '#0a0b0a',
      display: 'flex', flexDirection: 'column',
      padding: 32,
      paddingTop: 'calc(env(safe-area-inset-top) + 32px)',
      paddingBottom: 'calc(env(safe-area-inset-bottom) + 32px)',
      overflowY: 'auto',
    }}>

      {/* ── TOP SECTION ── */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: 40 }}>
        <div style={{
          width: 72, height: 72, borderRadius: 20,
          background: '#111', border: '2px solid #2e2e2e',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
            <rect x="13" y="4" width="6" height="24" rx="2" fill="white" />
            <rect x="4" y="13" width="24" height="6" rx="2" fill="white" />
          </svg>
        </div>
        <p style={{ fontSize: 28, fontWeight: 800, color: '#ffffff', marginTop: 16 }}>Welcome</p>
        <p style={{ fontSize: 15, color: '#9a9a97', textAlign: 'center', marginTop: 8, lineHeight: 1.5 }}>
          Install the app for the best experience
        </p>
      </div>

      {/* ── STEPS ── */}
      <div style={{ marginTop: 40 }}>

        {/* Step 1 */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, marginBottom: 24 }}>
          <NumberCircle n="1" />
          <div>
            <p style={{ fontSize: 15, fontWeight: 600, color: '#ffffff' }}>Tap the Share button</p>
            <p style={{ fontSize: 13, color: '#9a9a97', marginTop: 2 }}>Look for this icon at the bottom of Safari</p>
            <ShareIcon />
          </div>
        </div>

        {/* Step 2 */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, marginBottom: 24 }}>
          <NumberCircle n="2" />
          <div>
            <p style={{ fontSize: 15, fontWeight: 600, color: '#ffffff' }}>Tap 'Add to Home Screen'</p>
            <p style={{ fontSize: 13, color: '#9a9a97', marginTop: 2 }}>Scroll down in the share menu</p>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              background: '#1a1a1a', border: '0.5px solid #2e2e2e',
              borderRadius: 10, padding: '8px 12px', marginTop: 8,
            }}>
              <Plus size={16} color="#ffffff" />
              <span style={{ fontSize: 13, color: '#ffffff' }}>Add to Home Screen</span>
            </div>
          </div>
        </div>

        {/* Step 3 */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, marginBottom: 24 }}>
          <NumberCircle n="3" />
          <div>
            <p style={{ fontSize: 15, fontWeight: 600, color: '#ffffff' }}>Tap 'Add'</p>
            <p style={{ fontSize: 13, color: '#9a9a97', marginTop: 2 }}>Welcome will appear on your home screen</p>
          </div>
        </div>

      </div>

      {/* ── BOTTOM BUTTONS ── */}
      <div style={{ marginTop: 'auto', paddingTop: 16 }}>
        <button
          type="button"
          onClick={() => setTapped(true)}
          style={{
            width: '100%', background: '#ffffff', color: '#0a0b0a',
            fontSize: 17, fontWeight: 700, borderRadius: 14, padding: 16,
            border: 'none', cursor: 'pointer', marginBottom: 12,
          }}
        >
          {tapped ? 'Follow the steps above ↑' : 'Install now'}
        </button>
        <button
          type="button"
          onClick={handleDismiss}
          style={{
            width: '100%', background: 'transparent', color: '#6b6b68',
            fontSize: 15, fontWeight: 500, border: 'none', cursor: 'pointer', padding: '8px 0',
          }}
        >
          Maybe later
        </button>
      </div>

    </div>
  )
}
