import { useEffect, useState } from 'react'
import { X, Check } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import DetailPage from '../components/DetailPage.jsx'
import SkeletonCard from '../components/SkeletonCard.jsx'
import { getExploreCard, getServiceTeams } from '../lib/api.js'
import { supabase } from '../lib/supabase.js'

const EMPTY_FORM = { name: '', surname: '', email: '', phone: '' }

function JoinSheet({ onClose, areas }) {
  const { t } = useTranslation()
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')
  const [selectedArea, setSelectedArea] = useState(null)

  const set = (field) => (e) => setForm((prev) => ({ ...prev, [field]: e.target.value }))

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.name.trim() || !form.surname.trim() || !form.email.trim()) {
      setError(t('teams.error_required'))
      return
    }
    setSaving(true)
    setError('')
    const { error: dbError } = await supabase
      .from('team_join_requests')
      .insert([{
        full_name: `${form.name.trim()} ${form.surname.trim()}`,
        email: form.email.trim(),
        phone: form.phone.trim(),
        area_id: selectedArea?.id ?? null,
        area_name: selectedArea?.name ?? null,
      }])
    setSaving(false)
    if (dbError) {
      setError(t('teams.error_generic'))
    } else {
      setDone(true)
    }
  }

  const inputStyle = {
    width: '100%',
    background: '#242424',
    border: '0.5px solid #3a3a3a',
    borderRadius: '12px',
    padding: '14px 16px',
    fontSize: '15px',
    color: '#ffffff',
    outline: 'none',
    boxSizing: 'border-box',
  }

  const labelStyle = {
    fontSize: '13px',
    fontWeight: '600',
    color: '#8e8e93',
    marginBottom: '6px',
    display: 'block',
  }

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0,
          background: 'rgba(0,0,0,0.6)',
          zIndex: 100,
          backdropFilter: 'blur(2px)',
        }}
      />

      {/* Sheet */}
      <div style={{
        position: 'fixed', bottom: 0, left: 0, right: 0,
        background: '#1a1a1a',
        borderRadius: '24px 24px 0 0',
        padding: '0 24px calc(env(safe-area-inset-bottom) + 32px)',
        zIndex: 101,
        maxHeight: '92dvh',
        overflowY: 'auto',
      }}>
        {/* Handle */}
        <div style={{ display: 'flex', justifyContent: 'center', paddingTop: '12px', paddingBottom: '4px' }}>
          <div style={{ width: 36, height: 4, borderRadius: 99, background: '#3a3a3a' }} />
        </div>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '12px', paddingBottom: '24px' }}>
          <p style={{ fontSize: '20px', fontWeight: '700', color: '#ffffff', margin: 0 }}>{t('teams.sheet_title')}</p>
          <button
            type="button"
            onClick={onClose}
            style={{ background: '#2a2a2a', border: 'none', borderRadius: '50%', width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
          >
            <X size={16} color="#8e8e93" />
          </button>
        </div>

        {done ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', paddingTop: '32px', paddingBottom: '16px', textAlign: 'center' }}>
            <div style={{ width: 64, height: 64, borderRadius: '50%', background: '#16a34a22', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Check size={32} color="#22c55e" />
            </div>
            <p style={{ fontSize: '22px', fontWeight: '700', color: '#ffffff', margin: 0 }}>{t('teams.success_title')}</p>
            <p style={{ fontSize: '15px', color: '#6e6e73', lineHeight: 1.5, maxWidth: '260px', margin: 0 }}>
              {t('teams.success_body')}
            </p>
            <button
              type="button"
              onClick={onClose}
              style={{ marginTop: '8px', padding: '14px 32px', background: '#22c55e', border: 'none', borderRadius: '14px', fontSize: '16px', fontWeight: '700', color: '#fff', cursor: 'pointer' }}
            >
              {t('teams.done')}
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={labelStyle}>{t('teams.name_label')}</label>
              <input style={inputStyle} placeholder={t('teams.name_placeholder')} value={form.name} onChange={set('name')} autoComplete="given-name" />
            </div>
            <div>
              <label style={labelStyle}>{t('teams.surname_label')}</label>
              <input style={inputStyle} placeholder={t('teams.surname_placeholder')} value={form.surname} onChange={set('surname')} autoComplete="family-name" />
            </div>
            <div>
              <label style={labelStyle}>Área de servicio</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '4px' }}>
                {areas.filter((a) => !a.is_macro).map((area) => (
                  <button
                    key={area.id}
                    type="button"
                    onClick={() => setSelectedArea(selectedArea?.id === area.id ? null : area)}
                    style={{
                      padding: '8px 16px',
                      borderRadius: '20px',
                      border: selectedArea?.id === area.id ? '1.5px solid #f97316' : '1px solid #3a3a3a',
                      background: selectedArea?.id === area.id ? '#2a1a0a' : '#242424',
                      color: selectedArea?.id === area.id ? '#f97316' : '#aaaaaa',
                      fontSize: '14px',
                      fontWeight: selectedArea?.id === area.id ? '600' : '400',
                      cursor: 'pointer',
                    }}
                  >
                    {area.name}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label style={labelStyle}>{t('teams.email_label')}</label>
              <input style={inputStyle} type="email" placeholder="you@example.com" value={form.email} onChange={set('email')} autoComplete="email" />
            </div>
            <div>
              <label style={labelStyle}>{t('teams.phone_label')}</label>
              <input style={inputStyle} type="tel" placeholder="+39 333 000 0000" value={form.phone} onChange={set('phone')} autoComplete="tel" />
            </div>

            {error && (
              <p style={{ fontSize: '13px', color: '#f87171', margin: 0 }}>{error}</p>
            )}

            <button
              type="submit"
              disabled={saving}
              style={{
                marginTop: '8px',
                padding: '16px',
                background: saving ? '#166534' : '#22c55e',
                border: 'none',
                borderRadius: '14px',
                fontSize: '17px',
                fontWeight: '700',
                color: '#fff',
                cursor: saving ? 'not-allowed' : 'pointer',
                transition: 'background 0.2s',
              }}
            >
              {saving ? t('teams.sending') : t('teams.submit')}
            </button>
          </form>
        )}
      </div>
    </>
  )
}

export default function TeamsPage() {
  const { t } = useTranslation()
  const [heroImage, setHeroImage] = useState(null)
  const [description, setDescription] = useState(null)
  const [teams, setTeams] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [showJoin, setShowJoin] = useState(false)

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
    <>
      <DetailPage
        image={heroImage ?? undefined}
        title={t('teams.title')}
        description={description ?? undefined}
        backLabel={t('teams.back')}
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

          {/* Join button — same card dimensions */}
          <button
            type="button"
            onClick={() => setShowJoin(true)}
            style={{
              background: '#16a34a',
              border: 'none',
              borderRadius: '20px',
              padding: '18px',
              width: '100%',
              textAlign: 'center',
              fontSize: '16px',
              fontWeight: '700',
              color: '#ffffff',
              cursor: 'pointer',
              letterSpacing: '-0.01em',
            }}
          >
            {t('teams.join_button')}
          </button>
        </div>
      </DetailPage>

      {showJoin && <JoinSheet onClose={() => setShowJoin(false)} areas={teams} />}
    </>
  )
}
