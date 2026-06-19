import { useEffect, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { getEvents } from '../lib/api.js'
import BackRow from '../components/BackRow.jsx'
import { events as fallbackEvents } from '../data/events.js'
import { getOccurrencesInMonth, normalizeColor, normalizeEvent } from '../lib/events.js'
import { EVENT_COLOR_CLASSES } from '../lib/eventColors.js'
import { capitalize } from '../lib/format.js'
import EventListItem from '../components/EventListItem.jsx'
import Spinner from '../components/Spinner.jsx'
import ErrorState from '../components/ErrorState.jsx'

const DAY_HEADERS = ['M', 'T', 'W', 'T', 'F', 'S', 'S']

const COLOR_HEX = {
  white: '#ffffff',
  green: '#4caf7d',
  blue: '#5b8cff',
  purple: '#a78bfa',
  orange: '#f97316',
}

function isSameDay(a, b) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
}

function startOfMonth(date) {
  return new Date(date.getFullYear(), date.getMonth(), 1)
}

function DayCircle({ day, eventColors, isToday, isSelected }) {
  const SIZE = 40
  const R = 20
  const C = 20
  const n = Math.min(eventColors.length, 3)
  const hexColors = eventColors.slice(0, 3).map((c) => COLOR_HEX[c] ?? '#888888')

  let textColor = '#aaaaaa'
  let fontWeight = '600'

  if (isSelected) {
    textColor = '#0f0f0f'
    fontWeight = '700'
  } else if (isToday) {
    textColor = '#ffffff'
    fontWeight = '600'
  } else if (n === 1 && eventColors[0] === 'white') {
    textColor = '#0f0f0f'
    fontWeight = '700'
  } else if (n > 0) {
    textColor = '#ffffff'
    fontWeight = '700'
  }

  let bg = null
  if (isSelected) {
    bg = <circle cx={C} cy={C} r={R} fill="#ffffff" />
  } else if (n === 1) {
    bg = <circle cx={C} cy={C} r={R} fill={hexColors[0]} />
  } else if (n === 2) {
    bg = (
      <>
        <path d={`M ${C} ${C} L ${C} 0 A ${R} ${R} 0 0 0 ${C} ${SIZE} Z`} fill={hexColors[0]} />
        <path d={`M ${C} ${C} L ${C} 0 A ${R} ${R} 0 0 1 ${C} ${SIZE} Z`} fill={hexColors[1]} />
      </>
    )
  } else if (n === 3) {
    const pts = [-90, 30, 150].map((deg) => {
      const rad = (deg * Math.PI) / 180
      return [+(C + R * Math.cos(rad)).toFixed(2), +(C + R * Math.sin(rad)).toFixed(2)]
    })
    bg = (
      <>
        <path
          d={`M ${C} ${C} L ${pts[0][0]} ${pts[0][1]} A ${R} ${R} 0 0 1 ${pts[1][0]} ${pts[1][1]} Z`}
          fill={hexColors[0]}
        />
        <path
          d={`M ${C} ${C} L ${pts[1][0]} ${pts[1][1]} A ${R} ${R} 0 0 1 ${pts[2][0]} ${pts[2][1]} Z`}
          fill={hexColors[1]}
        />
        <path
          d={`M ${C} ${C} L ${pts[2][0]} ${pts[2][1]} A ${R} ${R} 0 0 1 ${pts[0][0]} ${pts[0][1]} Z`}
          fill={hexColors[2]}
        />
      </>
    )
  }

  return (
    <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`}>
      {bg}
      {isToday && !isSelected && (
        <circle cx={C} cy={C} r={R - 1} fill="none" stroke="#ffffff" strokeWidth={1.5} />
      )}
      <text
        x={C}
        y={C}
        textAnchor="middle"
        dominantBaseline="central"
        fill={textColor}
        fontSize={18}
        fontFamily="system-ui, -apple-system, sans-serif"
        fontWeight={fontWeight}
      >
        {day}
      </text>
    </svg>
  )
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
      ;(acc[day] ??= []).push(event)
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
    <div className="flex min-h-dvh flex-col px-4 pt-3 pb-6">
      <BackRow label="Home" />

      {loading ? (
        <Spinner />
      ) : error ? (
        <ErrorState />
      ) : (
        <>
          <div className="flex items-center justify-between">
            <button type="button" onClick={() => changeMonth(-1)} aria-label="Previous month" className="text-zinc-500">
              <ChevronLeft size={22} />
            </button>
            <p className="text-[20px] font-semibold text-primary">{monthLabel}</p>
            <button type="button" onClick={() => changeMonth(1)} aria-label="Next month" className="text-zinc-500">
              <ChevronRight size={22} />
            </button>
          </div>

          <div className="mt-3 grid grid-cols-7">
            {DAY_HEADERS.map((label, index) => (
              <div key={index} className="flex items-center justify-center py-1 text-[13px] text-[#555]">
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
              const dayEventColors = (occurrencesByDay[day] ?? []).slice(0, 3).map((e) => normalizeColor(e.color))

              return (
                <button
                  key={day}
                  type="button"
                  onClick={() => setSelectedDate(date)}
                  className="flex items-center justify-center py-0.5"
                >
                  <DayCircle day={day} eventColors={dayEventColors} isToday={isToday} isSelected={isSelected} />
                </button>
              )
            })}
          </div>

          <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1.5">
            {events.map((event) => (
              <div key={event.id} className="flex items-center gap-1.5">
                <span className={`h-2 w-2 rounded-full ${EVENT_COLOR_CLASSES[normalizeColor(event.color)].dot}`} />
                <span className="text-[13px] text-[#666]">{capitalize(event.type)}</span>
              </div>
            ))}
          </div>

          <div className="mt-3">
            {selectedDate && (
              <p className="text-[15px] font-medium text-primary">
                {selectedDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
              </p>
            )}

            {selectedDate && selectedEvents.length === 0 && (
              <p className="mt-4 text-center text-[15px] text-zinc-500">No events today</p>
            )}

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
