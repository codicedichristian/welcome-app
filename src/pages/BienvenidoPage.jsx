import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ChevronLeft, X } from 'lucide-react'
import { supabase } from '../lib/supabase.js'
import { getExploreCard } from '../lib/api.js'

const EMPTY_FORM = { name: '', surname: '', phone: '' }
const FALLBACK_TITLE = 'Bienvenido a casa'
const FALLBACK_DESCRIPTION = 'En VIVE Church somos una familia que apasionadamente busca a Dios y ama a las personas. Creemos que cada persona fue creada con un propósito y que la vida plena se encuentra en una relación genuina con Dios y con la comunidad. Vivimos en libertad, caminamos en misión, buscamos la santidad y rechazamos los patrones de este mundo. Encarnamos la generosidad — no como obligación, sino como estilo de vida. Si estás buscando una iglesia donde puedas crecer, servir y pertenecer, ¡este es tu hogar!'

function InfoSheet({ lang, onSignUp, onClose }) {
  return (
    <>
      <div
        onClick={onClose}
        style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 200 }}
      />
      <div
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          background: '#1a1a1a',
          borderRadius: '20px 20px 0 0',
          zIndex: 201,
          padding: '32px 24px',
          paddingBottom: 'calc(env(safe-area-inset-bottom) + 32px)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '24px' }}>
          <div style={{ width: '40px', height: '4px', borderRadius: '2px', background: '#333' }} />
        </div>
        <p style={{ fontSize: '22px', fontWeight: '800', color: '#ffffff', marginBottom: '12px', letterSpacing: '-0.01em', lineHeight: 1.2 }}>
          {lang === 'en'
            ? 'We have a special gathering for newcomers.'
            : 'Tenemos un encuentro especial para los nuevos.'}
        </p>
        <p style={{ fontSize: '15px', color: '#888', lineHeight: '1.6', marginBottom: '28px' }}>
          {lang === 'en'
            ? 'Sign up and we\'ll get in touch with you to tell you more.'
            : 'Inscríbete y te contactamos para contarte más.'}
        </p>
        <button
          type="button"
          onClick={onSignUp}
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
          }}
        >
          {lang === 'en' ? 'Sign up' : 'Inscribirme'}
        </button>
      </div>
    </>
  )
}

function ConnectSheet({ lang, onClose, onSubmitted }) {
  const [form, setForm] = useState(EMPTY_FORM)
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.name.trim()) return
    setSending(true)
    await supabase.from('connect_requests').insert({
      full_name: `${form.name.trim()} ${form.surname.trim()}`.trim(),
      phone: form.phone.trim() || null,
    })
    setSending(false)
    setSent(true)
    localStorage.setItem('bienvenido_submitted', 'true')
    onSubmitted()
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
      <div
        onClick={onClose}
        style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 200 }}
      />
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
          <p style={{ fontSize: '18px', fontWeight: '700', color: '#ffffff', margin: 0 }}>Conéctate con nosotros</p>
          <button type="button" onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#888', padding: 0 }}>
            <X size={20} />
          </button>
        </div>

        {sent ? (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <p style={{ fontSize: '32px', marginBottom: '12px' }}>🎉</p>
            <p style={{ fontSize: '18px', fontWeight: '700', color: '#ffffff', marginBottom: '8px' }}>¡Gracias!</p>
            <p style={{ fontSize: '14px', color: '#888', marginBottom: '24px' }}>Nos pondremos en contacto contigo pronto.</p>
            <button
              type="button"
              onClick={onClose}
              style={{
                width: '100%',
                padding: '14px',
                borderRadius: '12px',
                background: '#ffffff',
                color: '#000000',
                fontSize: '15px',
                fontWeight: '600',
                border: 'none',
                cursor: 'pointer',
              }}
            >
              Cerrar
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <input type="text" placeholder={lang === 'en' ? 'First name *' : 'Nombre *'} value={form.name} onChange={set('name')} required style={inputStyle} />
            <input type="text" placeholder={lang === 'en' ? 'Last name' : 'Apellido'} value={form.surname} onChange={set('surname')} style={inputStyle} />
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
                transition: 'opacity 0.2s',
              }}
            >
              {sending ? 'Enviando...' : 'Enviar'}
            </button>
          </form>
        )}
      </div>
    </>
  )
}

