import { useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { Calendar, Clock, MapPin, Users, Map, Check, Cross, Zap, Home, HandHeart, Star } from 'lucide-react'
import { getEventById } from '../data/events.js'
import { normalizeEvent } from '../lib/events.js'
import { EVENT_COLOR_CLASSES } from '../lib/eventColors.js'
import { isRsvped, addRsvp } from '../lib/rsvp.js'
import { getStoredUser } from '../lib/user.js'
import { rsvpEvent } from '../lib/api.js'
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

export default function EventDetailPage() {
  const { eventId } = useParams()
  const location = useLocation()
  const navigate = useNavigate()

  const fallbackEvent = getEventById(eventId)
  const event = location.state?.event ?? (fallbackEvent ? normalizeEvent(fallbackEvent) : null)

  const [going, setGoing] = useState(() => (event ? isRsvped(event.id) : false))

  if (!event) {
    return (
      <div className="px-4 pt-6">
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

  return (
    <div className="min-h-dvh bg-bg px-4 pt-6 pb-8">
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
            onClick={handleRsvp}
            disabled={going}
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
  )
}
