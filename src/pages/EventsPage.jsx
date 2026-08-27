import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft, ChevronRight, ArrowLeft, Clock, MapPin, Bookmark } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { getEvents, rsvpEvent } from '../lib/api.js'
import { SkeletonText } from '../components/SkeletonCard.jsx'
import { events as fallbackEvents } from '../data/events.js'
import { getOccurrencesInMonth } from '../lib/events.js'
import { getStoredUser } from '../lib/user.js'
import { formatTime12h } from '../lib/format.js'
import { isRsvped, addRsvp } from '../lib/rsvp.js'

const FONT = '"Helvetica Neue", Helvetica, "SF Pro Text", system-ui, sans-serif'

const CAT_COLOR = {
  sunday:  'oklch(0.64 0.18 232)',
  service: 'oklch(0.64 0.18 232)',
  youth:   'oklch(0.64 0.18 152)',
  midweek: 'oklch(0.64 0.18 292)',
  prayer:  'oklch(0.64 0.18 42)',
  special: 'oklch(0.64 0.18 42)',
}

const CHIP_TYPE = {
  Midweek: 'midweek',
  Service: 'sunday',
  Youth:   'youth',
  Prayer:  'prayer',
}

const DAY_NAMES = ['M', 'T', 'W', 'T', 'F', 'S', 'S']
const CATEGORIES = ['All', 'Midweek', 'Service', 'Youth', 'Prayer']
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

function dayLabel(date) {
  const weekday = date.toLocaleDateString('en-US', { weekday: 'long' }).toUpperCase()
  return `${weekday} ${date.getDate()}`
}

