import { NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard,
  CalendarDays,
  Newspaper,
  Home,
  ClipboardList,
  Sun,
  Layers,
  Users,
  MessageSquare,
  Compass,
  ChevronLeft,
} from 'lucide-react'

const NAV = [
  { label: 'Dashboard',  to: '/admin',           icon: LayoutDashboard, end: true },
  { label: 'Events',     to: '/admin/events',     icon: CalendarDays },
  { label: 'News',       to: '/admin/news',       icon: Newspaper },
  { label: 'Explore',    to: '/admin/explore',    icon: Compass },
  { label: 'Midweek',    to: '/admin/midweek',    icon: Home },
  { label: 'Schedules',  to: '/admin/schedules',  icon: ClipboardList },
  { label: 'Sundays',    to: '/admin/sundays',    icon: Sun },
  { label: 'Seasons',    to: '/admin/seasons',    icon: Layers },
  { label: 'Members',    to: '/admin/members',    icon: Users },
  { label: 'Messages',   to: '/admin/messages',   icon: MessageSquare },
]

export default function AdminSidebar() {
  const navigate = useNavigate()

  return (
    <aside className="flex w-52 shrink-0 flex-col border-r border-border bg-surface">
      <div className="px-4 py-5">
        <p className="text-[11px] font-semibold uppercase tracking-widest text-zinc-500">Admin Panel</p>
      </div>

      <nav className="flex-1 overflow-y-auto px-2 pb-2">
        {NAV.map(({ label, to, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
                isActive
                  ? 'bg-white/10 text-primary'
                  : 'text-zinc-500 hover:bg-white/5 hover:text-primary'
              }`
            }
          >
            <Icon size={15} strokeWidth={1.75} />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="border-t border-border px-2 py-3">
        <button
          type="button"
          onClick={() => navigate('/')}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-zinc-500 transition-colors hover:bg-white/5 hover:text-primary"
        >
          <ChevronLeft size={15} strokeWidth={1.75} />
          Back to App
        </button>
      </div>
    </aside>
  )
}
