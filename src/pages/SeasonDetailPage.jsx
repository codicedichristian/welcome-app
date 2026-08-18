import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'
import DetailPage from '../components/DetailPage.jsx'
import { getSeasonSundays } from '../lib/api.js'

function formatDate(dateStr) {
  if (!dateStr) return ''
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

function formatSundayRow(dateStr) {
  if (!dateStr) return ''
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }).toUpperCase()
}

function SundaysInSeason({ seasonId }) {
  const navigate = useNavigate()
  const [sundays, setSundays] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getSeasonSundays(seasonId).then(({ data }) => {
      setSundays(data ?? [])
      setLoading(false)
    })
  }, [seasonId])

  return (
    <>
      <p style={{ fontSize: '12px', fontWeight: '700', color: '#6b6b68', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '12px' }}>
        Sundays in this series
      </p>
      {loading ? (
        <p style={{ color: '#4a4a47', fontSize: '15px', textAlign: 'center', paddingTop: '20px' }}>Loading…</p>
      ) : sundays.length === 0 ? (
        <p style={{ color: '#6b6b68', fontSize: '14px', textAlign: 'center', paddingTop: '16px' }}>No sermons added yet</p>
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
              <p style={{ fontSize: '14px', fontWeight: '600', color: '#ffffff', margin: 0 }}>
                {sunday.title}
              </p>
            </div>
            <ChevronRight size={16} color="#444444" style={{ flexShrink: 0 }} />
          </button>
        ))
      )}
    </>
  )
}

export default function SeasonDetailPage() {
  const { id } = useParams()
  const [season, setSeason] = useState(null)

  useEffect(() => {
    getSeasonSundays(id).then(({ data }) => {
      if (data?.length) {
        setSeason({
          name: data[0].season_name ?? null,
          image_url: data[0].season_image_url ?? null,
          start_date: data[0].season_start_date ?? null,
          end_date: data[0].season_end_date ?? null,
          description: data[0].season_description ?? null,
        })
      }
    })
  }, [id])

  const subtitle = season?.start_date
    ? `${formatDate(season.start_date)}${season.end_date ? ` – ${formatDate(season.end_date)}` : ''}`
    : undefined

  return (
    <DetailPage
      image={season?.image_url ?? undefined}
      title={season?.name ?? ''}
      subtitle={subtitle}
      description={season?.description ?? undefined}
      backLabel="Sunday Series"
      backPath="/seasons"
    >
      <SundaysInSeason seasonId={id} />
    </DetailPage>
  )
}
