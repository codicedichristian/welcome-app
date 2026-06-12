import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import BackRow from '../components/BackRow.jsx'
import TextField from '../onboarding/components/TextField.jsx'
import OptionButton from '../onboarding/components/OptionButton.jsx'
import { AGE_RANGE_OPTIONS } from '../onboarding/options.js'

function getStoredUser() {
  try {
    return JSON.parse(localStorage.getItem('welcome_user')) ?? {}
  } catch {
    return {}
  }
}

export default function EditInfoPage() {
  const navigate = useNavigate()
  const [user] = useState(getStoredUser)
  const [form, setForm] = useState({
    firstName: user.firstName ?? '',
    lastName: user.lastName ?? '',
    email: user.email ?? '',
    phone: user.phone ?? '',
    ageRange: user.ageRange ?? '',
  })

  const update = (patch) => setForm((prev) => ({ ...prev, ...patch }))

  const handleSave = () => {
    localStorage.setItem('welcome_user', JSON.stringify({ ...user, ...form }))
    navigate('/profile')
  }

  return (
    <div className="flex min-h-dvh flex-col px-4 pt-6 pb-8">
      <BackRow label="Profile" />

      <h1 className="mt-4 text-[15px] font-medium text-primary">Edit info</h1>

      <div className="mt-6 flex flex-1 flex-col gap-4">
        <div>
          <p className="mb-1.5 text-[9px] uppercase tracking-[0.5px] text-inactive">First name</p>
          <TextField
            type="text"
            autoComplete="given-name"
            value={form.firstName}
            onChange={(value) => update({ firstName: value })}
          />
        </div>

        <div>
          <p className="mb-1.5 text-[9px] uppercase tracking-[0.5px] text-inactive">Last name</p>
          <TextField
            type="text"
            autoComplete="family-name"
            value={form.lastName}
            onChange={(value) => update({ lastName: value })}
          />
        </div>

        <div>
          <p className="mb-1.5 text-[9px] uppercase tracking-[0.5px] text-inactive">Email</p>
          <TextField
            type="email"
            autoComplete="email"
            value={form.email}
            onChange={(value) => update({ email: value })}
          />
        </div>

        <div>
          <p className="mb-1.5 text-[9px] uppercase tracking-[0.5px] text-inactive">Phone</p>
          <TextField
            type="tel"
            autoComplete="tel"
            value={form.phone}
            onChange={(value) => update({ phone: value })}
          />
        </div>

        <div>
          <p className="mb-1.5 text-[9px] uppercase tracking-[0.5px] text-inactive">Age range</p>
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
      </div>

      <button
        type="button"
        onClick={handleSave}
        className="mt-6 w-full rounded-xl bg-primary py-3.5 text-base font-medium text-bg"
      >
        Save changes
      </button>
    </div>
  )
}
