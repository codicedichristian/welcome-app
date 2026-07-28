import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft } from 'lucide-react'
import { useUser } from '../lib/UserContext.js'
import { getMyServicesData, updateServiceResponse } from '../lib/api.js'
import { formatShortDate } from '../lib/format.js'
import Spinner from '../components/Spinner.jsx'

const PAGE = {
  background: '#0a0b0a',
  minHeight: '100dvh',
  paddingTop: 'calc(env(safe-area-inset-top) + 24px)',
  paddingLeft: '22px',
  paddingRight: '22px',
  paddingBottom: '60px',
}

const AREA_COLORS = {
  Worship:    '#ffffff',
  Media:      '#5b8cff',
  Sound:      '#5b8cff',
  Digital:    '#a78bfa',
  Production: '#f97316',
}

function areaColor(name) {
  return AREA_COLORS[name] ?? '#888'
}

function Chip({ name, leading }) {
  const color = areaColor(name)
  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: 4,
      fontSize: 12,
      color,
      background: `${color}18`,
      border: `1px solid ${color}44`,
      borderRadius: 8,
      padding: '3px 9px',
      fontWeight: 600,
    }}>
      {leading && <span>★</span>}
      {name}
    </span>
  )
}

function StatusControl({ status, onUpdate }) {
  const [optimistic, setOptimistic] = useState(status)

  const handle = async (newStatus) => {
    const resolved = optimistic === newStatus ? 'pending' : newStatus
    setOptimistic(resolved)
    await onUpdate(resolved)
    if (resolved !== 'pending') return
  }

  if (optimistic === 'accepted') {
    return (
      <button type="button" onClick={() => handle('accepted')} style={filledBtn('#4caf7d')}>
        ✓ Accepted
      </button>
    )
  }
  if (optimistic === 'declined') {
    return (
      <button type="button" onClick={() => handle('declined')} style={filledBtn('#e55555')}>
        ✗ Declined
      </button>
    )
  }
  return (
    <div style={{ display: 'flex', gap: 8 }}>
      <button type="button" onClick={() => handle('accepted')} style={outlineBtn('#4caf7d')}>
        ✓ Accept
      </button>
      <button type="button" onClick={() => handle('declined')} style={outlineBtn('#e55555')}>
        ✗ Decline
      </button>
    </div>
  )
}

function filledBtn(color) {
  return {
    fontSize: 12, fontWeight: 600, color: '#fff', background: color,
    border: 'none', borderRadius: 10, padding: '7px 14px', cursor: 'pointer',
  }
}
function outlineBtn(color) {
  return {
    fontSize: 12, fontWeight: 600, color,
    background: 'transparent', border: `1px solid ${color}`,
    borderRadius: 10, padding: '7px 14px', cursor: 'pointer',
  }
}

export default function MyServicesPage() {
  const navigate = useNavigate()
  const user = useUser()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [responses, setResponses] = useState([])

  useEffect(() => {
    if (!user.id) return
    getMyServicesData(user.id).then((result) => {
      setData(result)
      setResponses(result.responses ?? [])
      setLoading(false)
    })
  }, [user.id])

  const handleUpdate = useCallback((scheduleId, areaId, newStatus) => {
    setResponses((prev) =>
      prev.map((r) =>
        r.schedule_id === scheduleId && r.area_id === areaId ? { ...r, status: newStatus } : r,
      ),
    )
    return updateServiceResponse(user.id, scheduleId, areaId, newStatus)
  }, [user.id])

  if (loading) return <Spinner />

  const { areas, leadingAreaIds, upcomingSchedules } = data ?? { areas: [], leadingAreaIds: new Set(), upcomingSchedules: [] }

  return (
    <div style={PAGE}>
      <button
        type="button"
        onClick={() => navigate('/my-church')}
        style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', cursor: 'pointer', marginBottom: 20, padding: 0 }}
      >
        <ChevronLeft size={18} color="#666" />
        <span style={{ fontSize: 14, color: '#444' }}>My Church</span>
      </button>

      {/* My Areas */}
      <p style={{ fontSize: 16, fontWeight: 700, color: '#ffffff', marginBottom: 10 }}>Your areas</p>
      {areas.length === 0 ? (
        <p style={{ fontSize: 14, color: '#666', marginBottom: 28 }}>No areas assigned</p>
      ) : (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 28 }}>
          {areas.map((a) => (
            <Chip
              key={a.area_id}
              name={a.service_areas?.name ?? ''}
              leading={leadingAreaIds.has(a.area_id)}
            />
          ))}
        </div>
      )}

      {/* Upcoming Sundays */}
      <p style={{ fontSize: 16, fontWeight: 700, color: '#ffffff', marginBottom: 12 }}>Upcoming Sundays</p>

      {upcomingSchedules.length === 0 ? (
        <p style={{ fontSize: 14, color: '#666' }}>No upcoming services scheduled</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {upcomingSchedules.map((schedule) => {
            const myResponses = responses.filter((r) => r.schedule_id === schedule.id)
            if (myResponses.length === 0) return null

            return (
              <div
                key={schedule.id}
                style={{ background: '#1a1a1a', border: '0.5px solid #2e2e2e', borderRadius: 16, padding: 16 }}
              >
                <p style={{ fontSize: 15, fontWeight: 700, color: '#ffffff', marginBottom: 12 }}>
                  {new Date(`${schedule.date}T00:00:00`).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {myResponses.map((resp) => {
                    const areaName = resp.service_areas?.name ?? ''
                    const isLeading = leadingAreaIds.has(resp.area_id)
                    return (
                      <div key={resp.area_id}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                          <Chip name={areaName} leading={false} />
                          {isLeading && (
                            <span style={{ fontSize: 11, color: '#f97316', fontWeight: 600 }}>★ Leading</span>
                          )}
                        </div>
                        <StatusControl
                          status={resp.status}
                          onUpdate={(s) => handleUpdate(schedule.id, resp.area_id, s)}
                        />
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
