import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Headphones, Bell, Gift, Calendar, CircleCheck,
  Home, CalendarCheck, BookOpen, MessageCircle, ChevronRight,
} from 'lucide-react'
import { useUser } from '../lib/UserContext.js'
import { getMyChurchData } from '../lib/api.js'
import { formatShortDate } from '../lib/format.js'

const MEMBER_ROLES = ['member', 'leader', 'admin']

// ─── Design tokens ────────────────────────────────────────────────────────────
const BG = '#0a0b0a'
const CARD_BG = '#1a1a1a'
const CARD_BORDER = '0.5px solid #2e2e2e'
const CARD_RADIUS = 20
const CARD_PAD = 18
const TEXT_PRIMARY = '#ffffff'
const TEXT_SEC = '#9a9a97'
const TEXT_TER = '#c9c9c6'
const TEXT_MUTED = '#6b6b68'
const ACCENT_PURPLE = '#a78bfa'
const ACCENT_BLUE = '#5b8cff'
const ACCENT_GREEN = '#4caf7d'
const ACCENT_ORANGE = '#f2a341'
const ACCENT_RED = '#e05b4f'

// ─── Helpers ─────────────────────────────────────────────────────────────────

function hex15(hex) { return `${hex}26` } // 15% opacity
function hex8(hex)  { return `${hex}14` } // 8% opacity

function getNextWednesday() {
  const today = new Date()
  const day = today.getDay()
  const daysUntil = ((3 - day + 7) % 7) || 7
  const next = new Date(today)
  next.setDate(today.getDate() + daysUntil)
  return next.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function Skel({ w, h, r = 8, style }) {
  return (
    <div style={{
      background: '#242424',
      borderRadius: r,
      width: w,
      height: h,
      flexShrink: 0,
      ...style,
    }} />
  )
}

// ─── Pill ─────────────────────────────────────────────────────────────────────

function Pill({ label, color }) {
  return (
    <span style={{
      background: hex15(color),
      color,
      fontSize: 11,
      fontWeight: 700,
      borderRadius: 20,
      padding: '4px 10px',
      whiteSpace: 'nowrap',
      flexShrink: 0,
    }}>
      {label}
    </span>
  )
}

// ─── Donate modal ─────────────────────────────────────────────────────────────

function DonateModal({ onClose }) {
  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
        display: 'flex', alignItems: 'flex-end', justifyContent: 'center', zIndex: 300,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: CARD_BG,
          borderRadius: '28px 28px 0 0',
          padding: '28px 24px calc(32px + env(safe-area-inset-bottom))',
          width: '100%', maxWidth: 480,
        }}
      >
        <p style={{ fontSize: 20, fontWeight: 700, color: TEXT_PRIMARY, textAlign: 'center', marginBottom: 8 }}>
          Support the church
        </p>
        <p style={{ fontSize: 14, color: '#888', textAlign: 'center', marginBottom: 20 }}>
          Your generosity makes everything possible.
        </p>
        <div style={{
          background: '#111', borderRadius: 14, padding: 16,
          fontFamily: 'monospace', fontSize: 14, color: TEXT_PRIMARY, lineHeight: 1.8, marginBottom: 20,
        }}>
          <p>Bank: Banco Santander</p>
          <p>IBAN: ES91 2100 0418 42</p>
          <p>Name: Welcome Church</p>
        </div>
        <button
          type="button"
          onClick={onClose}
          style={{
            width: '100%', borderRadius: 14, background: TEXT_PRIMARY, color: '#0f0f0f',
            fontSize: 17, fontWeight: 600, padding: 15, border: 'none', cursor: 'pointer',
          }}
        >
          Close
        </button>
      </div>
    </div>
  )
}

// ─── Section card ─────────────────────────────────────────────────────────────

