import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import DetailPage from '../components/DetailPage.jsx'
import { getExploreCard } from '../lib/api.js'

export default function NextStepsPage() {
  const { i18n } = useTranslation()
  const [cardData, setCardData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getExploreCard('/nextsteps').then(({ data }) => {
      setCardData(data ?? null)
      setLoading(false)
    })
  }, [])

  const title = (i18n.language === 'en' && cardData?.title_en) ? cardData.title_en : (cardData?.title ?? 'Next Steps')
  const description = (i18n.language === 'en' && cardData?.description_en) ? cardData.description_en : (cardData?.description ?? undefined)

  return (
    <DetailPage
      image={cardData?.image_url ?? undefined}
      title={loading ? '' : title}
      description={loading ? undefined : description}
      backLabel="Home"
      backPath="/"
    />
  )
}
