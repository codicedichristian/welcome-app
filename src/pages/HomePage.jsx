import { useEffect, useRef, useState } from 'react'
import { useNavigate, useOutletContext } from 'react-router-dom'
import { Bookmark, CalendarDays, Play, MapPin, Heart, Plus } from 'lucide-react'
import { useScrollMemory } from '../hooks/useScrollMemory.js'
import SwipeCarousel from '../components/SwipeCarousel.jsx'
import SkeletonCard from '../components/SkeletonCard.jsx'
import { getEvents, getNews, getExploreCards } from '../lib/api.js'
import { events as fallbackEvents } from '../data/events.js'
import { news as fallbackNews } from '../data/news.js'
import { getNextOccurrence, normalizeEvent } from '../lib/events.js'
import { useUser } from '../lib/UserContext.js'

const FONT = '"Helvetica Neue", Helvetica, "SF Pro Text", system-ui, sans-serif'
const ACCENT = '#f97316'

let cachedEvents = null
let cachedNews = null
let cachedExploreCards = null

const FALLBACK_EXPLORE = [
  { image: 'https://framerusercontent.com/images/RLmGvYtKErutAy2pF3l7ZVZMoc.jpg?width=2048&height=1365', category: 'Vision',     title: 'Our Vision',       to: '/vision'   },
  { image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&q=80',                    category: 'Leadership', title: 'Meet the Pastors', to: '/pastors'  },
  { image: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=800&q=80',                    category: 'Community',  title: 'Midweeks',         to: '/midweek'  },
  { image: 'https://images.unsplash.com/photo-1438032005730-c779502df39b?w=800&q=80',                    category: 'Sermons',    title: 'Sundays',          to: '/seasons'  },
  { image: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800&q=80',                    category: 'Serve',      title: 'Service Teams',    to: '/teams'    },
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
        loading="eager"
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', backgroundColor: '#1a1a1a' }}
      />
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.65), rgba(0,0,0,0) 55%)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', left: '16px', bottom: '16px' }}>
        <span style={{
          display: 'inline-block',
          background: (card.pill_color ?? ACCENT) + '22',
          color: card.pill_color ?? ACCENT,
          border: `1px solid ${(card.pill_color ?? ACCENT)}44`,
          fontSize: '12px',
          fontWeight: '700',
          padding: '4px 10px',
          borderRadius: '8px',
        }}>
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

  // Initialize directly from cache so returning from detail pages renders instantly
  const [events, setEvents] = useState(cachedEvents || [])
  const [news, setNews] = useState(cachedNews || [])
  const [exploreCards, setExploreCards] = useState(cachedExploreCards || [])
  const [showDonateModal, setShowDonateModal] = useState(false)
  const [isLoading, setIsLoading] = useState(!cachedEvents || !cachedNews || !cachedExploreCards)
  const [fadeOut, setFadeOut] = useState(false)
  const eventsScrollRef = useRef(null)
  useScrollMemory('home')

  const qaCard = {
    background: '#1c1c1c', border: '0.5px solid #2a2a2a', borderRadius: '16px',
    padding: '14px 12px', display: 'flex', alignItems: 'center', gap: '12px',
    cursor: 'pointer', textAlign: 'left', width: '100%',
  }
  const qaLabel = { fontSize: '13px', fontWeight: '500', color: '#fff', margin: 0 }
  const qaSub = { fontSize: '10px', color: '#555', marginTop: '2px', marginBottom: 0 }

  useEffect(() => {
    let cancelled = false

    const processResults = (evRes, nwRes, exRes) => {
      const ev = evRes.data?.length ? evRes.data : fallbackEvents
      const nw = nwRes.data?.length ? nwRes.data : fallbackNews
      const ex = exRes.data?.length
        ? exRes.data.map((c) => ({ image: c.image_url, category: c.pill_label, pill_color: c.pill_color, title: c.title, to: c.route }))
        : FALLBACK_EXPLORE
      return [ev, nw, ex]
    }

    async function load() {
      if (cachedEvents && cachedNews && cachedExploreCards) {
        // Cache hit — content already rendered from state init, refresh silently in background
        const [evRes, nwRes, exRes] = await Promise.all([getEvents(), getNews(), getExploreCards()])
        if (cancelled) return
        const [ev, nw, ex] = processResults(evRes, nwRes, exRes)
        cachedEvents = ev; cachedNews = nw; cachedExploreCards = ex
        setEvents(ev); setNews(nw); setExploreCards(ex)
        return
      }

      // No cache — show skeleton until data arrives
      const [evRes, nwRes, exRes] = await Promise.all([getEvents(), getNews(), getExploreCards()])
      if (cancelled) return
      const [ev, nw, ex] = processResults(evRes, nwRes, exRes)
      cachedEvents = ev; cachedNews = nw; cachedExploreCards = ex
      setEvents(ev); setNews(nw); setExploreCards(ex)
      setFadeOut(true)
      setTimeout(() => { if (!cancelled) setIsLoading(false) }, 300)
    }

    load()
    return () => { cancelled = true }
  }, [])

  useEffect(() => {
    if (isLoading) return
    const saved = sessionStorage.getItem('scroll_events_x')
    if (saved && eventsScrollRef.current) {
      requestAnimationFrame(() => {
        if (eventsScrollRef.current) eventsScrollRef.current.scrollLeft = parseInt(saved, 10)
      })
    }
  }, [isLoading])

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

  const announcementItems = news.map((item, i) => ({ ...item, fullWidth: i % 3 === 0 }))

  return (
    <>
    {isLoading && (
      <div style={{
        position: 'fixed', inset: 0, zIndex: 50,
        background: '#0a0a0a',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', gap: '12px',
        opacity: fadeOut ? 0 : 1,
        transition: 'opacity 300ms ease',
        pointerEvents: fadeOut ? 'none' : 'auto',
      }}>
        <Plus size={48} strokeWidth={1.5} color="#ffffff" />
        <span style={{ fontSize: '28px', fontWeight: '800', color: '#fff', letterSpacing: '-0.02em' }}>Welcome</span>
        <span style={{ fontSize: '13px', color: '#6e6e73' }}>Loading...</span>
      </div>
    )}
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
          {exploreCards.length === 0 ? (
            <>
              <SkeletonCard height={200} radius={22} />
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '7px', marginTop: '14px' }}>
                {[0, 1, 2].map((i) => (
                  <div key={i} style={{ height: '5px', width: i === 0 ? '20px' : '5px', borderRadius: '9px', background: '#2a2a2a' }} />
                ))}
              </div>
            </>
          ) : (
            <SwipeCarousel
              items={exploreCards}
              sidePadding={24}
              initialIndex={parseInt(sessionStorage.getItem('explore_index') || '0', 10)}
              onIndexChange={(i) => sessionStorage.setItem('explore_index', String(i))}
              renderItem={(card, didDrag) => <ExploreCard card={card} didDrag={didDrag} navigate={navigate} />}
            />
          )}
        </div>
      </div>

      {/* ── 3. UPCOMING EVENTS ── */}
      <div style={{ paddingTop: '30px' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingLeft: '24px', paddingRight: '24px' }}>
          <span style={{ fontSize: '22px', fontWeight: '700', letterSpacing: '-0.02em', color: '#fff' }}>Upcoming events</span>
          <button onClick={() => navigate('/events')} style={{ background: 'none', border: 'none', fontSize: '13px', fontWeight: '600', color: ACCENT, cursor: 'pointer', padding: 0 }}>See all</button>
        </div>

        {/* Cards row */}
        <div
          ref={eventsScrollRef}
          onScroll={() => sessionStorage.setItem('scroll_events_x', String(eventsScrollRef.current.scrollLeft))}
          style={{
            display: 'flex',
            gap: '14px',
            overflowX: 'auto',
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
            paddingLeft: '24px',
            paddingRight: '24px',
            marginTop: '16px',
          }}>
          {upcoming.map((ev) => (
            <button key={ev.id} type="button"
              onClick={() => navigate(`/events/${ev.id}`, { state: { event: ev } })}
              style={{ flexShrink: 0, width: '176px', background: '#161618', border: '1px solid #222226', borderRadius: '22px', padding: '8px 8px 12px', cursor: 'pointer', textAlign: 'left' }}>
              <div style={{ height: '160px', borderRadius: '16px', overflow: 'hidden', background: '#1c1c1f' }}>
                <img
                  src={ev.image_url ?? `https://picsum.photos/seed/${ev.id}/400/320`}
                  alt="" draggable={false} loading="eager"
                  style={{ width: '100%', height: '100%', objectFit: 'cover', backgroundColor: '#1a1a1a' }}
                />
              </div>
              <div style={{ padding: '9px 6px 0' }}>
                <p style={{ fontSize: '11px', fontWeight: '600', color: ACCENT, letterSpacing: '0.04em', textTransform: 'uppercase', margin: 0 }}>
                  {ev.dateObj.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })}
                </p>
                <p style={{ fontSize: '17px', fontWeight: '700', color: '#fff', letterSpacing: '-0.01em', margin: '3px 0 0' }}>{ev.name}</p>
                <p style={{ fontSize: '12.5px', color: '#8e8e93', marginTop: '3px', marginBottom: 0 }}>{ev.time}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* ── 4. ANNOUNCEMENTS ── */}
      <section style={{ padding: '30px 24px 0' }}>
        <p style={{ fontSize: '22px', fontWeight: '700', color: '#ffffff', letterSpacing: '-0.02em' }}>
          Announcements
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '14px' }}>
          {announcementItems.map((item) => {
            const dotColor = NEWS_DOT[item.category] ?? NEWS_DOT.General
            const imgSrc = item.image_url ?? `https://picsum.photos/seed/news-${item.id}/${item.fullWidth ? '600/300' : '400/280'}`
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => navigate(`/news/${item.id}`, { state: { item } })}
                style={{
                  gridColumn: item.fullWidth ? '1 / -1' : 'span 1',
                  height: item.fullWidth ? '150px' : '120px',
                  borderRadius: '20px',
                  overflow: 'hidden',
                  position: 'relative',
                  border: 'none',
                  cursor: 'pointer',
                  padding: 0,
                  background: '#161618',
                }}
              >
                <img src={imgSrc} alt="" draggable={false} loading="eager" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', backgroundColor: '#1a1a1a' }} />
                <div style={{ position: 'absolute', inset: 0, background: SCRIM, pointerEvents: 'none' }} />
                <div style={{ position: 'absolute', top: '12px', left: '12px', width: '9px', height: '9px', borderRadius: '50%', background: dotColor }} />
                <div style={{ position: 'absolute', left: item.fullWidth ? '16px' : '12px', right: item.fullWidth ? '16px' : '12px', bottom: item.fullWidth ? '14px' : '12px', pointerEvents: 'none', textAlign: 'left' }}>
                  <p style={{ fontSize: item.fullWidth ? '10.5px' : '10px', fontWeight: '700', letterSpacing: '0.07em', color: '#d1d1d6', marginBottom: item.fullWidth ? '6px' : '4px' }}>
                    {formatAnnouncementDate(item.published_at)}
                  </p>
                  <p style={{ fontSize: item.fullWidth ? '18px' : '14.5px', fontWeight: '700', letterSpacing: '-0.015em', lineHeight: 1.2, color: '#ffffff' }}>
                    {item.title}
                  </p>
                  {item.fullWidth && item.body && (
                    <p style={{ fontSize: '12px', lineHeight: 1.35, color: '#c7c7cc', marginTop: '4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {item.body}
                    </p>
                  )}
                </div>
              </button>
            )
          })}
        </div>
      </section>

      {/* ── 5. QUICK ACCESS ── */}
      <div style={{ paddingTop: '30px', paddingLeft: '24px', paddingRight: '24px' }}>
        <span style={{ fontSize: '22px', fontWeight: '700', letterSpacing: '-0.02em', color: '#fff' }}>Quick access</span>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '14px' }}>
          <button type="button" onClick={() => navigate('/events')} style={qaCard}>
            <CalendarDays size={24} color="#5b8cff" strokeWidth={1.75} />
            <div><p style={qaLabel}>Events calendar</p><p style={qaSub}>All events</p></div>
          </button>
          <button type="button" onClick={() => navigate('/last-sunday')} style={qaCard}>
            <Play size={24} color="#ffffff" strokeWidth={1.75} />
            <div><p style={qaLabel}>Last Sunday</p><p style={qaSub}>Sermon</p></div>
          </button>
          <button type="button" onClick={() => navigate('/midweek')} style={qaCard}>
            <MapPin size={24} color="#5b8cff" strokeWidth={1.75} />
            <div><p style={qaLabel}>Find Midweek</p><p style={qaSub}>Near you</p></div>
          </button>
          <button type="button" onClick={() => setShowDonateModal(true)} style={qaCard}>
            <Heart size={24} color="#4caf7d" strokeWidth={1.75} />
            <div><p style={qaLabel}>Donate</p><p style={qaSub}>Support us</p></div>
          </button>
        </div>
      </div>

    </div>
    </>
  )
}
