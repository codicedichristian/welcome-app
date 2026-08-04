import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft, ExternalLink } from 'lucide-react'
import { useUser } from '../lib/UserContext.js'
import { getMyServicesData, updateServiceResponse } from '../lib/api.js'

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

function formatDay(dateStr) {
  if (!dateStr) return ''
  return new Date(`${dateStr}T00:00:00`).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
}

function formatShort(dateStr) {
  if (!dateStr) return ''
  return new Date(`${dateStr}T00:00:00`).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function Pill({ label, color }) {
  return (
    <span style={{
      background: hex15(color), color,
      fontSize: 11, fontWeight: 700,
      borderRadius: 20, padding: '4px 10px', whiteSpace: 'nowrap', flexShrink: 0,
    }}>
      {label}
    </span>
  )
}

function AreaChip({ name, leading }) {
  return (
    <span style={{
      background: CHIP_BG, color: '#e5e5e2',
      fontSize: 12, fontWeight: 600, borderRadius: 20, padding: '4px 10px', whiteSpace: 'nowrap',
    }}>
      {leading ? `★ ${name}` : name}
    </span>
  )
}

function Skel({ w, h, r = 8 }) {
  return <div style={{ background: CHIP_BG, borderRadius: r, width: w, height: h, flexShrink: 0 }} />
}

// ─── Per-area response row ────────────────────────────────────────────────────

function AreaRow({ scheduleId, areaId, areaName, status, isLeading, onUpdate, onDecline }) {
  const [showButtons, setShowButtons] = useState(status === 'pending')

  const handleAccept = () => {
    onUpdate(scheduleId, areaId, 'accepted')
    setShowButtons(false)
  }

  return (
    <div style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      padding: '8px 0',
    }}>
      <AreaChip name={areaName} leading={isLeading} />

      {showButtons ? (
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            type="button"
            onClick={handleAccept}
            style={{
              background: ACCENT_BLUE, color: TEXT_PRIMARY,
              fontSize: 12, fontWeight: 700, borderRadius: 8, padding: '6px 14px',
              border: 'none', cursor: 'pointer',
            }}
          >
            Accept
          </button>
          <button
            type="button"
            onClick={() => onDecline(scheduleId, areaId, areaName)}
            style={{
              background: CHIP_BG, color: '#e5e5e2',
              fontSize: 12, fontWeight: 700, borderRadius: 8, padding: '6px 14px',
              border: 'none', cursor: 'pointer',
            }}
          >
            Decline
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Pill
            label={status === 'accepted' ? '✓ Accepted' : '✗ Declined'}
            color={status === 'accepted' ? ACCENT_GREEN : ACCENT_RED}
          />
          <button
            type="button"
            onClick={() => setShowButtons(true)}
            style={{ background: 'none', border: 'none', color: TEXT_MUTED, fontSize: 11, cursor: 'pointer', padding: 0 }}
          >
            Change
          </button>
        </div>
      )}
    </div>
  )
}

// ─── Decline reason bottom sheet ──────────────────────────────────────────────

function DeclineSheet({ target, date, onConfirm, onCancel }) {
  const [reason, setReason] = useState('')

  return (
    <div
      onClick={onCancel}
      style={{
        position: 'fixed', inset: 0, zIndex: 200,
        background: 'rgba(0,0,0,0.6)',
        display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%', maxWidth: 480,
          background: '#141414',
          borderRadius: '24px 24px 0 0',
          padding: '12px 20px calc(32px + env(safe-area-inset-bottom))',
        }}
      >
        {/* Handle */}
        <div style={{ width: 36, height: 4, borderRadius: 2, background: '#333', margin: '0 auto 20px' }} />

        <p style={{ fontSize: 16, fontWeight: 700, color: TEXT_PRIMARY, marginBottom: 6 }}>
          Why can't you make it?
        </p>
        <p style={{ fontSize: 13, color: TEXT_SEC, marginBottom: 16 }}>
          {target.areaName} · {date}
        </p>

        <textarea
          autoFocus
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Let your leader know…"
          rows={4}
          style={{
            width: '100%', boxSizing: 'border-box',
            background: '#1a1a1a', border: '0.5px solid #2e2e2e', borderRadius: 12,
            padding: 12, color: TEXT_PRIMARY, fontSize: 15,
            resize: 'none', outline: 'none',
            fontFamily: 'inherit',
          }}
        />

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 14 }}>
          <button
            type="button"
            onClick={() => onConfirm(reason)}
            style={{
              width: '100%', background: ACCENT_RED, color: TEXT_PRIMARY,
              fontSize: 15, fontWeight: 700, borderRadius: 12, padding: 14,
              border: 'none', cursor: 'pointer',
            }}
          >
            Confirm decline
          </button>
          <button
            type="button"
            onClick={onCancel}
            style={{
              width: '100%', background: 'transparent', color: TEXT_MUTED,
              fontSize: 14, fontWeight: 500, border: 'none', cursor: 'pointer', padding: '8px 0',
            }}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Overall status for a schedule ───────────────────────────────────────────

