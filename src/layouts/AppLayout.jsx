import { useCallback, useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import RightPanel from '../components/RightPanel.jsx'
import FloatingNav from '../components/FloatingNav.jsx'

const MAIN_ROUTES = ['/', '/events', '/news', '/my-events', '/my-church', '/profile']

export default function AppLayout() {
  const location = useLocation()
  const [isRightOpen, setIsRightOpen] = useState(false)

  const openRight = useCallback(() => setIsRightOpen(true), [])

  const showNav = MAIN_ROUTES.includes(location.pathname)

  return (
    <div className="min-h-dvh bg-bg text-primary">
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
