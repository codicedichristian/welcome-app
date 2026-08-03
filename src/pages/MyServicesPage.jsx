import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft } from 'lucide-react'
import { useUser } from '../lib/UserContext.js'
import { getMyServicesData, updateServiceResponse } from '../lib/api.js'

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
const ACCENT_BLUE = '#5b8cff'
const ACCENT_GREEN = '#4caf7d'
const ACCENT_ORANGE = '#f2a341'
const ACCENT_RED = '#e05b4f'
const CHIP_BG = '#242424'

function hex15(hex) { return `${hex}26` }

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatScheduleDate(dateStr) {
  if (!dateStr) return ''
  const d = new Date(`${dateStr}T00:00:00`)
  return d.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })
}

function formatShort(dateStr) {
  if (!dateStr) return ''
  return new Date(`${dateStr}T00:00:00`).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function SectionLabel({ text, color = TEXT_MUTED }) {
  return (
    <p style={{
      fontSize: 12, fontWeight: 700, color,
      letterSpacing: '0.06em', marginBottom: 12,
    }}>
      {text}
    </p>
  )
}

function Pill({ label, color }) {
  return (
    <span style={{
      background: hex15(color), color,
      fontSize: 11, fontWeight: 700,
      borderRadius: 20, padding: '4px 10px',
      whiteSpace: 'nowrap', flexShrink: 0,
    }}>
      {label}
    </span>
  )
}

function Skel({ w, h, r = 8 }) {
  return <div style={{ background: '#242424', borderRadius: r, width: w, height: h, flexShrink: 0 }} />
}

function AreaChip({ name, leading }) {
  return (
    <span style={{
      background: CHIP_BG, color: '#e5e5e2',
      fontSize: 12, fontWeight: 600,
      borderRadius: 20, padding: '6px 12px',
      whiteSpace: 'nowrap',
    }}>
      {leading ? `★ ${name}` : name}
    </span>
  )
}

// ─── Next Assignment status control ──────────────────────────────────────────

function NextAssignmentCard({ schedule, responses, leadingAreaIds, userId, onUpdate }) {
  const firstResp = responses[0]
  const [status, setStatus] = useState(firstResp?.status ?? 'pending')

  const handle = async (newStatus) => {
    if (newStatus === status) return
    setStatus(newStatus)
    await onUpdate(schedule.id, firstResp?.area_id, newStatus)
  }

  const statusColor = status === 'accepted' ? ACCENT_GREEN : status === 'declined' ? ACCENT_RED : ACCENT_ORANGE
  const statusLabel = status === 'accepted' ? 'Confirmed' : status === 'declined' ? 'Declined' : 'Pending'
  const areaName = firstResp?.service_areas?.name ?? ''

  return (
    <div style={{ background: CARD_BG, border: CARD_BORDER, borderRadius: CARD_RADIUS, padding: CARD_PAD, marginBottom: 24 }}>
      {/* Label + status pill */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <p style={{ fontSize: 12, fontWeight: 700, color: ACCENT_ORANGE, letterSpacing: '0.06em' }}>NEXT ASSIGNMENT</p>
        <Pill label={statusLabel} color={statusColor} />
      </div>

      {/* Title */}
      <p style={{ fontSize: 17, fontWeight: 700, color: TEXT_PRIMARY, marginTop: 12, marginBottom: 4 }}>
        Sunday Service{areaName ? ` · ${areaName}` : ''}
      </p>

      {/* Date */}
      <p style={{ fontSize: 13, color: TEXT_SEC }}>
        {formatScheduleDate(schedule.date)} · Arrive 30min early
      </p>

      {/* Buttons */}
      {status === 'pending' && (
        <div style={{ display: 'flex', gap: 10, marginTop: 14 }}>
          <button
            type="button"
            onClick={() => handle('accepted')}
            style={{
              flex: 1, background: ACCENT_BLUE, color: TEXT_PRIMARY,
              fontSize: 14, fontWeight: 700, borderRadius: 12, padding: 11, border: 'none', cursor: 'pointer',
            }}
          >
            Accept
          </button>
          <button
            type="button"
            onClick={() => handle('declined')}
            style={{
              flex: 1, background: CHIP_BG, color: '#e5e5e2',
              fontSize: 14, fontWeight: 700, borderRadius: 12, padding: 11, border: 'none', cursor: 'pointer',
            }}
          >
            Decline
          </button>
        </div>
      )}

      {status !== 'pending' && (
        <button
          type="button"
          onClick={() => setStatus('pending')}
          style={{
            marginTop: 14, background: 'none', border: 'none',
            color: TEXT_MUTED, fontSize: 13, cursor: 'pointer', padding: 0,
          }}
        >
          Change response
        </button>
      )}
    </div>
  )
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function SkeletonScreen() {
  return (
    <div style={{ background: BG, minHeight: '100dvh', paddingTop: 'calc(env(safe-area-inset-top) + 24px)', paddingLeft: 22, paddingRight: 22, paddingBottom: 60 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 22 }}>
        <Skel w={36} h={36} r={18} />
        <Skel w={120} h={20} />
      </div>
      <Skel w="100%" h={100} r={20} />
      <div style={{ height: 14 }} />
      <Skel w="100%" h={160} r={20} />
      <div style={{ height: 24 }} />
      <Skel w={80} h={14} r={6} />
      <div style={{ height: 12 }} />
      {[0, 1, 2].map((i) => <div key={i}><Skel w="100%" h={64} r={16} /><div style={{ height: 8 }} /></div>)}
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function MyServicesPage() {
  const navigate = useNavigate()
  const user = useUser()
  const [data, setData] = useState(null)
  const [responses, setResponses] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user?.id) return
    getMyServicesData(user.id).then((result) => {
      setData(result)
      setResponses(result.responses ?? [])
      setLoading(false)
    })
  }, [user?.id])

  const handleUpdate = useCallback((scheduleId, areaId, newStatus) => {
    setResponses((prev) =>
      prev.map((r) =>
        r.schedule_id === scheduleId && r.area_id === areaId ? { ...r, status: newStatus } : r,
      ),
    )
    return updateServiceResponse(user.id, scheduleId, areaId, newStatus)
  }, [user?.id])

  if (loading) return <SkeletonScreen />

  const { areas, leadingAreaIds, upcomingSchedules, history } = data ?? {
    areas: [], leadingAreaIds: new Set(), upcomingSchedules: [], history: [],
  }

  // Find next assignment: first upcoming schedule with any response for the user
  let nextAssignmentSchedule = null
  let nextAssignmentResponses = []
  for (const s of upcomingSchedules) {
    const myResps = responses.filter((r) => r.schedule_id === s.id)
    if (myResps.length > 0) {
      nextAssignmentSchedule = s
      nextAssignmentResponses = myResps
      break
    }
  }

  // Upcoming accepted: future schedules (excluding next assignment) with accepted responses
  const upcomingAccepted = upcomingSchedules
    .filter((s) => s.id !== nextAssignmentSchedule?.id)
    .flatMap((s) =>
      responses
        .filter((r) => r.schedule_id === s.id && r.status === 'accepted')
        .map((r) => ({ schedule: s, response: r })),
    )

  return (
    <div style={{
      background: BG, minHeight: '100dvh',
      paddingTop: 'calc(env(safe-area-inset-top) + 24px)',
      paddingLeft: 22, paddingRight: 22, paddingBottom: 60,
    }}>

      {/* ── NAV ROW ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 22 }}>
        <button
          type="button"
          onClick={() => navigate('/my-church')}
          style={{
            width: 36, height: 36, borderRadius: 18,
            background: CARD_BG, border: CARD_BORDER,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', flexShrink: 0,
          }}
        >
          <ChevronLeft size={18} color="#e5e5e2" strokeWidth={2} />
        </button>
        <p style={{ fontSize: 20, fontWeight: 800, color: TEXT_PRIMARY }}>My Services</p>
      </div>

      {/* ── YOUR TEAMS ── */}
      <div style={{ background: CARD_BG, border: CARD_BORDER, borderRadius: CARD_RADIUS, padding: CARD_PAD, marginBottom: 14 }}>
        <p style={{ fontSize: 12, fontWeight: 700, color: ACCENT_BLUE, letterSpacing: '0.06em' }}>YOUR TEAMS</p>
        {areas.length === 0 ? (
          <p style={{ fontSize: 13, color: TEXT_SEC, marginTop: 12 }}>No areas assigned</p>
        ) : (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 12 }}>
            {areas.map((a) => (
              <AreaChip
                key={a.area_id}
                name={a.service_areas?.name ?? ''}
                leading={leadingAreaIds.has(a.area_id)}
              />
            ))}
          </div>
        )}
      </div>

      {/* ── NEXT ASSIGNMENT ── */}
      {nextAssignmentSchedule ? (
        <NextAssignmentCard
          schedule={nextAssignmentSchedule}
          responses={nextAssignmentResponses}
          leadingAreaIds={leadingAreaIds}
          userId={user?.id}
          onUpdate={handleUpdate}
        />
      ) : (
        <div style={{ background: CARD_BG, border: CARD_BORDER, borderRadius: CARD_RADIUS, padding: CARD_PAD, marginBottom: 24 }}>
          <p style={{ fontSize: 12, fontWeight: 700, color: ACCENT_ORANGE, letterSpacing: '0.06em', marginBottom: 10 }}>NEXT ASSIGNMENT</p>
          <p style={{ fontSize: 14, color: TEXT_SEC }}>No upcoming assignments</p>
        </div>
      )}

      {/* ── UPCOMING ── */}
      {upcomingAccepted.length > 0 && (
        <div style={{ marginBottom: 28 }}>
          <SectionLabel text="UPCOMING" />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {upcomingAccepted.map(({ schedule, response }) => (
              <div
                key={`${schedule.id}-${response.area_id}`}
                style={{
                  background: CARD_BG, border: CARD_BORDER, borderRadius: 16, padding: 14,
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                }}
              >
                <div>
                  <p style={{ fontSize: 14, fontWeight: 600, color: TEXT_PRIMARY, marginBottom: 2 }}>
                    Sunday Service{response.service_areas?.name ? ` · ${response.service_areas.name}` : ''}
                  </p>
                  <p style={{ fontSize: 12, color: TEXT_SEC }}>
                    {formatShort(schedule.date)}
                  </p>
                </div>
                <Pill label="Confirmed" color={ACCENT_GREEN} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── HISTORY ── */}
      {(history ?? []).length > 0 && (
        <div>
          <SectionLabel text="HISTORY" />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            {history.map((r, i) => (
              <div
                key={`${r.schedule_id}-${r.area_id}-${i}`}
                style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '11px 0',
                  borderBottom: i < history.length - 1 ? '0.5px solid #1e1e1e' : 'none',
                }}
              >
                <p style={{ fontSize: 13, color: TEXT_TER }}>
                  {r.service_areas?.name ? `${r.service_areas.name} Service` : 'Service'}
                </p>
                <p style={{ fontSize: 12, color: TEXT_MUTED }}>{formatShort(r.scheduleDate)}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
