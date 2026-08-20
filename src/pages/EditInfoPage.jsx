import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import BackRow from '../components/BackRow.jsx'
import TextField from '../onboarding/components/TextField.jsx'
import OptionButton from '../onboarding/components/OptionButton.jsx'
import { AGE_RANGE_OPTIONS } from '../onboarding/options.js'
import { supabase } from '../lib/supabase.js'

export default function EditInfoPage() {
  const navigate = useNavigate()
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

    navigate('/profile')
  }

  return (
    <div className="page-transition flex min-h-dvh flex-col px-4 pb-8" style={{ paddingTop: 'calc(env(safe-area-inset-top) + 24px)' }}>
      <BackRow label="Profile" />

      <h1 className="mt-4 text-[24px] font-medium text-primary">Edit info</h1>

      <div className="mt-6 flex flex-1 flex-col gap-4">
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

      <button
        type="button"
        onClick={handleSave}
        disabled={saving || !userId}
        className="mt-6 w-full rounded-xl bg-primary py-4 text-[16px] font-medium text-bg disabled:opacity-40"
      >
        {saving ? 'Saving...' : 'Save changes'}
      </button>
    </div>
  )
}
