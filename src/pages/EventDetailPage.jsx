import { useEffect, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { Calendar, Clock, MapPin, Users, Map, Check, ChevronLeft, ExternalLink } from 'lucide-react'
import { getEventById } from '../data/events.js'
import { normalizeEvent } from '../lib/events.js'
import { rsvpEvent, deleteRsvp, checkRsvp } from '../lib/api.js'
import { useUser } from '../lib/UserContext.js'

function MetaRow({ icon: Icon, text }) {
  return (
    <div className="flex items-center gap-3 text-[14px] text-zinc-400">
      <Icon size={17} className="text-accent-blue" />
      <span>{text}</span>
    </div>
  )
}

function LocationRow({ location }) {
  if (!location) return null

  const isUrl = location.startsWith('http') || location.startsWith('www')
  const isOnline = location.toLowerCase().includes('zoom') ||
                   location.toLowerCase().includes('online') ||
                   location.toLowerCase().includes('remote')

  const href = isUrl
    ? location
    : `https://maps.google.com/?q=${encodeURIComponent(location)}`

  return (
    <button
      type="button"
      onClick={() => window.open(href, '_blank', 'noopener')}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        background: 'none',
        border: 'none',
        padding: 0,
        cursor: 'pointer',
        textAlign: 'left',
        width: '100%',
      }}
    >
      {isUrl || isOnline
        ? <ExternalLink size={17} style={{ color: '#5b8cff', flexShrink: 0 }} />
        : <MapPin size={17} style={{ color: '#5b8cff', flexShrink: 0 }} />
      }
      <span style={{ fontSize: '14px', color: '#5b8cff', flex: 1 }}>{location}</span>
      {!isUrl && !isOnline && (
        <ExternalLink size={12} style={{ color: '#5b8cff', opacity: 0.5, flexShrink: 0 }} />
      )}
    </button>
  )
}

function CancelSheet({ eventName, onConfirm, onClose }) {
  return (
    <>
      <div
        onClick={onClose}
        style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 200 }}
      />
      <div
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          background: '#1a1a1a',
          borderRadius: '20px 20px 0 0',
          zIndex: 201,
          padding: '20px',
          paddingBottom: 'calc(env(safe-area-inset-bottom) + 24px)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'center', paddingBottom: '16px' }}>
          <div style={{ width: '40px', height: '4px', borderRadius: '2px', background: '#333' }} />
        </div>
        <p style={{ fontSize: '16px', fontWeight: '600', color: '#ffffff', textAlign: 'center', marginBottom: '8px' }}>
          Cancel attendance?
        </p>
        <p style={{ fontSize: '13px', color: '#888', textAlign: 'center', marginBottom: '24px' }}>
          Are you sure you don't want to go to {eventName}?
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <button
            type="button"
            onClick={onConfirm}
            style={{
              width: '100%',
              padding: '14px',
              borderRadius: '12px',
              background: '#e55555',
              color: '#ffffff',
              fontSize: '15px',
              fontWeight: '600',
              border: 'none',
              cursor: 'pointer',
            }}
          >
            Yes, cancel
          </button>
          <button
            type="button"
            onClick={onClose}
            style={{
              width: '100%',
              padding: '14px',
              borderRadius: '12px',
              background: '#1a1a1a',
              border: '1px solid #2e2e2e',
              color: '#ffffff',
              fontSize: '15px',
              fontWeight: '600',
              cursor: 'pointer',
            }}
          >
            Keep my spot
          </button>
        </div>
      </div>
    </>
  )
}

