import { useEffect, useState } from 'react'
import DetailPage from '../components/DetailPage.jsx'
import SkeletonCard from '../components/SkeletonCard.jsx'
import BackRow from '../components/BackRow.jsx'
import { getExploreCard } from '../lib/api.js'

const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1529333166437-7750a6dd5a70?w=800&q=80'
const FALLBACK_DESCRIPTION = "Esteban and Antonella have been leading Welcome Church together since 2015. Esteban brings a passion for expository preaching and church planting across Europe, holding a Masters in Theology from Wheaton College. Antonella leads discipleship and pastoral care with a background in counseling and theology, walking alongside people through life's most challenging seasons with grace and wisdom."

function PastorsSkeleton() {
  return (
    <div style={{ background: '#0a0b0a', minHeight: '100dvh' }}>
      <div style={{ position: 'absolute', top: 'calc(env(safe-area-inset-top) + 12px)', left: '22px', zIndex: 10 }}>
        <BackRow label="Home" fallback="/" />
      </div>
      <SkeletonCard height={260} radius={0} />
      <div style={{ padding: '20px 22px 0', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <div style={{ height: '22px', width: '55%', borderRadius: '8px', background: '#2a2a2a' }} />
        <div style={{ height: '14px', width: '100%', borderRadius: '8px', background: '#222' }} />
        <div style={{ height: '14px', width: '88%', borderRadius: '8px', background: '#222' }} />
        <div style={{ height: '14px', width: '72%', borderRadius: '8px', background: '#222' }} />
      </div>
    </div>
  )
}

export default function PastorsPage() {
  const [isLoading, setIsLoading] = useState(true)
  const [heroImage, setHeroImage] = useState(null)
  const [description, setDescription] = useState(null)

  useEffect(() => {
    getExploreCard('/pastors').then(({ data }) => {
      setHeroImage(data?.image_url || FALLBACK_IMAGE)
      setDescription(data?.description || FALLBACK_DESCRIPTION)
      setIsLoading(false)
    })
  }, [])

  if (isLoading) return <PastorsSkeleton />

  return (
    <DetailPage
      image={heroImage}
      title="Esteban & Antonella"
      subtitle="Senior Pastors"
      description={description}
      backLabel="Home"
      backPath="/"
    />
  )
}
