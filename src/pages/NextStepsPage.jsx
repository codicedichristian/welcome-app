import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { X, ChevronLeft } from 'lucide-react'
import { supabase } from '../lib/supabase.js'
import { getExploreCard } from '../lib/api.js'
import DetailPage from '../components/DetailPage.jsx'

const EMPTY_FORM = { name: '', surname: '', email: '', phone: '' }

function SignUpSheet({ lang, onClose }) {
  const [form, setForm] = useState(EMPTY_FORM)
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.name.trim()) return
    setSending(true)
    await supabase.from('nextsteps_requests').insert({
      full_name: `${form.name.trim()} ${form.surname.trim()}`.trim(),
      email: form.email.trim() || null,
      phone: form.phone.trim() || null,
    })
    setSending(false)
    setSent(true)
  }

  const inputStyle = {
    width: '100%',
    padding: '14px',
    borderRadius: '12px',
    background: '#111',
    border: '1px solid #2e2e2e',
    color: '#ffffff',
    fontSize: '15px',
    outline: 'none',
    boxSizing: 'border-box',
  }

  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 200 }} />
      <div
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          background: '#1a1a1a',
          borderRadius: '20px 20px 0 0',
          zIndex: 201,
          padding: '24px 20px',
          paddingBottom: 'calc(env(safe-area-inset-bottom) + 32px)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'center', paddingBottom: '16px' }}>
          <div style={{ width: '40px', height: '4px', borderRadius: '2px', background: '#333' }} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <p style={{ fontSize: '18px', fontWeight: '700', color: '#ffffff', margin: 0 }}>
            {lang === 'en' ? 'Sign up' : 'Inscríbete'}
          </p>
          <button type="button" onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#888', padding: 0 }}>
            <X size={20} />
          </button>
        </div>

        {sent ? (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <p style={{ fontSize: '32px', marginBottom: '12px' }}>🎉</p>
            <p style={{ fontSize: '18px', fontWeight: '700', color: '#ffffff', marginBottom: '8px' }}>
              {lang === 'en' ? 'Thanks!' : '¡Gracias!'}
            </p>
            <p style={{ fontSize: '14px', color: '#888', marginBottom: '24px' }}>
              {lang === 'en' ? 'We will be in touch soon.' : 'Nos pondremos en contacto contigo pronto.'}
            </p>
            <button
              type="button"
              onClick={onClose}
              style={{ width: '100%', padding: '14px', borderRadius: '12px', background: '#ffffff', color: '#000000', fontSize: '15px', fontWeight: '600', border: 'none', cursor: 'pointer' }}
            >
              {lang === 'en' ? 'Close' : 'Cerrar'}
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <input type="text" placeholder={lang === 'en' ? 'First name *' : 'Nombre *'} value={form.name} onChange={set('name')} required style={inputStyle} />
            <input type="text" placeholder={lang === 'en' ? 'Last name' : 'Apellido'} value={form.surname} onChange={set('surname')} style={inputStyle} />
            <input type="email" placeholder={lang === 'en' ? 'Email' : 'Correo electrónico'} value={form.email} onChange={set('email')} style={inputStyle} />
            <input type="tel" placeholder={lang === 'en' ? 'Phone number' : 'Número de teléfono'} value={form.phone} onChange={set('phone')} style={inputStyle} />
            <button
              type="submit"
              disabled={sending || !form.name.trim()}
              style={{
                marginTop: '4px',
                width: '100%',
                padding: '14px',
                borderRadius: '12px',
                background: '#ffffff',
                color: '#000000',
                fontSize: '15px',
                fontWeight: '600',
                border: 'none',
                cursor: sending ? 'not-allowed' : 'pointer',
                opacity: sending || !form.name.trim() ? 0.5 : 1,
              }}
            >
              {sending ? (lang === 'en' ? 'Sending...' : 'Enviando...') : (lang === 'en' ? 'Send' : 'Enviar')}
            </button>
          </form>
        )}
      </div>
    </>
  )
}

export default function NextStepsPage() {
  const { i18n } = useTranslation()
  const [cardData, setCardData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)

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
              onClick={() => setShowForm(true)}
              style={{
                width: '100%',
                padding: '16px',
                borderRadius: '14px',
                background: '#ffffff',
                color: '#000000',
                fontSize: '16px',
                fontWeight: '700',
                border: 'none',
                cursor: 'pointer',
                letterSpacing: '-0.01em',
              }}
            >
              {i18n.language === 'en' ? 'I want to sign up' : 'Quiero inscribirme'}
            </button>
          </div>
        )}
      </DetailPage>

      {showForm && (
        <SignUpSheet lang={i18n.language} onClose={() => setShowForm(false)} />
      )}
    </>
  )
}
