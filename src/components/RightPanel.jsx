import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { User, Mail, Phone, Cake, Pencil, MessageCircle, Bell, ShieldCheck, ChevronRight } from 'lucide-react'
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

function formatMemberSince(isoDate) {
  if (!isoDate) return ''
  const date = new Date(isoDate)
  return `Member since ${date.toLocaleString('en-US', { month: 'long' })} ${date.getFullYear()}`
}

export default function RightPanel({ isOpen, onClose }) {
  const navigate = useNavigate()
  const panelRef = useRef(null)
  const touchStartY = useRef(0)
  const [user, setUser] = useState(getStoredUser)
  const liveUser = useUser()
  const [consents, setConsents] = useState({ marketing: false, profiling: false })

  useEffect(() => {
    if (isOpen) {
      const fresh = getStoredUser()
      setUser(fresh)
      if (fresh.id) {
        supabase
          .from('users')
          .select('*')
          .eq('id', fresh.id)
          .single()
          .then(({ data }) => {
            if (!data) return
            setConsents({ marketing: data.marketing_consent ?? false, profiling: data.profiling_consent ?? false })
            const migrated = migrateInterests(data.interests)
            setUser((prev) => {
              const next = { ...prev, ...data, interests: migrated }
              localStorage.setItem('welcome_user', JSON.stringify(next))
              return next
            })
          })
      }
    }
  }, [isOpen])

  const initials = `${user.firstName?.[0] ?? ''}${user.lastName?.[0] ?? ''}`.toUpperCase()
  const fullName = `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim()

  const persist = (next) => {
    localStorage.setItem('welcome_user', JSON.stringify(next))
    setUser(next)
  }

  const toggleInterest = async (interest) => {
    const current = normalizeInterests(user?.interests)
    const norm = interest.toLowerCase().trim()
    const updated = current.map((i) => i.toLowerCase().trim()).includes(norm)
      ? current.filter((i) => i.toLowerCase().trim() !== norm)
      : [...current, interest]
    setUser((prev) => {
      const next = { ...prev, interests: updated }
      localStorage.setItem('welcome_user', JSON.stringify(next))
      return next
    })
    await supabase.from('users').update({ interests: updated }).eq('id', user.id)
  }

  const toggleNotification = async (key) => {
    const notifKey = { email: 'notif_email', whatsapp: 'notif_whatsapp', app: 'notif_app' }[key]
    const current = { email: user.notif_email ?? true, whatsapp: user.notif_whatsapp ?? false, app: user.notif_app ?? true }
    const updated = { ...current, [key]: !current[key] }

    setUser((prev) => ({ ...prev, notif_email: updated.email, notif_whatsapp: updated.whatsapp, notif_app: updated.app }))

    await supabase.from('users').update({ [notifKey]: updated[key] }).eq('id', user.id)

    if (key === 'app') {
      try {
        if (updated.app) {
          const subscription = await subscribeToPush()
          if (subscription) saveSubscription(user.id, subscription)
        } else {
          await unsubscribeFromPush()
          await deleteSubscription(user.id)
        }
      } catch (e) {
        console.warn('[RightPanel] push subscription error:', e.message)
      }
    }
  }

  const toggleConsent = async (key) => {
    const updated = { ...consents, [key]: !consents[key] }
    setConsents(updated)
    await updateUserConsents(user.id, { marketing: updated.marketing, profiling: updated.profiling })
  }

  const handleSignOut = async () => {
    onClose()
    await supabase.auth.signOut()
    localStorage.removeItem('welcome_user')
    navigate('/login', { replace: true })
  }

  const handleEditInfo = () => {
    onClose()
    navigate('/edit-info')
  }

  const handleAdmin = () => {
    onClose()
    navigate('/admin')
  }

  const handleTouchStart = (e) => {
    touchStartY.current = e.touches[0].clientY
  }

  const handleTouchEnd = (e) => {
    const diffY = e.changedTouches[0].clientY - touchStartY.current
    if (diffY > 60 && (panelRef.current?.scrollTop ?? 0) <= 0) onClose()
  }

  const infoRows = [
    { icon: User, label: 'Full name', value: fullName },
    { icon: Mail, label: 'Email', value: user.email },
    { icon: Phone, label: 'Phone', value: user.phone },
    { icon: Cake, label: 'Age range', value: user.ageRange },
  ]

  const notificationRows = [
    { icon: Mail, label: 'Email', key: 'email' },
    { icon: MessageCircle, label: 'WhatsApp', key: 'whatsapp' },
    { icon: Bell, label: 'App notifications', key: 'app' },
  ]

  return (
    <>
      {/* Overlay */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.6)',
          opacity: isOpen ? 1 : 0,
          pointerEvents: isOpen ? 'auto' : 'none',
          transition: 'opacity 300ms ease-out',
          zIndex: 200,
        }}
      />

      {/* Bottom sheet */}
      <div
        ref={panelRef}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          height: '90%',
          background: '#111111',
          borderRadius: '20px 20px 0 0',
          zIndex: 201,
          transform: isOpen ? 'translateY(0)' : 'translateY(100%)',
          transition: 'transform 300ms ease-out',
          overflowY: 'auto',
          WebkitOverflowScrolling: 'touch',
        }}
      >
        {/* Handle bar */}
        <div style={{ display: 'flex', justifyContent: 'center', paddingTop: '12px', paddingBottom: '8px' }}>
          <div style={{ width: '40px', height: '4px', borderRadius: '2px', background: '#333' }} />
        </div>

        <div
          className="px-4"
          style={{
            paddingBottom: 'calc(env(safe-area-inset-bottom) + 32px)',
          }}
        >
          {liveUser.role === 'admin' && (
            <button
              type="button"
              onClick={handleAdmin}
              className="mb-5 flex w-full items-center gap-3 rounded-xl border border-border bg-bg px-4 py-4 text-left"
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
                  onClick={handleEditInfo}
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
                return INTERESTS.map((interest) => {
                  const selected = userInterests
                    .map((i) => i.toLowerCase().trim())
                    .includes(interest.toLowerCase().trim())
                  return (
                    <button
                      key={interest}
                      type="button"
                      style={{ cursor: 'pointer' }}
                      onClick={() => toggleInterest(interest)}
                      className={`rounded-full border px-4 py-2 text-[16px] transition-colors ${
                        selected ? 'border-primary text-primary' : 'border-border text-[#333333]'
                      }`}
                    >
                      {interest}
                    </button>
                  )
                })
              })()}
            </div>
          </section>

          <section className="mt-6">
            <h3 className="text-[13px] uppercase tracking-[0.5px] text-inactive">Notifications</h3>
            <div className="mt-2 overflow-hidden rounded-xl border border-border bg-surface">
              {notificationRows.map((row, index) => {
                const notifState = { email: user.notif_email ?? true, whatsapp: user.notif_whatsapp ?? false, app: user.notif_app ?? true }
                const checked = notifState[row.key]
                return (
                  <div
                    key={row.key}
                    className={`flex items-center justify-between px-4 py-4 ${
                      index !== notificationRows.length - 1 ? 'border-b border-border' : ''
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <row.icon size={18} className="text-zinc-500" />
                      <span className="text-[16px] text-primary">{row.label}</span>
                    </div>
                    <div
                      onClick={() => toggleNotification(row.key)}
                      style={{
                        width: 48, height: 28, borderRadius: 999,
                        backgroundColor: checked ? '#ffffff' : '#2a2a2a',
                        position: 'relative', cursor: 'pointer', flexShrink: 0,
                        transition: 'background-color 200ms',
                      }}
                    >
                      <div style={{
                        position: 'absolute', top: 4,
                        left: checked ? 24 : 4,
                        width: 20, height: 20, borderRadius: '50%',
                        backgroundColor: checked ? '#000000' : '#555555',
                        transition: 'left 200ms',
                      }} />
                    </div>
                  </div>
                )
              })}
            </div>
          </section>

          <section className="mt-6">
            <h3 className="text-[13px] uppercase tracking-[0.5px] text-inactive">Privacy &amp; Consents</h3>
            <div className="mt-2 overflow-hidden rounded-xl border border-border bg-surface">
              <button
                type="button"
                onClick={() => { onClose(); navigate('/privacy-policy') }}
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
      </div>
    </>
  )
}