function SectionCard({ accent, Icon, title, subtitle, detailLeft, detailRight, badge, onClick, disabled, comingSoon }) {
  const iconBg = accent === TEXT_PRIMARY ? hex8(accent) : hex15(accent)
  const hasBadge = badge > 0

  const inner = (
    <>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{
          width: 44, height: 44, borderRadius: 14, background: iconBg,
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        }}>
          <Icon size={20} color={accent} strokeWidth={1.8} />
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontSize: 16, fontWeight: 700, color: TEXT_PRIMARY, marginBottom: 2 }}>{title}</p>
          <p style={{ fontSize: 13, color: TEXT_SEC, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {subtitle}
          </p>
          {comingSoon && (
            <p style={{ fontSize: 11, color: TEXT_MUTED, marginTop: 2 }}>Coming soon</p>
          )}
        </div>

        {!disabled && (
          hasBadge ? (
            <div style={{
              width: 20, height: 20, borderRadius: '50%', background: ACCENT_RED,
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: TEXT_PRIMARY }}>{badge}</span>
            </div>
          ) : (
            <ChevronRight size={17} color={TEXT_MUTED} strokeWidth={2} />
          )
        )}
      </div>

      <div style={{ height: '0.5px', background: '#2e2e2e', margin: '14px 0' }} />

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
        <p style={{ fontSize: 13, color: TEXT_TER, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
          {detailLeft}
        </p>
        {detailRight}
      </div>
    </>
  )

  if (disabled) {
    return (
      <div style={{
        width: '100%', background: CARD_BG, border: CARD_BORDER,
        borderRadius: CARD_RADIUS, padding: CARD_PAD, opacity: 0.5,
      }}>
        {inner}
      </div>
    )
  }

  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        width: '100%', background: CARD_BG, border: CARD_BORDER,
        borderRadius: CARD_RADIUS, padding: CARD_PAD,
        textAlign: 'left', cursor: 'pointer',
      }}
    >
      {inner}
    </button>
  )
}

// ─── Quick action tile ────────────────────────────────────────────────────────

function QuickTile({ Icon, color, label, onClick, beta }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        position: 'relative',
        background: CARD_BG, border: CARD_BORDER,
        borderRadius: 18, padding: '16px 8px',
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
        cursor: 'pointer', width: '100%',
      }}
    >
      {beta && (
        <span style={{
          position: 'absolute', top: 6, right: 8,
          background: ACCENT_ORANGE, color: BG,
          fontSize: 8, fontWeight: 800, padding: '2px 5px', borderRadius: 4,
        }}>
          BETA
        </span>
      )}
      <Icon size={22} color={color} strokeWidth={1.8} />
      <span style={{ fontSize: 12, fontWeight: 600, color: '#e5e5e2' }}>{label}</span>
    </button>
  )
}

// ─── Lock screen ──────────────────────────────────────────────────────────────

function VisitorLock() {
  return (
    <div style={{
      background: BG, minHeight: '100dvh',
      paddingTop: 'calc(env(safe-area-inset-top) + 24px)',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 40,
    }}>
      <div style={{
        width: 64, height: 64, borderRadius: 20, background: CARD_BG,
        border: CARD_BORDER, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20,
      }}>
        <Home size={28} color={TEXT_SEC} strokeWidth={1.5} />
      </div>
      <p style={{ fontSize: 22, fontWeight: 700, color: TEXT_PRIMARY, marginBottom: 10, textAlign: 'center' }}>
        Members Area
      </p>
      <p style={{ fontSize: 14, color: TEXT_SEC, textAlign: 'center', maxWidth: 280, lineHeight: 1.6 }}>
        This section is for church members. Talk to a leader to get access.
      </p>
    </div>
  )
}

// ─── Skeleton screen ──────────────────────────────────────────────────────────

