import { useState, useRef, useEffect } from 'react'
import { ArrowLeft, Check, ChevronDown, Plus, X } from 'lucide-react'
import { updateUserOnboarding } from '../lib/api.js'
import { getStoredUser } from '../lib/user.js'

const INTERESTS = [
  'Worship', 'Prayer', 'Bible study', 'Youth', 'Kids ministry',
  'Missions', 'Community', 'Music', 'Arts & Creative',
  'Social action', 'Leadership', 'Marriage & Family', 'Small groups',
]

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

const ITEM_H = 56
const AGES = Array.from({ length: 82 }, (_, i) => i + 18)
// Pad with one empty sentinel at each end so first/last ages can center
const PICKER_ITEMS = ['', ...AGES, '']

function AgePicker({ value, onChange }) {
  const ref = useRef(null)

  useEffect(() => {
    if (!ref.current) return
    // AGES[0]=18 lives at pickerIndex 1, so scrollTop for age = (index in AGES) * ITEM_H
    const idx = AGES.indexOf(value)
    if (idx >= 0) ref.current.scrollTop = idx * ITEM_H
  }, [])

  const handleScroll = () => {
    if (!ref.current) return
    const idx = Math.round(ref.current.scrollTop / ITEM_H)
    const clamped = Math.max(0, Math.min(AGES.length - 1, idx))
    onChange(AGES[clamped])
  }

  return (
    <div style={{ position: 'relative', width: 180, height: ITEM_H * 3, overflow: 'hidden', margin: '0 auto' }}>
      {/* top fade */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: ITEM_H * 0.85, background: 'linear-gradient(to bottom, #111111, transparent)', pointerEvents: 'none', zIndex: 2 }} />
      {/* selection bar */}
      <div style={{ position: 'absolute', top: ITEM_H, left: 0, right: 0, height: ITEM_H, borderTop: '1px solid rgba(249,115,22,0.25)', borderBottom: '1px solid rgba(249,115,22,0.25)', background: 'rgba(249,115,22,0.06)', pointerEvents: 'none', zIndex: 2 }} />
      {/* bottom fade */}
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: ITEM_H * 0.85, background: 'linear-gradient(to top, #111111, transparent)', pointerEvents: 'none', zIndex: 2 }} />
      <ul
        ref={ref}
        onScroll={handleScroll}
        style={{
          height: '100%',
          overflowY: 'scroll',
          scrollSnapType: 'y mandatory',
          overscrollBehavior: 'contain',
          WebkitOverflowScrolling: 'touch',
          listStyle: 'none',
          padding: 0,
          margin: 0,
        }}
      >
        {PICKER_ITEMS.map((item, i) => {
          const isAge = item !== ''
          const dist = isAge ? Math.abs(item - value) : 99
          return (
            <li
              key={i}
              style={{
                scrollSnapAlign: isAge ? 'center' : 'none',
                height: ITEM_H,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: dist === 0 ? 46 : dist === 1 ? 26 : 18,
                fontWeight: dist === 0 ? 800 : 400,
                color: dist === 0 ? '#ffffff' : `rgba(255,255,255,${dist === 1 ? 0.3 : 0.1})`,
                userSelect: 'none',
              }}
            >
              {item}
            </li>
          )
        })}
      </ul>
    </div>
  )
}

function WhatsAppIcon() {
  return (
    <svg width="44" height="44" viewBox="0 0 24 24" fill="none">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" fill="#25D366" />
      <path d="M12 0C5.373 0 0 5.373 0 12c0 2.085.535 4.043 1.472 5.755L0 24l6.435-1.437A11.929 11.929 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.99 0-3.847-.587-5.4-1.595l-.387-.23-4.016.896.953-3.919-.252-.4A9.956 9.956 0 012 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z" fill="#25D366" />
    </svg>
  )
}

