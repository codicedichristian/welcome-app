import { useEffect, useRef, useState } from 'react'
import { useNavigate, useOutletContext } from 'react-router-dom'
import { getEvents, getNews } from '../lib/api.js'
import { events as fallbackEvents } from '../data/events.js'
import { news as fallbackNews } from '../data/news.js'
import { getNextOccurrence, normalizeEvent } from '../lib/events.js'
import { getStoredUser } from '../lib/user.js'
import { formatShortDate } from '../lib/format.js'

// Event card category pill styles
const CAT_PILL = {
  sunday:  { bg: 'rgba(255,255,255,0.15)', border: 'rgba(255,255,255,0.4)',   text: '#ffffff' },
  youth:   { bg: 'rgba(52,211,153,0.18)',  border: 'rgba(110,231,183,0.5)',   text: '#7ee9bb' },
  midweek: { bg: 'rgba(91,140,255,0.18)',  border: 'rgba(91,140,255,0.5)',    text: '#8bb4ff' },
  prayer:  { bg: 'rgba(167,139,250,0.18)', border: 'rgba(167,139,250,0.5)',   text: '#c4b0ff' },
  special: { bg: 'rgba(249,115,22,0.18)',  border: 'rgba(249,115,22,0.5)',    text: '#ffb088' },
}

// News card status dot colours
const NEWS_DOT = {
  Announcement: { color: '#5b8cff', glow: 'rgba(91,140,255,0.25)' },
  Event:        { color: '#3ddc97', glow: 'rgba(61,220,151,0.25)' },
  General:      { color: '#8a8a86', glow: 'rgba(138,138,134,0.25)' },
}

function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning!'
  if (h < 18) return 'Good afternoon!'
  return 'Good evening!'
}

// ─── Inline SVG icons (36×36, stroke-based, fill none) ───────────────────────

const CalendarIcon = () => (
  <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#5b8cff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="5" width="18" height="16" rx="2" />
    <path d="M3 10h18M8 3v4M16 3v4" />
  </svg>
)

const PlayIcon = () => (
  <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#141412" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="9" />
    <path d="M10 9l5 3-5 3V9z" fill="#141412" stroke="none" />
  </svg>
)

const PinIcon = () => (
  <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#5b8cff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 21s7-6.5 7-12a7 7 0 10-14 0c0 5.5 7 12 7 12z" />
    <circle cx="12" cy="9" r="2.5" />
  </svg>
)

const HeartIcon = () => (
  <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#3ddc97" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 21s-7.5-4.9-10-9.4C.5 8 2 4 6 4c2.2 0 3.8 1.3 6 4 2.2-2.7 3.8-4 6-4 4 0 5.5 4 4 7.6C19.5 16.1 12 21 12 21z" />
  </svg>
)

// ─── Sub-components ───────────────────────────────────────────────────────────

function QuickCard({ icon, label, sub, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        background: '#f2f1ee',
        borderRadius: '24px',
        padding: '20px',
        display: 'flex',
        flexDirection: 'column',
        gap: '14px',
        cursor: 'pointer',
        textAlign: 'left',
        width: '100%',
        border: 'none',
      }}
    >
      {icon}
      <div>
        <p style={{ fontSize: '17px', fontWeight: '700', color: '#141412', marginBottom: '2px', lineHeight: 1.2 }}>{label}</p>
        <p style={{ fontSize: '13px', color: '#7a7a76' }}>{sub}</p>
      </div>
    </button>
  )
}

