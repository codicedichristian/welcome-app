import { useCallback, useEffect, useRef, useState } from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import RightPanel from '../components/RightPanel.jsx'
import FloatingNav from '../components/FloatingNav.jsx'

const MAIN_ROUTES = ['/', '/events', '/news', '/my-events', '/my-church', '/profile']
const SWIPE_TABS = ['/', '/events', '/news', '/my-events']

export default function AppLayout() {
  const location = useLocation()
  const navigate = useNavigate()
  const [isRightOpen, setIsRightOpen] = useState(false)
  const openRight = useCallback(() => setIsRightOpen(true), [])
  const showNav = MAIN_ROUTES.includes(location.pathname)

  const mainRef = useRef(null)
  const touchData = useRef(null)

  useEffect(() => {
    const el = mainRef.current
    if (!el) return

    const tabIndex = SWIPE_TABS.indexOf(location.pathname)

    const onStart = (e) => {
      if (e.target.closest('[data-no-swipe="true"]')) return
      if (tabIndex < 0) return
      touchData.current = {
        startX: e.touches[0].clientX,
        startY: e.touches[0].clientY,
        locked: false,
        cancelled: false,
      }
    }

    const onMove = (e) => {
      if (!touchData.current || touchData.current.cancelled) return
      const dx = e.touches[0].clientX - touchData.current.startX
      const dy = e.touches[0].clientY - touchData.current.startY

      if (!touchData.current.locked) {
        if (Math.abs(dy) > Math.abs(dx) && Math.abs(dy) > 5) {
          touchData.current.cancelled = true
          return
        }
        if (Math.abs(dx) > 8) {
          touchData.current.locked = true
        } else {
          return
        }
      }

      e.preventDefault()
      const clamped = Math.max(-80, Math.min(80, dx))
      el.style.transform = `translateX(${clamped}px)`
      el.style.transition = 'none'
    }

    const onEnd = (e) => {
      if (!touchData.current) return
      const { cancelled, locked } = touchData.current
      const dx = e.changedTouches[0].clientX - touchData.current.startX
      touchData.current = null

      const reset = () => {
        el.style.transition = 'transform 200ms ease'
        el.style.transform = 'translateX(0)'
      }

      if (cancelled || !locked) { reset(); return }

      if (dx > 60 && tabIndex > 0) {
        el.style.transition = 'none'
        el.style.transform = 'translateX(0)'
        navigate(SWIPE_TABS[tabIndex - 1])
      } else if (dx < -60 && tabIndex < SWIPE_TABS.length - 1) {
        el.style.transition = 'none'
        el.style.transform = 'translateX(0)'
        navigate(SWIPE_TABS[tabIndex + 1])
      } else {
        reset()
      }
    }

    el.addEventListener('touchstart', onStart, { passive: true })
    el.addEventListener('touchmove', onMove, { passive: false })
    el.addEventListener('touchend', onEnd, { passive: true })

    return () => {
      el.removeEventListener('touchstart', onStart)
      el.removeEventListener('touchmove', onMove)
      el.removeEventListener('touchend', onEnd)
    }
  }, [location.pathname, navigate])

  return (
    <div className="min-h-dvh bg-bg text-primary">
      <main
        ref={mainRef}
        style={{ paddingBottom: showNav ? 'calc(90px + env(safe-area-inset-bottom))' : undefined }}
      >
        <div key={location.key} className="animate-fade-in">
          <Outlet context={{ openRightPanel: openRight }} />
        </div>
      </main>

      {showNav && <FloatingNav />}

      <RightPanel isOpen={isRightOpen} onClose={() => setIsRightOpen(false)} />
    </div>
  )
}
