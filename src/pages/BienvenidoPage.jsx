import { useState } from 'react'
import { ChevronLeft, X } from 'lucide-react'
import { supabase } from '../lib/supabase.js'

const EMPTY_FORM = { name: '', surname: '', email: '', phone: '' }

function ConnectSheet({ onClose }) {
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
            <input type="text" placeholder="Nombre *" value={form.name} onChange={set('name')} required style={inputStyle} />
            <input type="text" placeholder="Apellido" value={form.surname} onChange={set('surname')} style={inputStyle} />
            <input type="email" placeholder="Email" value={form.email} onChange={set('email')} style={inputStyle} />
            <input type="tel" placeholder="Teléfono" value={form.phone} onChange={set('phone')} style={inputStyle} />
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
  const [showSheet, setShowSheet] = useState(false)

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
            src="https://picsum.photos/seed/bienvenido/800/520"
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
              Bienvenido a casa
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
          <p style={{ fontSize: '15px', color: '#888', lineHeight: '1.7', marginBottom: '12px' }}>
            En VIVE Church somos una familia que apasionadamente busca a Dios y ama a las personas. Creemos que cada persona fue creada con un propósito y que la vida plena se encuentra en una relación genuina con Dios y con la comunidad.
          </p>
          <p style={{ fontSize: '15px', color: '#888', lineHeight: '1.7', marginBottom: '12px' }}>
            Vivimos en libertad, caminamos en misión, buscamos la santidad y rechazamos los patrones de este mundo. Encarnamos la generosidad — no como obligación, sino como estilo de vida.
          </p>
          <p style={{ fontSize: '15px', color: '#888', lineHeight: '1.7', marginBottom: '32px' }}>
            Si estás buscando una iglesia donde puedas crecer, servir y pertenecer, ¡este es tu hogar!
          </p>

          <button
            type="button"
            onClick={() => setShowSheet(true)}
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
            Conéctate con nosotros
          </button>
        </div>
      </div>

      {showSheet && <ConnectSheet onClose={() => setShowSheet(false)} />}
    </>
  )
}
