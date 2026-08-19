import { useEffect, useState } from 'react'
import DetailPage from '../components/DetailPage.jsx'
import { getExploreCard } from '../lib/api.js'

const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1529333166437-7750a6dd5a70?w=800&q=80'

export default function PastorsPage() {
  const [heroImage, setHeroImage] = useState(FALLBACK_IMAGE)

  useEffect(() => {
    getExploreCard('/pastors').then(({ data }) => {
      if (data?.image_url) setHeroImage(data.image_url)
    })
  }, [])

  return (
    <DetailPage
      image={heroImage}
      title="Esteban & Antonella"
      subtitle="Senior Pastors"
      description="Esteban and Antonella have been leading Welcome Church together since 2015. Esteban brings a passion for expository preaching and church planting across Europe, holding a Masters in Theology from Wheaton College. Antonella leads discipleship and pastoral care with a background in counseling and theology, walking alongside people through life's most challenging seasons with grace and wisdom."
      backLabel="Home"
      backPath="/"
    />
  )
}
