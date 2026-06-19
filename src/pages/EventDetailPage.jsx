import { useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { Calendar, Clock, MapPin, Users, Map, Check, Cross, Zap, Home, HandHeart, Star } from 'lucide-react'
import { getEventById } from '../data/events.js'
import { normalizeEvent } from '../lib/events.js'
import { EVENT_COLOR_CLASSES } from '../lib/eventColors.js'
import { isRsvped, addRsvp, removeRsvp } from '../lib/rsvp.js'
import { getStoredUser } from '../lib/user.js'
import { rsvpEvent, deleteRsvp } from '../lib/api.js'
import BackRow from '../components/BackRow.jsx'

const ICONS = { Cross, Zap, Home, HandHeart, Star }

function MetaRow({ icon: Icon, accentClass, text }) {
  return (
    <div className="flex items-center gap-3 text-[14px] text-zinc-400">
      <Icon size={17} className={accentClass} />
      <span>{text}</span>
    </div>
  )
}

function CancelSheet({ eventName, onConfirm, onClose }) {
  return (
    <>
      <div
        onClick={onClose}
        style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 200 }}
      />
      <div
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          background: '#111111',
          borderRadius: '20px 20px 0 0',
          zIndex: 201,
          padding: '12px 16px',
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

  const fallbackEvent = getEventById(eventId)
  const event = location.state?.event ?? (fallbackEvent ? normalizeEvent(fallbackEvent) : null)

  const [going, setGoing] = useState(() => (event ? isRsvped(event.id) : false))
  const [showCancelSheet, setShowCancelSheet] = useState(false)

  if (!event) {
    return (
      <div className="px-4 pt-3">
        <p className="text-[14px] text-zinc-500">Event not found.</p>
      </div>
    )
  }

  const colors = EVENT_COLOR_CLASSES[event.color]
  const Icon = ICONS[event.icon] ?? Cross

  const handleRsvp = () => {
    addRsvp(event.id)
    setGoing(true)
    const user = getStoredUser()
    if (user.id) {
      rsvpEvent(user.id, event.id)
    }
  }

  const handleCancelConfirm = () => {
    removeRsvp(event.id)
    setGoing(false)
    setShowCancelSheet(false)
    const user = getStoredUser()
    if (user.id) {
      deleteRsvp(user.id, event.id)
    }
  }

  return (
    <div className="min-h-dvh bg-bg px-4 pt-3 pb-8">
      <BackRow label="Events" />

      <div className="relative mt-4 h-[110px] rounded-[14px] bg-surface">
        <div className="flex h-full items-center justify-center">
          <Icon size={38} className={colors.accent} />
        </div>

        <div className={`absolute bottom-3 left-3 rounded-full px-3 py-1 text-[13px] font-medium text-bg ${colors.badge}`}>
          {event.typeLabel}
        </div>

        <div className="absolute right-3 top-3 flex h-11 w-11 flex-col items-center justify-center rounded-xl bg-bg leading-none">
          <span className="text-[16px] font-bold leading-none text-primary">{event.day}</span>
          <span className="mt-0.5 text-[11px] uppercase leading-none text-zinc-500">{event.month}</span>
        </div>
      </div>

      <div className="mt-4">
        <h1 className="text-[24px] font-bold text-primary">{event.name}</h1>
        <p className="mt-1 text-[13px] text-zinc-500">{event.subtitle}</p>
      </div>

      <div className="mt-4 flex flex-col gap-3">
        <MetaRow icon={Calendar} accentClass={colors.accent} text={event.date} />
        <MetaRow icon={Clock} accentClass={colors.accent} text={event.time} />
        <MetaRow icon={MapPin} accentClass={colors.accent} text={event.location} />
        <MetaRow icon={Users} accentClass={colors.accent} text={event.audience} />
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

      {showCancelSheet && (
        <CancelSheet
          eventName={event.name}
          onConfirm={handleCancelConfirm}
          onClose={() => setShowCancelSheet(false)}
        />
      )}
    </div>
  )
}
