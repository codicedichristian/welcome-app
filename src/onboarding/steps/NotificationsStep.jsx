import { Heart } from 'lucide-react'
import Toggle from '../components/Toggle.jsx'

export default function NotificationsStep({ formData, update }) {
  return (
    <div>
      <h1 className="mb-6 text-[28px] font-bold text-primary">Stay in the loop</h1>
      <div className="flex flex-col gap-3">
        <Toggle
          label="Email"
          checked={formData.notif_email}
          onChange={(value) => update({ notif_email: value })}
        />
        <Toggle
          label="WhatsApp"
          checked={formData.notif_whatsapp}
          onChange={(value) => update({ notif_whatsapp: value })}
        />
        <Toggle
          label="App notifications"
          checked={formData.notif_app}
          onChange={(value) => update({ notif_app: value })}
        />
      </div>

      <div className="mt-6 rounded-xl border border-border bg-surface p-5 text-center">
        <Heart className="mx-auto mb-2 text-accent-green" size={28} fill="currentColor" />
        <p className="text-[14px] font-medium text-primary">You're part of the family!</p>
        <p className="text-[13px] text-zinc-500">Welcome home</p>
      </div>
    </div>
  )
}
