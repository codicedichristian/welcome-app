import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft, MessageCircle, Paperclip, ExternalLink } from 'lucide-react'
import { useUser } from '../lib/UserContext.js'
import { getMemberMessages, markMessageRead } from '../lib/api.js'

const BG = '#0a0b0a'
const CARD_BG = '#1a1a1a'
const CARD_BORDER = '0.5px solid #2e2e2e'
const CARD_RADIUS = 20
const CARD_PAD = 18
const TEXT_PRIMARY = '#ffffff'
const TEXT_SEC = '#9a9a97'
const TEXT_TER = '#c9c9c6'
const TEXT_MUTED = '#6b6b68'
const ACCENT_GREEN = '#4caf7d'
const ACCENT_RED = '#e05b4f'

function formatDateTime(isoStr) {
  if (!isoStr) return ''
  const d = new Date(isoStr)
  const date = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  const time = d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
  return `${date} · ${time}`
}

function Skel({ w, h, r = 8 }) {
  return <div style={{ background: '#242424', borderRadius: r, width: w, height: h, flexShrink: 0 }} />
}

function SkeletonScreen() {
  return (
    <div style={{ background: BG, minHeight: '100dvh', paddingTop: 'calc(env(safe-area-inset-top) + 24px)', paddingLeft: 22, paddingRight: 22, paddingBottom: 60 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 22 }}>
        <Skel w={36} h={36} r={18} />
        <Skel w={140} h={22} />
      </div>
      {[0, 1, 2].map((i) => (
        <div key={i} style={{ marginBottom: 12 }}>
          <Skel w="100%" h={130} r={20} />
        </div>
      ))}
    </div>
  )
}

export default function MemberMessagesPage() {
  const navigate = useNavigate()
  const user = useUser()
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState(null)

  useEffect(() => {
    if (!user?.id) return
    getMemberMessages(user.id, user.role).then(({ data }) => {
      setMessages(data ?? [])
      setLoading(false)
    })
  }, [user?.id, user?.role])

  const handleExpand = (msg) => {
    const isOpen = expanded === msg.id
    if (isOpen) { setExpanded(null); return }
    setExpanded(msg.id)
    if (!msg.isRead) {
      markMessageRead(user.id, msg.id)
      setMessages((prev) => prev.map((m) => m.id === msg.id ? { ...m, isRead: true } : m))
    }
  }

  if (loading) return <SkeletonScreen />

  return (
    <div className="page-transition" style={{
      background: BG, minHeight: '100dvh',
      paddingTop: 'calc(env(safe-area-inset-top) + 24px)',
      paddingLeft: 22, paddingRight: 22, paddingBottom: 60,
    }}>

      {/* Nav row */}
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
        <p style={{ fontSize: 26, fontWeight: 800, color: TEXT_PRIMARY, letterSpacing: '-0.01em' }}>
          Leader Messages
        </p>
      </div>

      {messages.length === 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', marginTop: 80, gap: 16 }}>
          <MessageCircle size={48} color="#2e2e2e" strokeWidth={1.5} />
          <p style={{ fontSize: 14, color: TEXT_MUTED }}>No messages yet</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {messages.map((msg) => {
            const isOpen = expanded === msg.id
            return (
              <button
                key={msg.id}
                type="button"
                onClick={() => handleExpand(msg)}
                style={{
                  display: 'block', width: '100%',
                  background: msg.isRead ? CARD_BG : '#1f1f1f',
                  borderRadius: CARD_RADIUS,
                  padding: CARD_PAD,
                  textAlign: 'left', cursor: 'pointer',
                  border: msg.isRead ? CARD_BORDER : `none`,
                  borderLeft: msg.isRead ? undefined : `2px solid ${ACCENT_GREEN}`,
                }}
              >
                {/* Top row: author left, date right */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: TEXT_PRIMARY }}>
                    {msg.authorName ?? 'Leader'}
                  </span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    {!msg.isRead && (
                      <span style={{
                        fontSize: 10, fontWeight: 800, color: TEXT_PRIMARY,
                        background: ACCENT_RED, borderRadius: 4, padding: '2px 6px',
                      }}>
                        NEW
                      </span>
                    )}
                    <span style={{ fontSize: 12, color: TEXT_MUTED }}>
                      {formatDateTime(msg.created_at)}
                    </span>
                  </div>
                </div>

                {/* Audience pill */}
                <div style={{ marginTop: 4 }}>
                  <span style={{
                    display: 'inline-block',
                    background: '#242424', color: TEXT_SEC,
                    fontSize: 11, fontWeight: 600,
                    borderRadius: 20, padding: '3px 10px',
                  }}>
                    To: {msg.audienceLabel ?? 'Members'}
                  </span>
                </div>

                {/* Title */}
                <p style={{ fontSize: 16, fontWeight: 700, color: TEXT_PRIMARY, marginTop: 12, marginBottom: 6 }}>
                  {msg.title}
                </p>

                {/* Body */}
                <p style={{
                  fontSize: 13, color: TEXT_TER, lineHeight: 1.6,
                  overflow: isOpen ? 'visible' : 'hidden',
                  display: isOpen ? 'block' : '-webkit-box',
                  WebkitLineClamp: isOpen ? undefined : 3,
                  WebkitBoxOrient: 'vertical',
                }}>
                  {msg.body}
                </p>

                {/* Attachment (only when expanded and exists) */}
                {isOpen && msg.attachment_url && (
                  <a
                    href={msg.attachment_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      background: '#242424', borderRadius: 12, padding: '10px 14px',
                      marginTop: 12, textDecoration: 'none',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Paperclip size={16} color={TEXT_SEC} strokeWidth={1.8} />
                      <span style={{ fontSize: 13, color: '#e5e5e2', fontWeight: 500 }}>Attachment</span>
                    </div>
                    <ExternalLink size={15} color={TEXT_MUTED} strokeWidth={1.8} />
                  </a>
                )}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
