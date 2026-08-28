import { useState, useEffect } from 'react'
import { ArrowLeft, Check, Plus, X } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { supabase } from '../lib/supabase.js'
import { getStoredUser, toStoredUser } from '../lib/user.js'
import { INTERESTS, migrateInterests } from '../constants/interests.js'
import { AGE_RANGE_OPTIONS } from '../onboarding/options.js'

const COUNTRY_CODES = [
  { code: '+34', flag: '🇪🇸' },
  { code: '+39', flag: '🇮🇹' },
  { code: '+351', flag: '🇵🇹' },
  { code: '+57', flag: '🇨🇴' },
  { code: '+56', flag: '🇨🇱' },
  { code: '+51', flag: '🇵🇪' },
  { code: '+40', flag: '🇷🇴' },
  { code: '+380', flag: '🇺🇦' },
  { code: '+1', flag: '🇺🇸' },
  { code: '+44', flag: '🇬🇧' },
  { code: '+33', flag: '🇫🇷' },
  { code: '+49', flag: '🇩🇪' },
  { code: '+55', flag: '🇧🇷' },
  { code: '+52', flag: '🇲🇽' },
  { code: '+54', flag: '🇦🇷' },
]

function WhatsAppIcon() {
  return (
    <svg width="40" height="40" viewBox="0 0 24 24" fill="none">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" fill="#25D366" />
      <path d="M12 0C5.373 0 0 5.373 0 12c0 2.085.535 4.043 1.472 5.755L0 24l6.435-1.437A11.929 11.929 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.99 0-3.847-.587-5.4-1.595l-.387-.23-4.016.896.953-3.919-.252-.4A9.956 9.956 0 012 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z" fill="#25D366" />
    </svg>
  )
}

const isPWA = window.matchMedia('(display-mode: standalone)').matches

