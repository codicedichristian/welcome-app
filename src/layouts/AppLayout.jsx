import { useCallback, useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import RightPanel from '../components/RightPanel.jsx'
import FloatingNav from '../components/FloatingNav.jsx'

const MAIN_ROUTES = ['/', '/events', '/news', '/my-events']

export default function AppLayout() {
  const location = useLocation()
  const [isRightOpen, setIsRightOpen] = useState(false)

  const openRight = useCallback(() => setIsRightOpen(true), [])

  const showNav = MAIN_ROUTES.includes(location.pathname)

  return (
    <div className="min-h-dvh bg-bg text-primary">
      {/* Pinterest-style gradient fade — covers status bar, pointer-events off so taps pass through */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          height: 'calc(env(safe-area-inset-top) + 80px)',
          background: 'linear-gradient(to bottom, rgba(15,15,15,1) 0%, rgba(15,15,15,0.8) 50%, rgba(15,15,15,0) 100%)',
          zIndex: 100,
          pointerEvents: 'none',
        }}
      />
      <main style={{ paddingBottom: showNav ? 'calc(90px + env(safe-area-inset-bottom))' : undefined }}>
        <div key={location.key} className="animate-fade-in">
          <Outlet context={{ openRightPanel: openRight }} />
        </div>
      </main>

      {showNav && <FloatingNav />}

      <RightPanel isOpen={isRightOpen} onClose={() => setIsRightOpen(false)} />
    </div>
  )
}
