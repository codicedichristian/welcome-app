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
      <img src="/favicon-dark.png" alt="logo" style={{ width: 64, height: 64, borderRadius: 14 }} />
      <div className="flex flex-col items-center gap-0.5">
        <p className="text-[20px] font-semibold text-primary">{config.churchName}</p>
        <p className="text-[13px] text-zinc-500">Vive Madrid</p>
      </div>
      <p style={{ fontSize: '11px' }} className="text-zinc-600">{buildLabel}</p>
    </div>
  )
}
