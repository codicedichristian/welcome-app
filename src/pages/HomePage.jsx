import { useEffect, useRef, useState } from 'react'
import { useNavigate, useOutletContext } from 'react-router-dom'
import { Bookmark } from 'lucide-react'
import { useScrollMemory } from '../hooks/useScrollMemory.js'
import SwipeCarousel from '../components/SwipeCarousel.jsx'
import { getEvents, getNews } from '../lib/api.js'
import { events as fallbackEvents } from '../data/events.js'
import { news as fallbackNews } from '../data/news.js'
import { getNextOccurrence, normalizeEvent } from '../lib/events.js'
import { useUser } from '../lib/UserContext.js'
import { formatTime12h } from '../lib/format.js'

const FONT = '"Helvetica Neue", Helvetica, "SF Pro Text", system-ui, sans-serif'
const ACCENT = '#6d3ee0'

const EXPLORE_CARDS = [
  { image: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=800&q=80', category: 'Community', title: 'Midweeks',         to: '/midweek'  },
  { image: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800&q=80', category: 'Serve',      title: 'Teams',            to: '/teams'    },
  { image: 'https://images.unsplash.com/photo-1438032005730-c779502df39b?w=800&q=80', category: 'Sermons',    title: 'Sundays',          to: '/seasons'  },
  { image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&q=80', category: 'Leadership', title: 'Meet the Pastors', to: '/pastors'  },
  { image: 'https://images.unsplash.com/photo-1519501025264-65ba15a82390?w=800&q=80', category: 'Vision',     title: 'Our Vision',       to: '/vision'   },
]

const NEWS_DOT = {
  Announcement: '#3b82f6',
  Event:        '#22c55e',
  General:      '#8e8e93',
}

function formatAnnouncementDate(dateStr) {
  if (!dateStr) return ''
  const d = new Date(`${dateStr}T00:00:00`)
  const day = d.getDate()
  const month = d.toLocaleDateString('en-US', { month: 'short' }).toUpperCase()
  return `${day} ${month}`
}

const SCRIM = 'linear-gradient(to top, rgba(0,0,0,.88) 8%, rgba(0,0,0,.35) 50%, transparent 80%)'

function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning!'
  if (h < 18) return 'Good afternoon!'
  return 'Good evening!'
}

function getWeekDays() {
  const today = new Date()
  const dow = today.getDay()
  const monday = new Date(today)
  monday.setDate(today.getDate() - ((dow + 6) % 7))
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday)
    d.setDate(monday.getDate() + i)
    return d
  })
}

function isSameDay(a, b) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  )
}

function ExploreCard({ card, didDrag, navigate }) {
  return (
    <div
      onClick={() => { if (!didDrag.current) navigate(card.to) }}
      style={{
        width: '100%',
        height: '200px',
        borderRadius: '22px',
        overflow: 'hidden',
        position: 'relative',
        background: '#161618',
        cursor: 'pointer',
      }}
    >
      <img
        src={card.image}
        alt=""
        draggable={false}
        loading="lazy"
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
      />
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.65), rgba(0,0,0,0) 55%)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', left: '16px', bottom: '16px' }}>
        <span style={{ display: 'inline-block', background: 'rgba(255,255,255,0.12)', color: ACCENT, fontSize: '12px', fontWeight: '700', padding: '4px 10px', borderRadius: '8px' }}>
          {card.category}
        </span>
        <p style={{ fontSize: '26px', fontWeight: '700', color: '#ffffff', marginTop: '8px', lineHeight: 1.1 }}>
          {card.title}
        </p>
      </div>
    </div>
  )
}

