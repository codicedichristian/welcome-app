import { useCallback, useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { Cross } from 'lucide-react'
import { getStoredUser } from '../lib/user.js'
import { useSwipeGesture } from '../hooks/useSwipeGesture.js'
import LeftSidebar from '../components/LeftSidebar.jsx'
import RightPanel from '../components/RightPanel.jsx'

export default function AppLayout() {
  const location = useLocation()
  const [isLeftOpen, setIsLeftOpen] = useState(false)
  const [isRightOpen, setIsRightOpen] = useState(false)

  const user = getStoredUser()
  const initials = `${user.firstName?.[0] ?? ''}${user.lastName?.[0] ?? ''}`.toUpperCase()

  const openLeft = useCallback(() => setIsLeftOpen(true), [])
  const openRight = useCallback(() => setIsRightOpen(true), [])

  useSwipeGesture({ onSwipeRight: openLeft, onSwipeLeft: openRight })

  return (
    <div className="min-h-dvh bg-bg text-primary">
      <header
        className="flex items-center justify-between px-4 pb-3"
        style={{ paddingTop: 'calc(env(safe-area-inset-top) + 14px)' }}
      >
        <button type="button" onClick={() => setIsLeftOpen(true)} className="flex items-center gap-2">
          <Cross size={20} className="text-primary" />
          <span className="text-[18px] font-semibold text-primary">Welcome</span>
        </button>
        <button
          type="button"
          onClick={() => setIsRightOpen(true)}
          className="flex h-9 w-9 items-center justify-center rounded-full border border-border bg-surface text-[13px] font-medium text-primary"
        >
          {initials}
        </button>
      </header>

      <main>
        <div key={location.key} className="animate-fade-in">
          <Outlet />
        </div>
      </main>

      <LeftSidebar isOpen={isLeftOpen} onClose={() => setIsLeftOpen(false)} />
      <RightPanel isOpen={isRightOpen} onClose={() => setIsRightOpen(false)} />
    </div>
  )
}
