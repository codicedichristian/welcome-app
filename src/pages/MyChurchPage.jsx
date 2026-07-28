import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Lock, ChevronRight } from 'lucide-react'
import { useUser } from '../lib/UserContext.js'
import { getMyChurchData } from '../lib/api.js'
import { formatShortDate } from '../lib/format.js'
import Spinner from '../components/Spinner.jsx'

const MEMBER_ROLES = ['member', 'leader', 'admin']

const PAGE = {
  background: '#0a0b0a',
  minHeight: '100dvh',
  paddingTop: 'calc(env(safe-area-inset-top) + 24px)',
  paddingLeft: '22px',
  paddingRight: '22px',
  paddingBottom: 'calc(90px + env(safe-area-inset-bottom))',
}

const CARD = {
  display: 'flex',
  alignItems: 'center',
  width: '100%',
  background: '#1a1a1a',
  border: '0.5px solid #2e2e2e',
  borderRadius: '16px',
  padding: '16px',
  cursor: 'pointer',
  textAlign: 'left',
}

function Dot({ color }) {
  return <div style={{ width: 8, height: 8, borderRadius: '50%', background: color, flexShrink: 0 }} />
}

export default function MyChurchPage() {
  const navigate = useNavigate()
  const user = useUser()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  const isMember = MEMBER_ROLES.includes(user.role)

  useEffect(() => {
    if (!isMember || !user.id) { setLoading(false); return }
    getMyChurchData(user.id).then((result) => { setData(result); setLoading(false) })
  }, [user.id, isMember])

  if (!isMember) {
    return (
      <div style={{ ...PAGE, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <Lock size={48} color="#ffffff" />
        <p style={{ fontSize: 22, fontWeight: 700, color: '#ffffff', marginTop: 16, marginBottom: 8 }}>
          Members Area
        </p>
        <p style={{ fontSize: 14, color: '#888', textAlign: 'center', maxWidth: 280 }}>
          This section is for church members. Talk to a leader to get access.
        </p>
      </div>
    )
  }

  if (loading) return <Spinner />

  const { myGroup, latestNote, myAreas, nextSchedule, unreadMessages, lastSunday } = data ?? {}

  const leaderSub = myGroup
    ? `${myGroup.host ?? ''} · ${myGroup.zone ?? ''}`.trim().replace(/^·\s|·\s$/, '')
    : 'No group assigned'

  const areasSub = (myAreas ?? [])
    .map((a) => a.service_areas?.name)
    .filter(Boolean)
    .join(' · ') || 'No areas assigned'

  const sundaySub = lastSunday
    ? `${lastSunday.title ?? 'Recent sermon'} — ${formatShortDate(lastSunday.schedule?.date)}`
    : 'No sermons yet'

  return (
    <div style={PAGE}>
      <p style={{ fontSize: 24, fontWeight: 800, color: '#ffffff', marginBottom: 20, letterSpacing: '-0.01em' }}>
        My Church
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {/* Card 1 — My Midweek */}
        <button type="button" onClick={() => navigate('/my-church/midweek')} style={CARD}>
          <Dot color="#a78bfa" />
          <div style={{ flex: 1, paddingLeft: 12 }}>
            <p style={{ fontSize: 15, fontWeight: 700, color: '#ffffff', marginBottom: 2 }}>My Midweek</p>
            <p style={{ fontSize: 13, color: '#666' }}>{leaderSub}</p>
          </div>
          {latestNote && (
            <p style={{ fontSize: 12, color: '#555', maxWidth: 100, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginRight: 8 }}>
              {latestNote.title}
            </p>
          )}
          <ChevronRight size={16} color="#555" />
        </button>

        {/* Card 2 — My Services */}
        <button type="button" onClick={() => navigate('/my-church/services')} style={CARD}>
          <Dot color="#5b8cff" />
          <div style={{ flex: 1, paddingLeft: 12 }}>
            <p style={{ fontSize: 15, fontWeight: 700, color: '#ffffff', marginBottom: 2 }}>My Services</p>
            <p style={{ fontSize: 13, color: '#666' }}>{areasSub}</p>
          </div>
          {nextSchedule && (
            <p style={{ fontSize: 12, color: '#555', marginRight: 8, whiteSpace: 'nowrap' }}>
              {formatShortDate(nextSchedule.date)}
            </p>
          )}
          <ChevronRight size={16} color="#555" />
        </button>

        {/* Card 3 — Sundays */}
        <button type="button" onClick={() => navigate('/my-church/sundays')} style={CARD}>
          <Dot color="#ffffff" />
          <div style={{ flex: 1, paddingLeft: 12 }}>
            <p style={{ fontSize: 15, fontWeight: 700, color: '#ffffff', marginBottom: 2 }}>Sundays</p>
            <p style={{ fontSize: 13, color: '#666' }}>{sundaySub}</p>
          </div>
          <ChevronRight size={16} color="#555" />
        </button>

        {/* Card 4 — From the Leader */}
        <button type="button" onClick={() => navigate('/my-church/messages')} style={CARD}>
          <Dot color="#4caf7d" />
          <div style={{ flex: 1, paddingLeft: 12 }}>
            <p style={{ fontSize: 15, fontWeight: 700, color: '#ffffff', marginBottom: 2 }}>From the Leader</p>
            <p style={{ fontSize: 13, color: unreadMessages > 0 ? '#e55555' : '#666' }}>
              {unreadMessages > 0 ? `${unreadMessages} unread message${unreadMessages !== 1 ? 's' : ''}` : 'No new messages'}
            </p>
          </div>
          {unreadMessages > 0 && (
            <span style={{ background: '#e55555', color: '#fff', fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 999, marginRight: 8 }}>
              {unreadMessages}
            </span>
          )}
          <ChevronRight size={16} color="#555" />
        </button>
      </div>
    </div>
  )
}
