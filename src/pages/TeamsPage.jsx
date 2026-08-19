import { useEffect, useState } from 'react'
import DetailPage from '../components/DetailPage.jsx'
import SkeletonCard from '../components/SkeletonCard.jsx'
import { getExploreCard, getServiceTeams } from '../lib/api.js'

export default function TeamsPage() {
  const [heroImage, setHeroImage] = useState(null)
  const [description, setDescription] = useState(null)
  const [teams, setTeams] = useState([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      getExploreCard('/teams'),
      getServiceTeams(),
    ]).then(([{ data: cardData }, { data: teamsData }]) => {
      if (cardData?.image_url) setHeroImage(cardData.image_url)
      if (cardData?.description) setDescription(cardData.description)
      if (teamsData?.length) setTeams(teamsData)
      setIsLoading(false)
    })
  }, [])

  return (
    <DetailPage
      image={heroImage ?? undefined}
      title="Service Teams"
      description={description ?? undefined}
      backLabel="Home"
      backPath="/"
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        {isLoading ? (
          [0, 1, 2, 3, 4].map((i) => <SkeletonCard key={i} height={100} radius={20} />)
        ) : teams.map((team) => (
          <div
            key={team.id}
            style={{
              background: '#1a1a1a',
              border: '0.5px solid #2e2e2e',
              borderRadius: '20px',
              padding: '18px',
            }}
          >
            <p style={{ fontSize: '16px', fontWeight: '700', color: '#ffffff' }}>
              {team.name}
            </p>

            {team.description && (
              <p style={{ fontSize: '14px', color: '#c9c9c6', lineHeight: 1.6, marginTop: '12px' }}>
                {team.description}
              </p>
            )}
          </div>
        ))}
      </div>
    </DetailPage>
  )
}
