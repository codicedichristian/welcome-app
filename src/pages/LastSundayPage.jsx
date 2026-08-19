import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { PlayCircle, Headphones, Camera } from 'lucide-react'
import BackRow from '../components/BackRow.jsx'
import SkeletonCard, { SkeletonText } from '../components/SkeletonCard.jsx'
import { getLatestSundaySummary } from '../lib/api.js'

function formatSundayDate(dateStr) {
  if (!dateStr) return null
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
}

function MediaButton({ icon, label, href }) {
  return (
    <button
      type="button"
      onClick={() => window.open(href, '_blank', 'noopener')}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '14px',
        width: '100%',
        background: '#1a1a1a',
        border: '0.5px solid #2e2e2e',
        borderRadius: '16px',
        padding: '16px 18px',
        cursor: 'pointer',
        textAlign: 'left',
      }}
    >
      {icon}
      <span style={{ fontSize: '15px', fontWeight: '600', color: '#ffffff' }}>{label}</span>
    </button>
  )
}

export default function LastSundayPage() {
  const location = useLocation()
  const [summary, setSummary] = useState(location.state?.summary ?? null)
  const [loading, setLoading] = useState(!location.state?.summary)

  useEffect(() => {
    if (location.state?.summary) return
    getLatestSundaySummary().then(({ data }) => {
      setSummary(data ?? null)
      setLoading(false)
    })
  }, [])

  const dateLabel = formatSundayDate(summary?.schedule?.date)

  return (
    <div
      className="page-transition"
      style={{
        background: '#0a0b0a',
        minHeight: '100dvh',
        paddingTop: 'calc(env(safe-area-inset-top) + 24px)',
        paddingLeft: '22px',
        paddingRight: '22px',
        paddingBottom: '40px',
      }}
    >
      <BackRow label="Home" />

      {loading ? (
        <div style={{ marginTop: '24px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <SkeletonText width="38%" height={11} />
          <SkeletonText width="68%" height={28} />
          <SkeletonText width="35%" height={14} />
          <div style={{ marginTop: '12px' }}>
            <SkeletonCard height={120} radius={20} />
          </div>
          {[0, 1, 2].map((i) => <SkeletonCard key={i} height={54} radius={16} />)}
        </div>
      ) : !summary ? (
        <div style={{ display: 'flex', justifyContent: 'center', paddingTop: '60px' }}>
          <p style={{ color: '#4a4a47', fontSize: '15px' }}>No summary available yet.</p>
        </div>
      ) : (
        <>
          {/* Date + title + speaker */}
          <div style={{ marginTop: '24px', marginBottom: '24px' }}>
            {dateLabel && (
              <p style={{ fontSize: '11px', color: '#9a9a97', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '8px' }}>
                {dateLabel}
              </p>
            )}
            <h1 style={{ fontSize: '24px', fontWeight: '800', color: '#ffffff', letterSpacing: '-0.01em', lineHeight: 1.2, marginBottom: '6px' }}>
              {summary.title}
            </h1>
            {summary.speaker && (
              <p style={{ fontSize: '14px', color: '#9a9a97' }}>{summary.speaker}</p>
            )}
          </div>

          {/* Info card */}
          <div
            style={{
              background: '#1a1a1a',
              border: '0.5px solid #2e2e2e',
              borderRadius: '20px',
              padding: '20px',
              marginBottom: '24px',
            }}
          >
            {summary.scripture && (
              <div style={{ marginBottom: summary.description ? '16px' : 0 }}>
                <span
                  style={{
                    display: 'inline-block',
                    background: 'rgba(91,140,255,0.15)',
                    border: '0.5px solid rgba(91,140,255,0.4)',
                    color: '#8bb4ff',
                    fontSize: '12px',
                    fontWeight: '700',
                    letterSpacing: '0.04em',
                    padding: '5px 12px',
                    borderRadius: '8px',
                    textTransform: 'uppercase',
                  }}
                >
                  {summary.scripture}
                </span>
              </div>
            )}
            {summary.description && (
              <p style={{ fontSize: '15px', color: '#c9c9c6', lineHeight: 1.6 }}>
                {summary.description}
              </p>
            )}
          </div>

          {/* Media buttons — conditional, order: Watch / Listen / Photos */}
          {(summary.video_url || summary.audio_url || summary.photos_url) && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {summary.video_url && (
                <MediaButton
                  href={summary.video_url}
                  label="Watch"
                  icon={<PlayCircle size={22} color="#ee5555" />}
                />
              )}
              {summary.audio_url && (
                <MediaButton
                  href={summary.audio_url}
                  label="Listen"
                  icon={<Headphones size={22} color="#a78bfa" />}
                />
              )}
              {summary.photos_url && (
                <MediaButton
                  href={summary.photos_url}
                  label="Photos"
                  icon={<Camera size={22} color="#5b8cff" />}
                />
              )}
            </div>
          )}
        </>
      )}
    </div>
  )
}