export default function BienvenidoPage() {
  const [showInfo, setShowInfo] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [submitted, setSubmitted] = useState(() => !!localStorage.getItem('bienvenido_submitted'))
  const [cardData, setCardData] = useState(null)
  const { i18n } = useTranslation()

  useEffect(() => {
    getExploreCard('/bienvenido').then(({ data }) => setCardData(data))
  }, [])

  const title = (i18n.language === 'en' && cardData?.title_en) ? cardData.title_en : (cardData?.title || FALLBACK_TITLE)
  const description = (i18n.language === 'en' && cardData?.description_en) ? cardData.description_en : (cardData?.description || FALLBACK_DESCRIPTION)

  return (
    <>
      <div className="page-transition" style={{ background: '#0a0b0a', minHeight: '100dvh', paddingBottom: '40px' }}>
        {/* Back button */}
        <div style={{ position: 'absolute', top: 'calc(env(safe-area-inset-top) + 12px)', left: '16px', zIndex: 10 }}>
          <button
            type="button"
            onClick={() => window.history.back()}
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              background: 'rgba(0,0,0,0.4)',
              backdropFilter: 'blur(10px)',
              WebkitBackdropFilter: 'blur(10px)',
              border: '0.5px solid rgba(255,255,255,0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
            }}
          >
            <ChevronLeft size={18} color="#ffffff" />
          </button>
        </div>

        {/* Hero */}
        <div style={{ position: 'relative', width: '100%', height: '320px', background: '#111' }}>
          <img
            src="https://abcufxrkmyqvbxeghvkp.supabase.co/storage/v1/object/public/images/explore/1787573025463_RLmGvYtKErutAy2pF3l7ZVZMoc.avif"
            alt=""
            draggable={false}
            onContextMenu={(e) => e.preventDefault()}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, transparent 30%, #0a0b0a 100%)' }} />
          <div style={{ position: 'absolute', left: '22px', bottom: '24px' }}>
            <span style={{
              display: 'inline-block',
              background: 'rgba(0,0,0,0.45)',
              backdropFilter: 'blur(8px)',
              WebkitBackdropFilter: 'blur(8px)',
              color: '#ffffff',
              fontSize: '10px',
              fontWeight: '700',
              letterSpacing: '0.07em',
              textTransform: 'uppercase',
              padding: '4px 10px',
              borderRadius: '999px',
              marginBottom: '8px',
            }}>
              {title}
            </span>
            <p style={{ fontSize: '28px', fontWeight: '800', color: '#ffffff', letterSpacing: '-0.01em', margin: 0, lineHeight: 1.1 }}>
              VIVE Church
            </p>
          </div>
        </div>

        {/* Content */}
        <div style={{ padding: '24px 22px 0' }}>
          <p style={{ fontSize: '22px', fontWeight: '700', color: '#ffffff', marginBottom: '14px', letterSpacing: '-0.01em' }}>
            Bringing People to Life!
          </p>
          <p style={{ fontSize: '15px', color: '#888', lineHeight: '1.7', marginBottom: '32px' }}>
            {description}
          </p>

          <button
            type="button"
            onClick={submitted ? undefined : () => setShowInfo(true)}
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
              : (i18n.language === 'en' ? 'Get to know us' : 'Conócenos mejor')}
          </button>
        </div>
      </div>

      {showInfo && (
        <InfoSheet
          lang={i18n.language}
          onSignUp={() => { setShowInfo(false); setShowForm(true) }}
          onClose={() => setShowInfo(false)}
        />
      )}
      {showForm && (
        <ConnectSheet
          lang={i18n.language}
          onClose={() => setShowForm(false)}
          onSubmitted={() => setSubmitted(true)}
        />
      )}
    </>
  )
}
