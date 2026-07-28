import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft, Play, Image } from 'lucide-react'
import { getSundaySummaries } from '../lib/api.js'
import Spinner from '../components/Spinner.jsx'

const PAGE = {
  background: '#0a0b0a',
  minHeight: '100dvh',
  paddingTop: 'calc(env(safe-area-inset-top) + 24px)',
  paddingLeft: '22px',
  paddingRight: '22px',
  paddingBottom: '60px',
}

function formatCardDate(dateStr) {
  if (!dateStr) return ''
  return new Date(`${dateStr}T00:00:00`).toLocaleDateString('en-US', {
    weekday: 'short', month: 'short', day: 'numeric', year: 'numeric',
  }).toUpperCase()
}

export default function SundaysPage() {
  const navigate = useNavigate()
  const [summaries, setSummaries] = useState([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState(null)

  useEffect(() => {
    getSundaySummaries().then(({ data }) => { setSummaries(data ?? []); setLoading(false) })
  }, [])

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
        Sundays
      </p>

      {summaries.length === 0 ? (
        <p style={{ color: '#666', fontSize: 14, textAlign: 'center', marginTop: 40 }}>No sermons yet</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {summaries.map((s) => {
            const isOpen = expanded === s.id
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => setExpanded(isOpen ? null : s.id)}
                style={{
                  display: 'block',
                  width: '100%',
                  background: '#1a1a1a',
                  border: '0.5px solid #2e2e2e',
                  borderRadius: 16,
                  padding: 16,
                  textAlign: 'left',
                  cursor: 'pointer',
                }}
              >
                {/* Date */}
                <p style={{ fontSize: 11, color: '#555', letterSpacing: '0.06em', marginBottom: 6 }}>
                  {formatCardDate(s.schedule?.date)}
                </p>

                {/* Title */}
                <p style={{ fontSize: 16, fontWeight: 700, color: '#ffffff', marginBottom: 4 }}>
                  {s.title ?? 'Untitled'}
                </p>

                {/* Speaker */}
                {s.speaker && (
                  <p style={{ fontSize: 13, color: '#888', marginBottom: 6 }}>{s.speaker}</p>
                )}

                {/* Scripture badge */}
                {s.scripture && (
                  <span style={{
                    display: 'inline-block',
                    fontSize: 12,
                    fontWeight: 600,
                    color: '#5b8cff',
                    background: 'rgba(91,140,255,0.12)',
                    border: '1px solid rgba(91,140,255,0.3)',
                    borderRadius: 8,
                    padding: '3px 9px',
                    marginBottom: 8,
                  }}>
                    {s.scripture}
                  </span>
                )}

                {/* Description */}
                {s.description && (
                  <p style={{
                    fontSize: 13,
                    color: '#888',
                    lineHeight: 1.55,
                    marginBottom: 10,
                    overflow: isOpen ? 'visible' : 'hidden',
                    display: isOpen ? 'block' : '-webkit-box',
                    WebkitLineClamp: isOpen ? undefined : 2,
                    WebkitBoxOrient: 'vertical',
                  }}>
                    {s.description}
                  </p>
                )}

                {/* Action buttons */}
                {(s.video_url || s.photos_url) && (
                  <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
                    {s.video_url && (
                      <a
                        href={s.video_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 6,
                          fontSize: 13,
                          fontWeight: 600,
                          color: '#ffffff',
                          background: '#2a2a2a',
                          border: '0.5px solid #3a3a3a',
                          borderRadius: 10,
                          padding: '8px 14px',
                          textDecoration: 'none',
                        }}
                      >
                        <Play size={13} fill="#ffffff" strokeWidth={0} />
                        Watch
                      </a>
                    )}
                    {s.photos_url && (
                      <a
                        href={s.photos_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 6,
                          fontSize: 13,
                          fontWeight: 600,
                          color: '#ffffff',
                          background: '#2a2a2a',
                          border: '0.5px solid #3a3a3a',
                          borderRadius: 10,
                          padding: '8px 14px',
                          textDecoration: 'none',
                        }}
                      >
                        <Image size={13} />
                        Photos
                      </a>
                    )}
                  </div>
                )}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
