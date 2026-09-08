import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Cross } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { supabase } from '../lib/supabase.js'
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
