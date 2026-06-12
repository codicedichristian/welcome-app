import { Cross } from 'lucide-react'
import config from '../config.js'

export default function SplashScreen({ visible }) {
  return (
    <div
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center gap-4 bg-bg transition-opacity duration-500 ease-out ${
        visible ? 'opacity-100' : 'pointer-events-none opacity-0'
      }`}
    >
      <Cross size={48} className="text-primary" />
      <p className="text-[20px] text-primary">{config.churchName}</p>
    </div>
  )
}
