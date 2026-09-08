import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Cross, Check } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { registerVisitor } from '../lib/api.js'
import { toStoredUser } from '../lib/user.js'

const VIDEO_SRC =
  'https://vive.sfo2.cdn.digitaloceanspaces.com/2026/website/Hero%20Videos/2026_Website%20Hero%201280x720_Mobile.mp4'

const HOW_FOUND_KEYS = ['instagram', 'friend', 'email', 'another_vive', 'other']

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

// ── Shared primitives ──────────────────────────────────────────────────────

function OrangeButton({ children, disabled, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      style={{
        width: '100%',
        height: 56,
        background: disabled ? '#2a2a2a' : '#f97316',
        color: disabled ? '#666' : '#ffffff',
        fontSize: 17,
        fontWeight: 700,
        borderRadius: 14,
        border: 'none',
        cursor: disabled ? 'not-allowed' : 'pointer',
        transition: 'background 200ms, color 200ms',
        flexShrink: 0,
      }}
    >
      {children}
    </button>
  )
}

function Chip({ label, selected, onToggle }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      style={{
        padding: '9px 16px',
        borderRadius: 99,
        border: selected ? '1.5px solid #f97316' : '1px solid #2e2e2e',
        background: selected ? 'rgba(249,115,22,0.12)' : '#111',
        color: selected ? '#f97316' : '#9a9a97',
        fontSize: 14,
        fontWeight: selected ? 600 : 400,
        cursor: 'pointer',
        transition: 'all 160ms ease',
        whiteSpace: 'nowrap',
      }}
    >
      {label}
    </button>
  )
}

function ProgressBar({ step }) {
  return (
    <div style={{ height: 4, background: '#1a1a1a', borderRadius: 2, overflow: 'hidden' }}>
      <div
        style={{
          height: '100%',
          width: `${(step / 4) * 100}%`,
          background: '#f97316',
          borderRadius: 2,
          transition: 'width 300ms ease',
        }}
      />
    </div>
  )
}

// ── Screen 0 — Splash ─────────────────────────────────────────────────────

function SplashScreen({ onStart, onLogin }) {
  const { t } = useTranslation()
  const [videoFailed, setVideoFailed] = useState(false)
  const videoRef = useRef(null)

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: '#0a0a0a',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {!videoFailed && (
        <video
          ref={videoRef}
          autoPlay
          muted
          loop
          playsInline
          onError={() => setVideoFailed(true)}
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
          }}
          src={VIDEO_SRC}
        />
      )}

      <div
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'linear-gradient(to bottom, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0) 30%, rgba(0,0,0,0.85) 80%, rgba(0,0,0,0.95) 100%)',
        }}
      />

      <div
        style={{
          position: 'relative',
          marginTop: 'auto',
          padding: '0 28px',
          paddingBottom: 'calc(env(safe-area-inset-bottom) + 48px)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 12,
        }}
      >
        <Cross size={48} color="#ffffff" strokeWidth={2} />

        <h1
          style={{
            fontSize: 52,
            fontWeight: 700,
            color: '#ffffff',
            margin: '0 0 12px',
            letterSpacing: '-0.02em',
          }}
        >
          Vive Church
        </h1>

        <button
          type="button"
          onClick={onStart}
          style={{
            width: '100%',
            height: 56,
            background: '#f97316',
            color: '#ffffff',
            fontSize: 18,
            fontWeight: 700,
            borderRadius: 9999,
            border: 'none',
            cursor: 'pointer',
          }}
        >
          {t('welcome.join_button')}
        </button>

        <button
          type="button"
          onClick={onLogin}
          style={{
            background: 'none',
            border: 'none',
            color: 'rgba(255,255,255,0.45)',
            fontSize: 14,
            cursor: 'pointer',
            padding: '8px 0',
          }}
        >
          {t('welcome.have_account')}{' '}
          <span style={{ color: '#f97316', fontWeight: 600 }}>{t('welcome.sign_in_link')}</span>
        </button>
      </div>
    </div>
  )
}

// ── Screen 6 — Welcome Home ───────────────────────────────────────────────

function SuccessScreen({ onEnter }) {
  const { t } = useTranslation()
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: '#0a0a0a',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '0 28px',
        paddingBottom: 'calc(env(safe-area-inset-bottom) + 32px)',
      }}
    >
      <div
        style={{
          width: 88,
          height: 88,
          borderRadius: '50%',
          background: 'rgba(61,220,151,0.15)',
          border: '2px solid #3ddc97',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          animation: 'welcome-check-pop 500ms cubic-bezier(0.175, 0.885, 0.32, 1.275) both',
          marginBottom: 28,
        }}
      >
        <Check size={44} color="#3ddc97" strokeWidth={2.5} />
      </div>

      <h1
        style={{
          fontSize: 34,
          fontWeight: 800,
          color: '#ffffff',
          textAlign: 'center',
          margin: 0,
          letterSpacing: '-0.02em',
        }}
      >
        {t('welcome.success_title')}
      </h1>

      <p
        style={{
          fontSize: 16,
          color: '#9a9a97',
          textAlign: 'center',
          marginTop: 10,
          marginBottom: 40,
          lineHeight: 1.5,
        }}
      >
        {t('welcome.success_body')}
      </p>

      <OrangeButton onClick={onEnter}>{t('welcome.success_cta')}</OrangeButton>
    </div>
  )
}

