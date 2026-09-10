import { useEffect, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { Calendar, Clock, MapPin, Users, Check, ChevronLeft, ExternalLink, Lock } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { getEventById } from '../data/events.js'
import { normalizeEvent } from '../lib/events.js'
import { rsvpEvent, deleteRsvp, checkRsvp } from '../lib/api.js'
import { useUser } from '../lib/UserContext.js'
import { td } from '../utils/td.js'

function EventNotice({ icon, title, message }) {
  return (
    <div style={{
      margin: '16px 0',
      borderRadius: '12px',
      overflow: 'hidden',
      border: '1px solid #f97316',
    }}>
      <div style={{
        background: '#f97316',
        padding: '8px 14px',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
      }}>
        {icon}
        <span style={{ fontSize: '11px', fontWeight: '800', color: '#000', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
          {title}
        </span>
      </div>
      <div style={{ background: '#0d0d0d', padding: '12px 14px' }}>
        <p style={{ margin: 0, fontSize: '13.5px', color: '#f97316', fontFamily: 'monospace', lineHeight: 1.5 }}>
          {message}
        </p>
      </div>
    </div>
  )
}

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
  const { t } = useTranslation()
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
          {t('event_detail.cancel_title')}
        </p>
        <p style={{ fontSize: '13px', color: '#888', textAlign: 'center', marginBottom: '24px' }}>
          {t('event_detail.cancel_body', { eventName })}
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
            {t('event_detail.cancel_confirm')}
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
            {t('event_detail.cancel_keep')}
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
  const { t, i18n } = useTranslation()

  const fallbackEvent = getEventById(eventId)
  const event = location.state?.event ?? (fallbackEvent ? normalizeEvent(fallbackEvent) : null)
  const isMidweek = event?.type === 'midweek' || event?.id === 'midweek'

  const [going, setGoing] = useState(false)
  const [showCancelSheet, setShowCancelSheet] = useState(false)

  useEffect(() => {
    if (!user?.id || !event?.id) return
    checkRsvp(user.id, event.id).then((alreadyGoing) => setGoing(alreadyGoing))
  }, [user?.id, event?.id])

  if (!event) {
    return (
      <div className="px-4" style={{ paddingTop: 'calc(env(safe-area-inset-top) + 24px)' }}>
        <p className="text-[14px] text-zinc-500">{t('event_detail.not_found')}</p>
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
            onClick={() => { sessionStorage.setItem('returning_to_home', 'true'); window.history.back() }}
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
            onContextMenu={(e) => e.preventDefault()}
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

          <p className="mt-4 text-[14px] leading-[1.7] text-zinc-500">{td(event.description)}</p>

          {event.members_only && (
            <EventNotice
              icon={<Lock size={13} color="#000" strokeWidth={2.5} />}
              title={i18n.language === 'en' ? 'Members only' : 'Solo para miembros'}
              message={i18n.language === 'en'
                ? 'This event is only open to church members.'
                : '¡Este evento es solo para miembros de la iglesia!'}
            />
          )}

          {event.registration_required && (
            <EventNotice
              icon={
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                  <circle cx="9" cy="7" r="4"/>
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                  <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                </svg>
              }
              title={i18n.language === 'en' ? 'Registration required' : 'Inscripción requerida'}
              message={i18n.language === 'en'
                ? 'Registration is required to attend this event!'
                : '¡Es necesario inscribirse para asistir a este evento!'}
            />
          )}

          {event.link && (
            <a
              href={event.link}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                marginTop: '12px',
                fontSize: '14px',
                color: '#5b8cff',
                textDecoration: 'none',
              }}
            >
              <ExternalLink size={15} />
              <span>Más información</span>
            </a>
          )}

          <div className="mt-6">
            {isMidweek ? (
              <button
                type="button"
                onClick={() => navigate('/midweek')}
                className="flex w-full items-center justify-center gap-2 rounded-xl py-4 text-[16px] font-medium transition-colors bg-primary text-bg"
              >
                <span>Quiero asistir</span>
              </button>
            ) : (
              <>
                {(!event.cta_type || event.cta_type === 'rsvp') && (
                  <button
                    type="button"
                    onClick={going ? () => setShowCancelSheet(true) : handleRsvp}
                    className={`flex w-full items-center justify-center gap-2 rounded-xl py-4 text-[16px] font-medium transition-colors ${
                      going ? 'bg-accent-green text-bg' : 'bg-primary text-bg'
                    }`}
                  >
                    {going && <Check size={18} />}
                    <span>{going ? t('event_detail.youre_in') : t('event_detail.ill_be_there')}</span>
                  </button>
                )}

                {event.cta_type === 'link' && event.cta_url && (
                  <a
                    href={event.cta_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: 'block',
                      width: '100%',
                      padding: '16px',
                      borderRadius: '14px',
                      background: '#f97316',
                      color: '#fff',
                      fontSize: '16px',
                      fontWeight: '700',
                      textAlign: 'center',
                      textDecoration: 'none',
                    }}
                  >
                    {i18n.language === 'en' ? 'Sign up' : 'Inscríbete'}
                  </a>
                )}

                {event.cta_type === 'none' && null}
              </>
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
