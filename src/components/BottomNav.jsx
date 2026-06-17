import { NavLink } from 'react-router-dom'
import { Home, CalendarDays, Newspaper, User } from 'lucide-react'

const tabs = [
  { to: '/', label: 'Home', icon: Home, end: true },
  { to: '/events', label: 'Events', icon: CalendarDays },
  { to: '/news', label: 'News', icon: Newspaper },
  { to: '/profile', label: 'Profile', icon: User },
]

export default function BottomNav() {
  return (
    <nav
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        paddingBottom: 'env(safe-area-inset-bottom)',
        background: '#0f0f0f',
        borderTop: '0.5px solid #1e1e1e',
        zIndex: 100,
      }}
    >
      <ul className="flex h-[64px] items-stretch justify-around">
        {tabs.map(({ to, label, icon: Icon, end }) => (
          <li key={to} className="flex-1">
            <NavLink
              to={to}
              end={end}
              className={({ isActive }) =>
                `nav-tap flex h-full flex-col items-center justify-center gap-1 transition-colors ${
                  isActive ? 'text-primary' : 'text-inactive'
                }`
              }
            >
              <Icon size={22} strokeWidth={2} />
              <span style={{ fontSize: '11px' }}>{label}</span>
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  )
}
