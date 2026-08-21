import { useEffect, useState } from 'react'
import { CalendarX } from 'lucide-react'
import { useScrollMemory } from '../hooks/useScrollMemory.js'
import { getUserRsvps, getUserMidweekRsvp } from '../lib/api.js'
import { getEventById } from '../data/events.js'
import { normalizeEvent } from '../lib/events.js'
import { getStoredUser } from '../lib/user.js'
import BackRow from '../components/BackRow.jsx'
import EventListItem from '../components/EventListItem.jsx'
import Spinner from '../components/Spinner.jsx'

function withMidweekGroup(event, group) {
  if (!group) return event

  return {
    ...event,
    name: group.host,
    subtitle: `${group.zone} · ${group.address}`,
    meta: `+${group.phone}`,
    to: '/midweek',
    selectedGroupId: group.id,
  }
}

export default function MyEventsPage() {
  useScrollMemory()
  const [myEvents, setMyEvents] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    async function load() {
      const user = getStoredUser()

      if (user.id) {
        const [{ data: rsvps, error: rsvpsError }, { data: midweekRsvp }] = await Promise.all([
          getUserRsvps(user.id),
          getUserMidweekRsvp(user.id),
        ])

        if (!cancelled) {
          const events = (!rsvpsError && rsvps)
            ? rsvps.filter((row) => row.event).map((row) => normalizeEvent(row.event))
            : []

          if (midweekRsvp?.group) {
            events.push(withMidweekGroup(normalizeEvent(getEventById('midweek')), midweekRsvp.group))
          }

          setMyEvents(events)
          setLoading(false)
        }
      } else {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <div className="page-transition min-h-dvh bg-bg px-4 pb-8" style={{ paddingTop: 'calc(env(safe-area-inset-top) + 24px)' }}>
      <BackRow label="Home" />

      <h1 className="mt-4 text-[26px] font-bold text-primary">My Events</h1>
      <p className="mt-1 text-[13px] text-zinc-500">Events you're going to</p>

      {loading ? (
        <Spinner />
      ) : myEvents.length === 0 ? (
        <div className="mt-16 flex flex-col items-center text-center">
          <CalendarX size={36} className="text-zinc-600" />
          <p className="mt-3 text-[18px] text-primary">No events yet</p>
          <p className="mt-1 text-[14px] text-zinc-500">Tap "I'll be there" on any event to save it here</p>
        </div>
      ) : (
        <div className="mt-4 flex flex-col gap-2">
          {myEvents.map((event) => (
            <EventListItem key={event.id} event={event} to={event.to} />
          ))}
        </div>
      )}
    </div>
  )
}
