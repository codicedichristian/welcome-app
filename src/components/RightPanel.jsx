import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { User, Mail, Phone, Cake, Pencil, MessageCircle, Bell, ShieldCheck } from 'lucide-react'
import { INTERESTS_OPTIONS } from '../onboarding/options.js'
import { supabase } from '../lib/supabase.js'
import { saveSubscription, deleteSubscription } from '../lib/api.js'
import { subscribeToPush, unsubscribeFromPush } from '../lib/push.js'

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

  useEffect(() => {
    if (isOpen) setUser(getStoredUser())
  }, [isOpen])

  const initials = `${user.firstName?.[0] ?? ''}${user.lastName?.[0] ?? ''}`.toUpperCase()
  const fullName = `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim()

  const persist = (next) => {
    localStorage.setItem('welcome_user', JSON.stringify(next))
    setUser(next)
  }

  const toggleInterest = (interest) => {
    const interests = user.interests ?? []
    const updated = interests.includes(interest)
      ? interests.filter((i) => i !== interest)
      : [...interests, interest]
    persist({ ...user, interests: updated })
  }

  const toggleNotification = async (key) => {
    const value = !user.notifications?.[key]
    persist({ ...user, notifications: { ...user.notifications, [key]: value } })
    if (key !== 'app') return
    if (value) {
      const subscription = await subscribeToPush()
      if (subscription) saveSubscription(user.id, subscription)
    } else {
      await unsubscribeFromPush()
      await deleteSubscription(user.id)
    }
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
          {user.role === 'admin' && (
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
              {INTERESTS_OPTIONS.map((interest) => {
                const selected = user.interests?.includes(interest)
                return (
                  <button
                    key={interest}
                    type="button"
                    onClick={() => toggleInterest(interest)}
                    className={`rounded-full border px-4 py-2 text-[16px] transition-colors ${
                      selected ? 'border-primary text-primary' : 'border-border text-[#333333]'
                    }`}
                  >
                    {interest}
                  </button>
                )
              })}
            </div>
          </section>

          <section className="mt-6">
            <h3 className="text-[13px] uppercase tracking-[0.5px] text-inactive">Notifications</h3>
            <div className="mt-2 overflow-hidden rounded-xl border border-border bg-surface">
              {notificationRows.map((row, index) => {
                const checked = user.notifications?.[row.key] ?? false
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
                    <button
                      type="button"
                      role="switch"
                      aria-checked={checked}
                      onClick={() => toggleNotification(row.key)}
                      className={`relative h-7 w-12 shrink-0 rounded-full transition-colors ${
                        checked ? 'bg-primary' : 'bg-[#2a2a2a]'
                      }`}
                    >
                      <span
                        className={`absolute top-1 left-1 h-5 w-5 rounded-full transition-transform ${
                          checked ? 'translate-x-5 bg-bg' : 'translate-x-0 bg-zinc-500'
                        }`}
                      />
                    </button>
                  </div>
                )
              })}
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
