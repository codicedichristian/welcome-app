import { useEffect, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { getEvents } from '../lib/api.js'
import { events as fallbackEvents } from '../data/events.js'
import { getOccurrencesInMonth, normalizeColor, normalizeEvent } from '../lib/events.js'
import { EVENT_COLOR_CLASSES } from '../lib/eventColors.js'
import { capitalize } from '../lib/format.js'
import EventListItem from '../components/EventListItem.jsx'
import Spinner from '../components/Spinner.jsx'
import ErrorState from '../components/ErrorState.jsx'

const DAY_HEADERS = ['M', 'T', 'W', 'T', 'F', 'S', 'S']

function isSameDay(a, b) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
}

function startOfMonth(date) {
  return new Date(date.getFullYear(), date.getMonth(), 1)
}

const today = new Date()

export default function EventsPage() {
  const [currentMonth, setCurrentMonth] = useState(startOfMonth(today))
  const [selectedDate, setSelectedDate] = useState(today)
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

  const year = currentMonth.getFullYear()
  const month = currentMonth.getMonth()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const leadingEmpty = (new Date(year, month, 1).getDay() + 6) % 7

  const occurrencesByDay = events.reduce((acc, event) => {
    for (const day of getOccurrencesInMonth(event, year, month)) {
      (acc[day] ??= []).push(event)
    }
    return acc
  }, {})

  const changeMonth = (delta) => {
    setCurrentMonth(new Date(year, month + delta, 1))
    setSelectedDate(null)
  }

  const monthLabel = currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })

  const selectedEvents = selectedDate
    ? (occurrencesByDay[selectedDate.getDate()] ?? []).map((event) => normalizeEvent(event, selectedDate))
    : []

  return (
    <div className="px-4 pt-6 pb-6">
      <h1 className="text-[15px] font-medium text-primary">Events</h1>

      {loading ? (
        <Spinner />
      ) : error ? (
        <ErrorState />
      ) : (
        <>
          <div className="mt-5 flex items-center justify-between">
            <button type="button" onClick={() => changeMonth(-1)} aria-label="Previous month" className="text-zinc-500">
              <ChevronLeft size={18} />
            </button>
            <p className="text-xs text-primary">{monthLabel}</p>
            <button type="button" onClick={() => changeMonth(1)} aria-label="Next month" className="text-zinc-500">
              <ChevronRight size={18} />
            </button>
          </div>

          <div className="mt-4 grid grid-cols-7 gap-y-1.5">
            {DAY_HEADERS.map((label, index) => (
              <div key={index} className="text-center text-[8px] text-[#555]">
                {label}
              </div>
            ))}

            {Array.from({ length: leadingEmpty }).map((_, index) => (
              <div key={`empty-${index}`} />
            ))}

            {Array.from({ length: daysInMonth }).map((_, index) => {
              const day = index + 1
              const date = new Date(year, month, day)
              const isToday = isSameDay(date, today)
              const isSelected = selectedDate ? isSameDay(date, selectedDate) : false
              const dots = (occurrencesByDay[day] ?? []).slice(0, 3)

              return (
                <button
                  key={day}
                  type="button"
                  onClick={() => setSelectedDate(date)}
                  className="flex flex-col items-center gap-1 py-1"
                >
                  <span
                    className={`flex h-6 w-6 items-center justify-center rounded-full text-[11px] ${
                      isSelected
                        ? 'bg-primary font-medium text-bg'
                        : isToday
                          ? 'border border-primary text-[#aaa]'
                          : 'text-[#aaa]'
                    }`}
                  >
                    {day}
                  </span>
                  <span className="flex h-1.5 items-center gap-0.5">
                    {dots.map((event, dotIndex) => (
                      <span key={dotIndex} className={`h-1 w-1 rounded-full ${EVENT_COLOR_CLASSES[normalizeColor(event.color)].dot}`} />
                    ))}
                  </span>
                </button>
              )
            })}
          </div>

          <div className="mt-4 flex flex-wrap gap-x-3 gap-y-1.5">
            {events.map((event) => (
              <div key={event.id} className="flex items-center gap-1.5">
                <span className={`h-1.5 w-1.5 rounded-full ${EVENT_COLOR_CLASSES[normalizeColor(event.color)].dot}`} />
                <span className="text-[9px] text-[#666]">{capitalize(event.type)}</span>
              </div>
            ))}
          </div>

          <div className="my-4 border-t border-border" />

          <div>
            {selectedDate && (
              <p className="text-[10px] text-zinc-500">
                {selectedDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
              </p>
            )}

            {selectedDate && selectedEvents.length === 0 && <p className="mt-3 text-[10px] text-zinc-500">No events today</p>}

            {selectedEvents.length > 0 && (
              <div className="mt-3 flex flex-col gap-2">
                {selectedEvents.map((event) => (
                  <EventListItem key={event.id} event={event} />
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