export default function EventDetailPage() {
  const { eventId } = useParams()
  const location = useLocation()
  const navigate = useNavigate()
  const user = useUser()

  const fallbackEvent = getEventById(eventId)
  const event = location.state?.event ?? (fallbackEvent ? normalizeEvent(fallbackEvent) : null)

  const [going, setGoing] = useState(false)
  const [showCancelSheet, setShowCancelSheet] = useState(false)

  useEffect(() => {
    if (!user?.id || !event?.id) return
    checkRsvp(user.id, event.id).then((alreadyGoing) => setGoing(alreadyGoing))
  }, [user?.id, event?.id])

  if (!event) {
    return (
      <div className="px-4" style={{ paddingTop: 'calc(env(safe-area-inset-top) + 24px)' }}>
        <p className="text-[14px] text-zinc-500">Event not found.</p>
      </div>
    )
  }

  const handleRsvp = () => {
    setGoing(true)
    if (user?.id) {
      rsvpEvent(user.id, event.id).catch(console.error)
    }
  }

  const handleCancelConfirm = () => {
    setGoing(false)
    setShowCancelSheet(false)
    if (user?.id) {
      deleteRsvp(user.id, event.id).catch(console.error)
    }
  }

  return (
    <>
      <div className="page-transition min-h-dvh pb-8" style={{ background: '#0a0b0a' }}>
        {/* Back button overlaid on hero */}
        <div style={{ position: 'absolute', top: 'calc(env(safe-area-inset-top) + 12px)', left: '16px', zIndex: 10 }}>
          <button
            type="button"
            onClick={() => { localStorage.setItem('returning_to_home', 'true'); window.history.back() }}
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              background: 'rgba(0,0,0,0.4)',
              backdropFilter: 'blur(10px)',
              WebkitBackdropFilter: 'blur(10px)',
              border: '0.5px solid rgba(255,255,255,0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
            }}
          >
            <ChevronLeft size={18} color="#ffffff" />
          </button>
        </div>

        {/* Hero image */}
        <div style={{ position: 'relative', width: '100%', height: '260px', background: '#1a1a1a' }}>
          <img
            src={event.image_url ?? `https://picsum.photos/seed/${event.id}/800/520`}
            alt=""
            draggable={false}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, transparent 30%, #0a0b0a 100%)' }} />
          <div style={{ position: 'absolute', left: '22px', bottom: '20px' }}>
            <span style={{
              display: 'inline-block',
              background: 'rgba(0,0,0,0.45)',
              backdropFilter: 'blur(8px)',
              WebkitBackdropFilter: 'blur(8px)',
              color: '#ffffff',
              fontSize: '10px',
              fontWeight: '700',
              letterSpacing: '0.07em',
              textTransform: 'uppercase',
              padding: '4px 10px',
              borderRadius: '999px',
              marginBottom: '8px',
            }}>
              {event.typeLabel}
            </span>
            <p style={{ fontSize: '26px', fontWeight: '800', color: '#ffffff', letterSpacing: '-0.01em', margin: 0 }}>
              {event.name}
            </p>
          </div>
        </div>

        {/* Content */}
        <div style={{ padding: '20px 22px 0' }}>
          <div className="flex flex-col gap-3">
            <MetaRow icon={Calendar} text={event.date} />
            <MetaRow icon={Clock} text={event.time} />
            <LocationRow location={event.location} />
            <MetaRow icon={Users} text={event.audience} />
          </div>

          <p className="mt-4 text-[14px] leading-[1.7] text-zinc-500">{event.description}</p>

          <div className="mt-6">
            {event.type === 'midweek' ? (
              <button
                type="button"
                onClick={() => navigate('/midweek')}
                className="flex w-full items-center gap-3 rounded-xl bg-accent-blue p-4 text-left text-bg"
              >
                <Map size={22} />
                <div>
                  <p className="text-[16px] font-medium">Find your group</p>
                  <p className="text-[13px]">See all locations on the map</p>
                </div>
              </button>
            ) : (
              <button
                type="button"
                onClick={going ? () => setShowCancelSheet(true) : handleRsvp}
                className={`flex w-full items-center justify-center gap-2 rounded-xl py-4 text-[16px] font-medium transition-colors ${
                  going ? 'bg-accent-green text-bg' : 'bg-primary text-bg'
                }`}
              >
                {going && <Check size={18} />}
                <span>{going ? "You're in!" : "I'll be there"}</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {showCancelSheet && (
        <CancelSheet
          eventName={event.name}
          onConfirm={handleCancelConfirm}
          onClose={() => setShowCancelSheet(false)}
        />
      )}
    </>
  )
}
