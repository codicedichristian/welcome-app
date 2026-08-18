import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'
import BackRow from '../components/BackRow.jsx'
import { getSeasonSundays } from '../lib/api.js'

function formatSeasonDate(dateStr) {
  if (!dateStr) return ''
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
}

function formatSundayRow(dateStr) {
  if (!dateStr) return ''
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }).toUpperCase()
}

export default function SeasonDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [sundays, setSundays] = useState([])
  const [season, setSeason] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getSeasonSundays(id).then(({ data }) => {
      setSundays(data ?? [])
      if (data?.length) {
        setSeason({
          name: data[0].season_name ?? null,
          image_url: data[0].season_image_url ?? null,
          start_date: data[0].season_start_date ?? null,
          end_date: data[0].season_end_date ?? null,
          description: data[0].season_description ?? null,
        })
      }
      setLoading(false)
    })
  }, [id])

  return (
    <div
      className="page-transition"
      style={{ background: '#0a0b0a', minHeight: '100dvh', paddingBottom: '40px' }}
    >
      {/* Back row over hero */}
      <div style={{ position: 'absolute', top: 'calc(env(safe-area-inset-top) + 12px)', left: '22px', zIndex: 10 }}>
        <BackRow label="Sunday Series" fallback="/seasons" />
      </div>

      {/* Hero */}
      <div style={{ position: 'relative', width: '100%', height: '200px', background: '#1a1a1a' }}>
        {season?.image_url && (
          <img
            src={season.image_url}
            alt=""
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        )}
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(0,0,0,0.3) 0%, rgba(10,11,10,0.9) 100%)' }} />
        {season?.name && (
          <div style={{ position: 'absolute', left: '22px', bottom: '16px' }}>
            <p style={{ fontSize: '22px', fontWeight: '800', color: '#ffffff', letterSpacing: '-0.01em' }}>
              {season.name}
            </p>
          </div>
        )}
      </div>

      <div style={{ padding: '20px 22px 0' }}>
        {season?.start_date && (
          <p style={{ fontSize: '13px', color: '#9a9a97' }}>
            {formatSeasonDate(season.start_date)}
            {season.end_date ? ` – ${formatSeasonDate(season.end_date)}` : ''}
          </p>
        )}
        {season?.description && (
          <p style={{ fontSize: '14px', color: '#c9c9c6', lineHeight: 1.6, marginTop: '12px' }}>
            {season.description}
          </p>
        )}

        <p
          style={{
            fontSize: '12px',
            fontWeight: '700',
            color: '#6b6b68',
            textTransform: 'uppercase',
            letterSpacing: '0.07em',
            marginTop: '24px',
            marginBottom: '12px',
          }}
        >
          Sundays in this series
        </p>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', paddingTop: '20px' }}>
            <p style={{ color: '#4a4a47', fontSize: '15px' }}>Loading…</p>
          </div>
        ) : sundays.length === 0 ? (
          <p style={{ color: '#6b6b68', fontSize: '14px', textAlign: 'center', paddingTop: '16px' }}>
            No sermons added yet
          </p>
        ) : (
          sundays.map((sunday) => (
            <button
              key={sunday.id}
              type="button"
              onClick={() => navigate('/last-sunday', { state: { summary: sunday } })}
              style={{
                display: 'flex',
                alignItems: 'center',
                width: '100%',
                background: '#1a1a1a',
                border: '0.5px solid #2e2e2e',
                borderRadius: '14px',
                padding: '14px',
                marginBottom: '8px',
                cursor: 'pointer',
                textAlign: 'left',
              }}
            >
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: '11px', color: '#9a9a97', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '3px' }}>
                  {formatSundayRow(sunday.schedule?.date)}
                </p>
                <p style={{ fontSize: '14px', fontWeight: '600', color: '#ffffff' }}>
                  {sunday.title}
                </p>
              </div>
              <ChevronRight size={16} color="#444444" style={{ flexShrink: 0 }} />
            </button>
          ))
        )}
      </div>
    </div>
  )
}