function SkeletonScreen() {
  return (
    <div style={{
      background: BG, minHeight: '100dvh',
      paddingTop: 'calc(env(safe-area-inset-top) + 24px)',
      paddingLeft: 22, paddingRight: 22, paddingBottom: 'calc(90px + env(safe-area-inset-bottom))',
    }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <Skel w={44} h={44} r={22} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <Skel w={120} h={14} />
            <Skel w={180} h={12} />
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <Skel w={38} h={38} r={19} />
          <Skel w={38} h={38} r={19} />
        </div>
      </div>
      {/* Quick actions */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 24 }}>
        {[0, 1, 2].map((i) => <Skel key={i} w="100%" h={80} r={18} />)}
      </div>
      <Skel w={120} h={22} r={6} style={{ marginBottom: 16 }} />
      {/* Cards */}
      {[0, 1, 2, 3].map((i) => <Skel key={i} w="100%" h={120} r={20} style={{ marginBottom: 14 }} />)}
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function MyChurchPage() {
  const navigate = useNavigate()
  const user = useUser()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showDonate, setShowDonate] = useState(false)

  const isMember = MEMBER_ROLES.includes(user?.role)

  useEffect(() => {
    if (!isMember || !user?.id) { setLoading(false); return }
    getMyChurchData(user.id).then((result) => { setData(result); setLoading(false) })
  }, [user?.id, isMember])

  if (!isMember) return <VisitorLock />
  if (loading) return <SkeletonScreen />

  const {
    myGroup, myAreas, nextSchedule, unreadMessages,
    lastSunday, groupMemberCount, nextResponse, latestMessage,
  } = data ?? {}

  const initials = `${user?.firstName?.[0] ?? ''}${user?.lastName?.[0] ?? ''}`.toUpperCase()

  // Card subtitles
  const midweekSub = myGroup
    ? [myGroup.host, myGroup.zone].filter(Boolean).join(' · ')
    : 'No group assigned'

  const areasSub = (myAreas ?? [])
    .map((a) => a.service_areas?.name).filter(Boolean).join(' · ') || 'No areas assigned'

  const sundaySub = lastSunday
    ? `${lastSunday.title ?? 'Recent sermon'} — ${formatShortDate(lastSunday.schedule?.date)}`
    : 'No sermons yet'

  const leaderSub = unreadMessages > 0
    ? `${unreadMessages} new message${unreadMessages !== 1 ? 's' : ''}`
    : 'No new messages'

  // Card details
  const firstAreaName = (myAreas ?? [])[0]?.service_areas?.name ?? ''
  const nextServiceDetail = nextSchedule
    ? `Next: ${formatShortDate(nextSchedule.date)}${firstAreaName ? ' · ' + firstAreaName : ''}`
    : 'No upcoming services'

  const serviceStatusColor =
    nextResponse?.status === 'accepted' ? ACCENT_GREEN :
    nextResponse?.status === 'declined' ? ACCENT_RED :
    ACCENT_ORANGE

  const serviceStatusLabel =
    nextResponse?.status === 'accepted' ? 'Confirmed' :
    nextResponse?.status === 'declined' ? 'Declined' :
    'Pending'

  return (
    <div style={{
      background: BG, minHeight: '100dvh',
      paddingTop: 'calc(env(safe-area-inset-top) + 24px)',
      paddingLeft: 22, paddingRight: 22,
      paddingBottom: 'calc(90px + env(safe-area-inset-bottom))',
    }}>

      {/* ── HEADER ROW ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        {/* Left: avatar + greeting */}
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <div style={{
            width: 44, height: 44, borderRadius: 22,
            background: CARD_BG, border: CARD_BORDER,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 15, fontWeight: 700, color: TEXT_PRIMARY, flexShrink: 0,
          }}>
            {initials}
          </div>
          <div>
            <p style={{ fontSize: 18, fontWeight: 800, color: TEXT_PRIMARY, lineHeight: 1.2 }}>
              Hello, {user?.firstName ?? 'friend'}
            </p>
            <p style={{ fontSize: 13, color: TEXT_SEC }}>What would you like to do today?</p>
          </div>
        </div>

        {/* Right: icon buttons */}
        <div style={{ display: 'flex', gap: 10, flexShrink: 0 }}>
          <button type="button" style={iconBtn}>
            <Headphones size={18} color={TEXT_SEC} strokeWidth={1.8} />
          </button>

          <div style={{ position: 'relative' }}>
            <button
              type="button"
              onClick={() => navigate('/my-church/messages')}
              style={iconBtn}
            >
              <Bell size={18} color={TEXT_SEC} strokeWidth={1.8} />
            </button>
            {unreadMessages > 0 && (
              <div style={{
                position: 'absolute', top: 1, right: 1,
                width: 7, height: 7, borderRadius: '50%',
                background: ACCENT_RED, border: `1.5px solid ${BG}`,
              }} />
            )}
          </div>
        </div>
      </div>

      {/* ── QUICK ACTIONS GRID ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 24 }}>
        <QuickTile Icon={Gift}        color={ACCENT_PURPLE} label="Give"     onClick={() => setShowDonate(true)} />
        <QuickTile Icon={Calendar}    color={ACCENT_BLUE}   label="Events"   onClick={() => navigate('/events')} />
        <QuickTile Icon={CircleCheck} color={ACCENT_GREEN}  label="Check-in" onClick={() => {}} beta />
      </div>

      {/* ── PAGE TITLE ── */}
      <p style={{ fontSize: 26, fontWeight: 800, color: TEXT_PRIMARY, marginBottom: 16, letterSpacing: '-0.01em' }}>
        My Church
      </p>

      {/* ── SECTION CARDS ── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

        {/* Card 1 — Leader Messages */}
        <SectionCard
          accent={ACCENT_GREEN}
          Icon={MessageCircle}
          title="Leader Messages"
          subtitle={leaderSub}
          badge={unreadMessages}
          detailLeft={latestMessage?.body ?? 'No messages yet'}
          detailRight={null}
          onClick={() => navigate('/my-church/messages')}
        />

        {/* Card 2 — My Services */}
        <SectionCard
          accent={ACCENT_BLUE}
          Icon={CalendarCheck}
          title="My Services"
          subtitle={areasSub}
          detailLeft={nextServiceDetail}
          detailRight={<Pill label={serviceStatusLabel} color={serviceStatusColor} />}
          onClick={() => navigate('/my-church/services')}
        />

        {/* Card 3 — Sundays */}
        <SectionCard
          accent={TEXT_PRIMARY}
          Icon={BookOpen}
          title="Sundays"
          subtitle={sundaySub}
          detailLeft={lastSunday ? `Message: "${lastSunday.title ?? ''}"` : 'No sermons yet'}
          detailRight={
            lastSunday?.video_url
              ? (
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); window.open(lastSunday.video_url, '_blank') }}
                  style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', fontSize: 13, fontWeight: 600, color: '#e5e5e2', whiteSpace: 'nowrap' }}
                >
                  Watch again
                </button>
              )
              : null
          }
          onClick={() => navigate('/my-church/sundays')}
        />

        {/* Card 4 — My Midweek (disabled / coming soon) */}
        <SectionCard
          accent={ACCENT_PURPLE}
          Icon={Home}
          title="My Midweek"
          subtitle={midweekSub}
          detailLeft={`Next meeting: ${getNextWednesday()} · 7:00 PM`}
          detailRight={
            myGroup
              ? <Pill label={`${groupMemberCount} members`} color={ACCENT_PURPLE} />
              : null
          }
          disabled
          comingSoon
        />
      </div>

      {showDonate && <DonateModal onClose={() => setShowDonate(false)} />}
    </div>
  )
}

const iconBtn = {
  width: 38, height: 38, borderRadius: 19,
  background: CARD_BG, border: CARD_BORDER,
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  cursor: 'pointer',
}
