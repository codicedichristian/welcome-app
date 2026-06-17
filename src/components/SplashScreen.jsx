import { Cross } from 'lucide-react'
import config from '../config.js'

const buildTime = new Date(__BUILD_TIME__)
const buildLabel =
  'v' +
  config.appVersion +
  ' · Built ' +
  buildTime.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) +
  ' at ' +
  buildTime.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })

export default function SplashScreen({ visible }) {
  return (
    <div
      style={{ zIndex: 9999 }}
      className={`fixed inset-0 flex flex-col items-center justify-center gap-4 bg-bg transition-opacity duration-500 ease-out ${
        visible ? 'opacity-100' : 'pointer-events-none opacity-0'
      }`}
    >
      <Cross size={48} className="text-primary" />
      <p className="text-[20px] text-primary">{config.churchName}</p>
      <p style={{ fontSize: '11px' }} className="text-zinc-600">{buildLabel}</p>
    </div>
  )
}
