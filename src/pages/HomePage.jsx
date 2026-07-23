import { useEffect, useRef, useState } from 'react'
import { useNavigate, useOutletContext } from 'react-router-dom'
import { ChevronRight, CalendarDays, Play, MapPin, Heart, Bookmark } from 'lucide-react'
import { getEvents, getNews } from '../lib/api.js'
import { events as fallbackEvents } from '../data/events.js'
import { news as fallbackNews } from '../data/news.js'
import { getNextOccurrence, normalizeEvent } from '../lib/events.js'
import { getStoredUser } from '../lib/user.js'
import { capitalize, formatShortDate } from '../lib/format.js'

const GRADIENTS = {
  sunday:  'linear-gradient(135deg, #1a1a2e, #0f0f1a)',
  youth:   'linear-gradient(135deg, #1a3d2b, #0f2419)',
  midweek: 'linear-gradient(135deg, #1a2340, #0f1628)',
  prayer:  'linear-gradient(135deg, #2a1a40, #180f28)',
  special: 'linear-gradient(135deg, #3d2010, #281508)',
}

const BADGE = {
  sunday:  { bg: 'rgba(91,140,255,0.2)',  color: '#5b8cff' },
  youth:   { bg: 'rgba(76,175,125,0.2)',  color: '#4caf7d' },
  midweek: { bg: 'rgba(91,140,255,0.2)',  color: '#5b8cff' },
  prayer:  { bg: 'rgba(167,139,250,0.2)', color: '#a78bfa' },
  special: { bg: 'rgba(249,115,22,0.2)',  color: '#f97316' },
}

function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning!'
  if (h < 18) return 'Good afternoon!'
  return 'Good evening!'
}

