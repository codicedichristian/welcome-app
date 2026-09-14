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
  Users2,
  MessageSquare,
  Compass,
  ChevronLeft,
  CheckSquare,
  Inbox,
  Heart,
  Star,
  Phone,
} from 'lucide-react'
import { getStoredUser } from '../lib/user.js'

const NAV = [
  { label: 'Dashboard',  to: '/admin',            icon: LayoutDashboard, end: true, key: 'dashboard' },
  { label: 'Events',     to: '/admin/events',     icon: CalendarDays,    key: 'events' },
  { label: 'Attendance', to: '/admin/attendance', icon: CheckSquare,     key: 'attendance' },
  { label: 'News',       to: '/admin/news',       icon: Newspaper,       key: 'news' },
  { label: 'Explore',    to: '/admin/explore',    icon: Compass,         key: 'explore' },
  { label: 'Midweek',    to: '/admin/midweek',    icon: Home,            key: 'midweek' },
  { label: 'Teams',      to: '/admin/teams',      icon: Users2,          key: 'teams' },
  { label: 'Join Team Req.', to: '/admin/join-requests', icon: Inbox,    key: 'join-requests' },
  { label: 'Bienvenido Req.', to: '/admin/connect-requests', icon: Heart, key: 'connect-requests' },
  { label: 'Midweek clicks', to: '/admin/midweek-contacts', icon: MessageSquare, key: 'midweek-contacts' },
  { label: 'Next Steps Req.', to: '/admin/nextsteps-requests', icon: Star, key: 'nextsteps-requests' },
  { label: 'Event Contact Req.', to: '/admin/event-contact-requests', icon: Phone, key: 'event-contact-requests' },
  { label: 'Schedules',  to: '/admin/schedules',  icon: ClipboardList,   key: 'schedules' },
  { label: 'Sundays',    to: '/admin/sundays',    icon: Sun,             key: 'sundays' },
  { label: 'Seasons',    to: '/admin/seasons',    icon: Layers,          key: 'seasons' },
  { label: 'Members',    to: '/admin/members',    icon: Users,           key: 'members' },
  { label: 'Messages',   to: '/admin/messages',   icon: MessageSquare,   key: 'messages' },
]

export default function AdminSidebar() {
  const navigate = useNavigate()
  const user = getStoredUser()
  const visibleNav = user.adminTabs
    ? NAV.filter((item) => user.adminTabs.includes(item.key))
    : NAV

  return (
    <aside className="flex w-52 shrink-0 flex-col border-r border-border bg-surface">
      <div className="px-4 py-5">
        <p className="text-[11px] font-semibold uppercase tracking-widest text-zinc-500">Admin Panel</p>
      </div>

      <nav className="flex-1 overflow-y-auto px-2 pb-2">
        {visibleNav.map(({ label, to, icon: Icon, end }) => (
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
