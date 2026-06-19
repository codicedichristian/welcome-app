import { useEffect, useRef, useState } from 'react'
import { useNavigate, useOutletContext } from 'react-router-dom'
import { ChevronRight, CalendarDays, Play, MapPin, Heart } from 'lucide-react'
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

// End color of each gradient for image overlay blending
const GRADIENT_END = {
  sunday:  '#0f0f1a',
  youth:   '#0f2419',
  midweek: '#0f1628',
  prayer:  '#180f28',
  special: '#281508',
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
        <p style={{ fontSize: '13px', fontWeight: '500', color: '#ffffff' }}>{label}</p>
        <p style={{ fontSize: '10px', color: '#666', marginTop: '2px' }}>{sub}</p>
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
        <p style={{ fontSize: '18px', fontWeight: '600', color: '#ffffff', textAlign: 'center', marginBottom: '8px' }}>
          Support the church
        </p>
        <p style={{ fontSize: '13px', color: '#888', textAlign: 'center', marginBottom: '16px' }}>
          Your generosity makes everything possible.
        </p>
        <div
          style={{
            background: '#111',
            borderRadius: '12px',
            padding: '14px',
            fontFamily: 'monospace',
            fontSize: '13px',
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
            fontSize: '15px',
            fontWeight: '600',
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
  const [slideDir, setSlideDir] = useState(null) // 'right' | 'left' | null
  const [showDonate, setShowDonate] = useState(false)

  const touchStartX = useRef(0)
  const touchStartY = useRef(0)
  const cardContainerRef = useRef(null)

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

  // Attach non-passive touchmove to card so preventDefault can block Safari's page-back gesture
  useEffect(() => {
    const el = cardContainerRef.current
    if (!el) return
    const handleMove = (e) => {
      const diffX = e.touches[0].clientX - touchStartX.current
      const diffY = e.touches[0].clientY - touchStartY.current
      if (Math.abs(diffX) > Math.abs(diffY)) e.preventDefault()
    }
    el.addEventListener('touchmove', handleMove, { passive: false })
    return () => el.removeEventListener('touchmove', handleMove)
  }, [])

  const upcoming = events
    .map((event) => ({ event, date: getNextOccurrence(event) }))
    .filter((item) => item.date)
    .sort((a, b) => a.date - b.date)
    .slice(0, 5)
    .map((item) => normalizeEvent(item.event, item.date))

  const recentNews = news.slice(0, 3)

  const lastSundayRaw = events.find((e) => e.type === 'sunday')
  const lastSunday = lastSundayRaw ? normalizeEvent(lastSundayRaw, getNextOccurrence(lastSundayRaw)) : null

  const changeCard = (newIndex) => {
    if (newIndex < 0 || newIndex >= upcoming.length) return
    setSlideDir(newIndex > activeIndex ? 'right' : 'left')
    setActiveIndex(newIndex)
  }

  const handleTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX
    touchStartY.current = e.touches[0].clientY
  }

  const handleTouchEnd = (e) => {
    const diffX = e.changedTouches[0].clientX - touchStartX.current
    const diffY = e.changedTouches[0].clientY - touchStartY.current
    if (Math.abs(diffX) < Math.abs(diffY)) return
    if (Math.abs(diffX) >= 40) {
      diffX < 0 ? changeCard(activeIndex + 1) : changeCard(activeIndex - 1)
    } else if (upcoming[activeIndex]) {
      const ev = upcoming[activeIndex]
      navigate(`/events/${ev.id}`, { state: { event: ev } })
    }
  }

  const current     = upcoming[activeIndex]
  const gradient    = current ? (GRADIENTS[current.type]    ?? GRADIENTS.special)    : GRADIENTS.special
  const gradientEnd = current ? (GRADIENT_END[current.type] ?? GRADIENT_END.special) : GRADIENT_END.special
  const badge       = current ? (BADGE[current.type]        ?? BADGE.special)        : BADGE.special
  const slideClass  = slideDir === 'right' ? 'card-enter-right' : slideDir === 'left' ? 'card-enter-left' : ''

  return (
    <div
      className="px-4 pb-8"
      style={{ paddingTop: 'calc(env(safe-area-inset-top) + 14px)' }}
    >
      {/* 1. HEADER */}
      <div className="flex items-center justify-between mb-6">
        <button type="button" onClick={openRightPanel} className="text-left" style={{ cursor: 'pointer' }}>
          <p style={{ fontSize: '13px', color: '#666' }}>{getGreeting()}</p>
          <p style={{ fontSize: '22px', fontWeight: '700', color: '#ffffff', lineHeight: 1.2 }}>
            {user.firstName || 'Friend'}
          </p>
        </button>
        <button
          type="button"
          onClick={openRightPanel}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-border bg-surface text-[14px] font-medium text-primary"
        >
          {initials}
        </button>
      </div>

      {loading ? (
        <div style={{ paddingTop: '40px', textAlign: 'center' }}>
          <p style={{ color: '#555', fontSize: '14px' }}>Loading…</p>
        </div>
      ) : (
        <>
          {/* 2. UPCOMING EVENTS */}
          <section style={{ marginBottom: '28px' }}>
            <p style={{ fontSize: '16px', fontWeight: '600', color: '#ffffff', marginBottom: '12px' }}>
              Upcoming events
            </p>

            {upcoming.length > 0 ? (
              <>
                {/* Clipping container — square, overflow hidden so slide animation is clipped */}
                <div
                  ref={cardContainerRef}
                  onTouchStart={handleTouchStart}
                  onTouchEnd={handleTouchEnd}
                  style={{
                    borderRadius: '20px',
                    overflow: 'hidden',
                    aspectRatio: '1 / 1',
                    position: 'relative',
                  }}
                >
                  <div
                    key={activeIndex}
                    className={slideClass}
                    style={{ position: 'absolute', inset: 0, cursor: 'pointer' }}
                  >
                    {/* Background layers */}
                    {current.image_url ? (
                      <>
                        {/* Bottom half: solid card color */}
                        <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: '50%', background: gradientEnd }} />
                        {/* Top half: photo */}
                        <img
                          src={current.image_url}
                          alt=""
                          style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            width: '100%',
                            height: '50%',
                            objectFit: 'cover',
                            objectPosition: 'center',
                          }}
                        />
                        {/* Fade: transparent → card color over the bottom 60% of the image area */}
                        <div
                          style={{
                            position: 'absolute',
                            left: 0,
                            right: 0,
                            top: '20%',
                            height: '30%',
                            background: `linear-gradient(to bottom, transparent 0%, ${gradientEnd} 100%)`,
                          }}
                        />
                      </>
                    ) : (
                      <div style={{ position: 'absolute', inset: 0, background: gradient }} />
                    )}

                    {/* Content layer */}
                    <div
                      style={{
                        position: 'absolute',
                        inset: 0,
                        zIndex: 1,
                        padding: '16px',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <span
                          style={{
                            background: badge.bg,
                            color: badge.color,
                            fontSize: '10px',
                            fontWeight: '600',
                            padding: '3px 8px',
                            borderRadius: '20px',
                            textTransform: 'uppercase',
                            letterSpacing: '0.5px',
                          }}
                        >
                          {capitalize(current.type)}
                        </span>
                        <div
                          style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            background: 'rgba(255,255,255,0.1)',
                            borderRadius: '10px',
                            padding: '4px 10px',
                            minWidth: '44px',
                          }}
                        >
                          <span style={{ fontSize: '18px', fontWeight: '700', color: '#fff', lineHeight: 1 }}>
                            {current.day}
                          </span>
                          <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', marginTop: '1px' }}>
                            {current.month}
                          </span>
                        </div>
                      </div>

                      <div>
                        <p style={{ fontSize: '18px', fontWeight: '700', color: '#fff', marginBottom: '4px' }}>
                          {current.name}
                        </p>
                        <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)' }}>
                          {current.time} · {current.location}
                        </p>
                      </div>
                    </div>
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
                        onClick={() => changeCard(i)}
                        style={{
                          height: '5px',
                          width: i === activeIndex ? '14px' : '5px',
                          borderRadius: '50px',
                          background: i === activeIndex ? '#ffffff' : '#333333',
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
              <p style={{ fontSize: '16px', fontWeight: '600', color: '#ffffff', marginBottom: '12px' }}>
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
                          fontSize: '12px',
                          fontWeight: '500',
                          color: '#ffffff',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {item.title}
                      </p>
                      <p style={{ fontSize: '10px', color: '#555', marginTop: '1px' }}>
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
            <p style={{ fontSize: '16px', fontWeight: '600', color: '#ffffff', marginBottom: '12px' }}>
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
  )
}
