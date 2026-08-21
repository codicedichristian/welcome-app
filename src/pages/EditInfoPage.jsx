import { useState, useEffect } from 'react'
import { ArrowLeft, X } from 'lucide-react'
import TextField from '../onboarding/components/TextField.jsx'
import OptionButton from '../onboarding/components/OptionButton.jsx'
import { AGE_RANGE_OPTIONS } from '../onboarding/options.js'
import { supabase } from '../lib/supabase.js'

export default function EditInfoPage() {
  const [userId, setUserId] = useState(null)
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    ageRange: '',
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const load = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.user?.email) return

      const { data } = await supabase
        .from('users')
        .select('id, first_name, last_name, email, phone, age_range')
        .eq('email', session.user.email)
        .single()

      if (!data) return

      setUserId(data.id)
      setForm({
        firstName: data.first_name ?? '',
        lastName: data.last_name ?? '',
        email: data.email ?? '',
        phone: data.phone ?? '',
        ageRange: data.age_range ?? '',
      })
    }
    load()
  }, [])

  const update = (patch) => setForm((prev) => ({ ...prev, ...patch }))

  const handleSave = async () => {
    if (!userId) return
    setSaving(true)
    setError('')

    const { error: saveError } = await supabase
      .from('users')
      .update({
        first_name: form.firstName,
        last_name: form.lastName,
        email: form.email,
        phone: form.phone || null,
        age_range: form.ageRange || null,
      })
      .eq('id', userId)

    setSaving(false)

    if (saveError) {
      setError('Failed to save. Please try again.')
      console.error('[EditInfo] save error:', saveError.message)
      return
    }

    window.history.back()
  }

  return (
    <div className="page-transition flex h-dvh flex-col">
      {/* Fixed header — always visible above content on iOS PWA */}
      <div style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        backgroundColor: '#0a0a0a', borderBottom: '1px solid #1e1e1e',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 8px',
        height: 'calc(56px + env(safe-area-inset-top))',
        paddingTop: 'env(safe-area-inset-top)',
      }}>
        <button
          type="button"
          onClick={() => window.history.back()}
          style={{ background: 'none', border: 'none', color: '#aaa', cursor: 'pointer', padding: 8 }}
        >
          <ArrowLeft size={22} />
        </button>
        <span style={{ color: '#fff', fontSize: 16, fontWeight: 600 }}>Edit Profile</span>
        <button
          type="button"
          onClick={() => window.history.back()}
          style={{ background: 'none', border: 'none', color: '#aaa', cursor: 'pointer', padding: 8 }}
        >
          <X size={22} />
        </button>
      </div>

      {/* Scrollable form — top padding clears the fixed header */}
      <div className="flex-1 overflow-y-auto px-4 py-6" style={{ WebkitOverflowScrolling: 'touch', paddingTop: 'calc(56px + env(safe-area-inset-top) + 24px)' }}>
        <div className="flex flex-col gap-4">
          <div>
            <p className="mb-2 text-[13px] uppercase tracking-[0.5px] text-inactive">First name</p>
            <TextField
              type="text"
              autoComplete="given-name"
              value={form.firstName}
              onChange={(value) => update({ firstName: value })}
            />
          </div>

          <div>
            <p className="mb-2 text-[13px] uppercase tracking-[0.5px] text-inactive">Last name</p>
            <TextField
              type="text"
              autoComplete="family-name"
              value={form.lastName}
              onChange={(value) => update({ lastName: value })}
            />
          </div>

          <div>
            <p className="mb-2 text-[13px] uppercase tracking-[0.5px] text-inactive">Email</p>
            <TextField
              type="email"
              autoComplete="email"
              value={form.email}
              onChange={(value) => update({ email: value })}
            />
          </div>

          <div>
            <p className="mb-2 text-[13px] uppercase tracking-[0.5px] text-inactive">Phone</p>
            <TextField
              type="tel"
              autoComplete="tel"
              value={form.phone}
              onChange={(value) => update({ phone: value })}
            />
          </div>

          <div>
            <p className="mb-2 text-[13px] uppercase tracking-[0.5px] text-inactive">Age range</p>
            <div className="grid grid-cols-2 gap-3">
              {AGE_RANGE_OPTIONS.map((option) => (
                <OptionButton
                  key={option}
                  label={option}
                  className="text-center"
                  selected={form.ageRange === option}
                  onClick={() => update({ ageRange: option })}
                />
              ))}
            </div>
          </div>

          {error && <p className="text-[14px] text-red-400">{error}</p>}
        </div>
      </div>

      {/* Sticky footer — always visible above home indicator */}
      <div className="shrink-0 px-4 pt-3" style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 12px)' }}>
        <button
          type="button"
          onClick={handleSave}
          disabled={saving || !userId}
          className="w-full rounded-xl bg-primary py-4 text-[16px] font-medium text-bg disabled:opacity-40"
        >
          {saving ? 'Saving...' : 'Save changes'}
        </button>
      </div>
    </div>
  )
}
