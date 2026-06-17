import { useEffect, useState } from 'react'
import { Users, CalendarDays, Megaphone, Home } from 'lucide-react'
import { adminGetStats } from '../../lib/api.js'
import { getNextOccurrence } from '../../lib/events.js'
import Spinner from '../../components/Spinner.jsx'
import ErrorState from '../../components/ErrorState.jsx'

function countUpcomingThisWeek(events) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const weekEnd = new Date(today)
  weekEnd.setDate(weekEnd.getDate() + 7)

  return events.filter((event) => {
    const next = getNextOccurrence(event, today)
    return next && next >= today && next <= weekEnd
  }).length
}

export default function AdminDashboard() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    let cancelled = false

    async function load() {
      const { data, error: apiError } = await adminGetStats()
      if (cancelled) return

      if (apiError || !data) {
        setError(true)
      } else {
        setStats(data)
      }
      setLoading(false)
    }

    load()
    return () => {
      cancelled = true
    }
  }, [])

  if (loading) return <Spinner />
  if (error || !stats) return <ErrorState />

  const cards = [
    { label: 'Total members', value: stats.totalMembers, icon: Users, color: 'text-accent-blue' },
    { label: 'Upcoming events', value: countUpcomingThisWeek(stats.events), icon: CalendarDays, color: 'text-accent-green' },
    { label: 'Total news', value: stats.totalNews, icon: Megaphone, color: 'text-accent-orange' },
    { label: 'Active midweek groups', value: stats.activeMidweekGroups, icon: Home, color: 'text-accent-purple' },
  ]

  return (
    <div>
      <h1 className="text-lg font-medium text-primary">Dashboard</h1>

      <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="rounded-2xl border border-border bg-surface p-4">
            <Icon size={20} className={color} />
            <p className="mt-3 text-3xl font-semibold text-primary">{value}</p>
            <p className="mt-1 text-xs text-zinc-500">{label}</p>
          </div>
        ))}
      </div>

      <section className="mt-8">
        <h2 className="text-sm font-medium text-primary">Recent activity</h2>
        <div className="mt-3 overflow-hidden rounded-2xl border border-border bg-surface">
          {stats.recentMembers.length === 0 ? (
            <p className="px-4 py-4 text-xs text-zinc-500">No members yet</p>
          ) : (
            stats.recentMembers.map((member, index) => (
              <div
                key={`${member.email}-${index}`}
                className={`flex items-center justify-between px-4 py-3 ${
                  index !== stats.recentMembers.length - 1 ? 'border-b border-border' : ''
                }`}
              >
                <div>
                  <p className="text-sm text-primary">
                    {member.first_name} {member.last_name}
                  </p>
                  <p className="mt-0.5 text-xs text-zinc-500">{member.email}</p>
                </div>
                <p className="text-xs text-zinc-500">{new Date(member.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  )
}