// ── Individual form screens ────────────────────────────────────────────────

function Screen1({ form, update }) {
  const { t } = useTranslation()
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <h2 style={headingStyle}>{t('welcome.screen1_title')}</h2>
      <input
        type="text"
        autoFocus
        autoComplete="given-name"
        placeholder={t('welcome.first_name')}
        value={form.firstName}
        onChange={(e) => update({ firstName: e.target.value })}
        style={inputStyle}
      />
      <input
        type="text"
        autoComplete="family-name"
        placeholder={t('welcome.last_name')}
        value={form.lastName}
        onChange={(e) => update({ lastName: e.target.value })}
        style={inputStyle}
      />
    </div>
  )
}

function Screen2({ form, update }) {
  const { t } = useTranslation()
  const options = HOW_FOUND_KEYS.map((key) => ({ key, label: t(`how_found.${key}`) }))

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <h2 style={headingStyle}>{t('welcome.screen2_title')}</h2>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
        {options.map((opt) => {
          const isOther = opt.key === 'other'
          const selected = isOther
            ? form.howFoundUsIsOther
            : form.howFoundUs === opt.label && !form.howFoundUsIsOther
          return (
            <Chip
              key={opt.key}
              label={opt.label}
              selected={selected}
              onToggle={() => {
                if (isOther) {
                  update({ howFoundUsIsOther: !form.howFoundUsIsOther, howFoundUs: '' })
                } else {
                  update({ howFoundUs: opt.label, howFoundUsIsOther: false })
                }
              }}
            />
          )
        })}
      </div>
      {form.howFoundUsIsOther && (
        <input
          type="text"
          autoFocus
          placeholder={t('welcome.other_placeholder')}
          value={form.howFoundUs}
          onChange={(e) => update({ howFoundUs: e.target.value })}
          style={inputStyle}
        />
      )}
    </div>
  )
}

function Screen4({ form, update }) {
  const { t } = useTranslation()
  const [showPwd, setShowPwd] = useState(false)
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <h2 style={headingStyle}>{t('welcome.screen3_title')}</h2>
      <input
        type="email"
        inputMode="email"
        autoComplete="email"
        placeholder={t('welcome.email_placeholder')}
        value={form.email}
        onChange={(e) => update({ email: e.target.value })}
        style={inputStyle}
      />
      <div style={{ position: 'relative' }}>
        <input
          type={showPwd ? 'text' : 'password'}
          autoComplete="new-password"
          placeholder={t('welcome.password_placeholder')}
          value={form.password}
          onChange={(e) => update({ password: e.target.value })}
          style={{ ...inputStyle, paddingRight: 80 }}
        />
        <button
          type="button"
          onClick={() => setShowPwd((v) => !v)}
          style={{
            position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)',
            background: 'none', border: 'none', cursor: 'pointer',
            color: '#9a9a97', fontSize: 13, fontWeight: 600,
          }}
        >
          {showPwd ? t('welcome.password_hide') : t('welcome.password_show')}
        </button>
      </div>
      {form.password.length > 0 && form.password.length < 6 && (
        <p style={{ fontSize: 12, color: '#e55555', margin: 0 }}>
          {t('welcome.password_min_length')}
        </p>
      )}
    </div>
  )
}

function ConsentRow({ checked, onChange, required, children }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      style={{
        display: 'flex', alignItems: 'flex-start', gap: 14,
        background: 'none', border: 'none', cursor: 'pointer', padding: 0, textAlign: 'left',
      }}
    >
      <div
        style={{
          width: 24, height: 24, borderRadius: 7,
          border: checked ? '2px solid #f97316' : '1.5px solid #333',
          background: checked ? '#f97316' : 'transparent',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0, marginTop: 1, transition: 'all 150ms ease',
        }}
      >
        {checked && <Check size={14} color="#ffffff" strokeWidth={3} />}
      </div>
      <span style={{ fontSize: 14, color: '#ffffff', lineHeight: 1.5 }}>
        {children}
        {required && <span style={{ color: '#f97316' }}> *</span>}
      </span>
    </button>
  )
}