export default function HomePage() {
  const navigate = useNavigate()
  const outletContext = useOutletContext()
  const openRightPanel = outletContext?.openRightPanel ?? (() => {})
  const user = useUser()
  const initials = `${user?.firstName?.[0] ?? ''}${user?.lastName?.[0] ?? ''}`.toUpperCase()

  const today = new Date()
  const weekDays = getWeekDays()

  const [events, setEvents] = useState([])
  const [news, setNews] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedDay, setSelectedDay] = useState(null)
  const defaultDaySet = useRef(false)
  useScrollMemory('home')

  useEffect(() => {
    let cancelled = false
    async function load() {
      const [evRes, nwRes] = await Promise.all([getEvents(), getNews()])
      if (cancelled) return
      setEvents(evRes.data?.length ? evRes.data : fallbackEvents)
      setNews(nwRes.data?.length ? nwRes.data : fallbackNews)
      setLoading(false)
    }
    load()
    return () => { cancelled = true }
  }, [])

  useEffect(() => {
    if (defaultDaySet.current || !events.length) return
    defaultDaySet.current = true
    const weekEnd = new Date(weekDays[weekDays.length - 1])
    weekEnd.setHours(23, 59, 59, 999)
    const nextInWeek = events
      .map((ev) => getNextOccurrence(ev))
      .filter((d) => d && d >= today && d <= weekEnd)
      .sort((a, b) => a - b)[0]
    setSelectedDay(nextInWeek ?? today)
  }, [events])

  const upcoming = events
    .map((event) => ({ event, date: getNextOccurrence(event) }))
    .filter((item) => item.date)
    .sort((a, b) => a.date - b.date)
    .slice(0, 5)
    .map((item) => ({
      ...normalizeEvent(item.event, item.date),
      dateObj: item.date,
      rawEndTime: item.event.end_time,
    }))

  const activeDay = selectedDay ?? today
  const eventsOnDay = upcoming.filter((ev) => isSameDay(ev.dateObj, activeDay))
  const hasEvents = eventsOnDay.length > 0

  const CAT_COLORS = {
    sunday:  'oklch(0.64 0.18 232)',
    service: 'oklch(0.64 0.18 232)',
    youth:   'oklch(0.64 0.18 152)',
    midweek: 'oklch(0.64 0.18 292)',
    prayer:  'oklch(0.64 0.18 42)',
    special: 'oklch(0.64 0.18 42)',
  }

  const dotsForDay = (day) =>
    [...new Set(
      upcoming
        .filter((ev) => isSameDay(ev.dateObj, day))
        .map((ev) => CAT_COLORS[ev.type] ?? '#8e8e93'),
    )].slice(0, 3)

  const recentNews = news.slice(0, 3)

  return (
    <div
      className="page-transition"
      style={{ fontFamily: FONT, background: '#0a0a0a', minHeight: '100dvh', paddingBottom: '100px' }}
    >
      {/* ── 1. GREETING HEADER ── */}
      <div
        style={{
          paddingTop: 'calc(env(safe-area-inset-top) + 26px)',
          paddingLeft: '24px',
          paddingRight: '24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <button
          type="button"
          onClick={openRightPanel}
          style={{ background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', padding: 0 }}
        >
          <p style={{ fontSize: '15px', fontWeight: '400', color: '#8e8e93', marginBottom: '2px' }}>
            {getGreeting()}
          </p>
          <p style={{ fontSize: '30px', fontWeight: '700', color: '#ffffff', letterSpacing: '-0.02em', lineHeight: 1.1 }}>
            {(user?.firstName || 'friend').toLowerCase()}
          </p>
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button
            type="button"
            onClick={() => navigate('/my-events')}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}
          >
            <Bookmark size={20} color="#ffffff" />
            <span style={{ fontSize: '11px', color: '#c7c7cc' }}>My Events</span>
          </button>
          <button
            type="button"
            onClick={openRightPanel}
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              background: '#1c1c1f',
              border: '1px solid #48484a',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '13px',
              fontWeight: '700',
              color: '#ffffff',
              cursor: 'pointer',
              flexShrink: 0,
            }}
          >
            {initials}
          </button>
        </div>
      </div>

      {/* ── 2. EXPLORE THE CHURCH ── */}
      <div style={{ paddingTop: '28px', paddingLeft: '24px', paddingRight: '24px' }}>
        <p style={{ fontSize: '22px', fontWeight: '700', color: '#ffffff', letterSpacing: '-0.02em' }}>
          Explore the Church
        </p>
        <div style={{ marginTop: '14px' }}>
          <SwipeCarousel
            items={EXPLORE_CARDS}
            sidePadding={24}
            renderItem={(card, didDrag) => <ExploreCard card={card} didDrag={didDrag} navigate={navigate} />}
          />
        </div>
      </div>

      {/* ── 3. UPCOMING EVENTS ── */}
      <div style={{ paddingTop: '30px' }}>
        {/* Header row */}
        <div style={{ paddingLeft: '24px', paddingRight: '24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0' }}>
          <p style={{ fontSize: '22px', fontWeight: '700', color: '#ffffff', letterSpacing: '-0.02em' }}>
            Upcoming events
          </p>
          <button
            type="button"
            onClick={() => navigate('/events')}
            style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: '600', color: ACCENT, padding: 0 }}
          >
            See all
          </button>
        </div>

        {/* Weekday strip */}
        <div
          style={{
            display: 'flex',
            gap: '8px',
            overflowX: 'auto',
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
            padding: '14px 0 2px',
            marginLeft: '-24px',
            marginRight: '-24px',
            paddingLeft: '24px',
            paddingRight: '24px',
            boxSizing: 'content-box',
            width: '100%',
          }}
        >
          {weekDays.map((day, i) => {
            const isToday = isSameDay(day, today)
            const isSelected = isSameDay(day, activeDay)
            const label = isToday ? 'Today' : day.toLocaleDateString('en-US', { weekday: 'short' })
            const dots = dotsForDay(day)
            return (
              <button
                key={i}
                type="button"
                onClick={() => setSelectedDay(day)}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '6px',
                  minWidth: '42px',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: 0,
                  flexShrink: 0,
                }}
              >
                <span
                  style={{
                    fontSize: '11.5px',
                    fontWeight: isSelected || isToday ? '700' : '500',
                    color: isSelected ? '#ffffff' : isToday ? '#e5e5ea' : '#8e8e93',
                  }}
                >
                  {label}
                </span>
                <div
                  style={{
                    width: '42px',
                    height: '52px',
                    borderRadius: '14px',
                    background: isSelected ? ACCENT : '#18181b',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '4px',
                  }}
                >
                  <span
                    style={{
                      fontSize: '15px',
                      fontWeight: '700',
                      color: isSelected ? '#ffffff' : isToday ? '#e5e5ea' : '#c7c7cc',
                    }}
                  >
                    {day.getDate()}
                  </span>
                  <div style={{ display: 'flex', gap: '3px', height: '5px' }}>
                    {dots.map((color, di) => (
                      <div
                        key={di}
                        style={{
                          width: '5px',
                          height: '5px',
                          borderRadius: '50%',
                          background: isSelected ? 'rgba(255,255,255,0.6)' : color,
                        }}
                      />
                    ))}
                  </div>
                </div>
              </button>
            )
          })}
        </div>

        {/* Event cards — fixed-height container prevents layout jump */}
        {loading ? (
          <p style={{ padding: '16px 24px', color: '#6e6e73', fontSize: '14px', fontFamily: FONT }}>Loading…</p>
        ) : (
          <>
            <div
              style={{
                display: 'flex',
                gap: '14px',
                padding: '16px 24px 4px',
                overflowX: hasEvents ? 'auto' : 'hidden',
                scrollbarWidth: 'none',
                msOverflowStyle: 'none',
                scrollSnapType: 'x mandatory',
                minHeight: '220px',
                alignItems: 'flex-start',
              }}
            >
              {hasEvents ? eventsOnDay.map((ev) => {
                const imgSrc = ev.image_url ?? `https://picsum.photos/seed/${ev.id}/400/320`
                const timeStr = ev.rawEndTime
                  ? `${ev.time} – ${formatTime12h(ev.rawEndTime)}`
                  : ev.time
                return (
                  <button
                    key={ev.id}
                    type="button"
                    onClick={() => navigate(`/events/${ev.id}`, { state: { event: ev } })}
                    style={{
                      flex: '0 0 auto',
                      width: '176px',
                      background: '#161618',
                      border: '1px solid #222226',
                      borderRadius: '22px',
                      padding: '8px 8px 12px',
                      scrollSnapAlign: 'start',
                      cursor: 'pointer',
                      textAlign: 'left',
                    }}
                  >
                    <div style={{ height: '160px', borderRadius: '16px', overflow: 'hidden', background: '#1c1c1f' }}>
                      <img
                        src={imgSrc}
                        alt=""
                        draggable={false}
                        loading="lazy"
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    </div>
                    <div style={{ padding: '9px 6px 0' }}>
                      <p style={{ fontSize: '17px', fontWeight: '700', color: '#ffffff', letterSpacing: '-0.01em', lineHeight: 1.25 }}>
                        {ev.name}
                      </p>
                      <p style={{ fontSize: '12.5px', color: '#8e8e93', marginTop: '4px' }}>
                        {timeStr}
                      </p>
                    </div>
                  </button>
                )
              }) : (
                <div
                  style={{
                    width: '100%',
                    height: '188px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#8e8e93',
                    fontSize: '14px',
                  }}
                >
                  No events today
                </div>
              )}
            </div>

            {/* Pager dots */}
            {eventsOnDay.length > 1 && (
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '7px', marginTop: '12px' }}>
                {eventsOnDay.map((_, i) => (
                  <div
                    key={i}
                    style={{
                      height: '5px',
                      width: i === 0 ? '20px' : '5px',
                      borderRadius: '9px',
                      background: i === 0 ? '#ffffff' : '#3a3a3c',
                    }}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* ── 4. ANNOUNCEMENTS ── */}
      <section style={{ padding: '30px 24px 0' }}>
        <p style={{ fontSize: '22px', fontWeight: '700', color: '#ffffff', letterSpacing: '-0.02em' }}>
          Announcements
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '14px' }}>
          {/* Card 1 — full width */}
          {recentNews[0] && (() => {
            const item = recentNews[0]
            const dotColor = NEWS_DOT[item.category] ?? NEWS_DOT.General
            const imgSrc = item.image_url ?? `https://picsum.photos/seed/news-${item.id}/600/300`
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => navigate(`/news/${item.id}`, { state: { item } })}
                style={{ height: '150px', borderRadius: '20px', overflow: 'hidden', position: 'relative', border: 'none', cursor: 'pointer', padding: 0, background: '#161618', display: 'block', width: '100%' }}
              >
                <img src={imgSrc} alt="" draggable={false} loading="lazy" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
                <div style={{ position: 'absolute', inset: 0, background: SCRIM, pointerEvents: 'none' }} />
                <div style={{ position: 'absolute', top: '12px', left: '12px', width: '9px', height: '9px', borderRadius: '50%', background: dotColor }} />
                <div style={{ position: 'absolute', left: '16px', right: '16px', bottom: '14px', pointerEvents: 'none', textAlign: 'left' }}>
                  <p style={{ fontSize: '10.5px', fontWeight: '700', letterSpacing: '0.07em', color: '#d1d1d6', marginBottom: '6px' }}>
                    {formatAnnouncementDate(item.published_at)}
                  </p>
                  <p style={{ fontSize: '18px', fontWeight: '700', letterSpacing: '-0.015em', lineHeight: 1.2, color: '#ffffff' }}>
                    {item.title}
                  </p>
                  {item.body && (
                    <p style={{ fontSize: '12px', lineHeight: 1.35, color: '#c7c7cc', marginTop: '4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {item.body}
                    </p>
                  )}
                </div>
              </button>
            )
          })()}

          {/* Cards 2 & 3 — side by side */}
          {recentNews.length > 1 && (
            <div style={{ display: 'flex', gap: '12px' }}>
              {recentNews.slice(1, 3).map((item) => {
                const dotColor = NEWS_DOT[item.category] ?? NEWS_DOT.General
                const imgSrc = item.image_url ?? `https://picsum.photos/seed/news-${item.id}/400/280`
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => navigate(`/news/${item.id}`, { state: { item } })}
                    style={{ flex: 1, height: '120px', borderRadius: '20px', overflow: 'hidden', position: 'relative', border: 'none', cursor: 'pointer', padding: 0, background: '#161618' }}
                  >
                    <img src={imgSrc} alt="" draggable={false} loading="lazy" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
                    <div style={{ position: 'absolute', inset: 0, background: SCRIM, pointerEvents: 'none' }} />
                    <div style={{ position: 'absolute', top: '12px', left: '12px', width: '9px', height: '9px', borderRadius: '50%', background: dotColor }} />
                    <div style={{ position: 'absolute', left: '12px', right: '12px', bottom: '12px', pointerEvents: 'none', textAlign: 'left' }}>
                      <p style={{ fontSize: '10px', fontWeight: '700', letterSpacing: '0.07em', color: '#d1d1d6', marginBottom: '4px' }}>
                        {formatAnnouncementDate(item.published_at)}
                      </p>
                      <p style={{ fontSize: '14.5px', fontWeight: '700', lineHeight: 1.2, color: '#ffffff' }}>
                        {item.title}
                      </p>
                    </div>
                  </button>
                )
              })}
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
