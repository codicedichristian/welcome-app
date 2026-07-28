import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft } from 'lucide-react'
import { useUser } from '../lib/UserContext.js'
import { getMemberMessages, markMessageRead } from '../lib/api.js'
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

export default function MemberMessagesPage() {
  const navigate = useNavigate()
  const user = useUser()
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState(null)

  const areaIds = []
  const groupId = null

  useEffect(() => {
    if (!user.id) return
    getMemberMessages(user.id, user.role, areaIds, groupId).then(({ data }) => {
      setMessages(data ?? [])
      setLoading(false)
    })
  }, [user.id, user.role])

  const handleExpand = (msg) => {
    const isOpen = expanded === msg.id
    if (isOpen) { setExpanded(null); return }
    setExpanded(msg.id)
    if (!msg.isRead) {
      markMessageRead(user.id, msg.id)
      setMessages((prev) => prev.map((m) => m.id === msg.id ? { ...m, isRead: true } : m))
    }
  }

  if (loading) return <Spinner />

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

      <p style={{ fontSize: 24, fontWeight: 800, color: '#ffffff', marginBottom: 20, letterSpacing: '-0.01em' }}>
        From the Leader
      </p>

      {messages.length === 0 ? (
        <p style={{ color: '#666', fontSize: 14, textAlign: 'center', marginTop: 40 }}>No messages yet</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {messages.map((msg) => {
            const isOpen = expanded === msg.id
            const authorName = msg.author
              ? `${msg.author.first_name} ${msg.author.last_name}`
              : 'Leader'

            return (
              <button
                key={msg.id}
                type="button"
                onClick={() => handleExpand(msg)}
                style={{
                  display: 'block',
                  width: '100%',
                  background: msg.isRead ? '#1a1a1a' : '#1f1f1f',
                  borderRadius: 16,
                  padding: 16,
                  textAlign: 'left',
                  cursor: 'pointer',
                  border: msg.isRead ? '0.5px solid #2e2e2e' : 'none',
                  borderLeft: msg.isRead ? undefined : '3px solid #ffffff',
                }}
              >
                {/* Header row */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <span style={{ fontSize: 11, color: '#666' }}>{authorName}</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    {!msg.isRead && (
                      <span style={{
                        fontSize: 10,
                        fontWeight: 700,
                        color: '#fff',
                        background: '#e55555',
                        padding: '2px 7px',
                        borderRadius: 999,
                      }}>
                        NEW
                      </span>
                    )}
                    <span style={{ fontSize: 11, color: '#666' }}>
                      {formatShortDate(msg.created_at?.slice(0, 10))}
                    </span>
                  </div>
                </div>

                {/* Title */}
                <p style={{ fontSize: 14, fontWeight: 700, color: '#ffffff', marginBottom: 4 }}>{msg.title}</p>

                {/* Body */}
                <p style={{
                  fontSize: 13,
                  color: '#888',
                  lineHeight: 1.55,
                  overflow: isOpen ? 'visible' : 'hidden',
                  display: isOpen ? 'block' : '-webkit-box',
                  WebkitLineClamp: isOpen ? undefined : 3,
                  WebkitBoxOrient: 'vertical',
                }}>
                  {msg.body}
                </p>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
