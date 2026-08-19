import { useEffect, useState } from 'react'
import DetailPage from '../components/DetailPage.jsx'
import { getExploreCard, getServiceTeams } from '../lib/api.js'

export default function TeamsPage() {
  const [heroImage, setHeroImage] = useState(null)
  const [description, setDescription] = useState(null)
  const [teams, setTeams] = useState([])

  useEffect(() => {
    Promise.all([
      getExploreCard('/teams'),
      getServiceTeams(),
    ]).then(([{ data: cardData }, { data: teamsData }]) => {
      if (cardData?.image_url) setHeroImage(cardData.image_url)
      if (cardData?.description) setDescription(cardData.description)
      if (teamsData?.length) setTeams(teamsData)
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
        {teams.map((team) => (
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