function scheduleOverallStatus(scheduleId, responses, responseMap) {
  const statuses = responses.map((r) => responseMap[scheduleId]?.[r.areaId] ?? r.status)
  if (statuses.every((s) => s === 'accepted')) return 'accepted'
  if (statuses.some((s) => s === 'declined')) return 'declined'
  return 'pending'
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function SkeletonScreen() {
  return (
    <div style={{ background: BG, minHeight: '100dvh', paddingTop: 'calc(env(safe-area-inset-top) + 24px)', paddingLeft: 22, paddingRight: 22, paddingBottom: 60 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 22 }}>
        <Skel w={36} h={36} r={18} />
        <Skel w={120} h={22} />
      </div>
      <Skel w="100%" h={90} r={20} />
      <div style={{ height: 24 }} />
      <Skel w={80} h={14} r={6} />
      <div style={{ height: 12 }} />
      {[0, 1].map((i) => <div key={i} style={{ marginBottom: 12 }}><Skel w="100%" h={140} r={20} /></div>)}
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function MyServicesPage() {
  const navigate = useNavigate()
  const user = useUser()
  const [data, setData] = useState(null)
  const [responseMap, setResponseMap] = useState({})
  const [expandedId, setExpandedId] = useState(null)
  const [declineTarget, setDeclineTarget] = useState(null) // { scheduleId, areaId, areaName, date }
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user?.id) return
    getMyServicesData(user.id).then((result) => {
      setData(result)
      // Build flat responseMap: { scheduleId: { areaId: status } }
      const map = {}
      for (const s of result.upcomingSchedules ?? []) {
        map[s.scheduleId] = {}
        for (const r of s.responses) {
          map[s.scheduleId][r.areaId] = r.status
        }
      }
      setResponseMap(map)
      setLoading(false)
    })
  }, [user?.id])

  const handleUpdate = useCallback((scheduleId, areaId, newStatus, reason = null) => {
    setResponseMap((prev) => ({
      ...prev,
      [scheduleId]: { ...(prev[scheduleId] ?? {}), [areaId]: newStatus },
    }))
    updateServiceResponse(user?.id, scheduleId, areaId, newStatus, reason)
  }, [user?.id])

  const handleDeclineOpen = useCallback((scheduleId, areaId, areaName) => {
    const schedule = data?.upcomingSchedules?.find((s) => s.scheduleId === scheduleId)
    setDeclineTarget({ scheduleId, areaId, areaName, date: formatDay(schedule?.date) })
  }, [data])

  const handleDeclineConfirm = useCallback((reason) => {
    const { scheduleId, areaId } = declineTarget
    setDeclineTarget(null)
    handleUpdate(scheduleId, areaId, 'declined', reason)
  }, [declineTarget, handleUpdate])

  if (loading) return <SkeletonScreen />

  const { areas, upcomingSchedules, history } = data ?? { areas: [], upcomingSchedules: [], history: [] }

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
      <div style={{ background: CARD_BG, border: CARD_BORDER, borderRadius: CARD_RADIUS, padding: CARD_PAD, marginBottom: 24 }}>
        <p style={{ fontSize: 12, fontWeight: 700, color: ACCENT_BLUE, letterSpacing: '0.06em' }}>YOUR TEAMS</p>
        {areas.length === 0 ? (
          <p style={{ fontSize: 13, color: TEXT_SEC, marginTop: 12 }}>No areas assigned</p>
        ) : (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 12 }}>
            {areas.map((a) => (
              <AreaChip key={a.areaId} name={a.name} leading={a.isLeading} />
            ))}
          </div>
        )}
      </div>

      {/* ── UPCOMING SUNDAYS ── */}
      {upcomingSchedules.length > 0 && (
        <>
          <p style={{ fontSize: 12, fontWeight: 700, color: TEXT_MUTED, letterSpacing: '0.06em', marginBottom: 12 }}>
            UPCOMING
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 28 }}>
            {upcomingSchedules.map((s) => {
              const overall = scheduleOverallStatus(s.scheduleId, s.responses, responseMap)
              const statusColor = overall === 'accepted' ? ACCENT_GREEN : overall === 'declined' ? ACCENT_RED : ACCENT_ORANGE
              const statusLabel = overall === 'accepted' ? 'Confirmed' : overall === 'declined' ? 'Declined' : 'Pending'
              const isExpanded = expandedId === s.scheduleId

              return (
                <div key={s.scheduleId} style={{ background: CARD_BG, border: CARD_BORDER, borderRadius: CARD_RADIUS, padding: CARD_PAD }}>
                  {/* Top row: date + status pill — tappable to expand */}
                  <button
                    type="button"
                    onClick={() => setExpandedId(isExpanded ? null : s.scheduleId)}
                    style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}
                  >
                    <p style={{ fontSize: 15, fontWeight: 700, color: TEXT_PRIMARY }}>{formatDay(s.date)}</p>
                    <Pill label={statusLabel} color={statusColor} />
                  </button>

                  {/* Schedule title */}
                  <p style={{ fontSize: 14, fontWeight: 600, color: TEXT_TER, marginTop: 6 }}>
                    {s.title ?? 'Sunday Service'}
                  </p>

                  {/* Expanded detail */}
                  {isExpanded && (
                    <div style={{ marginTop: 12, padding: '12px 14px', background: '#131313', borderRadius: 12 }}>
                      {s.arrivalTime && (
                        <p style={{ fontSize: 12, color: TEXT_SEC, marginBottom: 6 }}>
                          Arrive by <span style={{ color: TEXT_TER, fontWeight: 600 }}>{s.arrivalTime}</span>
                        </p>
                      )}
                      {s.scheduleNotes && (
                        <p style={{ fontSize: 13, color: TEXT_TER, lineHeight: 1.5, marginBottom: 6 }}>{s.scheduleNotes}</p>
                      )}
                      {s.documentUrl && (
                        <a
                          href={s.documentUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, color: ACCENT_BLUE, textDecoration: 'none', marginBottom: 6 }}
                        >
                          View document <ExternalLink size={13} />
                        </a>
                      )}
                      {s.responses.filter((r) => r.areaNote).map((r) => (
                        <div key={r.areaId} style={{ marginTop: 8, borderTop: '0.5px solid #2a2a2a', paddingTop: 8 }}>
                          <p style={{ fontSize: 11, fontWeight: 700, color: TEXT_MUTED, marginBottom: 4 }}>{r.areaName.toUpperCase()} NOTE</p>
                          <p style={{ fontSize: 13, color: TEXT_TER, lineHeight: 1.5 }}>{r.areaNote}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Divider */}
                  <div style={{ height: '0.5px', background: '#2e2e2e', margin: '14px 0' }} />

                  {/* Area response rows */}
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    {s.responses.map((r, i) => (
                      <div key={r.areaId}>
                        <AreaRow
                          scheduleId={s.scheduleId}
                          areaId={r.areaId}
                          areaName={r.areaName}
                          status={responseMap[s.scheduleId]?.[r.areaId] ?? r.status}
                          isLeading={r.isLeading}
                          onUpdate={handleUpdate}
                          onDecline={handleDeclineOpen}
                        />
                        {i < s.responses.length - 1 && (
                          <div style={{ height: '0.5px', background: '#242424' }} />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        </>
      )}

      {declineTarget && (
        <DeclineSheet
          target={declineTarget}
          date={declineTarget.date}
          onConfirm={handleDeclineConfirm}
          onCancel={() => setDeclineTarget(null)}
        />
      )}

      {/* ── HISTORY ── */}
      {history.length > 0 && (
        <>
          <p style={{ fontSize: 12, fontWeight: 700, color: TEXT_MUTED, letterSpacing: '0.06em', marginBottom: 12, marginTop: upcomingSchedules.length === 0 ? 0 : undefined }}>
            HISTORY
          </p>
          <div>
            {history.map((r, i) => {
              const statusColor = r.status === 'accepted' ? ACCENT_GREEN : r.status === 'declined' ? ACCENT_RED : ACCENT_ORANGE
              const statusLabel = r.status === 'accepted' ? 'Confirmed' : r.status === 'declined' ? 'Declined' : 'Pending'
              return (
                <div
                  key={`${r.scheduleId}-${r.areaName}-${i}`}
                  style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '10px 0',
                    borderBottom: i < history.length - 1 ? '0.5px solid #1e1e1e' : 'none',
                  }}
                >
                  <p style={{ fontSize: 13, color: TEXT_TER }}>
                    {r.areaName ? `${r.areaName}` : 'Service'}
                    {r.title ? ` · ${r.title}` : ' · Sunday Service'}
                  </p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                    <span style={{ fontSize: 12, color: TEXT_MUTED }}>{formatShort(r.date)}</span>
                    <Pill label={statusLabel} color={statusColor} />
                  </div>
                </div>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}
