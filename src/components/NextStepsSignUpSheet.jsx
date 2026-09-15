import { useState } from 'react'
import { X } from 'lucide-react'
import { supabase } from '../lib/supabase.js'

const EMPTY_FORM = { name: '', surname: '', email: '', phone: '' }

export default function NextStepsSignUpSheet({ lang, onClose, onSubmitted }) {
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
    localStorage.setItem('nextsteps_submitted', 'true')
    if (onSubmitted) onSubmitted()
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
