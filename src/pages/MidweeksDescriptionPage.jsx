import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import DetailPage from '../components/DetailPage.jsx'
import BackRow from '../components/BackRow.jsx'
import SkeletonCard, { SkeletonText } from '../components/SkeletonCard.jsx'
import { getExploreCard } from '../lib/api.js'

function MidweeksSkeleton() {
  return (
    <div style={{ background: '#0a0b0a', minHeight: '100dvh', paddingBottom: '40px' }}>
      <div style={{ position: 'absolute', top: 'calc(env(safe-area-inset-top) + 12px)', left: '22px', zIndex: 10 }}>
        <BackRow label="Explore" fallback="/" />
      </div>
      <SkeletonCard height={200} radius={0} />
      <div style={{ padding: '20px 22px 0', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <SkeletonText width="55%" height={28} />
        <SkeletonText height={15} />
        <SkeletonText width="80%" height={15} />
        <div style={{ marginTop: '8px' }}>
          <SkeletonCard height={48} radius={14} />
        </div>
      </div>
    </div>
  )
}

export default function MidweeksDescriptionPage() {
  const navigate = useNavigate()
  const [heroImage, setHeroImage] = useState(null)
  const [title, setTitle] = useState('Midweeks')
  const [description, setDescription] = useState(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    getExploreCard('/midweeks').then(({ data }) => {
      if (data?.image_url) setHeroImage(data.image_url)
      if (data?.title) setTitle(data.title)
      if (data?.description) setDescription(data.description)
      setIsLoading(false)
    })
  }, [])

  if (isLoading) return <MidweeksSkeleton />

  return (
    <DetailPage
      image={heroImage ?? undefined}
      title={title}
      description={description ?? undefined}
      backLabel="Explore"
      backPath="/"
    >
      <button
        type="button"
        onClick={() => navigate('/midweek')}
        style={{
          width: '100%',
          background: '#f97316',
          color: '#ffffff',
          fontSize: '15px',
          fontWeight: '700',
          borderRadius: '14px',
          padding: '14px',
          border: 'none',
          cursor: 'pointer',
        }}
      >
        Find your group
      </button>
    </DetailPage>
  )
}
