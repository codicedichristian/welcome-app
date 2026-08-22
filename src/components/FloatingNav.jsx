import { useLocation, useNavigate } from 'react-router-dom'
import { Home, CalendarDays, Megaphone, Bookmark } from 'lucide-react'

const TABS = [
  { to: '/', icon: Home, label: 'Home', exact: true },
  { to: '/events', icon: CalendarDays, label: 'Events' },
  { to: '/news', icon: Megaphone, label: 'News' },
  { to: '/my-events', icon: Bookmark, label: 'My Events' },
]

export default function FloatingNav() {
  const navigate = useNavigate()
  const location = useLocation()

  return (
    <div
      style={{
        position: 'fixed',
        left: 0,
        right: 0,
        bottom: 'calc(18px + env(safe-area-inset-bottom))',
        zIndex: 100,
        display: 'flex',
        justifyContent: 'center',
        pointerEvents: 'none',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          background: 'rgba(38,38,42,0.92)',
          backdropFilter: 'blur(18px)',
          WebkitBackdropFilter: 'blur(18px)',
          borderRadius: '999px',
          padding: '8px',
          pointerEvents: 'auto',
        }}
      >
        {TABS.map(({ to, icon: Icon, label, exact }) => {
          const isActive = exact ? location.pathname === to : location.pathname === to

          return (
            <button
              key={to}
              type="button"
              aria-label={label}
              onClick={() => {
                if (to === '/') {
                  const liveScroll = sessionStorage.getItem('scroll_home_live')
                  if (liveScroll) sessionStorage.setItem('scroll_home_saved', liveScroll)
                  sessionStorage.setItem('returning_to_home', 'true')
                }
                navigate(to, { replace: true })
              }}
              style={{
                width: '52px',
                height: '44px',
                borderRadius: '999px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: isActive ? '#3a3a3e' : 'transparent',
                border: 'none',
                cursor: 'pointer',
                transition: 'background 150ms ease',
              }}
            >
              <Icon size={22} color={isActive ? '#ffffff' : '#8e8e93'} strokeWidth={2} />
            </button>
          )
        })}
      </div>
    </div>
  )
}
