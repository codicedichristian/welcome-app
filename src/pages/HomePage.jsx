import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Clock, MapPin, ArrowUpRight, CalendarCheck } from 'lucide-react'
import { getEvents } from '../lib/api.js'
import { events as fallbackEvents } from '../data/events.js'
import { getNextOccurrence, normalizeEvent } from '../lib/events.js'
import { getStoredUser } from '../lib/user.js'
import { announcement } from '../data/home.js'
import EventListItem from '../components/EventListItem.jsx'
import Spinner from '../components/Spinner.jsx'
import ErrorState from '../components/ErrorState.jsx'

export default function HomePage() {
  const navigate = useNavigate()
  const user = getStoredUser()

  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    let cancelled = false

    async function load() {
      const { data, error: apiError } = await getEvents()
      if (cancelled) return

      if (apiError || !data || data.length === 0) {
        setEvents(fallbackEvents)
        setError(Boolean(apiError) && fallbackEvents.length === 0)
      } else {
        setEvents(data)
      }
      setLoading(false)
    }

    load()
    return () => {
      cancelled = true
    }
  }, [])

  const upcoming = events
    .map((event) => ({ event, date: getNextOccurrence(event) }))
    .filter((item) => item.date)
    .sort((a, b) => a.date - b.date)

  const nextEvent = upcoming[0] ? normalizeEvent(upcoming[0].event, upcoming[0].date) : null
  const upcomingEvents = upcoming.slice(1, 3).map((item) => normalizeEvent(item.event, item.date))

  return (
    <div className="px-4 pb-8">
      <p className="text-[14px]" style={{ color: '#888' }}>
        Welcome home, {user.firstName}
      </p>

      {loading ? (
        <Spinner />
      ) : error ? (
        <ErrorState />
      ) : (
        <>
          {nextEvent && (
            <button
              type="button"
              onClick={() => navigate(`/events/${nextEvent.id}`, { state: { event: nextEvent } })}
              className="mt-4 block w-full rounded-xl bg-primary p-4 text-left"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="text-[13px] text-zinc-500">Next event</p>
                  <h2 className="mt-1 text-[22px] font-bold text-bg">{nextEvent.name}</h2>
                  <div className="mt-3 flex flex-col gap-1.5">
                    <div className="flex items-center gap-2 text-[15px] text-zinc-600">
                      <Clock size={15} />
                      <span>{nextEvent.time}</span>
                    </div>
                    <div className="flex items-center gap-2 text-[15px] text-zinc-600">
                      <MapPin size={15} />
                      <span>{nextEvent.location}</span>
                    </div>
                  </div>
                </div>
                <div className="flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-xl bg-[#f0f0f0] leading-none text-bg">
                  <span className="text-[28px] font-bold leading-none">{nextEvent.day}</span>
                  <span className="mt-0.5 text-[13px] uppercase leading-none">{nextEvent.month}</span>
                </div>
              </div>
              <div className="mt-4 flex justify-end">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-bg">
                  <ArrowUpRight size={16} className="text-primary" />
                </div>
              </div>
            </button>
          )}

          <section className="mt-6">
            <div className="flex items-center justify-between">
              <h3 className="text-[17px] font-semibold text-primary">Upcoming events</h3>
              <button type="button" onClick={() => navigate('/events')} className="text-[14px] text-zinc-500">
                See all
              </button>
            </div>
            <div className="mt-3 flex flex-col gap-2">
              {upcomingEvents.map((event) => (
                <EventListItem key={event.id} event={event} />
              ))}
            </div>
          </section>
        </>
      )}

      <section className="mt-6">
        <div className="flex items-center justify-between">
          <h3 className="text-[17px] font-semibold text-primary">Announcements</h3>
          <button type="button" onClick={() => navigate('/news')} className="text-[14px] text-zinc-500">
            See all
          </button>
        </div>
        <div className="mt-3 rounded-xl border border-border bg-surface p-4">
          <p className="text-[15px] font-medium text-primary">{announcement.title}</p>
          <p className="mt-1 text-[13px] text-zinc-500">{announcement.body}</p>
        </div>
      </section>

      <button
        type="button"
        onClick={() => navigate('/my-events')}
        className="mt-4 flex w-full items-center gap-2 rounded-xl border border-border bg-surface px-4 py-3.5"
      >
        <CalendarCheck size={17} className="text-zinc-500" />
        <span className="text-[15px] text-primary">My Events</span>
        <ArrowUpRight size={15} className="ml-auto text-zinc-600" />
      </button>
    </div>
  )
}
