import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'
import DetailPage from '../components/DetailPage.jsx'
import BackRow from '../components/BackRow.jsx'
import SkeletonCard, { SkeletonText } from '../components/SkeletonCard.jsx'
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

function SeasonSkeleton() {
  return (
    <div style={{ background: '#0a0b0a', minHeight: '100dvh', paddingBottom: '40px' }}>
      <div style={{ position: 'absolute', top: 'calc(env(safe-area-inset-top) + 12px)', left: '22px', zIndex: 10 }}>
        <BackRow label="Sunday Series" fallback="/seasons" />
      </div>
      <SkeletonCard height={200} radius={0} />
      <div style={{ padding: '20px 22px 0', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <SkeletonText width="60%" height={26} />
        <SkeletonText width="40%" height={13} />
        <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {[0, 1, 2].map((i) => <SkeletonCard key={i} height={62} radius={14} />)}
        </div>
      </div>
    </div>
  )
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
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {[0, 1, 2].map((i) => <SkeletonCard key={i} height={62} radius={14} />)}
        </div>
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
  const [isLoading, setIsLoading] = useState(true)

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
      setIsLoading(false)
    })
  }, [id])

  if (isLoading) return <SeasonSkeleton />

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
