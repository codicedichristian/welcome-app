import { useCallback, useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { Cross } from 'lucide-react'
import { getStoredUser } from '../lib/user.js'
import RightPanel from '../components/RightPanel.jsx'
import FloatingNav from '../components/FloatingNav.jsx'

const MAIN_ROUTES = ['/', '/events', '/news', '/my-events']

export default function AppLayout() {
  const location = useLocation()
  const [isRightOpen, setIsRightOpen] = useState(false)

  const user = getStoredUser()
  const initials = `${user.firstName?.[0] ?? ''}${user.lastName?.[0] ?? ''}`.toUpperCase()

  const openRight = useCallback(() => setIsRightOpen(true), [])

  const showNav = MAIN_ROUTES.includes(location.pathname)
  const isHome  = location.pathname === '/'

  return (
    <div className="min-h-dvh bg-bg text-primary">
      <div className="safe-top" />
      {!isHome && (
        <header
          className="flex items-center justify-between px-4 pb-3"
          style={{ paddingTop: 'calc(env(safe-area-inset-top) + 16px)' }}
        >
          <div className="flex items-center gap-2">
            <Cross size={20} className="text-primary" />
            <span className="text-[18px] font-semibold text-primary">Welcome</span>
          </div>
          <button
            type="button"
            onClick={openRight}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-border bg-surface text-[13px] font-medium text-primary"
          >
            {initials}
          </button>
        </header>
      )}

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
