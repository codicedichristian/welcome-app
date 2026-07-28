import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Home, CalendarDays, Megaphone, Bookmark, Lock } from 'lucide-react'
import { useUser } from '../lib/UserContext.js'

const MEMBER_ROLES = ['member', 'leader', 'admin']

const TABS = [
  { to: '/', icon: Home, label: 'Home', exact: true },
  { to: '/events', icon: CalendarDays, label: 'Events' },
  { to: '/news', icon: Megaphone, label: 'News' },
  { to: '/my-events', icon: Bookmark, label: 'My Church' },
]

function JoinUsSheet({ onClose }) {
  return (
    <>
      <div
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.7)',
          zIndex: 300,
        }}
      />
      <div
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          background: '#1a1a1a',
          borderRadius: '28px 28px 0 0',
          padding: '28px 24px calc(32px + env(safe-area-inset-bottom))',
          zIndex: 301,
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '14px' }}>
          <Lock size={36} color="#5b8cff" />
        </div>
        <p style={{ fontSize: '20px', fontWeight: 700, color: '#ffffff', textAlign: 'center', marginBottom: '8px' }}>
          Members only
        </p>
        <p style={{ fontSize: '14px', color: '#888', textAlign: 'center', marginBottom: '24px' }}>
          This section is for church members. Speak to one of our team to join the community.
        </p>
        <button
          type="button"
          onClick={onClose}
          style={{
            width: '100%',
            borderRadius: '14px',
            background: '#ffffff',
            color: '#0f0f0f',
            fontSize: '17px',
            fontWeight: 600,
            padding: '15px',
            border: 'none',
            cursor: 'pointer',
          }}
        >
          Close
        </button>
      </div>
    </>
  )
}

export default function FloatingNav() {
  const navigate = useNavigate()
  const location = useLocation()
  const user = useUser()
  const [showJoinUs, setShowJoinUs] = useState(false)

  const isLocked = !MEMBER_ROLES.includes(user.role)

  return (
    <>
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
          const isMyChurch = label === 'My Church'
          const TabIcon = isMyChurch && isLocked ? Lock : Icon

          return (
            <button
              key={to}
              type="button"
              aria-label={label}
              onClick={() => {
                if (isMyChurch && isLocked) {
                  setShowJoinUs(true)
                } else {
                  navigate(to)
                }
              }}
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
              <TabIcon size={24} color={isActive ? '#ffffff' : '#555555'} strokeWidth={isActive ? 2 : 1.75} />
            </button>
          )
        })}
      </div>

      {showJoinUs && <JoinUsSheet onClose={() => setShowJoinUs(false)} />}
    </>
  )
}
