import { useState, useEffect } from 'react'
import { updateUserPhone } from '../lib/api.js'
import { getStoredUser } from '../lib/user.js'

const COUNTRY_CODES = [
  { code: '+39', flag: '🇮🇹' },
  { code: '+34', flag: '🇪🇸' },
  { code: '+1',  flag: '🇺🇸' },
  { code: '+44', flag: '🇬🇧' },
  { code: '+33', flag: '🇫🇷' },
  { code: '+49', flag: '🇩🇪' },
  { code: '+55', flag: '🇧🇷' },
  { code: '+52', flag: '🇲🇽' },
  { code: '+54', flag: '🇦🇷' },
  { code: '+81', flag: '🇯🇵' },
]

export default function PhoneReminderSheet({ onComplete }) {
  const user = getStoredUser()
  const [visible, setVisible] = useState(false)
  const [countryCode, setCountryCode] = useState('+39')
  const [phone, setPhone] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true))
  }, [])

  const close = (cb) => {
    setVisible(false)
    setTimeout(cb, 380)
  }

  const handleSave = async () => {
    if (!phone.trim()) return
    setSaving(true)
    await updateUserPhone(user.id, `${countryCode}${phone.trim()}`)
    setSaving(false)
    close(onComplete)
  }

  const handleSkip = () => close(onComplete)

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 9000 }}>
      <div
        style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)' }}
        onClick={handleSkip}
      />
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          background: '#111111',
          borderRadius: '20px 20px 0 0',
          padding: '12px 24px calc(env(safe-area-inset-bottom) + 32px)',
          transform: visible ? 'translateY(0)' : 'translateY(100%)',
          transition: 'transform 380ms cubic-bezier(0.22,1,0.36,1)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 20 }}>
          <div style={{ width: 40, height: 4, borderRadius: 2, background: '#2a2a2a' }} />
        </div>

        <h2 style={{ fontSize: 22, fontWeight: 800, color: '#fff', margin: '0 0 6px', letterSpacing: '-0.01em' }}>
          Add your WhatsApp number
        </h2>
        <p style={{ fontSize: 14, color: '#666', margin: '0 0 22px', lineHeight: 1.5 }}>
          Stay updated on events and announcements
        </p>

        <div style={{ display: 'flex', gap: 10, marginBottom: 8 }}>
          <select
            value={countryCode}
            onChange={(e) => setCountryCode(e.target.value)}
            style={{
              height: 52,
              background: '#1a1a1a',
              border: '1px solid #2e2e2e',
              borderRadius: 14,
              color: '#fff',
              fontSize: 15,
              padding: '0 10px',
              flexShrink: 0,
              cursor: 'pointer',
              outline: 'none',
            }}
          >
            {COUNTRY_CODES.map((c) => (
              <option key={c.code} value={c.code}>{c.flag} {c.code}</option>
            ))}
          </select>
          <input
            type="tel"
            inputMode="tel"
            placeholder="Phone number"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            style={{
              flex: 1,
              height: 52,
              background: '#1a1a1a',
              border: '1px solid #2e2e2e',
              borderRadius: 14,
              color: '#fff',
              fontSize: 16,
              padding: '0 16px',
              outline: 'none',
              boxSizing: 'border-box',
            }}
          />
        </div>

        <p style={{ fontSize: 11, color: '#444', marginBottom: 20 }}>
          For events and important updates only
        </p>

        <button
          type="button"
          onClick={handleSave}
          disabled={saving || !phone.trim()}
          style={{
            width: '100%',
            height: 52,
            background: saving || !phone.trim() ? '#1e1e1e' : '#f97316',
            color: saving || !phone.trim() ? '#555' : '#fff',
            fontSize: 16,
            fontWeight: 700,
            borderRadius: 14,
            border: 'none',
            cursor: saving || !phone.trim() ? 'not-allowed' : 'pointer',
            marginBottom: 10,
            transition: 'background 200ms, color 200ms',
          }}
        >
          {saving ? 'Saving...' : 'Save my number'}
        </button>

        <button
          type="button"
          onClick={handleSkip}
          style={{ width: '100%', background: 'none', border: 'none', color: '#555', fontSize: 14, cursor: 'pointer', padding: '8px 0' }}
        >
          Maybe later
        </button>
      </div>
    </div>
  )
}
