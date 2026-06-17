import { useEffect, useState } from 'react'
import { CalendarX } from 'lucide-react'
import { getUserRsvps, getUserMidweekRsvp, getMidweekGroups } from '../lib/api.js'
import { events as fallbackEvents, getEventById } from '../data/events.js'
import { midweeks as fallbackMidweeks } from '../data/midweeks.js'
import { normalizeEvent } from '../lib/events.js'
import { getRsvpIds, getMidweekGroupId } from '../lib/rsvp.js'
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

        if (!cancelled && !rsvpsError && rsvps) {
          const events = rsvps.filter((row) => row.event).map((row) => normalizeEvent(row.event))

          if (midweekRsvp?.group) {
            events.push(withMidweekGroup(normalizeEvent(getEventById('midweek')), midweekRsvp.group))
          }

          setMyEvents(events)
          setLoading(false)
          return
        }
      }

      if (cancelled) return

      const { data: liveGroups } = await getMidweekGroups()
      const groups = liveGroups?.length ? liveGroups : fallbackMidweeks

      const rsvpIds = getRsvpIds()
      const myFallbackEvents = fallbackEvents
        .filter((event) => rsvpIds.includes(event.id))
        .map((event) => {
          const normalized = normalizeEvent(event)
          if (normalized.type !== 'midweek') return normalized

          const group = groups.find((g) => String(g.id) === String(getMidweekGroupId()))
          return withMidweekGroup(normalized, group)
        })

      setMyEvents(myFallbackEvents)
      setLoading(false)
    }

    load()
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <div className="min-h-dvh bg-bg px-4 pt-6 pb-8">
      <BackRow label="Home" />

      <h1 className="mt-4 text-[20px] font-medium text-primary">My Events</h1>
      <p className="mt-1 text-[12px] text-zinc-500">Events you're going to</p>

      {loading ? (
        <Spinner />
      ) : myEvents.length === 0 ? (
        <div className="mt-16 flex flex-col items-center text-center">
          <CalendarX size={32} className="text-zinc-600" />
          <p className="mt-3 text-[14px] text-primary">No events yet</p>
          <p className="mt-1 text-[12px] text-zinc-500">Tap "I'll be there" on any event to save it here</p>
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