export default function EventsPage() {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const user = getStoredUser()
  const initials = `${user.firstName?.[0] ?? ''}${user.lastName?.[0] ?? ''}`.toUpperCase()

  const [currentMonth, setCurrentMonth] = useState(
    new Date(TODAY.getFullYear(), TODAY.getMonth(), 1),
  )
  const [selectedDate, setSelectedDate] = useState(TODAY)
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeCategory, setActiveCategory] = useState('All')
  const [detailEvent, setDetailEvent] = useState(null)
  const [overlayGoing, setOverlayGoing] = useState(false)

  const loadEvents = useCallback(async () => {
    const { data } = await getEvents()
    setEvents(data?.length ? data : fallbackEvents)
    setLoading(false)
  }, [])

  useEffect(() => { loadEvents() }, [loadEvents])

  useEffect(() => {
    if (detailEvent) setOverlayGoing(isRsvped(detailEvent.id))
  }, [detailEvent])

  const year = currentMonth.getFullYear()
  const month = currentMonth.getMonth()

  const firstDow = (new Date(year, month, 1).getDay() + 6) % 7
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const prevMonthDays = new Date(year, month, 0).getDate()
  const totalCells = Math.ceil((firstDow + daysInMonth) / 7) * 7

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

  const filteredEvents = activeCategory === 'All'
    ? events
    : events.filter((ev) => ev.type === CHIP_TYPE[activeCategory])

  const occByDay = filteredEvents.reduce((acc, ev) => {
    for (const d of getOccurrencesInMonth(ev, year, month)) {
      ;(acc[d] ??= []).push(ev)
    }
    return acc
  }, {})

  const changeMonth = (delta) => setCurrentMonth(new Date(year, month + delta, 1))

  const monthName = currentMonth.toLocaleDateString('en-US', { month: 'long' })

  const selEvents = getEventsOnDate(filteredEvents, selectedDate)

  const handleOverlayRsvp = () => {
    if (!detailEvent) return
    if (detailEvent.type === 'midweek') {
      navigate('/midweek')
      return
    }
    addRsvp(detailEvent.id)
    setOverlayGoing(true)
    const u = getStoredUser()
    if (u.id) rsvpEvent(u.id, detailEvent.id)
  }

  return (
    <div
      style={{
        fontFamily: FONT,
        background: '#0a0a0a',
        minHeight: '100dvh',
        paddingBottom: '40px',
        position: 'relative',
      }}
    >
      {/* ── 1. NAV ROW ── */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: 'calc(env(safe-area-inset-top) + 22px) 24px 0',
        }}
      >
        <button
          type="button"
          onClick={() => navigate('/', { replace: true })}
          style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
        >
          <ArrowLeft size={18} color="#8e8e93" />
          <span style={{ fontSize: '15px', fontWeight: '600', color: '#8e8e93' }}>{t('events.back')}</span>
        </button>
        <div
          style={{
            width: '36px',
            height: '36px',
            borderRadius: '50%',
            background: '#1c1c1f',
            border: '1px solid #2c2c30',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '12px',
            fontWeight: '700',
            color: '#ffffff',
          }}
        >
          {initials || '?'}
        </div>
      </div>

      {/* ── 2. MONTH CARD ── */}
      <div
        style={{
          margin: '18px 16px 0',
          background: '#111113',
          border: '1px solid #1e1e22',
          borderRadius: '26px',
          padding: '18px 16px 16px',
        }}
      >
        {/* Month header */}
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <button
            type="button"
            onClick={() => changeMonth(-1)}
            aria-label="Previous month"
            style={{ width: '34px', height: '34px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'none', border: 'none', cursor: 'pointer', flexShrink: 0 }}
          >
            <ChevronLeft size={18} color="#c7c7cc" />
          </button>
          <div style={{ flex: 1, textAlign: 'center' }}>
            <p style={{ fontSize: '24px', fontWeight: '700', color: '#ffffff', letterSpacing: '-0.02em', lineHeight: 1 }}>
              {monthName}
            </p>
            <p style={{ fontSize: '11.5px', fontWeight: '600', color: '#8e8e93', letterSpacing: '0.08em', marginTop: '2px' }}>
              {year}
            </p>
          </div>
          <button
            type="button"
            onClick={() => changeMonth(1)}
            aria-label="Next month"
            style={{ width: '34px', height: '34px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'none', border: 'none', cursor: 'pointer', flexShrink: 0 }}
          >
            <ChevronRight size={18} color="#c7c7cc" />
          </button>
        </div>

        {/* Weekday headers */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '2px', marginTop: '16px' }}>
          {DAY_NAMES.map((name, i) => (
            <div key={i} style={{ textAlign: 'center', fontSize: '11px', fontWeight: '700', color: '#6e6e73', letterSpacing: '0.06em' }}>
              {name}
            </div>
          ))}
        </div>

        {/* Day grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '2px', marginTop: '8px' }}>
          {cells.map((cell, idx) => {
            if (cell.outside) {
              return (
                <div key={idx} style={{ height: '46px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ fontSize: '15px', fontWeight: '500', color: '#3a3a3e' }}>{cell.day}</span>
                </div>
              )
            }

            const dayEvs = occByDay[cell.day] ?? []
            const isToday = isSameDay(cell.date, TODAY)
            const isSelected = isSameDay(cell.date, selectedDate)
            const cats = [...new Set(dayEvs.map((e) => e.type))].slice(0, 3)

            return (
              <button
                key={idx}
                type="button"
                onClick={() => setSelectedDate(cell.date)}
                style={{
                  height: '46px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '4px',
                  borderRadius: '14px',
                  background: isSelected ? 'oklch(0.64 0.18 292)' : 'transparent',
                  border: isToday && !isSelected ? '1px solid #3a3a3e' : '1px solid transparent',
                  cursor: 'pointer',
                }}
              >
                <span
                  style={{
                    fontSize: '15px',
                    fontWeight: isSelected || isToday ? '700' : '500',
                    color: isSelected ? '#ffffff' : isToday ? '#ffffff' : '#c7c7cc',
                  }}
                >
                  {cell.day}
                </span>
                {cats.length > 0 && (
                  <div style={{ display: 'flex', gap: '3px', height: '5px', alignItems: 'center' }}>
                    {cats.map((cat) => (
                      <div
                        key={cat}
                        style={{
                          width: '5px',
                          height: '5px',
                          borderRadius: '50%',
                          background: isSelected ? 'rgba(255,255,255,0.7)' : CAT_COLOR[cat] ?? '#8e8e93',
                        }}
                      />
                    ))}
                  </div>
                )}
              </button>
            )
          })}
        </div>

        {/* Today pill */}
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: '14px' }}>
          <button
            type="button"
            onClick={() => {
              setCurrentMonth(new Date(TODAY.getFullYear(), TODAY.getMonth(), 1))
              setSelectedDate(TODAY)
            }}
            style={{
              background: 'transparent',
              border: '1px solid #2c2c30',
              borderRadius: '999px',
              color: '#e5e5ea',
              fontSize: '13px',
              fontWeight: '600',
              padding: '9px 22px',
              cursor: 'pointer',
            }}
          >
            {t('events.today')}
          </button>
        </div>
      </div>

      {/* ── 3. CATEGORY CHIPS ── */}
      <div
        style={{
          display: 'flex',
          gap: '8px',
          padding: '16px 16px 0',
          overflowX: 'auto',
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
        }}
      >
        {CATEGORIES.map((cat) => {
          const isActive = activeCategory === cat
          const dotColor = cat === 'All' ? '#8e8e93' : CAT_COLOR[CHIP_TYPE[cat]] ?? '#8e8e93'
          return (
            <button
              key={cat}
              type="button"
              onClick={() => setActiveCategory(cat)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '7px',
                fontSize: '12.5px',
                fontWeight: '600',
                padding: '8px 13px',
                borderRadius: '999px',
                border: isActive ? '1px solid #3a3a3e' : '1px solid #1e1e22',
                background: isActive ? '#2c2c30' : '#111113',
                color: isActive ? '#ffffff' : '#aeaeb2',
                cursor: 'pointer',
                flexShrink: 0,
                whiteSpace: 'nowrap',
              }}
            >
              {cat !== 'All' && (
                <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: isActive ? '#ffffff' : dotColor, flexShrink: 0 }} />
              )}
              {cat}
            </button>
          )
        })}
      </div>

      {/* ── 4. DAY HEADING + EVENT ROWS ── */}
      <div style={{ padding: '22px 24px 0' }}>
        <p style={{ fontSize: '12px', fontWeight: '700', letterSpacing: '0.1em', color: '#8e8e93' }}>
          {dayLabel(selectedDate)}
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '14px' }}>
          {loading ? (
            [0, 1, 2].map((i) => (
              <div
                key={i}
                style={{ display: 'flex', alignItems: 'center', gap: '12px', background: '#111113', border: '1px solid #1e1e22', borderRadius: '18px', padding: '10px' }}
              >
                <div style={{ width: '64px', height: '64px', borderRadius: '14px', flexShrink: 0, background: 'linear-gradient(90deg,#1a1a1a 25%,#2a2a2a 50%,#1a1a1a 75%)', backgroundSize: '200% 100%', animation: 'skeleton-shimmer 1.5s infinite' }} />
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <SkeletonText width="70%" height={16} />
                  <SkeletonText width="50%" height={12} />
                </div>
              </div>
            ))
          ) : selEvents.length === 0 ? (
            <div
              style={{
                border: '1px dashed #26262b',
                borderRadius: '18px',
                padding: '26px',
                textAlign: 'center',
              }}
            >
              <p style={{ fontSize: '13px', color: '#6e6e73' }}>{t('events.nothing_scheduled')}</p>
            </div>
          ) : (
            selEvents.map((ev, ei) => {
              const catColor = CAT_COLOR[ev.type] ?? '#8e8e93'
              const imgSrc = ev.image_url ?? `https://picsum.photos/seed/${ev.id}/200/200`
              const startTime = formatTime12h(ev.start_time)
              const endTime = formatTime12h(ev.end_time)
              const timeStr = endTime ? `${startTime} · ${endTime}` : startTime

              return (
                <button
                  key={`${ev.id}-${ei}`}
                  type="button"
                  onClick={() => setDetailEvent(ev)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    background: '#111113',
                    border: '1px solid #1e1e22',
                    borderRadius: '18px',
                    padding: '10px',
                    cursor: 'pointer',
                    textAlign: 'left',
                    width: '100%',
                  }}
                >
                  {/* Thumbnail */}
                  <div style={{ width: '64px', height: '64px', borderRadius: '14px', overflow: 'hidden', flexShrink: 0 }}>
                    <img src={imgSrc} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>

                  {/* Info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: catColor, flexShrink: 0 }} />
                      <p style={{ fontSize: '15.5px', fontWeight: '700', color: '#ffffff', letterSpacing: '-0.01em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {ev.title}
                      </p>
                    </div>
                    <p style={{ fontSize: '12.5px', color: '#8e8e93', marginTop: '5px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {timeStr}{ev.location ? ` · ${ev.location}` : ''}
                    </p>
                  </div>

                  <ChevronRight size={18} color="#48484a" style={{ flexShrink: 0 }} />
                </button>
              )
            })
          )}
        </div>
      </div>

      {/* ── 5. EVENT DETAIL OVERLAY ── */}
      {detailEvent && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: '#0a0a0a',
            zIndex: 20,
            overflowY: 'auto',
            fontFamily: FONT,
          }}
        >
          {/* Hero */}
          <div style={{ position: 'relative', height: '300px', flexShrink: 0 }}>
            <img
              src={detailEvent.image_url ?? `https://picsum.photos/seed/${detailEvent.id}/800/600`}
              alt=""
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
            <div
              style={{
                position: 'absolute',
                inset: 0,
                background: 'linear-gradient(to top, #0a0a0a 2%, rgba(10,10,10,0.1) 60%)',
              }}
            />
            {/* Back button */}
            <button
              type="button"
              onClick={() => setDetailEvent(null)}
              style={{
                position: 'absolute',
                top: 'calc(env(safe-area-inset-top) + 16px)',
                left: '20px',
                width: '38px',
                height: '38px',
                borderRadius: '50%',
                background: 'rgba(10,10,10,0.6)',
                backdropFilter: 'blur(10px)',
                WebkitBackdropFilter: 'blur(10px)',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <ArrowLeft size={18} color="#ffffff" />
            </button>
            {/* Overlay text */}
            <div style={{ position: 'absolute', left: '24px', right: '24px', bottom: '16px' }}>
              <span
                style={{
                  display: 'inline-block',
                  background: 'rgba(255,255,255,0.1)',
                  color: CAT_COLOR[detailEvent.type] ?? '#8e8e93',
                  fontSize: '11px',
                  fontWeight: '700',
                  letterSpacing: '0.08em',
                  padding: '5px 10px',
                  borderRadius: '8px',
                  textTransform: 'uppercase',
                }}
              >
                {detailEvent.type}
              </span>
              <p style={{ fontSize: '28px', fontWeight: '700', color: '#ffffff', letterSpacing: '-0.02em', marginTop: '10px', lineHeight: 1.15 }}>
                {detailEvent.title}
              </p>
            </div>
          </div>

          {/* Body */}
          <div style={{ padding: '6px 24px 0', display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {(detailEvent.start_time || detailEvent.end_time) && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Clock size={17} color="#8e8e93" />
                <span style={{ fontSize: '14px', color: '#c7c7cc' }}>
                  {formatTime12h(detailEvent.start_time)}
                  {detailEvent.end_time ? ` – ${formatTime12h(detailEvent.end_time)}` : ''}
                </span>
              </div>
            )}
            {detailEvent.location && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <MapPin size={17} color="#8e8e93" />
                <span style={{ fontSize: '14px', color: '#c7c7cc' }}>{detailEvent.location}</span>
              </div>
            )}
            <div style={{ height: '1px', background: '#1e1e22' }} />
            {detailEvent.description && (
              <p style={{ fontSize: '14.5px', lineHeight: 1.55, color: '#aeaeb2' }}>
                {detailEvent.description}
              </p>
            )}
            <div style={{ display: 'flex', gap: '10px', marginTop: '4px', paddingBottom: '40px' }}>
              <button
                type="button"
                onClick={handleOverlayRsvp}
                disabled={overlayGoing}
                style={{
                  flex: 1,
                  background: overlayGoing ? '#2c2c30' : CAT_COLOR[detailEvent.type] ?? '#f97316',
                  color: '#ffffff',
                  fontSize: '15px',
                  fontWeight: '700',
                  borderRadius: '16px',
                  padding: '15px',
                  border: 'none',
                  cursor: overlayGoing ? 'default' : 'pointer',
                }}
              >
                {detailEvent.type === 'midweek'
                  ? t('events.find_group')
                  : overlayGoing
                    ? t('events.going')
                    : t('events.im_going')}
              </button>
              <button
                type="button"
                onClick={() => {
                  addRsvp(detailEvent.id)
                  setOverlayGoing(true)
                }}
                style={{
                  width: '54px',
                  border: '1px solid #2c2c30',
                  borderRadius: '16px',
                  background: 'transparent',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Bookmark size={20} color={overlayGoing ? '#ffffff' : '#e5e5ea'} fill={overlayGoing ? '#ffffff' : 'none'} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
