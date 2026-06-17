import { useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Cross, Home, CalendarDays, Newspaper, Users } from 'lucide-react'
import config from '../config.js'

const NAV_ITEMS = [
  { to: '/', label: 'Home', icon: Home, exact: true },
  { to: '/events', label: 'Events', icon: CalendarDays },
  { to: '/news', label: 'News', icon: Newspaper },
  { to: '/midweek', label: 'Midweek', icon: Users },
]

export default function LeftSidebar({ isOpen, onClose }) {
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    onClose()
  }, [location.pathname]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <>
      <div
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          background: '#000000',
          opacity: isOpen ? 0.5 : 0,
          pointerEvents: isOpen ? 'auto' : 'none',
          transition: 'opacity 280ms ease-out',
          zIndex: 200,
        }}
      />
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          bottom: 0,
          width: '75%',
          background: '#111111',
          zIndex: 201,
          transform: isOpen ? 'translateX(0)' : 'translateX(-100%)',
          transition: 'transform 280ms ease-out',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <div
          style={{
            padding: '24px 16px 16px',
            paddingTop: 'calc(env(safe-area-inset-top) + 24px)',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
          }}
        >
          <Cross size={22} color="#ffffff" />
          <span style={{ fontSize: '20px', color: '#ffffff', fontWeight: '600' }}>{config.churchName}</span>
        </div>

        <div style={{ height: '0.5px', background: '#1e1e1e' }} />

        <nav style={{ flex: 1, paddingTop: '8px', paddingBottom: '8px' }}>
          {NAV_ITEMS.map(({ to, label, icon: Icon, exact }) => {
            const isActive = exact ? location.pathname === to : location.pathname === to || location.pathname.startsWith(to + '/')
            return (
              <button
                key={to}
                type="button"
                onClick={() => navigate(to)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '14px',
                  width: '100%',
                  height: '52px',
                  padding: '0 16px',
                  background: isActive ? '#1a1a1a' : 'transparent',
                  border: 'none',
                  borderLeft: isActive ? '3px solid #ffffff' : '3px solid transparent',
                  cursor: 'pointer',
                }}
              >
                <Icon size={20} color="#ffffff" />
                <span style={{ fontSize: '16px', color: '#ffffff' }}>{label}</span>
              </button>
            )
          })}
        </nav>

        <div style={{ height: '0.5px', background: '#1e1e1e' }} />

        <div style={{ padding: '16px', paddingBottom: 'calc(env(safe-area-inset-bottom) + 16px)' }}>
          <span style={{ fontSize: '11px', color: '#555555' }}>v{config.appVersion}</span>
        </div>
      </div>
    </>
  )
}