export default function OnboardingSheet({ sectionsToShow, onComplete, onSave }) {
  const user = getStoredUser()
  const sections = sectionsToShow
  const { t } = useTranslation()

  const [visible, setVisible] = useState(false)
  const [currentSection, setCurrentSection] = useState(-1)
  const [animKey, setAnimKey] = useState(0)
  const [slideDir, setSlideDir] = useState(1)

  // Interests
  const [interests, setInterests] = useState(() => migrateInterests(user.interests))
  const [customTag, setCustomTag] = useState('')
  const [showCustomInput, setShowCustomInput] = useState(false)
  const [shake, setShake] = useState(false)

  // Age range
  const [ageRange, setAgeRange] = useState(user.ageRange || user.age_range || '')

  // Phone
  const [countryCode, setCountryCode] = useState('+34')
  const [phone, setPhone] = useState('')
  const [phoneSkipped, setPhoneSkipped] = useState(false)

  // Notifications
  const [notifEmail, setNotifEmail] = useState(user.notifEmail ?? user.notif_email ?? false)
  const [notifWhatsapp, setNotifWhatsapp] = useState(user.notifWhatsapp ?? user.notif_whatsapp ?? false)
  const [notifApp, setNotifApp] = useState(user.notifApp ?? user.notif_app ?? false)

  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (sectionsToShow.length === 0) { onComplete(); return }
    requestAnimationFrame(() => setVisible(true))
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  const close = (cb) => {
    setVisible(false)
    setTimeout(cb, 420)
  }

  const goTo = (n) => {
    setSlideDir(n > currentSection ? 1 : -1)
    setAnimKey((k) => k + 1)
    setCurrentSection(n)
  }

  const goNextOrComplete = () => {
    const isLast = currentSection === sections.length - 1
    if (isLast) handleComplete()
    else goTo(currentSection + 1)
  }

  const handleComplete = async () => {
    setSaving(true)

    const finalInterests = sections.includes('interests') ? interests.filter(Boolean) : undefined
    const finalAgeRange = sections.includes('age_range') ? (ageRange || null) : undefined
    const finalNotifEmail = sections.includes('notifications') ? notifEmail : undefined
    const finalNotifWhatsapp = sections.includes('notifications') ? notifWhatsapp : undefined
    const finalNotifApp = sections.includes('notifications') ? notifApp : undefined

    let finalPhone = sections.includes('phone')
      ? (phoneSkipped || !phone.trim() ? 'pending' : `${countryCode}${phone.trim()}`)
      : undefined

    // Never overwrite a real phone with 'pending'
    if (finalPhone !== undefined) {
      const { data: currentData } = await supabase.from('users').select('phone').eq('id', user.id).single()
      if (currentData?.phone && currentData.phone !== 'pending') {
        finalPhone = currentData.phone
      }
    }

    const updatePayload = { onboarding_completed: true }
    if (finalInterests !== undefined) updatePayload.interests = finalInterests
    if (finalAgeRange !== undefined) updatePayload.age_range = finalAgeRange
    if (finalPhone !== undefined) updatePayload.phone = finalPhone
    if (finalNotifEmail !== undefined) updatePayload.notif_email = finalNotifEmail
    if (finalNotifWhatsapp !== undefined) updatePayload.notif_whatsapp = finalNotifWhatsapp
    if (finalNotifApp !== undefined) updatePayload.notif_app = finalNotifApp

    const { error } = await supabase
      .from('users')
      .update(updatePayload)
      .eq('id', user.id)

    console.log('[Onboarding] save result:', { error })

    // Re-fetch the full updated row so localStorage and context are fully fresh
    const { data: freshRow } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single()

    if (freshRow) {
      const stored = toStoredUser(freshRow, user.authId)
      localStorage.setItem('welcome_user', JSON.stringify(stored))
      onSave(stored)
    } else {
      // Fallback to partial update if re-fetch fails
      onSave({
        onboardingCompleted: true,
        ...(finalInterests !== undefined && { interests: finalInterests }),
        ...(finalAgeRange !== undefined && { ageRange: finalAgeRange }),
        ...(finalPhone !== undefined && { phone: finalPhone }),
        ...(finalNotifEmail !== undefined && { notifEmail: finalNotifEmail }),
        ...(finalNotifWhatsapp !== undefined && { notifWhatsapp: finalNotifWhatsapp }),
        ...(finalNotifApp !== undefined && { notifApp: finalNotifApp }),
      })
    }

    // Lock the flag at save time — prevents re-check on next mount
    localStorage.setItem('onboarding_checked', 'true')

    setSaving(false)
    close(onComplete)
  }

  const handleNextInterests = () => {
    if (interests.length === 0) {
      setShake(true)
      setTimeout(() => setShake(false), 600)
      return
    }
    goNextOrComplete()
  }

  const toggleInterest = (i) => {
    setInterests((prev) => prev.includes(i) ? prev.filter((x) => x !== i) : [...prev, i])
  }

  const addCustomTag = () => {
    const tag = customTag.trim()
    if (!tag) return
    if (!interests.includes(tag)) setInterests((prev) => [...prev, tag])
    setCustomTag('')
    setShowCustomInput(false)
  }

  const sectionName = currentSection >= 0 ? sections[currentSection] : null
  const stepNum = currentSection + 1
  const totalSteps = sections.length
  const canGoBack = currentSection > 0
  const animClass = slideDir === 1 ? 'animate-slide-in-right' : 'animate-slide-in-left'

  const sheetStyle = {
    position: 'absolute',
    bottom: 0,
    background: '#111111',
    transition: 'transform 400ms ease-out',
    display: 'flex', flexDirection: 'column',
    overflow: 'hidden',
    overscrollBehavior: 'contain',
    touchAction: 'pan-y',
    ...(isPWA
      ? {
          left: 0, right: 0, height: '88vh',
          borderRadius: '20px 20px 0 0',
          transform: visible ? 'translateY(0)' : 'translateY(100%)',
        }
      : {
          left: '50%', width: '100%', maxWidth: 480, maxHeight: '70vh',
          borderRadius: 20,
          transform: visible
            ? 'translateX(-50%) translateY(0)'
            : 'translateX(-50%) translateY(100%)',
        }
    ),
  }

  const stepLabel = {
    fontSize: 11, fontWeight: 600, color: '#555',
    textTransform: 'uppercase', letterSpacing: '0.1em', margin: 0,
  }

  const backBtn = (
    <button
      type="button"
      onClick={() => goTo(currentSection - 1)}
      style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#888', padding: '4px 4px 4px 0', display: 'flex', flexShrink: 0 }}
      aria-label="Back"
    >
      <ArrowLeft size={20} />
    </button>
  )

  const navRow = (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
      {canGoBack ? backBtn : <div style={{ width: 28, flexShrink: 0 }} />}
      <p style={stepLabel}>{t('onboarding.step', { step: stepNum, total: totalSteps })}</p>
    </div>
  )

  return (
    <div
      style={{ position: 'fixed', inset: 0, zIndex: 9000 }}
      onTouchStart={(e) => e.stopPropagation()}
      onTouchMove={(e) => e.stopPropagation()}
    >
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)' }} />

      <div style={sheetStyle}
        onTouchStart={(e) => e.stopPropagation()}
        onTouchMove={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: 12, marginBottom: 8, flexShrink: 0 }}>
          <div style={{ width: 40, height: 4, borderRadius: 2, background: '#333' }} />
        </div>

        <div
          key={animKey}
          className={currentSection === -1 ? '' : animClass}
          style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}
        >
          {/* ── INTRO ── */}
          {currentSection === -1 && (
            <div style={{
              flex: 1, display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center',
              padding: '32px 28px calc(env(safe-area-inset-bottom) + 40px)',
              textAlign: 'center',
            }}>
              <div style={{ fontSize: 52, marginBottom: 24 }}>👋</div>
              <h2 style={{ fontSize: 26, fontWeight: 800, color: '#fff', margin: '0 0 14px', letterSpacing: '-0.02em', lineHeight: 1.25 }}>
                {t('onboarding.intro_title')}
              </h2>
              <p style={{ fontSize: 15, color: '#666', margin: '0 0 52px', lineHeight: 1.65 }}>
                {t('onboarding.intro_body')}
              </p>
              <button
                type="button"
                onClick={() => goTo(0)}
                style={{
                  width: '100%', height: 56, background: '#f97316', color: '#fff',
                  fontSize: 17, fontWeight: 700, borderRadius: 14, border: 'none', cursor: 'pointer',
                }}
              >
                {t('onboarding.intro_start')}
              </button>
            </div>
          )}

          {/* ── INTERESTS ── */}
          {sectionName === 'interests' && (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
              <div style={{ flex: 1, overflowY: 'auto', padding: '8px 24px 0' }}>
                {navRow}
                <h2 style={{ fontSize: 28, fontWeight: 800, color: '#fff', margin: '0 0 6px', letterSpacing: '-0.02em' }}>
                  {t('onboarding.interests_title')}
                </h2>
                <p style={{ fontSize: 15, color: '#666', margin: '0 0 22px', lineHeight: 1.5 }}>
                  {t('onboarding.interests_subtitle')}
                </p>
                <div style={{
                  display: 'flex', flexWrap: 'wrap', gap: 8, paddingBottom: 16,
                  animation: shake ? 'shake-x 0.5s ease-in-out' : 'none',
                }}>
                  {[...INTERESTS, ...interests.filter((i) => !INTERESTS.map((x) => x.toLowerCase()).includes(i.toLowerCase()))].map((interest) => (
                    <button
                      key={interest}
                      type="button"
                      onClick={() => toggleInterest(interest)}
                      style={{
                        padding: '8px 16px', borderRadius: 999,
                        border: interests.includes(interest) ? 'none' : '1.5px solid #333',
                        background: interests.includes(interest) ? '#f97316' : 'transparent',
                        color: interests.includes(interest) ? '#fff' : '#aaa',
                        fontSize: 14,
                        fontWeight: interests.includes(interest) ? 600 : 400,
                        cursor: 'pointer',
                      }}
                    >
                      {interest}
                    </button>
                  ))}
                  {showCustomInput ? (
                    <div style={{
                      display: 'flex', alignItems: 'center', gap: 6,
                      border: '1.5px solid #f97316', borderRadius: 999,
                      padding: '6px 12px', background: 'rgba(249,115,22,0.08)',
                    }}>
                      <input
                        autoFocus
                        value={customTag}
                        onChange={(e) => setCustomTag(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter') addCustomTag() }}
                        placeholder={t('onboarding.interests_add_placeholder')}
                        style={{ background: 'none', border: 'none', outline: 'none', color: '#fff', fontSize: 14, width: 80 }}
                      />
                      <button type="button" onClick={addCustomTag} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#f97316', padding: 0, display: 'flex' }}>
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
                      style={{
                        display: 'flex', alignItems: 'center', gap: 6,
                        padding: '8px 16px', borderRadius: 999,
                        border: '1.5px dashed #444', background: 'transparent',
                        color: '#666', fontSize: 14, cursor: 'pointer',
                      }}
                    >
                      <Plus size={13} />
                      {t('onboarding.interests_add_own')}
                    </button>
                  )}
                </div>
              </div>
              <div style={{ padding: '12px 24px calc(env(safe-area-inset-bottom) + 16px)', flexShrink: 0 }}>
                <button
                  type="button"
                  onClick={handleNextInterests}
                  disabled={saving}
                  style={{ width: '100%', height: 52, background: '#f97316', color: '#fff', fontSize: 16, fontWeight: 700, borderRadius: 14, border: 'none', cursor: 'pointer' }}
                >
                  {saving ? t('onboarding.saving') : t('onboarding.next')}
                </button>
              </div>
            </div>
          )}

          {/* ── AGE RANGE ── */}
          {sectionName === 'age_range' && (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
              <div style={{ flex: 1, overflowY: 'auto', padding: '8px 24px 0' }}>
                {navRow}
                <h2 style={{ fontSize: 28, fontWeight: 800, color: '#fff', margin: '0 0 6px', letterSpacing: '-0.02em' }}>
                  {t('onboarding.age_title')}
                </h2>
                <p style={{ fontSize: 15, color: '#666', margin: '0 0 28px', lineHeight: 1.5 }}>
                  {t('onboarding.age_subtitle')}
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {AGE_RANGE_OPTIONS.map((option) => (
                    <button
                      key={option}
                      type="button"
                      onClick={() => setAgeRange(option)}
                      style={{
                        width: '100%', height: 52, borderRadius: 14,
                        border: ageRange === option ? 'none' : '1.5px solid #333',
                        background: ageRange === option ? '#f97316' : 'transparent',
                        color: ageRange === option ? '#fff' : '#aaa',
                        fontSize: 16, fontWeight: ageRange === option ? 700 : 400,
                        cursor: 'pointer', textAlign: 'left', paddingLeft: 20,
                      }}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              </div>
              <div style={{ padding: '12px 24px calc(env(safe-area-inset-bottom) + 16px)', flexShrink: 0 }}>
                <button
                  type="button"
                  onClick={goNextOrComplete}
                  disabled={saving || !ageRange}
                  style={{
                    width: '100%', height: 52,
                    background: saving || !ageRange ? '#1e1e1e' : '#f97316',
                    color: saving || !ageRange ? '#555' : '#fff',
                    fontSize: 16, fontWeight: 700, borderRadius: 14, border: 'none',
                    cursor: saving || !ageRange ? 'not-allowed' : 'pointer',
                    marginBottom: 10, transition: 'background 200ms, color 200ms',
                  }}
                >
                  {saving ? t('onboarding.saving') : t('onboarding.next')}
                </button>
                <button
                  type="button"
                  onClick={() => { setAgeRange(''); goNextOrComplete() }}
                  disabled={saving}
                  style={{ width: '100%', background: 'none', border: 'none', color: '#555', fontSize: 14, cursor: 'pointer', padding: '6px 0' }}
                >
                  {t('onboarding.skip')}
                </button>
              </div>
            </div>
          )}

          {/* ── PHONE ── */}
          {sectionName === 'phone' && (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
              <div style={{ flex: 1, overflowY: 'auto', padding: '8px 24px 0' }}>
                {navRow}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: 20 }}>
                  <WhatsAppIcon />
                  <h2 style={{ fontSize: 26, fontWeight: 800, color: '#fff', margin: '16px 0 8px', textAlign: 'center', letterSpacing: '-0.02em' }}>
                    {t('onboarding.phone_title')}
                  </h2>
                  <p style={{ fontSize: 15, color: '#666', margin: '0 0 28px', textAlign: 'center', lineHeight: 1.5 }}>
                    {t('onboarding.phone_subtitle')}
                  </p>
                  <div style={{ width: '100%', display: 'flex', gap: 10, marginBottom: 8 }}>
                    <select
                      value={countryCode}
                      onChange={(e) => setCountryCode(e.target.value)}
                      style={{
                        height: 52, background: '#1a1a1a', border: '1px solid #333',
                        borderRadius: 12, color: '#fff', fontSize: 15,
                        padding: '0 10px', flexShrink: 0, cursor: 'pointer', outline: 'none',
                      }}
                    >
                      {COUNTRY_CODES.map((c) => (
                        <option key={c.code} value={c.code}>{c.flag} {c.code}</option>
                      ))}
                    </select>
                    <input
                      type="tel"
                      inputMode="tel"
                      placeholder={t('onboarding.phone_placeholder')}
                      value={phone}
                      onChange={(e) => { setPhone(e.target.value); setPhoneSkipped(false) }}
                      style={{
                        flex: 1, height: 52, background: '#1a1a1a', border: '1px solid #333',
                        borderRadius: 12, color: '#fff', fontSize: 16,
                        padding: '0 16px', outline: 'none', boxSizing: 'border-box',
                      }}
                    />
                  </div>
                  <p style={{ fontSize: 12, color: '#444', textAlign: 'center', lineHeight: 1.5, width: '100%', marginBottom: 4 }}>
                    {t('onboarding.phone_disclaimer')}
                  </p>
                </div>
              </div>
              <div style={{ padding: '12px 24px calc(env(safe-area-inset-bottom) + 16px)', flexShrink: 0 }}>
                <button
                  type="button"
                  onClick={() => { setPhoneSkipped(false); goNextOrComplete() }}
                  disabled={saving || !phone.trim()}
                  style={{
                    width: '100%', height: 52,
                    background: saving || !phone.trim() ? '#1e1e1e' : '#f97316',
                    color: saving || !phone.trim() ? '#555' : '#fff',
                    fontSize: 16, fontWeight: 700, borderRadius: 14, border: 'none',
                    cursor: saving || !phone.trim() ? 'not-allowed' : 'pointer',
                    marginBottom: 10, transition: 'background 200ms, color 200ms',
                  }}
                >
                  {saving ? t('onboarding.saving') : t('onboarding.phone_save')}
                </button>
                <button
                  type="button"
                  onClick={() => { setPhoneSkipped(true); goNextOrComplete() }}
                  disabled={saving}
                  style={{ width: '100%', background: 'none', border: 'none', color: '#555', fontSize: 14, cursor: 'pointer', padding: '6px 0' }}
                >
                  {t('onboarding.skip')}
                </button>
              </div>
            </div>
          )}

          {/* ── NOTIFICATIONS ── */}
          {sectionName === 'notifications' && (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
              <div style={{ flex: 1, overflowY: 'auto', padding: '8px 24px 0' }}>
                {navRow}
                <h2 style={{ fontSize: 28, fontWeight: 800, color: '#fff', margin: '0 0 6px', letterSpacing: '-0.02em' }}>
                  {t('onboarding.notif_title')}
                </h2>
                <p style={{ fontSize: 15, color: '#666', margin: '0 0 28px', lineHeight: 1.5 }}>
                  {t('onboarding.notif_subtitle')}
                </p>
                {[
                  { label: t('onboarding.notif_email'), value: notifEmail, set: setNotifEmail },
                  { label: t('onboarding.notif_whatsapp'), value: notifWhatsapp, set: setNotifWhatsapp },
                  { label: t('onboarding.notif_app'), value: notifApp, set: setNotifApp },
                ].map((row) => (
                  <div key={row.label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 20 }}>
                    <span style={{ fontSize: 16, color: '#fff' }}>{row.label}</span>
                    <div
                      onClick={() => row.set((v) => !v)}
                      style={{
                        width: 48, height: 28, borderRadius: 999,
                        backgroundColor: row.value ? '#ffffff' : '#2a2a2a',
                        position: 'relative', cursor: 'pointer', flexShrink: 0,
                        transition: 'background-color 200ms',
                      }}
                    >
                      <div style={{
                        position: 'absolute', top: 4,
                        left: row.value ? 24 : 4,
                        width: 20, height: 20, borderRadius: '50%',
                        backgroundColor: row.value ? '#000000' : '#555555',
                        transition: 'left 200ms',
                      }} />
                    </div>
                  </div>
                ))}
              </div>
              <div style={{ padding: '12px 24px calc(env(safe-area-inset-bottom) + 16px)', flexShrink: 0 }}>
                <button
                  type="button"
                  onClick={goNextOrComplete}
                  disabled={saving}
                  style={{ width: '100%', height: 52, background: '#f97316', color: '#fff', fontSize: 16, fontWeight: 700, borderRadius: 14, border: 'none', cursor: 'pointer' }}
                >
                  {saving ? t('onboarding.saving') : t('onboarding.done')}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