export default function OnboardingSheet({ onComplete }) {
  const user = getStoredUser()
  const [visible, setVisible] = useState(false)
  const [section, setSection] = useState(0)

  const [age, setAge] = useState(25)
  const [interests, setInterests] = useState([])
  const [customTag, setCustomTag] = useState('')
  const [showCustomInput, setShowCustomInput] = useState(false)
  const [shake, setShake] = useState(false)

  const [countryCode, setCountryCode] = useState('+39')
  const [phone, setPhone] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true))
  }, [])

  const close = (cb) => {
    setVisible(false)
    setTimeout(cb, 420)
  }

  const goTo = (n) => setSection(n)

  const handleNextInterests = () => {
    if (interests.length === 0) {
      setShake(true)
      setTimeout(() => setShake(false), 600)
      return
    }
    goTo(2)
  }

  const toggleInterest = (i) => {
    setInterests((prev) => (prev.includes(i) ? prev.filter((x) => x !== i) : [...prev, i]))
  }

  const addCustom = () => {
    const t = customTag.trim()
    if (!t) return
    if (!interests.includes(t)) setInterests((prev) => [...prev, t])
    setCustomTag('')
    setShowCustomInput(false)
  }

  const handleSave = async () => {
    setSaving(true)
    const fullPhone = phone.trim() ? `${countryCode}${phone.trim()}` : 'pending'
    await updateUserOnboarding(user.id, { age, interests, phone: fullPhone })
    setSaving(false)
    close(onComplete)
  }

  const handleSkip = async () => {
    setSaving(true)
    await updateUserOnboarding(user.id, { age, interests, phone: 'pending' })
    setSaving(false)
    close(onComplete)
  }

  const sectionStyle = {
    position: 'absolute',
    inset: 0,
    transition: 'transform 350ms cubic-bezier(0.22,1,0.36,1)',
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '16px 24px',
    boxSizing: 'border-box',
  }

  const stepLabel = {
    fontSize: 11,
    fontWeight: 600,
    color: '#555',
    textTransform: 'uppercase',
    letterSpacing: '0.1em',
    marginBottom: 20,
  }

  const heading = {
    fontSize: 28,
    fontWeight: 800,
    color: '#ffffff',
    margin: '0 0 6px',
    textAlign: 'center',
    letterSpacing: '-0.02em',
  }

  const sub = {
    fontSize: 15,
    color: '#666',
    margin: '0 0 32px',
    textAlign: 'center',
    lineHeight: 1.5,
  }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 9000 }}>
      {/* backdrop */}
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.72)' }} />

      {/* sheet */}
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: '88vh',
          background: '#111111',
          borderRadius: '20px 20px 0 0',
          transform: visible ? 'translateY(0)' : 'translateY(100%)',
          transition: 'transform 420ms cubic-bezier(0.22,1,0.36,1)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        {/* handle + nav row */}
        <div style={{ paddingTop: 10, paddingBottom: 14, flexShrink: 0 }}>
          {/* drag handle */}
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 12 }}>
            <div style={{ width: 40, height: 4, borderRadius: 2, background: '#2a2a2a' }} />
          </div>
          {/* back arrow + step dots */}
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {section > 0 && (
              <button
                type="button"
                onClick={() => goTo(section - 1)}
                style={{ position: 'absolute', left: 16, background: 'none', border: 'none', cursor: 'pointer', color: '#888', padding: 4, display: 'flex', alignItems: 'center' }}
                aria-label="Back"
              >
                <ArrowLeft size={20} />
              </button>
            )}
            <div style={{ display: 'flex', gap: 6 }}>
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  style={{
                    height: 6,
                    width: i === section ? 20 : 6,
                    borderRadius: 3,
                    background: i === section ? '#f97316' : '#2a2a2a',
                    transition: 'width 300ms ease, background 300ms ease',
                  }}
                />
              ))}
            </div>
          </div>
        </div>

        {/* sliding sections */}
        <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
          {/* ── Section 0: Age ── */}
          <div style={{ ...sectionStyle, transform: `translateX(${(0 - section) * 100}%)` }}>
            <p style={stepLabel}>Step 1 of 3</p>
            <h2 style={heading}>How old are you?</h2>
            <p style={sub}>We'll use this to personalise your experience</p>
            <AgePicker value={age} onChange={setAge} />
            <button
              type="button"
              onClick={() => goTo(1)}
              style={{ marginTop: 40, background: 'none', border: 'none', cursor: 'pointer', padding: 8, animation: 'bounce-down 1.5s ease-in-out infinite' }}
              aria-label="Next"
            >
              <ChevronDown size={30} color="#555" />
            </button>
          </div>

          {/* ── Section 1: Interests ── */}
          <div style={{ ...sectionStyle, transform: `translateX(${(1 - section) * 100}%)`, justifyContent: 'flex-start', paddingTop: 28 }}>
            <p style={stepLabel}>Step 2 of 3</p>
            <h2 style={heading}>What interests you?</h2>
            <p style={{ ...sub, marginBottom: 20 }}>Pick as many as you like</p>

            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: 10,
                justifyContent: 'center',
                width: '100%',
                animation: shake ? 'shake-x 0.5s ease-in-out' : 'none',
              }}
            >
              {[...INTERESTS, ...interests.filter((i) => !INTERESTS.includes(i))].map((interest) => (
                <button
                  key={interest}
                  type="button"
                  onClick={() => toggleInterest(interest)}
                  style={{
                    padding: '9px 16px',
                    borderRadius: 99,
                    border: interests.includes(interest) ? 'none' : '1.5px solid #2e2e2e',
                    background: interests.includes(interest) ? '#f97316' : 'transparent',
                    color: interests.includes(interest) ? '#fff' : '#888',
                    fontSize: 14,
                    fontWeight: interests.includes(interest) ? 600 : 400,
                    cursor: 'pointer',
                  }}
                >
                  {interest}
                </button>
              ))}

              {showCustomInput ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, border: '1.5px solid #f97316', borderRadius: 99, padding: '6px 12px', background: 'rgba(249,115,22,0.08)' }}>
                  <input
                    autoFocus
                    value={customTag}
                    onChange={(e) => setCustomTag(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') addCustom() }}
                    placeholder="Add..."
                    style={{ background: 'none', border: 'none', outline: 'none', color: '#fff', fontSize: 14, width: 80 }}
                  />
                  <button type="button" onClick={addCustom} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#f97316', padding: 0, display: 'flex' }}>
                    <Check size={15} />
                  </button>
                  <button type="button" onClick={() => { setShowCustomInput(false); setCustomTag('') }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#555', padding: 0, display: 'flex' }}>
                    <X size={14} />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowCustomInput(true)}
                  style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 16px', borderRadius: 99, border: '1.5px dashed #333', background: 'transparent', color: '#555', fontSize: 14, cursor: 'pointer' }}
                >
                  <Plus size={13} />
                  Add your own
                </button>
              )}
            </div>

            <button
              type="button"
              onClick={handleNextInterests}
              style={{ marginTop: 24, background: 'none', border: 'none', cursor: 'pointer', padding: 8, animation: 'bounce-down 1.5s ease-in-out infinite' }}
              aria-label="Next"
            >
              <ChevronDown size={30} color="#555" />
            </button>
          </div>

          {/* ── Section 2: Phone ── */}
          <div
            style={{
              ...sectionStyle,
              transform: `translateX(${(2 - section) * 100}%)`,
              paddingBottom: `calc(env(safe-area-inset-bottom) + 28px)`,
            }}
          >
            <p style={stepLabel}>Step 3 of 3</p>
            <WhatsAppIcon />
            <h2 style={{ ...heading, marginTop: 16 }}>Want to stay in the loop?</h2>
            <p style={sub}>Get event invites and reminders directly on WhatsApp</p>

            <div style={{ width: '100%', display: 'flex', gap: 10, marginBottom: 10 }}>
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

            <p style={{ fontSize: 12, color: '#444', textAlign: 'center', marginBottom: 24, lineHeight: 1.5 }}>
              We'll only message you for events and important updates
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
                marginBottom: 12,
                transition: 'background 200ms, color 200ms',
              }}
            >
              {saving ? 'Saving...' : 'Save my number'}
            </button>

            <button
              type="button"
              onClick={handleSkip}
              disabled={saving}
              style={{ background: 'none', border: 'none', color: '#555', fontSize: 14, cursor: 'pointer', padding: '8px 0' }}
            >
              Skip for now
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
