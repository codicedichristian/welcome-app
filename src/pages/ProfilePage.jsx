import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { User, Mail, Phone, Cake, Pencil, Bell, ShieldCheck, ChevronRight } from 'lucide-react'
import { INTERESTS, migrateInterests } from '../constants/interests.js'
import { normalizeInterests } from '../utils/normalizeInterests.js'
import { supabase } from '../lib/supabase.js'
import { saveSubscription, deleteSubscription, updateUserConsents } from '../lib/api.js'
import { subscribeToPush, unsubscribeFromPush } from '../lib/push.js'
import { useUser } from '../lib/UserContext.js'

function getStoredUser() {
  try {
    return JSON.parse(localStorage.getItem('welcome_user')) ?? {}
  } catch {
    return {}
  }
}

function WhatsAppIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" fill="#25D366" />
      <path d="M12 0C5.373 0 0 5.373 0 12c0 2.085.535 4.043 1.472 5.755L0 24l6.435-1.437A11.929 11.929 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.99 0-3.847-.587-5.4-1.595l-.387-.23-4.016.896.953-3.919-.252-.4A9.956 9.956 0 012 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z" fill="#25D366" />
    </svg>
  )
}

function formatMemberSince(isoDate) {
  if (!isoDate) return ''
  const date = new Date(isoDate)
  const month = date.toLocaleString('en-US', { month: 'long' })
  return `Member since ${month} ${date.getFullYear()}`
}

