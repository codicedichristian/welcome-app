import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { getExploreCard } from '../lib/api.js'
import DetailPage from '../components/DetailPage.jsx'
import NextStepsSignUpSheet from '../components/NextStepsSignUpSheet.jsx'

export default function NextStepsPage() {
  const { i18n } = useTranslation()
  const [cardData, setCardData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [submitted, setSubmitted] = useState(() => !!localStorage.getItem('nextsteps_submitted'))

  useEffect(() => {
    getExploreCard('/nextsteps').then(({ data }) => {
      setCardData(data ?? null)
      setLoading(false)
    })
  }, [])

  const title = (i18n.language === 'en' && cardData?.title_en) ? cardData.title_en : (cardData?.title ?? 'Next Steps')
  const description = (i18n.language === 'en' && cardData?.description_en) ? cardData.description_en : (cardData?.description ?? undefined)

  return (
    <>
      <DetailPage
        image={cardData?.image_url ?? undefined}
        title={loading ? '' : title}
        description={loading ? undefined : description}
        backLabel="Home"
        backPath="/"
      >
        {!loading && (
          <div style={{ marginTop: '8px' }}>
            <button
              type="button"
              onClick={submitted ? undefined : () => setShowForm(true)}
              disabled={submitted}
              style={{
                width: '100%',
                padding: '16px',
                borderRadius: '14px',
                background: submitted ? '#22c55e' : '#ffffff',
                color: submitted ? '#ffffff' : '#000000',
                fontSize: '16px',
                fontWeight: '700',
                border: 'none',
                cursor: submitted ? 'default' : 'pointer',
                letterSpacing: '-0.01em',
                transition: 'background 0.3s ease',
              }}
            >
              {submitted
                ? '✓ ' + (i18n.language === 'en' ? 'Request sent!' : '¡Solicitud enviada!')
                : (i18n.language === 'en' ? 'I want to sign up' : 'Quiero inscribirme')}
            </button>
          </div>
        )}
      </DetailPage>

      {showForm && (
        <NextStepsSignUpSheet lang={i18n.language} onClose={() => setShowForm(false)} onSubmitted={() => setSubmitted(true)} />
      )}
    </>
  )
}
