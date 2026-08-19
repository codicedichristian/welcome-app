import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import DetailPage from '../components/DetailPage.jsx'
import { getExploreCard } from '../lib/api.js'

export default function MidweeksDescriptionPage() {
  const navigate = useNavigate()
  const [heroImage, setHeroImage] = useState(null)
  const [title, setTitle] = useState('Midweeks')
  const [description, setDescription] = useState(null)

  useEffect(() => {
    getExploreCard('/midweeks').then(({ data }) => {
      if (data?.image_url) setHeroImage(data.image_url)
      if (data?.title) setTitle(data.title)
      if (data?.description) setDescription(data.description)
    })
  }, [])

  return (
    <DetailPage
      image={heroImage ?? undefined}
      title={title}
      description={description ?? undefined}
      backLabel="Explore"
      backPath="/home"
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
