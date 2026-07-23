import { useCallback, useEffect, useState } from 'react'
import { ChevronLeft, ChevronRight, RefreshCw, Plus } from 'lucide-react'
import { getEvents } from '../lib/api.js'
import BackRow from '../components/BackRow.jsx'
import { events as fallbackEvents } from '../data/events.js'
import { getOccurrencesInMonth } from '../lib/events.js'
import { getStoredUser } from '../lib/user.js'
import { formatTime12h } from '../lib/format.js'

const CARD_BG = 'oklch(0.18 0.006 260)'

const CAT_COLOR = {
  sunday:  'oklch(0.85 0.005 260)',
  youth:   'oklch(0.65 0.14 150)',
  midweek: 'oklch(0.6 0.01 260)',
  prayer:  'oklch(0.62 0.18 300)',
  special: 'oklch(0.65 0.14 150)',
}

const DAY_NAMES = ['S', 'M', 'T', 'W', 'T', 'F', 'S']

const TODAY = new Date()

function isSameDay(a, b) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  )
}

function getEventsOnDate(allEvents, date) {
  if (!date) return []
  const y = date.getFullYear()
  const m = date.getMonth()
  const d = date.getDate()
  return allEvents.filter((ev) => getOccurrencesInMonth(ev, y, m).includes(d))
}

