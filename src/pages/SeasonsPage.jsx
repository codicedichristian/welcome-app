import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import DetailPage from '../components/DetailPage.jsx'
import { getSeasons, getExploreCard } from '../lib/api.js'

function formatSeasonDate(dateStr) {
  if (!dateStr) return ''
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
}

export default function SeasonsPage() {
  const navigate = useNavigate()
  const [seasons, setSeasons] = useState([])
  const [loading, setLoading] = useState(true)
  const [heroImage, setHeroImage] = useState(null)

  useEffect(() => {
    Promise.all([
      getSeasons(),
      getExploreCard('/seasons'),
    ]).then(([{ data: seasonsData }, { data: cardData }]) => {
      setSeasons(seasonsData ?? [])
      if (cardData?.image_url) setHeroImage(cardData.image_url)
      setLoading(false)
    })
  }, [])

  return (
    <DetailPage
      image={heroImage ?? undefined}
      title="Sunday Series"
      backLabel="Home"
      backPath="/"
    >
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', paddingTop: '60px' }}>
          <p style={{ color: '#4a4a47', fontSize: '15px' }}>Loading…</p>
        </div>
      ) : seasons.length === 0 ? (
        <div style={{ display: 'flex', justifyContent: 'center', paddingTop: '60px' }}>
          <p style={{ color: '#4a4a47', fontSize: '15px' }}>No series yet.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {seasons.map((season) => (
            <button
              key={season.id}
              type="button"
              onClick={() => navigate(`/seasons/${season.id}`)}
              style={{
                position: 'relative',
                height: '140px',
                borderRadius: '20px',
                overflow: 'hidden',
                background: '#1a1a1a',
                border: 'none',
                cursor: 'pointer',
                padding: 0,
                textAlign: 'left',
                display: 'block',
                width: '100%',
              }}
            >
              {season.image_url && (
                <img
                  src={season.image_url}
                  alt=""
                  style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
                />
              )}
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  background: season.image_url
                    ? 'linear-gradient(180deg, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.8) 100%)'
                    : 'linear-gradient(135deg, #1e1e2e 0%, #0f0f1a 100%)',
                }}
              />

              {/* Bottom-left */}
              <div style={{ position: 'absolute', left: '14px', bottom: '12px' }}>
                {(season.start_date || season.end_date) && (
                  <p style={{ fontSize: '11px', color: '#9a9a97', marginBottom: '2px' }}>
                    {formatSeasonDate(season.start_date)}
                    {season.end_date ? ` – ${formatSeasonDate(season.end_date)}` : ''}
                  </p>
                )}
                <p style={{ fontSize: '16px', fontWeight: '700', color: '#ffffff' }}>
                  {season.name}
                </p>
              </div>

              {/* Bottom-right count pill */}
              <div style={{ position: 'absolute', right: '14px', bottom: '12px' }}>
                <span
                  style={{
                    background: 'rgba(255,255,255,0.1)',
                    color: '#ffffff',
                    fontSize: '11px',
                    fontWeight: '600',
                    borderRadius: '20px',
                    padding: '3px 8px',
                  }}
                >
                  {season.sunday_count} {season.sunday_count === 1 ? 'Sunday' : 'Sundays'}
                </span>
              </div>
            </button>
          ))}
        </div>
      )}
    </DetailPage>
  )
}