function DonateModal({ onClose }) {
  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.7)',
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'center',
        zIndex: 300,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: '#1a1a1a',
          borderRadius: '28px 28px 0 0',
          padding: '28px 24px calc(32px + env(safe-area-inset-bottom))',
          width: '100%',
          maxWidth: '480px',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '14px' }}>
          <HeartIcon />
        </div>
        <p style={{ fontSize: '20px', fontWeight: '700', color: '#ffffff', textAlign: 'center', marginBottom: '8px' }}>
          Support the church
        </p>
        <p style={{ fontSize: '14px', color: '#888', textAlign: 'center', marginBottom: '20px' }}>
          Your generosity makes everything possible.
        </p>
        <div
          style={{
            background: '#111',
            borderRadius: '14px',
            padding: '16px',
            fontFamily: 'monospace',
            fontSize: '14px',
            color: '#ffffff',
            lineHeight: '1.8',
            marginBottom: '20px',
          }}
        >
          <p>Bank: Banco Santander</p>
          <p>IBAN: ES91 2100 0418 42</p>
          <p>Name: Welcome Church</p>
        </div>
        <button
          type="button"
          aria-label="close"
          onClick={onClose}
          style={{
            width: '100%',
            borderRadius: '14px',
            background: '#ffffff',
            color: '#0f0f0f',
            fontSize: '17px',
            fontWeight: '600',
            padding: '15px',
            border: 'none',
            cursor: 'pointer',
          }}
        >
          Close
        </button>
      </div>
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function HomePage() {
  const navigate = useNavigate()
  const outletContext = useOutletContext()
  const openRightPanel = outletContext?.openRightPanel ?? (() => {})
  const user = getStoredUser()
  const initials = `${user.firstName?.[0] ?? ''}${user.lastName?.[0] ?? ''}`.toUpperCase()

  const [events, setEvents] = useState([])
  const [news, setNews] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeIndex, setActiveIndex] = useState(0)
  const [dragOffset, setDragOffset] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const [showDonate, setShowDonate] = useState(false)
  const [showScrollBar, setShowScrollBar] = useState(false)

  // Drag tracking refs
  const cardContainerRef = useRef(null)
  const touchStartX = useRef(0)
  const touchStartY = useRef(0)
  const isHorizontalDrag = useRef(null) // null=undecided, true=horiz, false=vert
  const velocityPoints = useRef([])
  const isDraggingRef = useRef(false)
  const cardWidthRef = useRef(0)
  const didDrag = useRef(false)
  const dragStartX = useRef(0)

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
    const onScroll = () => setShowScrollBar(window.scrollY > 60)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const upcoming = events
    .map((event) => ({ event, date: getNextOccurrence(event) }))
    .filter((item) => item.date)
    .sort((a, b) => a.date - b.date)
    .slice(0, 5)
    .map((item) => normalizeEvent(item.event, item.date))

  const recentNews = news.slice(0, 3)

  // Non-passive touchmove — lets us preventDefault on horizontal swipes to
  // block Safari's page-back gesture while the carousel is active.
  useEffect(() => {
    const el = cardContainerRef.current
    if (!el) return
    const onMove = (e) => {
      const dx = e.touches[0].clientX - touchStartX.current
      const dy = e.touches[0].clientY - touchStartY.current

      if (isHorizontalDrag.current === null) {
        const absDx = Math.abs(dx)
        const absDy = Math.abs(dy)
        if (absDx > 5 || absDy > 5) isHorizontalDrag.current = absDx > absDy
        return
      }

      if (!isHorizontalDrag.current) return
      e.preventDefault()
      setDragOffset(dx)

      velocityPoints.current.push({ x: e.touches[0].clientX, t: Date.now() })
      if (velocityPoints.current.length > 5) velocityPoints.current.shift()
    }
    el.addEventListener('touchmove', onMove, { passive: false })
    return () => el.removeEventListener('touchmove', onMove)
  }, [upcoming.length])

  // Mouse drag (desktop testing)
  useEffect(() => {
    const onMouseMove = (e) => {
      if (!isDraggingRef.current) return
      const dx = e.clientX - dragStartX.current
      setDragOffset(dx)
      velocityPoints.current.push({ x: e.clientX, t: Date.now() })
      if (velocityPoints.current.length > 5) velocityPoints.current.shift()
    }

    const onMouseUp = (e) => {
      if (!isDraggingRef.current) return
      isDraggingRef.current = false
      const dx = e.clientX - dragStartX.current
      didDrag.current = Math.abs(dx) >= 10

      const velocity = calcVelocity()
      let newIndex = activeIndex
      if ((dx < -50 || velocity < -0.3) && activeIndex < upcoming.length - 1) newIndex = activeIndex + 1
      else if ((dx > 50 || velocity > 0.3) && activeIndex > 0) newIndex = activeIndex - 1

      setActiveIndex(newIndex)
      setIsDragging(false)
      setDragOffset(0)
    }

    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup', onMouseUp)
    return () => {
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseup', onMouseUp)
    }
  }, [activeIndex, upcoming.length])

  function calcVelocity() {
    const track = velocityPoints.current
    if (track.length < 2) return 0
    const last = track[track.length - 1]
    const first = track[0]
    const dt = last.t - first.t
    return dt > 0 ? (last.x - first.x) / dt : 0
  }

  const handleTouchStart = (e) => {
    cardWidthRef.current = cardContainerRef.current?.offsetWidth ?? 0
    touchStartX.current = e.touches[0].clientX
    touchStartY.current = e.touches[0].clientY
    isHorizontalDrag.current = null
    velocityPoints.current = [{ x: e.touches[0].clientX, t: Date.now() }]
    isDraggingRef.current = true
    didDrag.current = false
    setIsDragging(true)
  }

  const handleTouchEnd = (e) => {
    isDraggingRef.current = false
    const endX = e.changedTouches[0].clientX
    const endY = e.changedTouches[0].clientY
    const dx = endX - touchStartX.current
    const dy = endY - touchStartY.current

    const horizontal = isHorizontalDrag.current ?? (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 5)

    if (!horizontal) {
      setIsDragging(false)
      setDragOffset(0)
      return
    }

    didDrag.current = Math.abs(dx) >= 10
    const velocity = calcVelocity()
    let newIndex = activeIndex
    if ((dx < -50 || velocity < -0.3) && activeIndex < upcoming.length - 1) newIndex = activeIndex + 1
    else if ((dx > 50 || velocity > 0.3) && activeIndex > 0) newIndex = activeIndex - 1

    setActiveIndex(newIndex)
    setIsDragging(false)
    setDragOffset(0)
  }

  const handleMouseDown = (e) => {
    e.preventDefault()
    dragStartX.current = e.clientX
    isDraggingRef.current = true
    didDrag.current = false
    velocityPoints.current = [{ x: e.clientX, t: Date.now() }]
    setIsDragging(true)
  }

  const cw = cardWidthRef.current || 1
  let activeDotIndex = activeIndex
  if (isDragging) {
    if (dragOffset < -(cw * 0.5) && activeIndex < upcoming.length - 1) activeDotIndex = activeIndex + 1
    else if (dragOffset > (cw * 0.5) && activeIndex > 0) activeDotIndex = activeIndex - 1
  }

  return (
    <>
      {/* Scroll-aware sticky title bar */}
      <div
        style={{
          position: 'fixed',
          top: 'env(safe-area-inset-top)',
          left: 0,
          right: 0,
          height: '44px',
          background: 'rgba(10,11,10,0.95)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          borderBottom: '0.5px solid rgba(255,255,255,0.06)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 99,
          opacity: showScrollBar ? 1 : 0,
          transform: showScrollBar ? 'translateY(0)' : 'translateY(-100%)',
          transition: 'opacity 200ms ease-out, transform 200ms ease-out',
          pointerEvents: showScrollBar ? 'auto' : 'none',
        }}
      >
        <span style={{ fontSize: '15px', fontWeight: '600', color: '#ffffff' }}>Welcome</span>
      </div>

      {/* Page wrapper */}
      <div
        style={{
          background: '#0a0b0a',
          minHeight: '100dvh',
          paddingTop: 'calc(env(safe-area-inset-top) + 24px)',
          paddingLeft: '22px',
          paddingRight: '22px',
          paddingBottom: '120px',
        }}
      >
        {/* ── HEADER ── */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '34px' }}>
          {/* Greeting + name (tappable — opens profile panel) */}
          <button
            type="button"
            onClick={openRightPanel}
            style={{ background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', padding: 0 }}
          >
            <p style={{ fontSize: '16px', fontWeight: '400', color: '#9a9a97', marginBottom: '4px' }}>
              {getGreeting()}
            </p>
            <p style={{ fontSize: '32px', fontWeight: '800', color: '#ffffff', letterSpacing: '-0.02em', lineHeight: 1.1 }}>
              {(user.firstName || 'friend').toLowerCase()}
            </p>
          </button>

          {/* Bookmark + avatar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '18px' }}>
            <button
              type="button"
              onClick={() => navigate('/my-events')}
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#c9c9c6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
              </svg>
              <span style={{ fontSize: '13px', color: '#c9c9c6' }}>My Events</span>
            </button>

            <button
              type="button"
              onClick={openRightPanel}
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '50%',
                border: '1.5px solid #e8e8e5',
                background: '#1e1e1e',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '15px',
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

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', paddingTop: '60px' }}>
            <p style={{ color: '#4a4a47', fontSize: '15px' }}>Loading…</p>
          </div>
        ) : (
          <>
            {/* ── UPCOMING EVENTS ── */}
            <section style={{ marginBottom: '34px' }}>
              <p style={{ fontSize: '24px', fontWeight: '800', color: '#ffffff', marginBottom: '16px', letterSpacing: '-0.01em' }}>
                Upcoming events
              </p>

              {upcoming.length > 0 ? (
                <>
                  {/* Carousel outer — extends edge-to-edge, clips overflow */}
                  <div
                    ref={cardContainerRef}
                    onTouchStart={handleTouchStart}
                    onTouchEnd={handleTouchEnd}
                    onMouseDown={handleMouseDown}
                    style={{
                      overflow: 'hidden',
                      margin: '0 -22px',
                      cursor: isDragging ? 'grabbing' : 'grab',
                      userSelect: 'none',
                      WebkitUserSelect: 'none',
                    }}
                  >
                    {/* Carousel track */}
                    <div
                      style={{
                        display: 'flex',
                        width: '100%',
                        transform: `translateX(calc(${-activeIndex * 100}% + ${dragOffset}px))`,
                        transition: isDragging ? 'none' : 'transform 280ms ease-out',
                        willChange: 'transform',
                      }}
                    >
                      {upcoming.map((ev) => {
                        const pill = CAT_PILL[ev.type] ?? CAT_PILL.special
                        const imgSrc = ev.image_url ?? `https://picsum.photos/seed/${ev.id}/800/580`
                        return (
                          <div
                            key={ev.id}
                            style={{ flex: '0 0 100%', width: '100%', minWidth: '100%', padding: '0 22px' }}
                            onClick={() => {
                              if (!didDrag.current) navigate(`/events/${ev.id}`, { state: { event: ev } })
                            }}
                          >
                            {/* Event card */}
                            <div
                              style={{
                                width: '100%',
                                height: '290px',
                                borderRadius: '24px',
                                overflow: 'hidden',
                                position: 'relative',
                              }}
                            >
                              <img
                                src={imgSrc}
                                alt=""
                                draggable={false}
                                style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
                              />
                              <div
                                style={{
                                  position: 'absolute',
                                  inset: 0,
                                  background: 'linear-gradient(180deg, rgba(0,0,0,0.05) 0%, rgba(0,0,0,0.15) 45%, rgba(0,0,0,0.88) 100%)',
                                }}
                              />

                              {/* Date badge — top right */}
                              <div
                                style={{
                                  position: 'absolute',
                                  top: '14px',
                                  right: '14px',
                                  background: '#ffffff',
                                  borderRadius: '14px',
                                  padding: '8px 14px',
                                  display: 'flex',
                                  flexDirection: 'column',
                                  alignItems: 'center',
                                  zIndex: 2,
                                }}
                              >
                                <span style={{ fontSize: '20px', fontWeight: '800', color: '#111111', lineHeight: 1 }}>
                                  {ev.day}
                                </span>
                                <span style={{ fontSize: '11px', fontWeight: '700', color: '#7a7a76', textTransform: 'uppercase', letterSpacing: '0.06em', marginTop: '2px' }}>
                                  {ev.month}
                                </span>
                              </div>

                              {/* Bottom content */}
                              <div
                                style={{
                                  position: 'absolute',
                                  left: '20px',
                                  bottom: '20px',
                                  right: '20px',
                                  zIndex: 2,
                                }}
                              >
                                <span
                                  style={{
                                    display: 'inline-block',
                                    background: pill.bg,
                                    border: `1px solid ${pill.border}`,
                                    color: pill.text,
                                    fontSize: '12px',
                                    fontWeight: '700',
                                    letterSpacing: '0.04em',
                                    padding: '5px 11px',
                                    borderRadius: '8px',
                                    marginBottom: '10px',
                                    textTransform: 'uppercase',
                                  }}
                                >
                                  {ev.type}
                                </span>
                                <p style={{ fontSize: '26px', fontWeight: '800', color: '#ffffff', marginBottom: '4px', lineHeight: 1.1, letterSpacing: '-0.01em' }}>
                                  {ev.name}
                                </p>
                                <p style={{ fontSize: '15px', color: '#d8d8d5', lineHeight: 1.4 }}>
                                  {ev.time ? `${ev.time} · ` : ''}{ev.location}
                                </p>
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>

                  {/* Dot indicators */}
                  {upcoming.length > 1 && (
                    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '7px', marginTop: '14px' }}>
                      {upcoming.map((_, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => { setActiveIndex(i); setDragOffset(0) }}
                          style={{
                            height: '6px',
                            width: i === activeDotIndex ? '20px' : '6px',
                            borderRadius: i === activeDotIndex ? '3px' : '50%',
                            background: i === activeDotIndex ? '#ffffff' : '#4a4a47',
                            border: 'none',
                            padding: 0,
                            cursor: 'pointer',
                            transition: 'all 200ms ease',
                          }}
                        />
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <p style={{ fontSize: '15px', color: '#4a4a47' }}>No upcoming events</p>
              )}
            </section>

            {/* ── ANNOUNCEMENTS ── */}
            {recentNews.length > 0 && (
              <section style={{ marginBottom: '34px' }}>
                <p style={{ fontSize: '24px', fontWeight: '800', color: '#ffffff', marginBottom: '16px', letterSpacing: '-0.01em' }}>
                  Announcements
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  {recentNews.map((item, idx) => {
                    const dot = NEWS_DOT[item.category] ?? NEWS_DOT.General
                    const isLast = idx === recentNews.length - 1
                    const isOdd = recentNews.length % 2 !== 0
                    const imgSrc = item.image_url ?? `https://picsum.photos/seed/news-${item.id}/400/280`
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => navigate(`/news/${item.id}`, { state: { item } })}
                        style={{
                          gridColumn: isOdd && isLast ? '1 / -1' : undefined,
                          height: '140px',
                          borderRadius: '24px',
                          overflow: 'hidden',
                          position: 'relative',
                          border: 'none',
                          cursor: 'pointer',
                          textAlign: 'left',
                          padding: 0,
                        }}
                      >
                        <img
                          src={imgSrc}
                          alt=""
                          draggable={false}
                          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                        <div
                          style={{
                            position: 'absolute',
                            inset: 0,
                            background: 'linear-gradient(90deg, rgba(0,0,0,0.15) 0%, rgba(0,0,0,0.88) 100%)',
                          }}
                        />
                        {/* Status dot */}
                        <div
                          style={{
                            position: 'absolute',
                            top: '12px',
                            left: '12px',
                            width: '9px',
                            height: '9px',
                            borderRadius: '50%',
                            background: dot.color,
                            boxShadow: `0 0 0 3px ${dot.glow}`,
                            zIndex: 2,
                          }}
                        />
                        {/* Title + date */}
                        <div style={{ position: 'absolute', left: '14px', right: '14px', bottom: '12px', zIndex: 2 }}>
                          <p style={{ fontSize: '15px', fontWeight: '700', color: '#ffffff', lineHeight: 1.25, marginBottom: '3px' }}>
                            {item.title}
                          </p>
                          <p style={{ fontSize: '12px', color: '#c9c9c6' }}>
                            {formatShortDate(item.published_at)}
                          </p>
                        </div>
                      </button>
                    )
                  })}
                </div>
              </section>
            )}

            {/* ── QUICK ACCESS ── */}
            <section>
              <p style={{ fontSize: '24px', fontWeight: '800', color: '#ffffff', marginBottom: '16px', letterSpacing: '-0.01em' }}>
                Quick access
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <QuickCard icon={<CalendarIcon />} label="Events calendar" sub="All events"  onClick={() => navigate('/events')} />
                <QuickCard icon={<PlayIcon />}     label="Last Sunday"     sub="Sermon"      onClick={() => navigate('/last-sunday')} />
                <QuickCard icon={<PinIcon />}      label="Find Midweek"    sub="Near you"    onClick={() => navigate('/midweek')} />
                <QuickCard icon={<HeartIcon />}    label="Donate"          sub="Give online" onClick={() => setShowDonate(true)} />
              </div>
            </section>
          </>
        )}

        {showDonate && <DonateModal onClose={() => setShowDonate(false)} />}
      </div>
    </>
  )
}
