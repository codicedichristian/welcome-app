import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Cross } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { supabase } from '../lib/supabase.js'
import { signInWithGoogle } from '../lib/auth.js'
import { getUserByAuthId } from '../lib/api.js'
import { toStoredUser } from '../lib/user.js'
import PasswordField from '../onboarding/components/PasswordField.jsx'
import TextField from '../onboarding/components/TextField.jsx'
import config from '../config.js'

const buildTime = new Date(__BUILD_TIME__)
const buildLabel =
  'v' +
  config.appVersion +
  ' · Built ' +
  buildTime.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) +
  ' at ' +
  buildTime.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })

export default function LoginPage() {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  const [showReset, setShowReset] = useState(false)
  const [resetEmail, setResetEmail] = useState('')
  const [resetSent, setResetSent] = useState(false)
  const [resetSubmitting, setResetSubmitting] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    setSubmitting(true)

    const { data, error: authError } = await supabase.auth.signInWithPassword({ email, password })

    if (authError) {
      if (authError.message?.toLowerCase().includes('email not confirmed')) {
        setError(t('login.error_email_not_confirmed'))
      } else {
        setError(t('login.error_invalid_credentials'))
      }
      setSubmitting(false)
      return
    }

    const { data: profile, error: profileError } = await getUserByAuthId(data.user.id)

    if (profileError || !profile) {
      setError(t('login.error_invalid_credentials'))
      setSubmitting(false)
      return
    }

    localStorage.setItem('welcome_user', JSON.stringify(toStoredUser(profile, data.user.id)))

    navigate('/', { replace: true })
  }

  const handleResetSubmit = async (e) => {
    e.preventDefault()
    setResetSubmitting(true)
    await supabase.auth.resetPasswordForEmail(resetEmail)
    setResetSubmitting(false)
    setResetSent(true)
  }

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-bg px-6">
      <div className="flex flex-col items-center gap-2">
        <Cross size={40} className="text-primary" />
        <p className="text-lg text-primary">Welcome</p>
        <p style={{ fontSize: '11px' }} className="text-zinc-600">{buildLabel}</p>
      </div>

      {showReset ? (
        <form onSubmit={handleResetSubmit} className="mt-10 flex w-full max-w-sm flex-col gap-3">
          {resetSent ? (
            <p className="text-center text-sm text-zinc-400">{t('login.reset_sent')}</p>
          ) : (
            <>
              <TextField
                type="email"
                placeholder="you@example.com"
                autoComplete="email"
                value={resetEmail}
                onChange={setResetEmail}
              />
              <button
                type="submit"
                disabled={resetSubmitting || !resetEmail}
                className="w-full rounded-xl bg-primary py-3.5 text-[17px] font-medium text-bg transition-opacity disabled:opacity-50"
              >
                {resetSubmitting ? t('login.sending') : t('login.send_reset')}
              </button>
            </>
          )}
          <button
            type="button"
            onClick={() => {
              setShowReset(false)
              setResetSent(false)
            }}
            className="mt-2 text-center text-xs text-zinc-500"
          >
            {t('login.back_to_sign_in')}
          </button>
        </form>
      ) : (
        <form onSubmit={handleSubmit} className="mt-10 flex w-full max-w-sm flex-col gap-3">
          <button
            type="button"
            onClick={signInWithGoogle}
            style={{
              width: '100%',
              padding: '14px',
              background: '#fff',
              border: 'none',
              borderRadius: '14px',
              fontSize: '16px',
              fontWeight: '600',
              color: '#111',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
              marginBottom: '16px',
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continuar con Google
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
            <div style={{ flex: 1, height: '1px', background: '#2a2a2a' }} />
            <span style={{ color: '#555', fontSize: '13px' }}>o</span>
            <div style={{ flex: 1, height: '1px', background: '#2a2a2a' }} />
          </div>
          <TextField
            type="email"
            placeholder="you@example.com"
            autoComplete="email"
            value={email}
            onChange={setEmail}
          />
          <PasswordField placeholder="Password" autoComplete="current-password" value={password} onChange={setPassword} />

          {error && <p className="text-center text-xs text-[#e55555]">{error}</p>}

          <button
            type="submit"
            disabled={submitting || !email || !password}
            className="w-full rounded-xl bg-primary py-3.5 text-[17px] font-medium text-bg transition-opacity disabled:opacity-50"
          >
            {submitting ? t('login.signing_in') : t('login.sign_in')}
          </button>

          <button type="button" onClick={() => setShowReset(true)} className="text-center text-xs text-zinc-500">
            {t('login.forgot_password')}
          </button>

          <button type="button" onClick={() => navigate('/welcome')} className="mt-4 text-center text-xs text-zinc-500">
            {t('login.new_here')}
          </button>
        </form>
      )}
    </div>
  )
}