function QuickCard({ icon, label, sub, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        background: '#1c1c1c',
        border: '0.5px solid #2a2a2a',
        borderRadius: '16px',
        padding: '14px 12px',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        cursor: 'pointer',
        textAlign: 'left',
        width: '100%',
      }}
    >
      {icon}
      <div>
        <p style={{ fontSize: '15px', fontWeight: '500', color: '#ffffff' }}>{label}</p>
        <p style={{ fontSize: '12px', color: '#666', marginTop: '2px' }}>{sub}</p>
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
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 300,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: '#1a1a1a',
          borderRadius: '20px',
          padding: '24px',
          width: '85%',
          maxWidth: '340px',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '12px' }}>
          <Heart size={32} color="#4caf7d" fill="#4caf7d" />
        </div>
        <p style={{ fontSize: '20px', fontWeight: '600', color: '#ffffff', textAlign: 'center', marginBottom: '8px' }}>
          Support the church
        </p>
        <p style={{ fontSize: '14px', color: '#888', textAlign: 'center', marginBottom: '16px' }}>
          Your generosity makes everything possible.
        </p>
        <div
          style={{
            background: '#111',
            borderRadius: '12px',
            padding: '14px',
            fontFamily: 'monospace',
            fontSize: '14px',
            color: '#ffffff',
            lineHeight: '1.7',
            marginBottom: '16px',
          }}
        >
          <p>Bank: Banco Santander</p>
          <p>IBAN: ES91 2100 0418 42</p>
          <p>Name: Welcome Church</p>
        </div>
        <button
          type="button"
          onClick={onClose}
          style={{
            width: '100%',
            borderRadius: '12px',
            background: '#ffffff',
            color: '#0f0f0f',
            fontSize: '17px',
            fontWeight: '500',
            padding: '12px',
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
  const isHorizontalDrag = useRef(null) // null=undecided, true=horizontal, false=vertical
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

  // Non-passive touchmove so we can preventDefault for horizontal swipes
  useEffect(() => {
    const el = cardContainerRef.current
    if (!el) return
    const onMove = (e) => {
      const dx = e.touches[0].clientX - touchStartX.current
      const dy = e.touches[0].clientY - touchStartY.current

      if (isHorizontalDrag.current === null) {
        const absDx = Math.abs(dx)
        const absDy = Math.abs(dy)
        if (absDx > 5 || absDy > 5) {
          isHorizontalDrag.current = absDx > absDy
        }
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

  // Mouse drag support for desktop testing
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

    // If touchmove never fired or didn't determine direction, compute it here
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

  // Dot index updates in real time as drag crosses 50% of card width
  const cw = cardWidthRef.current || 1
  let activeDotIndex = activeIndex
  if (isDragging) {
    if (dragOffset < -(cw * 0.5) && activeIndex < upcoming.length - 1) activeDotIndex = activeIndex + 1
    else if (dragOffset > (cw * 0.5) && activeIndex > 0) activeDotIndex = activeIndex - 1
  }

  return (
    <>
      {/* Scroll-aware "Welcome" bar — appears below safe-area cover when scrollY > 60 */}
      <div
        style={{
          position: 'fixed',
          top: 'env(safe-area-inset-top)',
          left: 0,
          right: 0,
          height: '44px',
          background: 'rgba(15,15,15,0.95)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          borderBottom: '0.5px solid #1e1e1e',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 998,
          opacity: showScrollBar ? 1 : 0,
          transform: showScrollBar ? 'translateY(0)' : 'translateY(-100%)',
          transition: 'opacity 200ms ease-out, transform 200ms ease-out',
          pointerEvents: showScrollBar ? 'auto' : 'none',
        }}
      >
        <span style={{ fontSize: '15px', fontWeight: '600', color: '#ffffff' }}>Welcome</span>
      </div>

      <div
        className="px-4 pb-8"
        style={{ paddingTop: 'calc(env(safe-area-inset-top) + 14px)' }}
      >
      {/* 1. HEADER */}
      <div className="flex items-center justify-between mb-6">
        <button type="button" onClick={openRightPanel} className="text-left" style={{ cursor: 'pointer' }}>
          <p style={{ fontSize: '14px', color: '#666' }}>{getGreeting()}</p>
          <p style={{ fontSize: '28px', fontWeight: '700', color: '#ffffff', lineHeight: 1.2 }}>
            {user.firstName || 'Friend'}
          </p>
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            type="button"
            onClick={() => navigate('/my-events')}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '2px',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: 0,
            }}
          >
            <Bookmark size={20} color="#ffffff" />
            <span style={{ fontSize: '13px', color: '#ffffff' }}>My Events</span>
          </button>
          <button
            type="button"
            onClick={openRightPanel}
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              border: '1.5px solid #ffffff',
              background: '#1a1a1a',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '14px',
              fontWeight: '500',
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
        <div style={{ paddingTop: '40px', textAlign: 'center' }}>
          <p style={{ color: '#555', fontSize: '14px' }}>Loading…</p>
        </div>
      ) : (
        <>
          {/* 2. UPCOMING EVENTS */}
          <section style={{ marginBottom: '28px' }}>
            <p style={{ fontSize: '20px', fontWeight: '600', color: '#ffffff', marginBottom: '12px' }}>
              Upcoming events
            </p>

            {upcoming.length > 0 ? (
              <>
                {/* carousel-outer: transparent clipper only — no border-radius, no height */}
                <div
                  ref={cardContainerRef}
                  onTouchStart={handleTouchStart}
                  onTouchEnd={handleTouchEnd}
                  onMouseDown={handleMouseDown}
                  style={{
                    overflow: 'hidden',
                    margin: '0 -8px',
                    cursor: isDragging ? 'grabbing' : 'grab',
                    userSelect: 'none',
                    WebkitUserSelect: 'none',
                  }}
                >
                  {/* carousel-track: slides side by side, width:100% so 100% in translateX = one slide */}
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'row',
                      width: '100%',
                      transform: `translateX(calc(${-activeIndex * 100}% + ${dragOffset}px))`,
                      transition: isDragging ? 'none' : 'transform 280ms ease-out',
                      willChange: 'transform',
                    }}
                  >
                    {upcoming.map((ev) => {
                      const grad = GRADIENTS[ev.type] ?? GRADIENTS.special
                      const bdg = BADGE[ev.type] ?? BADGE.special
                      return (
                        /* carousel-slide: full-width slot, no overflow clipping here */
                        <div
                          key={ev.id}
                          style={{
                            flex: '0 0 100%',
                            width: '100%',
                            minWidth: '100%',
                            padding: '0 8px',
                          }}
                          onClick={() => {
                            if (!didDrag.current) navigate(`/events/${ev.id}`, { state: { event: ev } })
                          }}
                        >
                          {/* event-card: the actual visible card — border-radius and overflow:hidden live HERE */}
                          <div
                            style={{
                              width: '100%',
                              height: '170px',
                              borderRadius: '20px',
                              overflow: 'hidden',
                              position: 'relative',
                            }}
                          >
                            {/* Background */}
                            {ev.image_url ? (
                              <img
                                src={ev.image_url}
                                alt=""
                                draggable={false}
                                style={{
                                  position: 'absolute',
                                  inset: 0,
                                  width: '100%',
                                  height: '100%',
                                  objectFit: 'cover',
                                  objectPosition: 'center',
                                }}
                              />
                            ) : (
                              <div style={{ position: 'absolute', inset: 0, background: grad }} />
                            )}

                            {/* Gradient overlay */}
                            <div
                              style={{
                                position: 'absolute',
                                inset: 0,
                                background: 'linear-gradient(to bottom, rgba(0,0,0,0.15) 0%, rgba(0,0,0,0.75) 60%, rgba(0,0,0,0.92) 100%)',
                              }}
                            />

                            {/* Date badge — top right */}
                            <div
                              style={{
                                position: 'absolute',
                                top: '12px',
                                right: '12px',
                                background: 'rgba(0,0,0,0.5)',
                                borderRadius: '8px',
                                padding: '4px 10px',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                zIndex: 2,
                              }}
                            >
                              <span style={{ fontSize: '18px', fontWeight: '700', color: '#fff', lineHeight: 1 }}>
                                {ev.day}
                              </span>
                              <span style={{ fontSize: '9px', color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', marginTop: '1px' }}>
                                {ev.month}
                              </span>
                            </div>

                            {/* Text content — pinned to bottom */}
                            <div
                              style={{
                                position: 'absolute',
                                bottom: 0,
                                left: 0,
                                right: 0,
                                padding: '14px',
                                zIndex: 2,
                              }}
                            >
                              <span
                                style={{
                                  display: 'inline-block',
                                  background: bdg.bg,
                                  color: bdg.color,
                                  fontSize: '10px',
                                  fontWeight: '600',
                                  padding: '3px 8px',
                                  borderRadius: '20px',
                                  textTransform: 'uppercase',
                                  letterSpacing: '0.5px',
                                }}
                              >
                                {capitalize(ev.type)}
                              </span>
                              <p style={{ fontSize: '20px', fontWeight: '700', color: '#fff', marginTop: '4px', lineHeight: 1.2 }}>
                                {ev.name}
                              </p>
                              <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.7)', marginTop: '4px' }}>
                                {ev.time} · {ev.location}
                              </p>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>

                {upcoming.length > 1 && (
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'center',
                      gap: '5px',
                      marginTop: '10px',
                    }}
                  >
                    {upcoming.map((_, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => {
                          setActiveIndex(i)
                          setDragOffset(0)
                        }}
                        style={{
                          height: '5px',
                          width: i === activeDotIndex ? '14px' : '5px',
                          borderRadius: '50px',
                          background: i === activeDotIndex ? '#ffffff' : '#333333',
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
              <p style={{ fontSize: '14px', color: '#555' }}>No upcoming events</p>
            )}
          </section>

          {/* 3. ANNOUNCEMENTS */}
          {recentNews.length > 0 && (
            <section style={{ marginBottom: '28px' }}>
              <p style={{ fontSize: '20px', fontWeight: '600', color: '#ffffff', marginBottom: '12px' }}>
                Announcements
              </p>
              <div
                style={{
                  background: '#1a1a1a',
                  border: '0.5px solid #2e2e2e',
                  borderRadius: '14px',
                  padding: '0 14px',
                }}
              >
                {recentNews.map((item, index) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => navigate(`/news/${item.id}`, { state: { item } })}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      width: '100%',
                      padding: '12px 0',
                      background: 'transparent',
                      border: 'none',
                      borderBottom: index < recentNews.length - 1 ? '0.5px solid #1e1e1e' : 'none',
                      cursor: 'pointer',
                      textAlign: 'left',
                    }}
                  >
                    <span
                      style={{
                        width: '7px',
                        height: '7px',
                        borderRadius: '50%',
                        background: item.color ?? '#5b8cff',
                        flexShrink: 0,
                      }}
                    />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p
                        style={{
                          fontSize: '15px',
                          fontWeight: '500',
                          color: '#ffffff',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {item.title}
                      </p>
                      <p style={{ fontSize: '13px', color: '#555', marginTop: '1px' }}>
                        {formatShortDate(item.published_at)}
                      </p>
                    </div>
                    <ChevronRight size={14} color="#333" style={{ flexShrink: 0 }} />
                  </button>
                ))}
              </div>
            </section>
          )}

          {/* 4. QUICK ACCESS */}
          <section>
            <p style={{ fontSize: '20px', fontWeight: '600', color: '#ffffff', marginBottom: '12px' }}>
              Quick access
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <QuickCard
                icon={<CalendarDays size={24} color="#5b8cff" />}
                label="Events calendar"
                sub="All events"
                onClick={() => navigate('/events')}
              />
              <QuickCard
                icon={<Play size={24} color="#ffffff" />}
                label="Last Sunday"
                sub="Sermon"
                onClick={() => navigate('/last-sunday')}
              />
              <QuickCard
                icon={<MapPin size={24} color="#5b8cff" />}
                label="Find Midweek"
                sub="Near you"
                onClick={() => navigate('/midweek')}
              />
              <QuickCard
                icon={<Heart size={24} color="#4caf7d" />}
                label="Donate"
                sub="Support us"
                onClick={() => setShowDonate(true)}
              />
            </div>
          </section>
        </>
      )}

      {showDonate && <DonateModal onClose={() => setShowDonate(false)} />}
      </div>
    </>
  )
}