export default function ProfilePage() {
  const navigate = useNavigate()
  const [user, setUser] = useState(getStoredUser)
  const liveUser = useUser()
  const [consents, setConsents] = useState({ marketing: false, profiling: false })
  const [notifications, setNotifications] = useState({ email: true, whatsapp: false, app: true })

  // Fresh fetch on mount — always read from DB, not stale localStorage
  useEffect(() => {
    const id = user.id
    if (!id) return
    supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .single()
      .then(({ data, error }) => {
        if (error || !data) return
        setConsents({ marketing: data.marketing_consent ?? false, profiling: data.profiling_consent ?? false })
        const migrated = migrateInterests(data.interests)
        const raw = normalizeInterests(data.interests)
        // Save migrated values back to DB if any names changed
        if (JSON.stringify(migrated) !== JSON.stringify(raw)) {
          supabase.from('users').update({ interests: migrated }).eq('id', id)
          console.log('[Interests] migrated old values to new:', migrated)
        }
        setUser((prev) => {
          const next = { ...prev, ...data, interests: migrated }
          localStorage.setItem('welcome_user', JSON.stringify(next))
          return next
        })
      })
  }, [])

  // Sync notification toggles when fresh DB data arrives
  useEffect(() => {
    setNotifications({
      email: user.notif_email ?? true,
      whatsapp: user.notif_whatsapp ?? false,
      app: user.notif_app ?? true,
    })
  }, [user.notif_email, user.notif_whatsapp, user.notif_app])

  useEffect(() => {
    console.log('[Profile Pills] localUser.interests raw:', user?.interests)
    console.log('[Profile Pills] userInterests:', normalizeInterests(user?.interests))
  }, [user.interests])

  const initials = `${user.firstName?.[0] ?? ''}${user.lastName?.[0] ?? ''}`.toUpperCase()
  const fullName = `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim()

  const persist = (next) => {
    localStorage.setItem('welcome_user', JSON.stringify(next))
    setUser(next)
  }

  const handleInterestToggle = async (pill) => {
    const current = normalizeInterests(user?.interests)
    const updated = current
      .map((i) => i.toLowerCase().trim())
      .includes(pill.toLowerCase().trim())
      ? current.filter((i) => i.toLowerCase().trim() !== pill.toLowerCase().trim())
      : [...current, pill]

    console.log('[Profile] toggling:', pill)
    console.log('[Profile] updated interests:', updated)

    // Optimistic update — functional form avoids stale closure on rapid taps
    setUser((prev) => {
      const next = { ...prev, interests: updated }
      localStorage.setItem('welcome_user', JSON.stringify(next))
      return next
    })

    const { data, error } = await supabase
      .from('users')
      .update({ interests: updated })
      .eq('id', user.id)
      .select()

    console.log('[Profile] save result:', { data, error })
  }

  const handleNotifToggle = async (key) => {
    const updated = { ...notifications, [key]: !notifications[key] }

    // Optimistic local update
    setNotifications(updated)

    const { error } = await supabase
      .from('users')
      .update({ notif_email: updated.email, notif_whatsapp: updated.whatsapp, notif_app: updated.app })
      .eq('id', user.id)

    console.log('[Profile] notif saved:', updated, error ? error.message : 'OK')

    setUser((prev) => ({ ...prev, notif_email: updated.email, notif_whatsapp: updated.whatsapp, notif_app: updated.app }))

    // Handle push subscription when app notifications are toggled
    if (key === 'app') {
      if (updated.app) {
        const subscription = await subscribeToPush()
        if (subscription) saveSubscription(user.id, subscription)
      } else {
        await unsubscribeFromPush()
        await deleteSubscription(user.id)
      }
    }
  }

  const toggleConsent = async (key) => {
    const updated = { ...consents, [key]: !consents[key] }
    setConsents(updated)
    await updateUserConsents(user.id, { marketing: updated.marketing, profiling: updated.profiling })
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    localStorage.removeItem('welcome_user')
    navigate('/login', { replace: true })
  }

  const infoRows = [
    { icon: User, label: 'Full name', value: fullName },
    { icon: Mail, label: 'Email', value: user.email },
    { icon: Phone, label: 'Phone', value: user.phone },
    { icon: Cake, label: 'Age range', value: user.ageRange },
  ]

  const notifRows = [
    { icon: <Mail size={18} className="shrink-0 text-zinc-500" />, label: 'Email notifications', key: 'email' },
    { icon: <WhatsAppIcon />, label: 'WhatsApp', key: 'whatsapp' },
    { icon: <Bell size={18} className="shrink-0 text-zinc-500" />, label: 'App notifications', key: 'app' },
  ]

  return (
    <div className="page-transition px-4 pt-6 pb-8">
      {(liveUser.role === 'admin' || liveUser.role === 'leader') && (
        <button
          type="button"
          onClick={() => navigate('/admin')}
          className="mb-4 flex w-full items-center gap-3 rounded-xl border border-border bg-surface px-4 py-4 text-left"
        >
          <ShieldCheck size={20} className="shrink-0 text-accent-blue" />
          <span className="flex-1 text-[16px] font-medium text-primary">Admin Panel</span>
        </button>
      )}

      <div className="flex flex-col items-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-full border-2 border-primary bg-surface text-[22px] font-medium text-primary">
          {initials}
        </div>
        <p className="mt-3 text-[18px] font-medium text-primary">{fullName}</p>
        <p className="mt-1 text-[13px] text-zinc-500">{formatMemberSince(user.registeredAt)}</p>
      </div>

      <section className="mt-8">
        <h3 className="text-[13px] uppercase tracking-[0.5px] text-inactive">Personal info</h3>
        <div className="mt-2 overflow-hidden rounded-xl border border-border bg-surface">
          {infoRows.map((row, index) => (
            <button
              key={row.label}
              type="button"
              onClick={() => navigate('/edit-info')}
              className={`flex w-full items-center gap-3 px-4 py-4 text-left ${
                index !== infoRows.length - 1 ? 'border-b border-border' : ''
              }`}
            >
              <row.icon size={18} className="shrink-0 text-zinc-500" />
              <div className="flex-1">
                <p className="text-[13px] text-zinc-500">{row.label}</p>
                <p className="mt-0.5 text-[16px] text-primary">{row.value || '—'}</p>
              </div>
              <Pencil size={15} className="shrink-0 text-zinc-600" />
            </button>
          ))}
        </div>
      </section>

      <section className="mt-6">
        <h3 className="text-[13px] uppercase tracking-[0.5px] text-inactive">Interests</h3>
        <div className="mt-2 flex flex-wrap gap-2">
          {(() => {
            const userInterests = normalizeInterests(user.interests)
            return INTERESTS.map((pill) => {
              const selected = userInterests
                .map((i) => i.toLowerCase().trim())
                .includes(pill.toLowerCase().trim())
              return (
                <button
                  key={pill}
                  type="button"
                  onClick={() => handleInterestToggle(pill)}
                  style={{ cursor: 'pointer' }}
                  className={`rounded-full border px-4 py-2 text-[16px] transition-colors ${
                    selected ? 'border-primary text-primary' : 'border-border text-[#333333]'
                  }`}
                >
                  {pill}
                </button>
              )
            })
          })()}
        </div>
      </section>

      <section className="mt-6">
        <h3 className="text-[13px] uppercase tracking-[0.5px] text-inactive">Notifications</h3>
        <div className="mt-2 overflow-hidden rounded-xl border border-border bg-surface">
          {notifRows.map((row, index) => (
            <div
              key={row.key}
              className={`flex items-center justify-between px-4 py-4 ${
                index !== notifRows.length - 1 ? 'border-b border-border' : ''
              }`}
            >
              <div className="flex items-center gap-3">
                {row.icon}
                <span className="text-[16px] text-primary">{row.label}</span>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={notifications[row.key]}
                onClick={() => handleNotifToggle(row.key)}
                className={`relative h-7 w-12 shrink-0 rounded-full transition-colors ${
                  notifications[row.key] ? 'bg-primary' : 'bg-[#2a2a2a]'
                }`}
              >
                <span
                  className={`absolute top-1 left-1 h-5 w-5 rounded-full transition-transform ${
                    notifications[row.key] ? 'translate-x-5 bg-bg' : 'translate-x-0 bg-zinc-500'
                  }`}
                />
              </button>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-6">
        <h3 className="text-[13px] uppercase tracking-[0.5px] text-inactive">Privacy &amp; Consents</h3>
        <div className="mt-2 overflow-hidden rounded-xl border border-border bg-surface">
          <button
            type="button"
            onClick={() => navigate('/privacy-policy')}
            className="flex w-full items-center gap-3 border-b border-border px-4 py-4 text-left"
          >
            <ShieldCheck size={18} className="shrink-0 text-zinc-500" />
            <span className="flex-1 text-[16px] text-primary">Privacy Policy</span>
            <ChevronRight size={15} className="shrink-0 text-zinc-600" />
          </button>
          {[
            { label: 'Marketing communications', key: 'marketing' },
            { label: 'Personalised content', key: 'profiling' },
          ].map((row, index) => (
            <div key={row.key} className={`flex items-center justify-between px-4 py-4 ${index === 0 ? 'border-b border-border' : ''}`}>
              <span className="text-[16px] text-primary">{row.label}</span>
              <button
                type="button"
                role="switch"
                aria-checked={consents[row.key]}
                onClick={() => toggleConsent(row.key)}
                className={`relative h-7 w-12 shrink-0 rounded-full transition-colors ${consents[row.key] ? 'bg-primary' : 'bg-[#2a2a2a]'}`}
              >
                <span className={`absolute top-1 left-1 h-5 w-5 rounded-full transition-transform ${consents[row.key] ? 'translate-x-5 bg-bg' : 'translate-x-0 bg-zinc-500'}`} />
              </button>
            </div>
          ))}
        </div>
      </section>

      <button
        type="button"
        onClick={handleSignOut}
        className="mt-6 w-full rounded-xl border border-[#3a1a1a] bg-surface py-4 text-[16px] font-medium text-[#e55555]"
      >
        Sign out
      </button>
    </div>
  )
}
