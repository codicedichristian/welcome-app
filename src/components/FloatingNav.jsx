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
        bottom: 'calc(24px + env(safe-area-inset-bottom))',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 100,
        display: 'flex',
        alignItems: 'center',
        gap: '4px',
        background: '#1a1a1a',
        borderRadius: '50px',
        padding: '8px 12px',
        border: '0.5px solid #2e2e2e',
        boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
      }}
    >
      {TABS.map(({ to, icon: Icon, label, exact }) => {
        const isActive = exact ? location.pathname === to : location.pathname === to
        return (
          <button
            key={to}
            type="button"
            aria-label={label}
            onClick={() => navigate(to)}
            style={{
              width: '48px',
              height: '44px',
              borderRadius: '50px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: isActive ? '#2e2e2e' : 'transparent',
              border: 'none',
              cursor: 'pointer',
              transition: 'background 150ms ease',
            }}
          >
            <Icon size={24} color={isActive ? '#ffffff' : '#555555'} strokeWidth={isActive ? 2 : 1.75} />
          </button>
        )
      })}
    </div>
  )
}
