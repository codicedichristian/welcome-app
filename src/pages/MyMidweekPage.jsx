import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft } from 'lucide-react'
import { useUser } from '../lib/UserContext.js'
import { getMyMidweekData } from '../lib/api.js'
import Spinner from '../components/Spinner.jsx'

const PAGE = {
  background: '#0a0b0a',
  minHeight: '100dvh',
  paddingTop: 'calc(env(safe-area-inset-top) + 24px)',
  paddingLeft: '22px',
  paddingRight: '22px',
  paddingBottom: '60px',
}

function formatNoteDate(dateStr) {
  if (!dateStr) return ''
  return new Date(`${dateStr}T00:00:00`).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
}

export default function MyMidweekPage() {
  const navigate = useNavigate()
  const user = useUser()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState(null)

  useEffect(() => {
    if (!user.id) return
    getMyMidweekData(user.id).then((result) => { setData(result); setLoading(false) })
  }, [user.id])

  if (loading) return <Spinner />

  const { group, leader, notes } = data ?? { group: null, leader: null, notes: [] }

  const leaderName = leader
    ? `${leader.first_name} ${leader.last_name}`
    : group?.host ?? '—'

  const phone = (leader?.phone ?? group?.phone ?? '').replace(/\D/g, '')

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

      {!group ? (
        <p style={{ color: '#666', fontSize: 14, textAlign: 'center', marginTop: 60 }}>
          No midweek group assigned yet.
        </p>
      ) : (
        <>
          {/* Leader info card */}
          <div style={{ background: '#1a1a1a', border: '0.5px solid #2e2e2e', borderRadius: 16, padding: 16, marginBottom: 28 }}>
            <p style={{ fontSize: 11, color: '#555', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>
              Your leader
            </p>
            <p style={{ fontSize: 16, fontWeight: 700, color: '#ffffff', marginBottom: 4 }}>{leaderName}</p>
            <p style={{ fontSize: 13, color: '#888', marginBottom: phone ? 14 : 0 }}>
              {[group.zone, group.address].filter(Boolean).join(' — ')}
            </p>
            {phone && (
              <a
                href={`https://wa.me/${phone}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  background: '#25d366',
                  color: '#fff',
                  padding: '10px 18px',
                  borderRadius: 12,
                  fontSize: 14,
                  fontWeight: 600,
                  textDecoration: 'none',
                }}
              >
                Message leader
              </a>
            )}
          </div>

          {/* Notes */}
          <p style={{ fontSize: 16, fontWeight: 700, color: '#ffffff', marginBottom: 12 }}>Meeting notes</p>

          {notes.length === 0 ? (
            <p style={{ color: '#666', fontSize: 14, textAlign: 'center', marginTop: 20 }}>No notes yet</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {notes.map((note) => {
                const isOpen = expanded === note.id
                return (
                  <button
                    key={note.id}
                    type="button"
                    onClick={() => setExpanded(isOpen ? null : note.id)}
                    style={{
                      display: 'block',
                      width: '100%',
                      background: '#1a1a1a',
                      border: '0.5px solid #2e2e2e',
                      borderRadius: 14,
                      padding: 14,
                      textAlign: 'left',
                      cursor: 'pointer',
                    }}
                  >
                    <p style={{ fontSize: 11, color: '#555', marginBottom: 4 }}>{formatNoteDate(note.date)}</p>
                    <p style={{ fontSize: 14, fontWeight: 700, color: '#ffffff', marginBottom: isOpen ? 8 : 0 }}>{note.title}</p>
                    {isOpen && (
                      <p style={{ fontSize: 13, color: '#888', lineHeight: 1.6 }}>{note.content}</p>
                    )}
                    {!isOpen && note.content && (
                      <p style={{
                        fontSize: 13,
                        color: '#888',
                        marginTop: 4,
                        overflow: 'hidden',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                      }}>
                        {note.content}
                      </p>
                    )}
                  </button>
                )
              })}
            </div>
          )}
        </>
      )}
    </div>
  )
}
