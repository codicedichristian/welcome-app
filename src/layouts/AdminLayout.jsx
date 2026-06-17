import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { LayoutDashboard, CalendarDays, Megaphone, Home, Users, LogOut } from 'lucide-react'
import { supabase } from '../lib/supabase.js'
import { getStoredUser } from '../lib/user.js'

const NAV_ITEMS = [
  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/admin/events', label: 'Events', icon: CalendarDays },
  { to: '/admin/news', label: 'News', icon: Megaphone },
  { to: '/admin/midweek', label: 'Midweek Groups', icon: Home },
  { to: '/admin/members', label: 'Members', icon: Users },
]

export default function AdminLayout() {
  const navigate = useNavigate()
  const user = getStoredUser()
  const fullName = `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim()

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    localStorage.removeItem('welcome_user')
    navigate('/login', { replace: true })
  }

  const navLinkClass = ({ isActive }) =>
    `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors ${
      isActive ? 'bg-surface text-primary' : 'text-inactive'
    }`

  return (
    <div className="min-h-dvh bg-bg text-primary">
      <header className="flex items-center justify-between border-b border-border px-4 py-3">
        <p className="text-sm font-medium text-primary">Welcome Admin</p>
        <div className="flex items-center gap-3">
          <span className="text-xs text-zinc-400">{fullName}</span>
          <button
            type="button"
            onClick={handleSignOut}
            aria-label="Logout"
            className="flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1.5 text-xs text-zinc-400 transition-colors hover:text-primary"
          >
            <LogOut size={14} />
            <span>Logout</span>
          </button>
        </div>
      </header>

      <div className="flex flex-col md:flex-row">
        <nav className="border-b border-border px-2 py-2 md:w-56 md:shrink-0 md:border-b-0 md:border-r md:px-3 md:py-4">
          <ul className="flex gap-1 overflow-x-auto md:flex-col md:overflow-visible">
            {NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
              <li key={to} className="shrink-0 md:w-full">
                <NavLink to={to} end={end} className={navLinkClass}>
                  <Icon size={18} />
                  <span className="whitespace-nowrap">{label}</span>
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        <main className="flex-1 px-4 py-6 md:px-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