export default function EventsPage() {
  const user = getStoredUser()
  const initials = `${user.firstName?.[0] ?? ''}${user.lastName?.[0] ?? ''}`.toUpperCase()

  const [currentMonth, setCurrentMonth] = useState(
    new Date(TODAY.getFullYear(), TODAY.getMonth(), 1),
  )
  const [selectedDate, setSelectedDate] = useState(TODAY)
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const loadEvents = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true)
    const { data } = await getEvents()
    setEvents(data?.length ? data : fallbackEvents)
    if (isRefresh) setRefreshing(false)
    else setLoading(false)
  }, [])

  useEffect(() => {
    loadEvents()
  }, [loadEvents])

  const year = currentMonth.getFullYear()
  const month = currentMonth.getMonth()

  const firstDow = new Date(year, month, 1).getDay() // 0 = Sunday
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const prevMonthDays = new Date(year, month, 0).getDate()
  const totalCells = Math.ceil((firstDow + daysInMonth) / 7) * 7

  // Build flat grid cells
  const cells = []
  for (let i = firstDow - 1; i >= 0; i--) {
    const d = prevMonthDays - i
    cells.push({ day: d, outside: true, date: new Date(year, month - 1, d) })
  }
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({ day: d, outside: false, date: new Date(year, month, d) })
  }
  for (let d = 1; cells.length < totalCells; d++) {
    cells.push({ day: d, outside: true, date: new Date(year, month + 1, d) })
  }

  // Occurrences for the current calendar month (for rings)
  const occByDay = events.reduce((acc, ev) => {
    for (const d of getOccurrencesInMonth(ev, year, month)) {
      ;(acc[d] ??= []).push(ev)
    }
    return acc
  }, {})

  const changeMonth = (delta) => {
    setCurrentMonth(new Date(year, month + delta, 1))
  }

  const monthLabel = currentMonth.toLocaleDateString('en-US', { month: 'long' })

  // Events section data
  const selEvents = getEventsOnDate(events, selectedDate)
  const nextDate = selectedDate
    ? new Date(
        selectedDate.getFullYear(),
        selectedDate.getMonth(),
        selectedDate.getDate() + 1,
      )
    : null
  const nextEvents = getEventsOnDate(events, nextDate)

  const dayGroups = []
  if (selectedDate) dayGroups.push({ date: selectedDate, evs: selEvents })
  if (nextDate && nextEvents.length > 0) dayGroups.push({ date: nextDate, evs: nextEvents })

  return (
    <div
      style={{
        fontFamily:
          "-apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif",
        paddingTop: '8px',
      }}
    >
      {/* Back button */}
      <div style={{ padding: '0 16px 10px' }}>
        <BackRow label="Home" />
      </div>

      {/* ── Calendar card ── */}
      <div
        style={{
          margin: '0 12px',
          background: CARD_BG,
          borderRadius: '32px',
          border: '1px solid oklch(0.26 0.006 260)',
          boxShadow: '0 40px 80px rgba(0,0,0,0.5)',
          padding: '20px',
        }}
      >
        {/* Header row */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '16px',
          }}
        >
          <div
            style={{
              width: '34px',
              height: '34px',
              borderRadius: '50%',
              background: 'oklch(0.28 0.008 260)',
              border: '1px solid oklch(0.35 0.008 260)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '13px',
              fontWeight: '600',
              color: 'oklch(0.75 0.006 260)',
              flexShrink: 0,
            }}
          >
            {initials || '?'}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <button
              type="button"
              onClick={() => loadEvents(true)}
              aria-label="Refresh events"
              style={{
                background: 'none',
                border: 'none',
                padding: 0,
                cursor: 'pointer',
                display: 'flex',
                opacity: refreshing ? 0.4 : 1,
              }}
            >
              <RefreshCw size={18} color="oklch(0.55 0.01 260)" />
            </button>
            <button
              type="button"
              aria-label="Add event"
              style={{
                background: 'none',
                border: 'none',
                padding: 0,
                cursor: 'pointer',
                display: 'flex',
              }}
            >
              <Plus size={18} color="oklch(0.55 0.01 260)" />
            </button>
          </div>
        </div>

        {/* Month title row */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            marginBottom: '16px',
          }}
        >
          <button
            type="button"
            onClick={() => changeMonth(-1)}
            aria-label="Previous month"
            style={{
              background: 'none',
              border: 'none',
              padding: '4px',
              cursor: 'pointer',
              display: 'flex',
              color: 'oklch(0.55 0.01 260)',
              flexShrink: 0,
            }}
          >
            <ChevronLeft size={20} />
          </button>
          <h2
            style={{
              flex: 1,
              margin: '0 4px',
              fontSize: '26px',
              fontWeight: '700',
              color: 'oklch(0.95 0.005 260)',
              letterSpacing: '-0.02em',
              lineHeight: 1,
            }}
          >
            {monthLabel}
          </h2>
          <button
            type="button"
            onClick={() => changeMonth(1)}
            aria-label="Next month"
            style={{
              background: 'none',
              border: 'none',
              padding: '4px',
              cursor: 'pointer',
              display: 'flex',
              color: 'oklch(0.55 0.01 260)',
              flexShrink: 0,
            }}
          >
            <ChevronRight size={20} />
          </button>
        </div>

        {/* Weekday headers */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(7, 1fr)',
            marginBottom: '6px',
          }}
        >
          {DAY_NAMES.map((name, i) => (
            <div
              key={i}
              style={{
                textAlign: 'center',
                fontSize: '11px',
                fontWeight: '600',
                color: 'oklch(0.42 0.008 260)',
                paddingBottom: '4px',
              }}
            >
              {name}
            </div>
          ))}
        </div>

        {/* Day grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(7, 1fr)',
            rowGap: '10px',
          }}
        >
          {cells.map((cell, idx) => {
            if (cell.outside) {
              return (
                <div
                  key={idx}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    height: '32px',
                  }}
                >
                  <span
                    style={{
                      fontSize: '14px',
                      fontWeight: '500',
                      color: 'oklch(0.35 0.006 260)',
                    }}
                  >
                    {cell.day}
                  </span>
                </div>
              )
            }

            const dayEvs = occByDay[cell.day] ?? []
            const isToday = isSameDay(cell.date, TODAY)
            const isSelected = selectedDate ? isSameDay(cell.date, selectedDate) : false

            // Unique categories (max 2)
            const cats = [...new Set(dayEvs.map((e) => e.type))].slice(0, 2)

            // Build combined box-shadow
            const shadows = []
            if (isToday) shadows.push('0 0 0 1.5px oklch(0.97 0.005 260)')
            if (cats.length === 1) {
              shadows.push(`0 0 0 2px ${CAT_COLOR[cats[0]] ?? 'oklch(0.55 0.01 260)'}`)
            } else if (cats.length >= 2) {
              const c1 = CAT_COLOR[cats[0]] ?? 'oklch(0.55 0.01 260)'
              const c2 = CAT_COLOR[cats[1]] ?? 'oklch(0.55 0.01 260)'
              shadows.push(
                `0 0 0 2px ${c1}`,
                `0 0 0 4.5px ${CARD_BG}`,
                `0 0 0 6.5px ${c2}`,
              )
            }

            return (
              <button
                key={idx}
                type="button"
                onClick={() => setSelectedDate(cell.date)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: 'none',
                  border: 'none',
                  padding: 0,
                  cursor: 'pointer',
                }}
              >
                <div
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: isSelected ? 'oklch(0.3 0.01 260)' : 'transparent',
                    boxShadow: shadows.length > 0 ? shadows.join(', ') : undefined,
                  }}
                >
                  <span
                    style={{
                      fontSize: '14px',
                      fontWeight: isSelected || isToday ? '700' : '500',
                      color:
                        isSelected || isToday
                          ? 'oklch(0.97 0.005 260)'
                          : 'oklch(0.72 0.006 260)',
                    }}
                  >
                    {cell.day}
                  </span>
                </div>
              </button>
            )
          })}
        </div>

        {/* Today button */}
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: '18px' }}>
          <button
            type="button"
            onClick={() => {
              setCurrentMonth(new Date(TODAY.getFullYear(), TODAY.getMonth(), 1))
              setSelectedDate(TODAY)
            }}
            style={{
              background: 'transparent',
              border: '1px solid oklch(0.34 0.008 260)',
              borderRadius: '999px',
              color: 'oklch(0.85 0.006 260)',
              fontSize: '13px',
              fontWeight: '600',
              padding: '8px 18px',
              cursor: 'pointer',
            }}
          >
            Today
          </button>
        </div>
      </div>

      {/* ── Events section ── */}
      <div
        style={{
          marginTop: '12px',
          background: 'oklch(0.15 0.005 260)',
          borderTop: '1px solid oklch(0.24 0.006 260)',
          borderRadius: '24px 24px 0 0',
          padding: '18px 20px 26px',
          minHeight: '160px',
        }}
      >
        {loading ? (
          <p
            style={{
              color: 'oklch(0.5 0.008 260)',
              fontSize: '14px',
              textAlign: 'center',
            }}
          >
            Loading…
          </p>
        ) : dayGroups.length === 0 || dayGroups.every((g) => g.evs.length === 0) ? (
          <p
            style={{
              color: 'oklch(0.5 0.008 260)',
              fontSize: '14px',
              textAlign: 'center',
            }}
          >
            No events on this day
          </p>
        ) : (
          dayGroups.map((group, gi) => {
            const dayName = group.date
              .toLocaleDateString('en-US', { weekday: 'long' })
              .toUpperCase()
            const dayNum = group.date.getDate()

            return (
              <div key={gi} style={{ marginTop: gi > 0 ? '20px' : 0 }}>
                {/* Day heading */}
                <p
                  style={{
                    fontSize: '11px',
                    fontWeight: '700',
                    letterSpacing: '0.06em',
                    textTransform: 'uppercase',
                    color: 'oklch(0.5 0.008 260)',
                    margin: '0 0 12px',
                  }}
                >
                  {dayName} {dayNum}
                </p>

                {group.evs.length === 0 ? (
                  <p style={{ fontSize: '13px', color: 'oklch(0.45 0.008 260)' }}>
                    No events
                  </p>
                ) : (
                  group.evs.map((ev, ei) => {
                    const startTime = formatTime12h(ev.start_time)
                    const endTime = formatTime12h(ev.end_time)
                    const catColor = CAT_COLOR[ev.type] ?? 'oklch(0.55 0.01 260)'

                    return (
                      <div
                        key={`${ev.id}-${ei}`}
                        style={{
                          display: 'grid',
                          gridTemplateColumns: '52px 10px 1fr',
                          columnGap: '10px',
                          alignItems: 'start',
                          marginTop: ei > 0 ? '12px' : 0,
                        }}
                      >
                        {/* Time */}
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <span
                            style={{
                              fontSize: '12px',
                              color: 'oklch(0.55 0.008 260)',
                              lineHeight: 1.4,
                            }}
                          >
                            {startTime || '—'}
                          </span>
                          {endTime && (
                            <span
                              style={{
                                fontSize: '12px',
                                color: 'oklch(0.55 0.008 260)',
                                lineHeight: 1.4,
                              }}
                            >
                              {endTime}
                            </span>
                          )}
                        </div>

                        {/* Dot */}
                        <div style={{ paddingTop: '4px' }}>
                          <div
                            style={{
                              width: '8px',
                              height: '8px',
                              borderRadius: '50%',
                              background: catColor,
                            }}
                          />
                        </div>

                        {/* Title + description */}
                        <div>
                          <p
                            style={{
                              fontSize: '14px',
                              fontWeight: '600',
                              color: 'oklch(0.94 0.005 260)',
                              margin: '0 0 2px',
                            }}
                          >
                            {ev.title}
                          </p>
                          {ev.description && (
                            <p
                              style={{
                                fontSize: '12px',
                                color: 'oklch(0.55 0.008 260)',
                                lineHeight: 1.5,
                                margin: 0,
                              }}
                            >
                              {ev.description}
                            </p>
                          )}
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