function Screen5({ form, update }) {
  const { t } = useTranslation()
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <h2 style={headingStyle}>{t('welcome.screen4_title')}</h2>
      <ConsentRow checked={form.marketingConsent} onChange={(v) => update({ marketingConsent: v })}>
        {t('welcome.consent_marketing')}
      </ConsentRow>
      <ConsentRow checked={form.profilingConsent} onChange={(v) => update({ profilingConsent: v })}>
        {t('welcome.consent_profiling')}
      </ConsentRow>
      <ConsentRow checked={form.privacyAccepted} onChange={(v) => update({ privacyAccepted: v })} required>
        {t('welcome.consent_privacy_before')}{' '}
        <a href="/privacy-policy" target="_blank" rel="noopener noreferrer" style={{ color: '#f97316' }}>
          {t('welcome.consent_privacy_link')}
        </a>{' '}
        {t('welcome.consent_privacy_after')}
      </ConsentRow>
    </div>
  )
}

// ── Shared style constants ────────────────────────────────────────────────

const headingStyle = {
  fontSize: 30,
  fontWeight: 800,
  color: '#ffffff',
  margin: 0,
  letterSpacing: '-0.02em',
}

const inputStyle = {
  width: '100%',
  height: 54,
  background: '#111',
  border: '1px solid #2a2a2a',
  borderRadius: 14,
  padding: '0 16px',
  fontSize: 17,
  color: '#ffffff',
  boxSizing: 'border-box',
  outline: 'none',
}

// ── Main component ────────────────────────────────────────────────────────

export default function WelcomeFlowPage() {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const [screen, setScreen] = useState(0)
  const [direction, setDirection] = useState(1)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    howFoundUs: '',
    howFoundUsIsOther: false,
    email: '',
    password: '',
    privacyAccepted: false,
    marketingConsent: false,
    profilingConsent: false,
  })

  const update = (patch) => setForm((prev) => ({ ...prev, ...patch }))

  const goTo = (n) => {
    setDirection(n > screen ? 1 : -1)
    setError(null)
    setScreen(n)
  }

  const canContinue = () => {
    switch (screen) {
      case 1: return form.firstName.trim().length > 0 && form.lastName.trim().length > 0
      case 2: return form.howFoundUs.trim().length > 0
      case 3: return EMAIL_RE.test(form.email) && form.password.length >= 6
      case 4: return form.privacyAccepted
      default: return true
    }
  }

  const handleSubmit = async () => {
    setSaving(true)
    setError(null)
    sessionStorage.setItem('registration_in_progress', 'true')
    const { user, authId, error: err } = await registerVisitor(form)
    if (err) {
      setError(err.message || t('welcome.screen4_title'))
      setSaving(false)
      return
    }
    setSaving(false)
    setDirection(1)
    setScreen(5)
  }

  if (screen === 0) return <SplashScreen onStart={() => goTo(1)} onLogin={() => navigate('/login')} />
  if (screen === 5) return <SuccessScreen onEnter={() => { sessionStorage.removeItem('registration_in_progress'); navigate('/login', { replace: true }) }} />

  const animClass = direction === 1 ? 'animate-slide-in-right' : 'animate-slide-in-left'

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100dvh',
        background: '#0a0a0a',
        padding: '0 24px',
        paddingTop: 'calc(env(safe-area-inset-top) + 20px)',
        paddingBottom: 'calc(env(safe-area-inset-bottom) + 28px)',
      }}
    >
      {/* Top bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <button
          type="button"
          onClick={() => goTo(screen - 1)}
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            padding: '4px 4px 4px 0', color: '#9a9a97',
            display: 'flex', flexShrink: 0,
          }}
          aria-label="Indietro"
        >
          <ArrowLeft size={22} />
        </button>
        <div style={{ flex: 1 }}>
          <ProgressBar step={screen} />
        </div>
      </div>

      <p style={{ fontSize: 13, color: '#555', marginTop: 6, marginBottom: 0 }}>
        {t('welcome.step_indicator', { step: screen })}
      </p>

      {/* Animated step */}
      <div
        key={screen}
        className={animClass}
        style={{ flex: 1, display: 'flex', flexDirection: 'column', marginTop: 32, overflow: 'hidden' }}
      >
        {screen === 1 && <Screen1 form={form} update={update} />}
        {screen === 2 && <Screen2 form={form} update={update} />}
        {screen === 3 && <Screen4 form={form} update={update} />}
        {screen === 4 && <Screen5 form={form} update={update} />}
      </div>

      {error && (
        <p style={{ fontSize: 13, color: '#e55555', textAlign: 'center', marginBottom: 12 }}>
          {error}
        </p>
      )}

      <OrangeButton
        disabled={!canContinue() || saving}
        onClick={screen === 4 ? handleSubmit : () => goTo(screen + 1)}
      >
        {screen === 4
          ? (saving ? t('welcome.creating_account') : t('welcome.create_account'))
          : t('welcome.continue')}
      </OrangeButton>
    </div>
  )
}
